/** Mind Manor: answer a question to open each door; reach the attic before your lanterns die. */

export interface Room {
  name: string;
  icon: string;
  blurb: string;
}

export const ROOMS: readonly Room[] = [
  { name: 'Foyer', icon: '🚪', blurb: 'The front door slams behind you. Seven doors stand between you and the attic.' },
  { name: 'Portrait Gallery', icon: '🖼️', blurb: 'The eyes in the paintings follow you. One of them blinks.' },
  { name: 'Library', icon: '📚', blurb: 'Books whisper facts to anyone who listens closely.' },
  { name: 'Conservatory', icon: '🥀', blurb: 'Dead roses. A gramophone plays a waltz from 1923.' },
  { name: 'Ballroom', icon: '🕯️', blurb: 'Guests from every century are dancing. None of them have feet.' },
  { name: 'Crypt Stairs', icon: '⚰️', blurb: 'Cold air rises from below. Something down there knows the answer.' },
  { name: 'Observatory', icon: '🔭', blurb: 'The telescope points at a star that went out long ago.' },
  { name: 'Attic', icon: '🦇', blurb: 'You made it. The Grimoire is yours.' },
];

export const MAX_LANTERNS = 3;
export const LAST_ROOM = ROOMS.length - 1;
/** Worst case: every door needs a right answer and you can afford MAX_LANTERNS - 1 wrong ones. */
export const QUESTIONS_NEEDED = LAST_ROOM + MAX_LANTERNS - 1;

export type ManorStatus = 'playing' | 'won' | 'lost';

export interface ManorState {
  room: number;
  lanterns: number;
  score: number;
  answered: number;
  status: ManorStatus;
}

export type ManorAction = { type: 'answer'; correct: boolean } | { type: 'restart' };

export function initialManor(): ManorState {
  return { room: 0, lanterns: MAX_LANTERNS, score: 0, answered: 0, status: 'playing' };
}

export function manorReducer(state: ManorState, action: ManorAction): ManorState {
  if (action.type === 'restart') return initialManor();
  if (state.status !== 'playing') return state;

  const answered = state.answered + 1;
  if (action.correct) {
    const room = state.room + 1;
    return {
      ...state,
      room,
      answered,
      score: state.score + 1,
      status: room === LAST_ROOM ? 'won' : 'playing',
    };
  }
  const lanterns = state.lanterns - 1;
  return { ...state, lanterns, answered, status: lanterns === 0 ? 'lost' : 'playing' };
}
