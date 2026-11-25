import { useMemo, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
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

  const hasResults = !!active || loading;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top bar */}
      <header className={`no-print border-b border-slate-200 bg-white ${hasResults ? 'sticky top-0 z-20' : ''}`}>
        <div className={`mx-auto max-w-7xl px-4 ${hasResults ? 'py-3' : 'pt-16 pb-8 sm:pt-24'}`}>
          <div className={`${hasResults ? 'flex items-center gap-4' : 'flex flex-col items-center'}`}>
            <div className={`flex items-center gap-2 ${hasResults ? '' : 'mb-8'}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Search size={20} />
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-tight text-slate-900">
                  <span className="text-blue-600">M</span><span className="text-red-500">u</span><span className="text-amber-500">l</span><span className="text-blue-600">t</span><span className="text-green-600">i</span><span className="text-red-500">M</span>
                </div>
                {!hasResults && <p className="text-sm text-slate-500">Buscador inteligente de soluções</p>}
              </div>
            </div>

            <div className={`${hasResults ? 'flex-1 max-w-3xl' : 'w-full max-w-2xl'}`}>
              <OmniInputBar mode={mode} loading={loading} onSubmit={handleSubmit} compact={hasResults} />
              <div className="mt-3 flex justify-center">
                <QuickModeSelector value={mode} onChange={setMode} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className={`${hasResults ? '' : 'hidden lg:block'}`}>
          <HistorySidebar />
        </aside>

        <main className="min-w-0">
          {error && (
            <div className="no-print mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {loading && <LoadingResults />}

          {!loading && active && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Soluções para: <span className="font-medium text-slate-700">{active.inputSummary}</span>
              </p>
              <ActionableCard response={active.response} />
            </div>
          )}

          {!loading && !active && (
            <div className="py-8 text-center lg:hidden">
              <p className="text-sm text-slate-400">Digite sua dúvida, envie uma foto, áudio ou arquivo para encontrar soluções.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function LoadingResults() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-50" />
          <div className="mt-1 h-4 w-2/3 animate-pulse rounded bg-slate-50" />
        </div>
      ))}
    </div>
  );
}
