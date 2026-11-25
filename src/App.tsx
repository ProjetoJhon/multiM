import { useMemo, useState } from 'react';
import { AlertCircle, Clock3, Menu, Search, Trash2, X } from 'lucide-react';
import { ActionableCard } from './components/ActionableCard';
import { OmniInputBar } from './components/OmniInputBar';
import { QuickModeSelector } from './components/QuickModeSelector';
import { orchestrate } from './services/aiOrchestrator';
import { useAppStore } from './store';
import type { OmniInputPayload } from './types';

export default function App() {
  const { mode, setMode, sessions, activeSessionId, addSession, setActiveSession, clearSessions } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      <header className={`no-print border-b border-slate-200 bg-white ${hasResults ? 'sticky top-0 z-30' : ''}`}>
        <div className={`mx-auto max-w-6xl px-4 ${hasResults ? 'py-3' : 'pt-16 pb-8 sm:pt-24'}`}>
          <div className={`flex items-center gap-3 ${hasResults ? '' : 'flex-col'}`}>
            {/* Logo + menu */}
            <div className={`flex items-center gap-2 ${hasResults ? 'shrink-0' : 'mb-6'}`}>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Abrir histórico"
                title="Histórico"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Search size={18} />
                </div>
                <div className="text-2xl font-semibold tracking-tight text-slate-900">
                  <span className="text-blue-600">M</span><span className="text-red-500">u</span><span className="text-amber-500">l</span><span className="text-blue-600">t</span><span className="text-green-600">i</span><span className="text-red-500">M</span>
                </div>
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

      {/* History drawer */}
      {drawerOpen && (
        <div className="no-print fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[320px] max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Clock3 size={16} /> Histórico</h2>
              <div className="flex items-center gap-1">
                {sessions.length > 0 && (
                  <button onClick={() => { clearSessions(); }} className="p-2 text-slate-400 hover:text-red-600" aria-label="Limpar histórico" title="Limpar">
                    <Trash2 size={16} />
                  </button>
                )}
                <button onClick={() => setDrawerOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {sessions.length === 0 && <p className="px-2 py-4 text-sm text-slate-400">Nenhuma pesquisa recente.</p>}
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSession(s.id); setDrawerOpen(false); }}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition ${activeSessionId === s.id ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50'}`}
                >
                  <div className="text-[11px] text-slate-400">{new Date(s.createdAt).toLocaleString('pt-BR')}</div>
                  <div className="mt-0.5 line-clamp-2 text-sm text-slate-700">{s.inputSummary || s.response.detected_intent}</div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-4 py-6">
        {error && (
          <div className="no-print mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading && <LoadingResults />}

        {!loading && active && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Aproximadamente {1 + (active.response.sources?.length || 0) + (active.response.structured_steps?.length || 0)} soluções encontradas para <span className="font-medium text-slate-700">"{active.inputSummary}"</span>
            </p>
            <ActionableCard response={active.response} />
          </div>
        )}

        {!loading && !active && (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-400">Pesquise qualquer problema e receba soluções e links.</p>
          </div>
        )}
      </main>
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
