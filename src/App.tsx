import { useMemo, useState } from 'react';
import { AlertCircle, Clock3, FlaskConical, Grid3X3, Trash2, X } from 'lucide-react';
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
    <div className={`min-h-screen bg-white text-[#1f1f1f] ${!hasResults ? 'flex flex-col' : ''}`}>
      {/* Top nav - Google.com style */}
      <nav className="no-print flex items-center justify-between px-4 sm:px-6 h-[60px] text-[14px]">
        <div className="flex items-center gap-4">
          <a href="#" onClick={(e) => { e.preventDefault(); clearSessions(); setError(null); }} className="text-[#1f1f1f] hover:underline">Sobre</a>
          <span className="text-[#1f1f1f] hover:underline cursor-default hidden sm:inline">Store</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setDrawerOpen(true)} className="text-[#1f1f1f] hover:underline px-1">Histórico</button>
          <span className="text-[#1f1f1f] hover:underline cursor-default hidden sm:inline px-1">Imagens</span>
          <button type="button" className="p-2 rounded-full hover:bg-[rgba(60,64,67,.08)]" aria-label="Google apps" title="Google apps">
            <FlaskConical size={20} className="text-[#444746]" />
          </button>
          <button type="button" className="p-2 rounded-full hover:bg-[rgba(60,64,67,.08)]" aria-label="Google apps">
            <Grid3X3 size={20} className="text-[#444746]" />
          </button>
          <div className="ml-1 h-8 w-8 rounded-full bg-[#0b57d0] text-white flex items-center justify-center text-sm font-medium cursor-default">M</div>
        </div>
      </nav>

      {!hasResults ? (
        <>
          <main className="flex-1 flex flex-col items-center px-5">
            <div className="w-full flex flex-col items-center" style={{ marginTop: 'clamp(60px, 16vh, 198px)' }}>
              {/* Google logo */}
              <div className="mb-[26px]">
                <h1 className="text-[92px] leading-[1] font-normal select-none" style={{ fontFamily: 'Product Sans, Arial, sans-serif', letterSpacing: '-2px' }}>
                  <span className="text-[#4285f4]">M</span><span className="text-[#ea4335]">u</span><span className="text-[#fbbc05]">l</span><span className="text-[#4285f4]">t</span><span className="text-[#34a853]">i</span><span className="text-[#ea4335]">M</span>
                </h1>
              </div>

              {/* Search bar */}
              <div className="w-full max-w-[584px]">
                <OmniInputBar mode={mode} loading={loading} onSubmit={handleSubmit} />
              </div>

              {/* Buttons */}
              <div className="mt-[29px] flex gap-3">
                <button
                  type="button"
                  onClick={() => { const el = document.querySelector('textarea') as HTMLTextAreaElement | null; el?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }}
                  className="bg-[#f8f9fa] border border-[#f8f9fa] rounded-[4px] text-[#3c4043] text-[14px] h-[36px] px-[16px] hover:border-[#dadce0] hover:shadow-[0_1px_1px_rgba(0,0,0,.1)]"
                >
                  Pesquisa Google
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="bg-[#f8f9fa] border border-[#f8f9fa] rounded-[4px] text-[#3c4043] text-[14px] h-[36px] px-[16px] hover:border-[#dadce0] hover:shadow-[0_1px_1px_rgba(0,0,0,.1)]"
                >
                  Estou com sorte
                </button>
              </div>
            </div>
          </main>

          {/* Footer - Google style */}
          <footer className="bg-[#f2f2f2] text-[#1f1f1f] text-[14px]">
            <div className="px-[30px] py-[15px] border-b border-[#dadce0] text-[#1f1f1f]">Brasil</div>
            <div className="flex flex-col sm:flex-row justify-between px-[20px] py-0">
              <div className="flex justify-center sm:justify-start flex-wrap">
                {['Sobre', 'Publicidade', 'Negócios', 'Como funciona a Pesquisa'].map((t) => (
                  <span key={t} className="px-[15px] py-[14px] hover:underline cursor-default text-[#1f1f1f]">{t}</span>
                ))}
              </div>
              <div className="flex justify-center sm:justify-end flex-wrap">
                {['Privacidade', 'Termos', 'Configurações'].map((t) => (
                  <span key={t} className="px-[15px] py-[14px] hover:underline cursor-default text-[#1f1f1f]">{t}</span>
                ))}
              </div>
            </div>
          </footer>
        </>
      ) : (
        <>
          <header className="no-print sticky top-0 z-30 bg-white border-b border-[#ebebeb]">
            <div className="flex items-center gap-10 px-6 pt-5 pb-3">
              <button
                type="button"
                onClick={() => { clearSessions(); setError(null); }}
                className="shrink-0 text-[30px] leading-none font-normal select-none"
                style={{ fontFamily: 'Product Sans, Arial, sans-serif', letterSpacing: '-1px' }}
                title="Ir para a página inicial do MultiM"
              >
                <span className="text-[#4285f4]">M</span><span className="text-[#ea4335]">u</span><span className="text-[#fbbc05]">l</span><span className="text-[#4285f4]">t</span><span className="text-[#34a853]">i</span><span className="text-[#ea4335]">M</span>
              </button>
              <div className="flex-1 max-w-[690px]">
                <OmniInputBar mode={mode} loading={loading} onSubmit={handleSubmit} compact />
              </div>
            </div>
            <div className="flex items-center gap-6 px-6 lg:pl-[180px] text-[14px] text-[#5f6368]">
              <span className="py-3 border-b-[3px] border-[#1a73e8] text-[#1a73e8] -mb-px">Todos</span>
              <span className="py-3 cursor-default hover:text-[#202124]">Imagens</span>
              <span className="py-3 cursor-default hover:text-[#202124]">Vídeos</span>
              <span className="py-3 cursor-default hover:text-[#202124]">Notícias</span>
            </div>
          </header>

          <main className="px-6 lg:pl-[180px] py-3 max-w-[1176px]">
            {error && (
              <div className="no-print mb-4 flex items-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {loading && <LoadingResults />}
            {!loading && active && (
              <div>
                <p className="text-[14px] text-[#70757a] leading-[43px]">
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
          <aside className="absolute right-0 top-0 h-full w-[360px] max-w-[90vw] bg-white shadow-2xl flex flex-col rounded-l-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#dadce0]">
              <h2 className="flex items-center gap-2 text-[16px] text-[#202124]"><Clock3 size={18} /> Pesquisas recentes</h2>
              <div className="flex items-center gap-1">
                {sessions.length > 0 && (
                  <button onClick={() => { clearSessions(); }} className="p-2 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full" aria-label="Limpar">
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={() => setDrawerOpen(false)} className="p-2 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full" aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {sessions.length === 0 && <p className="px-4 py-8 text-sm text-[#70757a] text-center">Nenhuma pesquisa recente.</p>}
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSession(s.id); setDrawerOpen(false); }}
                  className={`w-full rounded-lg px-4 py-3 text-left transition ${activeSessionId === s.id ? 'bg-[#e8f0fe]' : 'hover:bg-[#f1f3f4]'}`}
                >
                  <div className="text-[12px] text-[#70757a]">{new Date(s.createdAt).toLocaleString('pt-BR')}</div>
                  <div className="mt-0.5 truncate text-[14px] text-[#202124]">{s.inputSummary || 'Pesquisa'}</div>
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
    <div className="space-y-8 max-w-[600px] mt-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-[28px] w-[28px] animate-pulse rounded-full bg-[#e8eaed]" />
            <div className="space-y-1">
              <div className="h-3 w-24 animate-pulse rounded bg-[#e8eaed]" />
              <div className="h-2.5 w-40 animate-pulse rounded bg-[#f1f3f4]" />
            </div>
          </div>
          <div className="h-5 w-[75%] animate-pulse rounded bg-[#e8eaed] mb-2" />
          <div className="h-4 w-full animate-pulse rounded bg-[#f1f3f4] mb-1" />
          <div className="h-4 w-[85%] animate-pulse rounded bg-[#f1f3f4]" />
        </div>
      ))}
    </div>
  );
}
