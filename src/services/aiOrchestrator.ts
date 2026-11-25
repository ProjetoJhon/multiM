import { aiResponseJsonSchema } from '../schemas/responseSchema';
import type { AIResponse, OmniInputPayload, QuickMode } from '../types';

const MODEL = import.meta.env.VITE_AI_MODEL || 'gemini-2.5-flash';
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const BASE_SYSTEM_PROMPT = `
Você é o motor de um aplicativo multimodal "canivete suíço inteligente".
Sua tarefa: receber texto, áudio, imagem ou arquivo e entregar uma solução prática.

REGRAS DE SAÍDA:
- Responda SOMENTE com JSON válido, sem markdown, sem cercas de código.
- O JSON deve seguir exatamente este contrato:
  {
    "detected_intent": string,
    "direct_answer": string (máximo 2 frases, objetiva),
    "structured_steps": [{"id": string, "label": string, "done": false}],
    "tabular_data": [objeto plano com chaves consistentes],
    "suggested_next_action": string
  }
- "structured_steps": passos práticos e acionáveis. Se não houver passos, retorne [].
- "tabular_data": dados extraíveis em formato tabular. Se não houver, retorne [].
- Nunca invente fatos ausentes; quando incerto, diga "Não identificado" no campo apropriado.
- Priorize clareza, utilidade imediata e segurança.
`.trim();

const MODE_PROMPTS: Record<QuickMode, string> = {
  auto: 'Detecte automaticamente a intenção mais provável e escolha o melhor formato de solução.',
  summarize:
    'Modo Resumir & Extrair: extraia pontos-chave, entidades, prazos, valores e dados relevantes. Prefira tabela quando houver dados repetitivos.',
  diagnose:
    'Modo Diagnosticar & Resolver: identifique sintomas/causa provável e entregue passos de diagnóstico e correção em ordem segura. Alerte riscos quando houver.',
  plan:
    'Modo Organizar & Planejar: transforme o conteúdo em plano executável com checklist, responsáveis/prazos quando inferíveis, e tabela de acompanhamento.',
  translate:
    'Modo Traduzir & Explicar: traduza ou simplifique mantendo significado. Explique termos difíceis em linguagem simples e preserve dados importantes.',
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
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: aiResponseJsonSchema,
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
    throw new Error(`Erro da IA (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  return normalizeResponse(parseJson(text), payload);
}

function parseJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned);
}

function normalizeResponse(raw: unknown, payload: OmniInputPayload): AIResponse {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const stepsRaw = Array.isArray(obj.structured_steps) ? obj.structured_steps : [];
  const tabRaw = Array.isArray(obj.tabular_data) ? obj.tabular_data : [];

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
    suggested_next_action: String(
      obj.suggested_next_action || 'Revise o resultado e me peça um ajuste específico.',
    ),
  };
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
  return {
    detected_intent: intent,
    direct_answer:
      'Recebi sua entrada e montei uma resposta estruturada. Configure VITE_GEMINI_API_KEY para ativar análise multimodal real.',
    structured_steps: [
      { id: 'step-1', label: 'Revise a intenção detectada e ajuste o modo, se necessário.', done: false },
      { id: 'step-2', label: 'Confirme os dados extraídos antes de executar ações.', done: false },
      { id: 'step-3', label: 'Exporte a tabela ou checklist para compartilhar com o time.', done: false },
    ],
    tabular_data: payload.text
      ? [{ campo: 'Entrada', valor: payload.text.slice(0, 80) }, { campo: 'Modo', valor: payload.mode }]
      : [{ campo: 'Anexos', valor: payload.attachments.length }],
    suggested_next_action: 'Adicione mais contexto (foto, arquivo ou detalhe) para eu refinar a solução.',
  };
}
