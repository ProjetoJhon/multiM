import { Clock3, Trash2 } from 'lucide-react';
import { useAppStore } from '../store';

export function HistorySidebar() {
  const { sessions, activeSessionId, setActiveSession, clearSessions } = useAppStore();

  return (
    <aside className="no-print rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,.06)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Clock3 size={16} /> Histórico</h2>
        {sessions.length > 0 && (
          <button onClick={clearSessions} className="text-slate-400 hover:text-red-600" aria-label="Limpar histórico"><Trash2 size={15} /></button>
        )}
      </div>
      <div className="space-y-2">
        {sessions.length === 0 && <p className="text-sm text-slate-400">Suas resoluções recentes aparecem aqui.</p>}
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSession(s.id)}
            className={`w-full rounded-2xl border px-3 py-2 text-left transition ${activeSessionId === s.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 hover:bg-slate-50'}`}
          >
            <div className="text-xs opacity-70">{new Date(s.createdAt).toLocaleString('pt-BR')}</div>
            <div className="mt-1 line-clamp-2 text-sm font-medium">{s.inputSummary || s.response.detected_intent}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
