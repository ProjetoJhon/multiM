import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, FileSpreadsheet } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Featured answer - like Google featured snippet */}
      <article className="print-card rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 mb-1">{response.detected_intent}</p>
            <p className="text-xl leading-snug text-slate-900">{response.direct_answer}</p>
          </div>
          <div className="no-print flex shrink-0 gap-2">
            <SmallBtn icon={Copy} label={copied ? 'Copiado' : 'Copiar'} onClick={() => void copyAnswer()} />
            <SmallBtn icon={Download} label="PDF" onClick={() => window.print()} />
            {columns.length > 0 && <SmallBtn icon={FileSpreadsheet} label="CSV" onClick={exportCSV} />}
          </div>
        </div>

      {steps.length > 0 && (
        <section className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-medium text-slate-800 mb-3">Soluções sugeridas</h3>
          <ol className="space-y-2">
            {steps.map((step, idx) => (
              <li key={step.id} className="group">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">{idx + 1}</span>
                  <input type="checkbox" checked={step.done} onChange={() => toggleStep(step.id)} className="mt-1 h-4 w-4 accent-blue-600" />
                  <span className={`text-sm leading-relaxed ${step.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.label}</span>
                </label>
              </li>
            ))}
          </ol>
        </section>
      )}

      {columns.length > 0 && (
        <section className="mt-5 border-t border-slate-100 pt-4 overflow-x-auto">
          <h3 className="text-sm font-medium text-slate-800 mb-2">Dados encontrados</h3>
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                {columns.map((c) => <th key={c} className="border-b border-slate-200 px-2 py-2 font-medium">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {response.tabular_data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  {columns.map((c) => <td key={c} className="border-b border-slate-100 px-2 py-2 text-slate-700">{String(row[c] ?? '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

        {response.suggested_next_action && (
          <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
            <span className="font-medium text-slate-800">Próxima ação: </span>
            {response.suggested_next_action}
          </div>
        )}
      </article>

      {/* Search results list - like Google results */}
      {response.sources?.length > 0 && (
        <section className="space-y-1">
          <h3 className="px-1 text-sm text-slate-500 mb-3">Resultados e fontes</h3>
          {response.sources.map((s, i) => {
            let host = '';
            try { host = new URL(s.url).hostname.replace(/^www\./, ''); } catch {}
            return (
              <a
                key={`${s.url}-${i}`}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg px-1 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">{host.charAt(0).toUpperCase()}</span>
                  <span className="truncate">{host}</span>
                </div>
                <div className="mt-1 text-lg text-blue-700 hover:underline leading-snug">{s.title || s.url}</div>
                {s.snippet && <p className="mt-0.5 text-sm text-slate-600 leading-relaxed line-clamp-2">{s.snippet}</p>}
              </a>
            );
          })}
        </section>
      )}
    </div>
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
