import type { AIResponse, OmniInputPayload, QuickMode } from '../types';

const MODEL = import.meta.env.VITE_AI_MODEL || 'gemini-flash-lite-latest';
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const BASE_SYSTEM_PROMPT = `
Você é o motor de um aplicativo multimodal "canivete suíço inteligente".
Sua tarefa: receber texto, áudio, imagem ou arquivo e entregar uma solução prática.
Quando a pergunta exigir informação atual, fatos verificáveis, preços, notícias, locais, pessoas, empresas ou comparação com a web, USE a busca do Google disponível nas ferramentas e baseie a resposta nas fontes encontradas.

REGRAS DE SAÍDA:
- Responda SOMENTE com JSON válido, sem markdown, sem cercas de código.
- O JSON deve seguir exatamente este contrato:
  {
    "detected_intent": string,
    "direct_answer": string (máximo 2 frases, objetiva),
    "structured_steps": [{"id": string, "label": string, "done": false}],
    "tabular_data": [objeto plano com chaves consistentes],
    "suggested_next_action": string,
    "sources": [{"title": string, "url": string, "snippet": string}]
  }
- "structured_steps": passos práticos e acionáveis. Se não houver passos, retorne [].
- "tabular_data": dados extraíveis em formato tabular. Se não houver, retorne [].
- "sources": fontes web usadas. Se não houver busca, retorne [].
- Nunca invente fatos ausentes; quando incerto, diga "Não identificado" e sugira verificação.
- Priorize clareza, utilidade imediata e segurança.
`.trim();

const MODE_PROMPTS: Record<QuickMode, string> = {
  auto: 'Detecte automaticamente a intenção. Se a pergunta precisar de dados atuais ou externos, pesquise na web antes de responder.',
  search: 'Modo Pesquisar na Web: pesquise no Google, sintetize os achados, cite fontes em "sources" e destaque diferenças entre fontes quando houver.',
  summarize: 'Modo Resumir & Extrair: extraia pontos-chave, entidades, prazos, valores e dados relevantes. Prefira tabela quando houver dados repetitivos.',
  diagnose: 'Modo Diagnosticar & Resolver: identifique sintomas/causa provável e entregue passos de diagnóstico e correção em ordem segura. Alerte riscos quando houver.',
  plan: 'Modo Organizar & Planejar: transforme o conteúdo em plano executável com checklist, responsáveis/prazos quando inferíveis, e tabela de acompanhamento.',
  translate: 'Modo Traduzir & Explicar: traduza ou simplifique mantendo significado. Explique termos difíceis em linguagem simples e preserve dados importantes.',
};

export async function orchestrate(payload: OmniInputPayload): Promise<AIResponse> {
  if (!API_KEY) return mockResponse(payload);

  const system = `${BASE_SYSTEM_PROMPT}\n\nMODO ATIVO: ${MODE_PROMPTS[payload.mode]}`;
  const parts: Array<Record<string, unknown>> = [];

  const userText = [
    payload.text?.trim() ? `Entrada do usuário:\n${payload.text.trim()}` : '',
    payload.attachments.length
      ? `Anexos enviados: ${payload.attachments.map((a) => `${a.kind}:${a.name}`).join(', ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  parts.push({ text: userText || 'Analise os anexos e gere a melhor solução prática.' });

  for (const att of payload.attachments) {
    parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
  }

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts }],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Erro da IA (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  const grounding = extractGroundingSources(candidate);
  return normalizeResponse(parseJson(text), payload, grounding);
}

function parseJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('A IA retornou um formato inesperado. Tente novamente.');
  }
}

function extractGroundingSources(candidate: any): Array<{ title: string; url: string; snippet: string }> {
  const meta = candidate?.groundingMetadata;
  const chunks = Array.isArray(meta?.groundingChunks) ? meta.groundingChunks : [];
  const sources: Array<{ title: string; url: string; snippet: string }> = [];
  for (const ch of chunks) {
    const web = ch?.web;
    if (web?.uri) {
      sources.push({ title: String(web.title || web.uri), url: String(web.uri), snippet: '' });
    }
  }
  // dedupe by url
  const seen = new Set<string>();
  return sources.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true))).slice(0, 8);
}

function normalizeResponse(raw: unknown, payload: OmniInputPayload, grounding: Array<{ title: string; url: string; snippet: string }>): AIResponse {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const stepsRaw = Array.isArray(obj.structured_steps) ? obj.structured_steps : [];
  const tabRaw = Array.isArray(obj.tabular_data) ? obj.tabular_data : [];
  const srcRaw = Array.isArray(obj.sources) ? obj.sources : [];
  const sources = [...srcRaw.map(normalizeSource), ...grounding]
    .filter((s) => s.url)
    .filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i)
    .slice(0, 8);

  return {
    detected_intent: String(obj.detected_intent || inferIntent(payload)),
    direct_answer: String(obj.direct_answer || 'Analisei sua entrada e gerei uma solução inicial.'),
    structured_steps: stepsRaw.map((s, i) => {
      if (typeof s === 'string') return { id: `step-${i + 1}`, label: s, done: false };
      const step = (s ?? {}) as Record<string, unknown>;
      return {
        id: String(step.id || `step-${i + 1}`),
        label: String(step.label || step.text || `Passo ${i + 1}`),
        done: Boolean(step.done),
      };
    }),
    tabular_data: tabRaw.filter((r) => r && typeof r === 'object') as AIResponse['tabular_data'],
    suggested_next_action: String(obj.suggested_next_action || 'Revise o resultado e me peça um ajuste específico.'),
    sources,
  };
}

function normalizeSource(s: unknown): { title: string; url: string; snippet: string } {
  const o = (s ?? {}) as Record<string, unknown>;
  return { title: String(o.title || o.url || 'Fonte'), url: String(o.url || ''), snippet: String(o.snippet || '') };
}

function inferIntent(payload: OmniInputPayload): string {
  if (payload.mode !== 'auto') return payload.mode;
  if (payload.attachments.some((a) => a.kind === 'image')) return 'Análise visual';
  if (payload.attachments.some((a) => a.kind === 'audio')) return 'Transcrição e organização';
  return 'Análise geral';
}

function mockResponse(payload: OmniInputPayload): AIResponse {
  const hasImage = payload.attachments.some((a) => a.kind === 'image');
  const hasAudio = payload.attachments.some((a) => a.kind === 'audio');
  const intent = hasImage ? 'Diagnóstico visual' : hasAudio ? 'Organização de áudio' : 'Resumo e plano de ação';
  const keyState = API_KEY ? 'definida' : 'vazia';
  return {
    detected_intent: intent,
    direct_answer: `Mock ativo (API_KEY ${keyState}, modelo ${MODEL}). Se a chave está no .env, reinicie o servidor Vite e dê hard refresh (Ctrl+F5).`,
    structured_steps: [
      { id: 'step-1', label: 'Revise a intenção detectada e ajuste o modo, se necessário.', done: false },
      { id: 'step-2', label: 'Confirme os dados extraídos antes de executar ações.', done: false },
      { id: 'step-3', label: 'Exporte a tabela ou checklist para compartilhar com o time.', done: false },
    ],
    tabular_data: payload.text
      ? [{ campo: 'Entrada', valor: payload.text.slice(0, 80) }, { campo: 'Modo', valor: payload.mode }]
      : [{ campo: 'Anexos', valor: payload.attachments.length }],
    suggested_next_action: 'Adicione mais contexto (foto, arquivo ou detalhe) para eu refinar a solução.',
    sources: [],
  };
}
