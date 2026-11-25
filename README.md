# MultiM — Omni Solver

Aplicativo web/PWA multimodal (input-first) para resolver problemas cotidianos e profissionais a partir de texto, áudio, imagem ou arquivo.

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- Zustand (persistência local)
- Gemini API (multimodal, structured output) com fallback mock sem chave

## Rodar localmente
```bash
npm install
cp .env.example .env   # opcional: adicione VITE_GEMINI_API_KEY
npm run dev
```

## Scripts
- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — preview do build

## Estrutura
- `src/components/` — OmniInputBar, QuickModeSelector, ActionableCard, HistorySidebar
- `src/services/aiOrchestrator.ts` — orquestração multimodal + schema JSON
- `src/services/mediaProcessor.ts` — compressão/conversão de mídia
- `src/schemas/responseSchema.ts` — contrato de saída da IA
- `src/store.ts` — histórico local com Zustand persist

## Variáveis de ambiente
- `VITE_GEMINI_API_KEY` — chave da API Gemini (opcional no MVP; sem ela usa mock)
- `VITE_AI_MODEL` — modelo, padrão `gemini-2.0-flash`
