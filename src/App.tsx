import { useMemo, useState } from 'react';
import { AlertCircle, Clock3, Menu, Search, Trash2, X } from 'lucide-react';
import { ActionableCard } from './components/ActionableCard';
import { OmniInputBar } from './components/OmniInputBar';
import { orchestrate } from './services/aiOrchestrator';
import { useAppStore } from './store';
import type { OmniInputPayload } from './types';

export default function App() {
  const { mode, sessions, activeSessionId, addSession, setActiveSession, clearSessions } = useAppStore();
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
          'Pesquisa',
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
    <div className={`min-h-screen bg-[#f8f9fa] text-slate-900 ${!hasResults ? 'flex flex-col' : ''}`}>
      {/* Minimal top nav */}
      <nav className="no-print flex items-center justify-between px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200/60 transition-colors"
          aria-label="Histórico"
          title="Histórico"
        >
          <Menu size={20} />
        </button>
        {hasResults && (
          <div className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <span className="text-blue-600">M</span><span className="text-red-500">u</span><span className="text-amber-500">l</span><span className="text-blue-600">t</span><span className="text-green-600">i</span><span className="text-red-500">M</span>
          </div>
        )}
        <div className="w-10" />
      </nav>

      {/* Search area */}
      <header className={`no-print ${hasResults ? 'sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-sm' : 'flex-1 flex items-center justify-center'}`}>
        <div className={`w-full px-4 ${hasResults ? 'max-w-5xl mx-auto py-3 flex items-center gap-4' : 'max-w-2xl mx-auto -mt-20'}`}>
          {!hasResults && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white shadow-sm border border-slate-200 mb-5">
                <Search size={30} className="text-slate-700" />
              </div>
              <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight">
                <span className="text-blue-600">M</span><span className="text-red-500">u</span><span className="text-amber-500">l</span><span className="text-blue-600">t</span><span className="text-green-600">i</span><span className="text-red-500">M</span>
              </h1>
              <p className="mt-3 text-slate-500">Encontre soluções na web</p>
            </div>
          )}
          {hasResults && (
            <div className="hidden sm:block text-xl font-semibold tracking-tight shrink-0 mr-2">
              <span className="text-blue-600">M</span><span className="text-red-500">u</span><span className="text-amber-500">l</span><span className="text-blue-600">t</span><span className="text-green-600">i</span><span className="text-red-500">M</span>
            </div>
          )}
          <div className={hasResults ? 'flex-1 max-w-2xl' : ''}>
            <OmniInputBar mode={mode} loading={loading} onSubmit={handleSubmit} compact={hasResults} />
          </div>
        </div>
      </header>

      {/* History drawer */}
      {drawerOpen && (
        <div className="no-print fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[320px] max-w-[85vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Clock3 size={16} /> Pesquisas recentes</h2>
              <div className="flex items-center gap-1">
                {sessions.length > 0 && (
                  <button onClick={() => { clearSessions(); }} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100" aria-label="Limpar" title="Limpar">
                    <Trash2 size={16} />
                  </button>
                )}
                <button onClick={() => setDrawerOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {sessions.length === 0 && <p className="px-3 py-6 text-sm text-slate-400 text-center">Nenhuma pesquisa recente.</p>}
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSession(s.id); setDrawerOpen(false); }}
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${activeSessionId === s.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="text-[11px] text-slate-400">{new Date(s.createdAt).toLocaleString('pt-BR')}</div>
                  <div className="mt-0.5 line-clamp-2 text-sm text-slate-700">{s.inputSummary || 'Pesquisa'}</div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          {error && (
            <div className="no-print mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {loading && <LoadingResults />}

          {!loading && active && (
            <div>
              <p className="text-xs text-slate-500 mb-4 px-1">
                Cerca de {active.response.sources?.length || 0} resultados
              </p>
              <ActionableCard response={active.response} />
            </div>
          )}
        </main>
      )}

      {!hasResults && (
        <footer className="no-print py-6 text-center text-xs text-slate-400">
          MultiM &middot; Buscador de soluções
        </footer>
      )}
    </div>
  );
}

function LoadingResults() {
  return (
    <div className="space-y-6 max-w-2xl">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
