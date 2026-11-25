import { useMemo, useState } from 'react';
import { AlertCircle, Clock3, Grid3X3, Trash2, X } from 'lucide-react';
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
    <div className={`min-h-screen bg-white text-[#202124] ${!hasResults ? 'flex flex-col' : ''}`}>
      {/* Google-like top nav */}
      <nav className="no-print flex items-center justify-end gap-2 px-4 py-3 text-[13px] text-[#202124]">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="hover:underline px-2 py-1"
        >
          Histórico
        </button>
        <button type="button" className="p-2 rounded-full hover:bg-[#3c404314]" aria-label="Apps">
          <Grid3X3 size={18} className="text-[#5f6368]" />
        </button>
        <div className="ml-1 h-8 w-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-sm font-medium">M</div>
      </nav>

      {/* Home / search header */}
      {!hasResults ? (
        <main className="flex-1 flex flex-col items-center px-4">
          <div className="mt-[min(18vh,140px)] w-full flex flex-col items-center">
            <h1 className="text-[82px] sm:text-[92px] leading-none font-normal tracking-tight select-none" style={{ fontFamily: 'Arial, sans-serif' }}>
              <span className="text-[#4285f4]">M</span>
              <span className="text-[#ea4335]">u</span>
              <span className="text-[#fbbc05]">l</span>
              <span className="text-[#4285f4]">t</span>
              <span className="text-[#34a853]">i</span>
              <span className="text-[#ea4335]">M</span>
            </h1>
            <div className="w-full max-w-[584px] mt-7">
              <OmniInputBar mode={mode} loading={loading} onSubmit={handleSubmit} />
              <div className="mt-7 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const ta = document.querySelector('textarea');
                    if (ta) (ta as HTMLTextAreaElement).form?.requestSubmit?.();
                  }}
                  className="h-9 px-4 rounded bg-[#f8f9fa] border border-[#f8f9fa] text-sm text-[#3c4043] hover:shadow hover:border-[#dadce0]"
                >
                  Pesquisa MultiM
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="h-9 px-4 rounded bg-[#f8f9fa] border border-[#f8f9fa] text-sm text-[#3c4043] hover:shadow hover:border-[#dadce0]"
                >
                  Pesquisas recentes
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1" />
          <footer className="w-full bg-[#f2f2f2] text-[#70757a] text-sm mt-auto">
            <div className="px-7 py-3 border-b border-[#dadce0]">Brasil</div>
            <div className="flex flex-col sm:flex-row justify-between px-7 py-3 gap-2">
              <div className="flex gap-6 justify-center sm:justify-start flex-wrap">
                <span className="hover:underline cursor-default">Sobre</span>
                <span className="hover:underline cursor-default">Publicidade</span>
                <span className="hover:underline cursor-default">Negócios</span>
              </div>
              <div className="flex gap-6 justify-center sm:justify-end flex-wrap">
                <span className="hover:underline cursor-default">Privacidade</span>
                <span className="hover:underline cursor-default">Termos</span>
                <span className="hover:underline cursor-default">Configurações</span>
              </div>
            </div>
          </footer>
        </main>
      ) : (
        <>
          <header className="no-print sticky top-0 z-30 bg-white border-b border-[#ebebeb]">
            <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => { clearSessions(); setError(null); }}
                className="shrink-0 text-[28px] leading-none font-normal tracking-tight select-none"
                style={{ fontFamily: 'Arial, sans-serif' }}
                title="Voltar ao início"
              >
                <span className="text-[#4285f4]">M</span><span className="text-[#ea4335]">u</span><span className="text-[#fbbc05]">l</span><span className="text-[#4285f4]">t</span><span className="text-[#34a853]">i</span><span className="text-[#ea4335]">M</span>
              </button>
              <div className="flex-1 max-w-[692px]">
                <OmniInputBar mode={mode} loading={loading} onSubmit={handleSubmit} compact />
              </div>
            </div>
          </header>

          <main className="px-4 sm:px-6 lg:pl-[180px] py-4 max-w-[1120px]">
            {error && (
              <div className="no-print mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {loading && <LoadingResults />}

            {!loading && active && (
              <div>
                <p className="text-sm text-[#70757a] mb-4">
                  Aproximadamente {active.response.sources?.length || 0} resultados
                </p>
                <ActionableCard response={active.response} />
              </div>
            )}
          </main>
        </>
      )}

      {/* History drawer */}
      {drawerOpen && (
        <div className="no-print fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-[320px] max-w-[85vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="flex items-center gap-2 text-sm font-medium text-[#202124]"><Clock3 size={16} /> Pesquisas recentes</h2>
              <div className="flex items-center gap-1">
                {sessions.length > 0 && (
                  <button onClick={() => { clearSessions(); }} className="p-2 text-[#5f6368] hover:bg-slate-100 rounded-full" aria-label="Limpar" title="Limpar">
                    <Trash2 size={16} />
                  </button>
                )}
                <button onClick={() => setDrawerOpen(false)} className="p-2 text-[#5f6368] hover:bg-slate-100 rounded-full" aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {sessions.length === 0 && <p className="px-3 py-6 text-sm text-[#70757a] text-center">Nenhuma pesquisa recente.</p>}
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSession(s.id); setDrawerOpen(false); }}
                  className={`w-full rounded-lg px-3 py-3 text-left transition ${activeSessionId === s.id ? 'bg-[#e8f0fe]' : 'hover:bg-[#f1f3f4]'}`}
                >
                  <div className="text-[11px] text-[#70757a]">{new Date(s.createdAt).toLocaleString('pt-BR')}</div>
                  <div className="mt-0.5 line-clamp-2 text-sm text-[#202124]">{s.inputSummary || 'Pesquisa'}</div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function LoadingResults() {
  return (
    <div className="space-y-7 max-w-[600px]">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-[26px] w-[26px] animate-pulse rounded-full bg-[#e8eaed]" />
            <div className="h-3 w-32 animate-pulse rounded bg-[#e8eaed]" />
          </div>
          <div className="h-5 w-4/5 animate-pulse rounded bg-[#e8eaed]" />
          <div className="h-4 w-full animate-pulse rounded bg-[#f1f3f4]" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-[#f1f3f4]" />
        </div>
      ))}
    </div>
  );
}
