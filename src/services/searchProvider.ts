import type { SourceRef } from '../types';

interface DDGResult {
  title: string;
  url: string;
  snippet: string;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parseDuckDuckGoHtml(html: string): DDGResult[] {
  const results: DDGResult[] = [];
  // Match result blocks: <a rel="nofollow" class="result__a" href="...">TITLE</a> ... <a class="result__snippet"...>SNIPPET</a>
  const blockRegex = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|<td[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/td>)/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRegex.exec(html)) && results.length < 12) {
    let url = m[1];
    // DDG wraps URLs in redirect: //duckduckgo.com/l/?uddg=ENCODED&...
    const uddg = url.match(/[?&]uddg=([^&]+)/);
    if (uddg) url = decodeURIComponent(uddg[1]);
    if (url.startsWith('//')) url = 'https:' + url;
    if (!/^https?:\/\//i.test(url)) continue;
    const title = decodeHtml(m[2]);
    const snippet = decodeHtml(m[3] || m[4] || '');
    if (title) results.push({ title, url, snippet });
  }
  // Fallback: simpler pattern
  if (results.length === 0) {
    const linkRegex = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let lm: RegExpExecArray | null;
    while ((lm = linkRegex.exec(html)) && results.length < 12) {
      let url = lm[1];
      const uddg = url.match(/[?&]uddg=([^&]+)/);
      if (uddg) url = decodeURIComponent(uddg[1]);
      if (!/^https?:\/\//i.test(url)) continue;
      results.push({ title: decodeHtml(lm[2]), url, snippet: '' });
    }
  }
  return results;
}

export async function searchWeb(query: string): Promise<SourceRef[]> {
  const q = (query || '').trim();
  if (!q) return [];

  // Try Vite dev proxy first, then direct (may fail CORS in browser)
  const endpoints = [
    `/api/search?q=${encodeURIComponent(q)}`,
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: { Accept: 'text/html' },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const parsed = parseDuckDuckGoHtml(html);
      if (parsed.length > 0) {
        return parsed.map((r) => ({ title: r.title, url: r.url, snippet: r.snippet }));
      }
    } catch {
      // try next endpoint
    }
  }
  return [];
}
