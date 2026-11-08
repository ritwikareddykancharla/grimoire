import { useMemo, useReducer, useState } from 'react';
import { getOnThisDay } from '../api/wiki';
import { useAsync, useDocumentTitle } from '../hooks';
import { initialManor, LAST_ROOM, manorReducer, MAX_LANTERNS, QUESTIONS_NEEDED, ROOMS } from '../lib/manor';
import { buildQuestions, type Question } from '../lib/quiz';
import { mulberry32 } from '../lib/rng';
import { articleHref } from '../lib/routes';
import { ErrorPanel, Loading } from './Feedback';

export function MindManor() {
  useDocumentTitle('Mind Manor');
  const today = new Date();
  const [events, retry] = useAsync(() => getOnThisDay(today.getMonth() + 1, today.getDate()), [today.toDateString()]);
  const [seed, setSeed] = useState(() => Date.now());
  const questions = useMemo(
    () =>
      events.state === 'ready'
        ? buildQuestions(events.value, mulberry32(seed), QUESTIONS_NEEDED, new Date().getFullYear())
        : [],
    [events, seed],
  );

  if (events.state === 'loading') return <Loading label="Lighting the lanterns…" />;
  if (events.state === 'error') {
    return (
      <ErrorPanel title="The manor is shrouded in fog." onRetry={retry}>
        <p>Mind Manor needs Wikipedia to write its riddles. Check your connection.</p>
      </ErrorPanel>
    );
  }

  return <ManorGame key={seed} questions={questions} onRestart={() => setSeed(Date.now())} />;
}

function ManorGame({ questions, onRestart }: { questions: Question[]; onRestart: () => void }) {
  const [state, dispatch] = useReducer(manorReducer, undefined, initialManor);
  const [picked, setPicked] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const question = questions[index];
  const room = ROOMS[Math.min(state.room, LAST_ROOM)];
  const nextRoom = ROOMS[Math.min(state.room + 1, LAST_ROOM)];
  const lanterns = useMemo(() => Array.from({ length: MAX_LANTERNS }, (_, i) => i < state.lanterns), [state.lanterns]);

  function choose(i: number) {
    if (picked !== null || !question) return;
    setPicked(i);
    dispatch({ type: 'answer', correct: i === question.answerIndex });
  }

  function next() {
    setPicked(null);
    setIndex((n) => n + 1);
  }

  const answeredRight = picked !== null && question && picked === question.answerIndex;
  const finished = state.status !== 'playing' && picked === null;
  const outOfQuestions = !question && state.status === 'playing';

  return (
    <div className="manor">
      <header className="manor-header panel">
        <div>
          <p className="kicker">Mind Manor</p>
          <h1>
            <span aria-hidden="true">{room?.icon}</span> {room?.name}
          </h1>
          <p className="muted">{room?.blurb}</p>
        </div>
        <div className="manor-stats">
          <div aria-label={`${state.lanterns} of ${MAX_LANTERNS} lanterns left`} className="lanterns">
            {lanterns.map((lit, i) => (
              <span key={i} className={lit ? 'lantern lit' : 'lantern'} aria-hidden="true">
                🏮
              </span>
            ))}
          </div>
          <div className="score">Souls freed: {state.score}</div>
        </div>
      </header>

      <ol className="manor-map" aria-label="Manor map">
        {ROOMS.map((r, i) => (
          <li
            key={r.name}
            className={i < state.room ? 'room done' : i === state.room ? 'room here' : 'room'}
            aria-current={i === state.room ? 'location' : undefined}
          >
            <span aria-hidden="true">{i <= state.room ? r.icon : '🔒'}</span>
            <small>{r.name}</small>
          </li>
        ))}
      </ol>

      {finished && (
        <section className="panel manor-end" role="status">
          {state.status === 'won' ? (
            <>
              <h2>🦇 You escaped Mind Manor!</h2>
              <p>
                You answered {state.score} of {state.answered} riddles correctly with {state.lanterns}{' '}
                {state.lanterns === 1 ? 'lantern' : 'lanterns'} still burning.
              </p>
            </>
          ) : (
            <>
              <h2>💀 Your last lantern flickers out…</h2>
              <p>
                You reached the {room?.name} and freed {state.score} {state.score === 1 ? 'soul' : 'souls'}. The manor
                will wait for you.
              </p>
            </>
          )}
          <button type="button" className="button primary" onClick={onRestart}>
            Enter again with new riddles
          </button>
        </section>
      )}

      {outOfQuestions && (
        <ErrorPanel title="The spirits ran out of riddles.">
          <p>Today's history was too quiet. Start again to shuffle a new set.</p>
          <button type="button" className="button primary" onClick={onRestart}>
            Start again
          </button>
        </ErrorPanel>
      )}

      {question && !finished && (
        <section className="panel riddle" aria-labelledby="riddle-prompt">
          <p className="kicker">
            Door to the {nextRoom?.name} · Riddle {index + 1}
          </p>
          <h2 id="riddle-prompt">{question.prompt}</h2>
          <div className="riddle-clue">
            {question.image && <img src={question.image} alt="" />}
            <blockquote>{question.clue}</blockquote>
          </div>
          {question.hint && <p className="muted">Hint: {question.hint}</p>}

          <div className="options" role="group" aria-label="Answers">
            {question.options.map((option, i) => {
              const verdict =
                picked === null ? '' : i === question.answerIndex ? 'correct' : i === picked ? 'wrong' : 'dim';
              return (
                <button
                  key={option}
                  type="button"
                  className={`button option ${verdict}`}
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="riddle-feedback" aria-live="polite">
            {picked !== null && (
              <>
                <p className={answeredRight ? 'good' : 'bad'}>
                  {answeredRight
                    ? 'The door creaks open.'
                    : `A cold wind blows out a lantern. The answer was ${question.options[question.answerIndex]}.`}
                </p>
                <div className="riddle-actions">
                  {question.learnMore && (
                    <a className="button" href={articleHref(question.learnMore)}>
                      Learn more
                    </a>
                  )}
                  <button type="button" className="button primary" onClick={next} autoFocus>
                    {state.status === 'playing' ? (answeredRight ? 'Walk through the door' : 'Try another riddle') : 'See your fate'}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
