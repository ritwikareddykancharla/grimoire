import { shuffle, type Rng } from './rng';

/** A Wikipedia page as the quiz needs it. `key` is the canonical title used in links. */
export interface QuizPage {
  key: string;
  title: string;
  extract: string;
  description?: string;
  thumbnail?: string;
}

/** One "on this day" event. Negative years are BC. */
export interface QuizEvent {
  text: string;
  year: number;
  pages: QuizPage[];
}

export type QuestionKind = 'year' | 'identity';

export interface Question {
  id: string;
  kind: QuestionKind;
  prompt: string;
  clue: string;
  hint?: string;
  image?: string;
  options: string[];
  answerIndex: number;
  /** Canonical title of the article that explains the answer. */
  learnMore?: string;
}

export const OPTION_COUNT = 4;
export const REDACTION = '▒▒▒▒';
const MAX_CLUE_LENGTH = 420;
const MIN_EXTRACT_LENGTH = 80;

export function formatYear(year: number): string {
  return year < 0 ? `${-year} BC` : String(year);
}

/**
 * Four distinct years: the real one plus three plausible decoys.
 * Decoys sit within a window that widens for older events, never land on
 * year 0 (which does not exist) and never fall after `maxYear`.
 */
export function yearOptions(rng: Rng, year: number, maxYear: number): number[] {
  const age = Math.max(0, maxYear - year);
  const spread = Math.min(300, Math.max(5, Math.round(age / 8)));
  const lo = year - spread;
  const hi = Math.max(year, Math.min(year + spread, maxYear));
  const candidates: number[] = [];
  for (let y = lo; y <= hi; y++) {
    if (y !== year && y !== 0) candidates.push(y);
  }
  const decoys = shuffle(rng, candidates).slice(0, OPTION_COUNT - 1);
  return shuffle(rng, [year, ...decoys]);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Terms that would give the answer away: the full title and each word of 4+ letters. */
export function redactionTerms(title: string): string[] {
  const words = title.split(/[\s_(),.:;'"–—-]+/).filter((w) => w.length >= 4);
  const unique = Array.from(new Set([title, ...words].filter((t) => t.length > 0)));
  return unique.sort((a, b) => b.length - a.length);
}

/** Matches the year as a standalone number, so 1870 matches "1870" and "1870s" but not "18701". */
export function yearPattern(year: number): RegExp {
  return new RegExp(`(?<!\\d)${Math.abs(year)}(?!\\d)`, 'g');
}

/** Hide the answer year inside an event description ("…the War of 1870"). */
export function redactYear(text: string, year: number): string {
  return text.replace(yearPattern(year), REDACTION);
}

/** Hide every occurrence of the title (and its significant words) in `text`. */
export function redact(text: string, title: string): string {
  let out = text;
  for (const term of redactionTerms(title)) {
    out = out.replace(new RegExp(escapeRegExp(term), 'gi'), REDACTION);
  }
  return out;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max)}…`;
}

function uniquePages(events: readonly QuizEvent[]): QuizPage[] {
  const seen = new Set<string>();
  const out: QuizPage[] = [];
  for (const event of events) {
    for (const page of event.pages) {
      const id = page.title.toLowerCase();
      if (seen.has(id) || page.extract.length < MIN_EXTRACT_LENGTH) continue;
      seen.add(id);
      out.push(page);
    }
  }
  return out;
}

/**
 * Build up to `count` questions, alternating "what year?" and "which article?".
 * Pure and deterministic for a given rng seed, so it is easy to test.
 */
export function buildQuestions(
  events: readonly QuizEvent[],
  rng: Rng,
  count: number,
  maxYear: number,
): Question[] {
  const datedEvents = shuffle(
    rng,
    events.filter((e) => Number.isInteger(e.year) && e.year !== 0 && e.text.trim().length > 20),
  );
  const pool = shuffle(rng, uniquePages(events));
  const questions: Question[] = [];
  let eventCursor = 0;
  let pageCursor = 0;

  while (questions.length < count) {
    const wantIdentity = questions.length % 2 === 1;
    const canIdentity = pageCursor < pool.length && pool.length >= OPTION_COUNT;
    const canYear = eventCursor < datedEvents.length;

    if ((wantIdentity && canIdentity) || (!canYear && canIdentity)) {
      const page = pool[pageCursor++] as QuizPage;
      const decoys = shuffle(
        rng,
        pool.filter((p) => p.title.toLowerCase() !== page.title.toLowerCase()),
      ).slice(0, OPTION_COUNT - 1);
      const options = shuffle(rng, [page.title, ...decoys.map((d) => d.title)]);
      questions.push({
        id: `identity:${page.key}`,
        kind: 'identity',
        prompt: 'Which article is this spirit describing?',
        clue: truncate(redact(page.extract, page.title), MAX_CLUE_LENGTH),
        hint: page.description ? redact(page.description, page.title) : undefined,
        options,
        answerIndex: options.indexOf(page.title),
        learnMore: page.key,
      });
    } else if (canYear) {
      const event = datedEvents[eventCursor++] as QuizEvent;
      const years = yearOptions(rng, event.year, maxYear);
      const lead = event.pages[0];
      questions.push({
        id: `year:${event.year}:${questions.length}`,
        kind: 'year',
        prompt: 'In what year did this happen?',
        clue: redactYear(event.text, event.year),
        image: lead?.thumbnail,
        options: years.map(formatYear),
        answerIndex: years.indexOf(event.year),
        learnMore: lead?.key,
      });
    } else {
      break;
    }
  }
  return questions;
}
