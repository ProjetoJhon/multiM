# MultiM â€” Omni Solver

Aplicativo web/PWA multimodal (input-first) para resolver problemas cotidianos e profissionais a partir de texto, Ã¡udio, imagem ou arquivo.

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- Zustand (persistÃªncia local)
- Gemini API (multimodal, structured output) com fallback mock sem chave

## Rodar localmente
```bash
npm install
cp .env.example .env   # opcional: adicione VITE_GEMINI_API_KEY
npm run dev
```

## Scripts
- `npm run dev` â€” desenvolvimento
- `npm run build` â€” build de produÃ§Ã£o
- `npm run preview` â€” preview do build

## Estrutura
- `src/components/` â€” OmniInputBar, QuickModeSelector, ActionableCard, HistorySidebar
- `src/services/aiOrchestrator.ts` â€” orquestraÃ§Ã£o multimodal + schema JSON
- `src/services/mediaProcessor.ts` â€” compressÃ£o/conversÃ£o de mÃ­dia
- `src/schemas/responseSchema.ts` â€” contrato de saÃ­da da IA
- `src/store.ts` â€” histÃ³rico local com Zustand persist

## VariÃ¡veis de ambiente
- `VITE_GEMINI_API_KEY` â€” chave da API Gemini (opcional no MVP; sem ela usa mock)
- `VITE_AI_MODEL` â€” modelo, padrÃ£o `gemini-flash-lite-latest`


