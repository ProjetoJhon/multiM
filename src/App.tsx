import { useMemo, useState } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { ActionableCard } from './components/ActionableCard';
import { HistorySidebar } from './components/HistorySidebar';
import { OmniInputBar } from './components/OmniInputBar';
import { QuickModeSelector } from './components/QuickModeSelector';
import { orchestrate } from './services/aiOrchestrator';
import { useAppStore } from './store';
import type { OmniInputPayload } from './types';

export default function App() {
  const { mode, setMode, sessions, activeSessionId, addSession } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId],
  );

  async function handleSubmit(payload: OmniInputPayload) {
    setLoading(true);
    setError(null);
    try {
      const response = await orchestrate(payload);
      addSession({
        id: crypto.randomUUID?.() ?? String(Date.now()),
        createdAt: new Date().toISOString(),
        mode: payload.mode,
        inputSummary:
          payload.text.slice(0, 90) ||
          payload.attachments.map((a) => a.name).join(', ') ||
          'Entrada multimodal',
        response,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao processar sua solicitação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <HistorySidebar />

        <main className="space-y-5">
          <header className="no-print space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                <Sparkles size={14} /> Omni · canivete suíço inteligente
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Resolva qualquer entrada em segundos.
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Digite, grave, fotografe, anexe ou pesquise na web. A IA identifica a intenção, pode usar busca do Google e devolve uma saída acionável com fontes.
              </p>
            </div>
            <QuickModeSelector value={mode} onChange={setMode} />
            <OmniInputBar mode={mode} loading={loading} onSubmit={handleSubmit} />
          </header>

          {error && (
            <div className="no-print flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {loading && <LoadingCard />}

          {!loading && active && <ActionableCard key={active.id} response={active.response} />}

          {!loading && !active && <EmptyState />}
        </main>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.06)]">
      <div className="h-6 w-40 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-slate-100" />
      <div className="mt-6 space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
      </div>
      <p className="mt-4 text-sm text-slate-500">Analisando sua entrada e estruturando a solução...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
      <p className="text-base font-medium text-slate-700">Nenhuma resolução ainda</p>
      <p className="mt-1 text-sm text-slate-500">Envie um texto, áudio, foto ou arquivo para começar.</p>
    </div>
  );
}
