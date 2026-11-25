import { FileSearch, ListChecks, Languages, Wrench, Sparkles } from 'lucide-react';
import type { QuickMode } from '../types';

const modes: { id: QuickMode; label: string; icon: React.ElementType; hint: string }[] = [
  { id: 'auto', label: 'Auto', icon: Sparkles, hint: 'Detecta intenção' },
  { id: 'summarize', label: 'Resumir & Extrair', icon: FileSearch, hint: 'Caos em clareza' },
  { id: 'diagnose', label: 'Diagnosticar & Resolver', icon: Wrench, hint: 'Causa e correção' },
  { id: 'plan', label: 'Organizar & Planejar', icon: ListChecks, hint: 'Ações e prazos' },
  { id: 'translate', label: 'Traduzir & Explicar', icon: Languages, hint: 'Simplificar' },
];

export function QuickModeSelector({
  value,
  onChange,
}: {
  value: QuickMode;
  onChange: (mode: QuickMode) => void;
}) {
  return (
    <div className="no-print flex flex-wrap gap-2">
      {modes.map(({ id, label, icon: Icon, hint }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            title={hint}
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
              active
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
