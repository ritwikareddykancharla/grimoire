import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { initialManor, LAST_ROOM, manorReducer, MAX_LANTERNS, QUESTIONS_NEEDED, type ManorAction } from './manor';

const answers = fc.array(fc.boolean(), { maxLength: 40 });
const actions: fc.Arbitrary<ManorAction[]> = fc.array(
  fc.oneof(
    { weight: 9, arbitrary: fc.boolean().map((correct): ManorAction => ({ type: 'answer', correct })) },
    { weight: 1, arbitrary: fc.constant<ManorAction>({ type: 'restart' }) },
  ),
  { maxLength: 40 },
);

describe('manorReducer', () => {
  it('keeps every state inside the rules of the manor', () => {
    fc.assert(
      fc.property(actions, (seq) => {
        let s = initialManor();
        for (const a of seq) {
          s = manorReducer(s, a);
          expect(s.lanterns).toBeGreaterThanOrEqual(0);
          expect(s.lanterns).toBeLessThanOrEqual(MAX_LANTERNS);
          expect(s.room).toBeGreaterThanOrEqual(0);
          expect(s.room).toBeLessThanOrEqual(LAST_ROOM);
          expect(s.status === 'won').toBe(s.room === LAST_ROOM);
          expect(s.status === 'lost').toBe(s.lanterns === 0);
          expect(s.score).toBe(s.room);
          expect(s.answered).toBe(s.score + (MAX_LANTERNS - s.lanterns));
        }
      }),
    );
  });

  it('ignores answers once the game is over', () => {
    fc.assert(
      fc.property(answers, fc.boolean(), (seq, extra) => {
        const end = seq.reduce((s, correct) => manorReducer(s, { type: 'answer', correct }), initialManor());
        if (end.status !== 'playing') {
          expect(manorReducer(end, { type: 'answer', correct: extra })).toBe(end);
        }
      }),
    );
  });

  it('always ends within QUESTIONS_NEEDED answers', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: QUESTIONS_NEEDED, maxLength: QUESTIONS_NEEDED }), (seq) => {
        const end = seq.reduce((s, correct) => manorReducer(s, { type: 'answer', correct }), initialManor());
        expect(end.status).not.toBe('playing');
        expect(end.answered).toBeLessThanOrEqual(QUESTIONS_NEEDED);
      }),
    );
  });

  it('restart returns to the foyer with full lanterns', () => {
    fc.assert(
      fc.property(answers, (seq) => {
        const s = seq.reduce((st, correct) => manorReducer(st, { type: 'answer', correct }), initialManor());
        expect(manorReducer(s, { type: 'restart' })).toEqual(initialManor());
      }),
    );
  });
});
