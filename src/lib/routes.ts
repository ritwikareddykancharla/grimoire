/** Hash routes keep the app working on any static host with no server rewrites. */
export type Route =
  | { name: 'home' }
  | { name: 'article'; title: string }
  | { name: 'manor' }
  | { name: 'notfound'; path: string };

/** Wikipedia canonical form: underscores instead of spaces. */
export function canonicalTitle(title: string): string {
  return title.trim().replace(/ /g, '_');
}

export function displayTitle(title: string): string {
  return title.replace(/_/g, ' ');
}

export function articleHref(title: string): string {
  return `#/article/${encodeURIComponent(canonicalTitle(title))}`;
}

function safeDecode(s: string): string | null {
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
}

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/' || path === '') return { name: 'home' };
  if (path === '/manor') return { name: 'manor' };
  const match = /^\/article\/(.+)$/.exec(path);
  if (match?.[1]) {
    const title = safeDecode(match[1]);
    if (title && title.trim()) return { name: 'article', title: canonicalTitle(title) };
  }
  return { name: 'notfound', path };
}

const NON_ARTICLE_NAMESPACES = new Set([
  'file', 'image', 'category', 'help', 'special', 'wikipedia', 'wp', 'template',
  'portal', 'talk', 'user', 'user_talk', 'module', 'draft', 'mediawiki', 'media', 'book', 'timedtext',
]);

/**
 * Turn a Parsoid wiki link (`./Ada_Lovelace#Early_life`) into an in-app route.
 * Returns null for non-article namespaces (File:, Category:, ...) and for
 * anything that is not a relative wiki link.
 */
export function wikiHrefToRoute(href: string): string | null {
  if (!href.startsWith('./')) return null;
  const raw = href.slice(2).split('#')[0]?.split('?')[0] ?? '';
  const title = safeDecode(raw);
  if (!title || !title.trim()) return null;
  const colon = title.indexOf(':');
  if (colon > 0 && NON_ARTICLE_NAMESPACES.has(title.slice(0, colon).toLowerCase().replace(/ /g, '_'))) {
    return null;
  }
  return articleHref(title);
}
