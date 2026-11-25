import type { AIResponse } from '../types';

export function ActionableCard({ response }: { response: AIResponse }) {
  const sources = response.sources ?? [];

  if (sources.length === 0) {
    return (
      <p className="text-sm text-slate-500 px-1">
        Nenhum link encontrado para esta pesquisa. Tente refinar os termos.
      </p>
    );
  }

  return (
    <section className="space-y-1">
      {sources.map((s, i) => {
        let host = '';
        try {
          host = new URL(s.url).hostname.replace(/^www\./, '');
        } catch {
          host = s.url;
        }
        return (
          <a
            key={`${s.url}-${i}`}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg px-1 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                {host.charAt(0).toUpperCase()}
              </span>
              <span className="truncate">{host}</span>
            </div>
            <div className="mt-1 text-xl text-[#1a0dab] hover:underline leading-snug">
              {s.title || s.url}
            </div>
            {s.snippet && (
              <p className="mt-1 text-sm text-slate-600 leading-relaxed line-clamp-2">{s.snippet}</p>
            )}
          </a>
        );
      })}
    </section>
  );
}
