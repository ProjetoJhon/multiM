import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, FileSpreadsheet, Sparkles } from 'lucide-react';
import type { AIResponse } from '../types';

export function ActionableCard({ response }: { response: AIResponse }) {
  const [steps, setSteps] = useState(response.structured_steps);
  const [copied, setCopied] = useState(false);

  useEffect(() => setSteps(response.structured_steps), [response]);

  const columns = useMemo(() => {
    const first = response.tabular_data[0];
    return first ? Object.keys(first) : [];
  }, [response.tabular_data]);

  function toggleStep(id: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  }

  async function copyAnswer() {
    const text = [
      response.direct_answer,
      '',
      ...steps.map((s) => `${s.done ? '[x]' : '[ ]'} ${s.label}`),
      '',
      `Próxima ação: ${response.suggested_next_action}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function exportCSV() {
    if (!columns.length) return;
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [columns.join(','), ...response.tabular_data.map((row) => columns.map((c) => escape(row[c])).join(','))].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'omni-dados.csv');
  }

  return (
    <article className="print-card rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <Sparkles size={14} /> {response.detected_intent}
          </div>
          <p className="mt-3 text-lg font-semibold leading-snug text-slate-900">{response.direct_answer}</p>
        </div>
        <div className="no-print flex gap-2">
          <SmallBtn icon={Copy} label={copied ? 'Copiado' : 'Copiar'} onClick={() => void copyAnswer()} />
          <SmallBtn icon={Download} label="PDF" onClick={() => window.print()} />
          {columns.length > 0 && <SmallBtn icon={FileSpreadsheet} label="CSV" onClick={exportCSV} />}
        </div>
      </div>

      {steps.length > 0 && (
        <section className="mt-5">
          <h3 className="text-sm font-semibold text-slate-700">Passos acionáveis</h3>
          <ul className="mt-2 space-y-2">
            {steps.map((step) => (
              <li key={step.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 px-3 py-2 hover:bg-slate-50">
                  <input type="checkbox" checked={step.done} onChange={() => toggleStep(step.id)} className="mt-1 h-4 w-4 accent-slate-900" />
                  <span className={`text-sm ${step.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {columns.length > 0 && (
        <section className="mt-5 overflow-x-auto">
          <h3 className="text-sm font-semibold text-slate-700">Dados extraídos</h3>
          <table className="mt-2 w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-600">
                {columns.map((c) => <th key={c} className="border-b border-slate-200 px-3 py-2 font-medium">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {response.tabular_data.map((row, i) => (
                <tr key={i} className="odd:bg-white even:bg-slate-50/40">
                  {columns.map((c) => <td key={c} className="border-b border-slate-100 px-3 py-2 text-slate-700">{String(row[c] ?? '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="mt-5 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-100">
        <span className="font-semibold text-white">Próxima ação sugerida: </span>
        {response.suggested_next_action}
      </div>
    </article>
  );
}

function SmallBtn({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
      <Icon size={14} /> {label}
    </button>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
