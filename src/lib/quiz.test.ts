import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  buildQuestions,
  formatYear,
  OPTION_COUNT,
  redact,
  redactionTerms,
  yearOptions,
  yearPattern,
  type QuizEvent,
  type QuizPage,
} from './quiz';
import { mulberry32, shuffle } from './rng';

const MAX_YEAR = 2026;
const seed = fc.integer({ min: 0, max: 2 ** 31 - 1 });
const year = fc.integer({ min: -3000, max: MAX_YEAR }).filter((y) => y !== 0);

const word = fc.stringMatching(/^[A-Z][a-z]{2,9}$/);
const title = fc.array(word, { minLength: 1, maxLength: 3 }).map((ws) => ws.join(' '));

const page: fc.Arbitrary<QuizPage> = fc
  .record({ title, filler: fc.lorem({ maxCount: 30 }), mention: fc.boolean() })
  .map(({ title, filler, mention }) => ({
    key: title.replace(/ /g, '_'),
    title,
    extract: `${mention ? `${title} is ` : ''}a subject of great renown. ${filler} ${mention ? title.toUpperCase() : ''}`.padEnd(90, '.'),
    description: mention ? `famous ${title.toLowerCase()}` : undefined,
  }));

// Real event text often repeats its own year ("...during the Franco-German War of 1870").
const event: fc.Arbitrary<QuizEvent> = fc
  .record({ text: fc.lorem({ maxCount: 20 }), year, leakYear: fc.boolean(), pages: fc.array(page, { maxLength: 4 }) })
  .map(({ text, year, leakYear, pages }) => ({
    text: `Something remarkable happened: ${text}${leakYear ? ` in the war of ${Math.abs(year)}s` : ''}`,
    year,
    pages,
  }));

describe('shuffle', () => {
  it('is a permutation of its input', () => {
    fc.assert(
      fc.property(seed, fc.array(fc.integer()), (s, xs) => {
        const out = shuffle(mulberry32(s), xs);
        expect(out.slice().sort()).toEqual(xs.slice().sort());
      }),
    );
  });
});

describe('yearOptions', () => {
  it('returns four distinct years including the real one exactly once, none after maxYear or equal to 0', () => {
    fc.assert(
      fc.property(seed, year, (s, y) => {
        const opts = yearOptions(mulberry32(s), y, MAX_YEAR);
        expect(opts).toHaveLength(OPTION_COUNT);
        expect(new Set(opts).size).toBe(OPTION_COUNT);
        expect(opts.filter((o) => o === y)).toHaveLength(1);
        for (const o of opts) {
          expect(Number.isInteger(o)).toBe(true);
          expect(o).not.toBe(0);
          expect(o).toBeLessThanOrEqual(MAX_YEAR);
        }
      }),
    );
  });

  it('formats to four distinct labels', () => {
    fc.assert(
      fc.property(seed, year, (s, y) => {
        const labels = yearOptions(mulberry32(s), y, MAX_YEAR).map(formatYear);
        expect(new Set(labels).size).toBe(OPTION_COUNT);
      }),
    );
  });
});

describe('redact', () => {
  it('never leaves the title or any of its significant words in the clue', () => {
    fc.assert(
      fc.property(title, fc.lorem({ maxCount: 40 }), fc.boolean(), (t, filler, shout) => {
        const text = `${filler} ${shout ? t.toUpperCase() : t} ${filler} ${t.toLowerCase()}`;
        const out = redact(text, t).toLowerCase();
        for (const term of redactionTerms(t)) {
          expect(out).not.toContain(term.toLowerCase());
        }
      }),
    );
  });

  it('leaves text without the title untouched', () => {
    expect(redact('A quiet night in the library.', 'Zanzibar')).toBe('A quiet night in the library.');
  });
});

describe('buildQuestions', () => {
  it('produces well-formed, answerable questions', () => {
    fc.assert(
      fc.property(seed, fc.array(event, { maxLength: 15 }), fc.integer({ min: 0, max: 12 }), (s, events, count) => {
        const qs = buildQuestions(events, mulberry32(s), count, MAX_YEAR);
        expect(qs.length).toBeLessThanOrEqual(count);
        expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
        for (const q of qs) {
          expect(q.options).toHaveLength(OPTION_COUNT);
          expect(new Set(q.options.map((o) => o.toLowerCase())).size).toBe(OPTION_COUNT);
          expect(q.answerIndex).toBeGreaterThanOrEqual(0);
          expect(q.answerIndex).toBeLessThan(OPTION_COUNT);
          if (q.kind === 'year') {
            const answerYear = Number.parseInt(q.options[q.answerIndex] as string, 10);
            expect(q.clue).not.toMatch(yearPattern(answerYear));
          }
          if (q.kind === 'identity') {
            const answer = (q.options[q.answerIndex] as string).toLowerCase();
            expect(q.clue.toLowerCase()).not.toContain(answer);
            if (q.hint) expect(q.hint.toLowerCase()).not.toContain(answer);
          }
        }
      }),
    );
  });

  it('fills every slot when there is enough history', () => {
    fc.assert(
      fc.property(seed, fc.array(event, { minLength: 12, maxLength: 20 }), (s, events) => {
        expect(buildQuestions(events, mulberry32(s), 9, MAX_YEAR)).toHaveLength(9);
      }),
    );
  });

  it('is deterministic for a given seed', () => {
    fc.assert(
      fc.property(seed, fc.array(event, { maxLength: 10 }), (s, events) => {
        expect(buildQuestions(events, mulberry32(s), 9, MAX_YEAR)).toEqual(buildQuestions(events, mulberry32(s), 9, MAX_YEAR));
      }),
    );
  });
});
