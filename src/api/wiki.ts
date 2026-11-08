import type { QuizEvent, QuizPage } from '../lib/quiz';

/** `simple` is Simple English Wikipedia: shorter sentences, kid-friendly vocabulary. */
export type Lang = 'en' | 'simple';

// Wikimedia asks browser clients to identify themselves with Api-User-Agent.
const USER_AGENT = 'Grimoire95/0.1 (https://github.com/ritwikareddykancharla/grimoire; Kiroween 2026)';

export class WikiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'WikiError';
    this.status = status;
  }
}

export interface Thumbnail {
  source: string;
  width: number;
  height: number;
}

export interface PageSummary {
  key: string;
  title: string;
  description?: string;
  extract: string;
  thumbnail?: Thumbnail;
  originalimage?: Thumbnail;
}

export interface SearchHit {
  key: string;
  title: string;
  description?: string;
  thumbnail?: string;
}

export interface MediaItem {
  title: string;
  src: string;
  caption?: string;
}

export interface PictureOfTheDay {
  title: string;
  src: string;
  width: number;
  height: number;
  description?: string;
  artist?: string;
}

export interface FeaturedFeed {
  featured?: PageSummary;
  picture?: PictureOfTheDay;
  onThisDay: QuizEvent[];
}

const base = (lang: Lang) => `https://${lang}.wikipedia.org`;
const encodeTitle = (title: string) => encodeURIComponent(title.replace(/ /g, '_'));
const absolutize = (url: string) => (url.startsWith('//') ? `https:${url}` : url);

const cache = new Map<string, Promise<unknown>>();

async function request(url: string, accept: string, signal?: AbortSignal): Promise<Response> {
  const res = await fetch(url, { headers: { 'Api-User-Agent': USER_AGENT, Accept: accept }, signal });
  if (!res.ok) throw new WikiError(res.status, `Wikipedia responded ${res.status} for ${url}`);
  return res;
}

/** Memoize successful lookups for the session; failed ones are retried next time. */
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const pending = load().catch((err: unknown) => {
    cache.delete(key);
    throw err;
  });
  cache.set(key, pending);
  return pending;
}

/* ---------- Raw response shapes (only the fields we use) ---------- */

interface RawSummary {
  title: string;
  normalizedtitle?: string;
  titles?: { canonical: string; normalized: string };
  description?: string;
  extract?: string;
  thumbnail?: Thumbnail;
  originalimage?: Thumbnail;
}

interface RawEvent {
  text: string;
  year: number;
  pages?: RawSummary[];
}

function toSummary(raw: RawSummary): PageSummary {
  const key = raw.titles?.canonical ?? raw.title.replace(/ /g, '_');
  return {
    key,
    title: raw.titles?.normalized ?? raw.normalizedtitle ?? raw.title.replace(/_/g, ' '),
    description: raw.description,
    extract: raw.extract ?? '',
    thumbnail: raw.thumbnail,
    originalimage: raw.originalimage,
  };
}

function toQuizPage(raw: RawSummary): QuizPage {
  const s = toSummary(raw);
  return { key: s.key, title: s.title, extract: s.extract, description: s.description, thumbnail: s.thumbnail?.source };
}

function toEvent(raw: RawEvent): QuizEvent {
  return { text: raw.text, year: raw.year, pages: (raw.pages ?? []).map(toQuizPage) };
}

/* ---------- Public API ---------- */

export function getSummary(title: string, lang: Lang): Promise<PageSummary> {
  return cached(`summary:${lang}:${title}`, async () => {
    const res = await request(`${base(lang)}/api/rest_v1/page/summary/${encodeTitle(title)}`, 'application/json');
    return toSummary((await res.json()) as RawSummary);
  });
}

export function getArticleHtml(title: string, lang: Lang): Promise<string> {
  return cached(`html:${lang}:${title}`, async () => {
    const res = await request(`${base(lang)}/api/rest_v1/page/html/${encodeTitle(title)}`, 'text/html');
    return res.text();
  });
}

export function getMedia(title: string, lang: Lang): Promise<MediaItem[]> {
  return cached(`media:${lang}:${title}`, async () => {
    const res = await request(`${base(lang)}/api/rest_v1/page/media-list/${encodeTitle(title)}`, 'application/json');
    const data = (await res.json()) as {
      items?: { title: string; type: string; showInGallery?: boolean; caption?: { text?: string }; srcset?: { src: string }[] }[];
    };
    return (data.items ?? [])
      .filter((item) => item.type === 'image' && item.showInGallery !== false && item.srcset?.[0]?.src)
      .map((item) => ({
        title: item.title,
        src: absolutize(item.srcset?.[0]?.src ?? ''),
        caption: item.caption?.text,
      }));
  });
}

export async function getRandomTitle(lang: Lang): Promise<string> {
  const res = await request(`${base(lang)}/api/rest_v1/page/random/summary`, 'application/json');
  return toSummary((await res.json()) as RawSummary).key;
}

export async function searchTitles(query: string, lang: Lang, signal?: AbortSignal): Promise<SearchHit[]> {
  const url = `${base(lang)}/w/rest.php/v1/search/title?q=${encodeURIComponent(query)}&limit=8`;
  const res = await request(url, 'application/json', signal);
  const data = (await res.json()) as {
    pages?: { key: string; title: string; description?: string | null; thumbnail?: { url?: string } | null }[];
  };
  return (data.pages ?? []).map((p) => ({
    key: p.key,
    title: p.title,
    description: p.description ?? undefined,
    thumbnail: p.thumbnail?.url ? absolutize(p.thumbnail.url) : undefined,
  }));
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Featured feed exists for English Wikipedia only; it drives the home page. */
export function getFeatured(date: Date): Promise<FeaturedFeed> {
  const path = `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
  return cached(`featured:${path}`, async () => {
    const res = await request(`${base('en')}/api/rest_v1/feed/featured/${path}`, 'application/json');
    const data = (await res.json()) as {
      tfa?: RawSummary;
      image?: {
        title: string;
        thumbnail?: Thumbnail;
        description?: { text?: string };
        artist?: { text?: string };
      };
      onthisday?: RawEvent[];
    };
    const img = data.image;
    return {
      featured: data.tfa ? toSummary(data.tfa) : undefined,
      picture: img?.thumbnail
        ? {
            title: img.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, ''),
            src: img.thumbnail.source,
            width: img.thumbnail.width,
            height: img.thumbnail.height,
            description: img.description?.text,
            artist: img.artist?.text,
          }
        : undefined,
      onThisDay: (data.onthisday ?? []).map(toEvent),
    };
  });
}

/** All notable events for a calendar day. Feeds the Mind Manor question generator. */
export function getOnThisDay(month: number, day: number): Promise<QuizEvent[]> {
  return cached(`otd:${month}/${day}`, async () => {
    const res = await request(`${base('en')}/api/rest_v1/feed/onthisday/events/${pad(month)}/${pad(day)}`, 'application/json');
    const data = (await res.json()) as { events?: RawEvent[] };
    return (data.events ?? []).map(toEvent);
  });
}
