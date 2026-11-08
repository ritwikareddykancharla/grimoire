# Tech

## Stack
- React 19 + TypeScript (strict, `noUncheckedIndexedAccess`) + Vite 8.
- No backend. All data comes from public Wikimedia REST APIs, called from the browser (CORS `*`).
- DOMPurify for every piece of HTML we render.
- Vitest + fast-check for tests. jsdom only for sanitizer tests (`// @vitest-environment jsdom`).
- Plain CSS in `src/styles.css` using CSS custom properties. No CSS framework.

## Commands
- `npm run dev`: dev server (run it yourself in a terminal, never from the agent).
- `npm test`: run all tests once (`vitest run`). Never use watch mode from the agent.
- `npm run typecheck`: `tsc --noEmit`.
- `npm run build`: typecheck then production build to `dist/`.

## Wikimedia API rules
- Always send the `Api-User-Agent` header (see `USER_AGENT` in `src/api/wiki.ts`).
- Endpoints in use: `rest_v1/page/{summary,html,media-list,random/summary}`, `rest_v1/feed/{featured,onthisday}`, `w/rest.php/v1/search/title`.
- Simple English Wikipedia is `simple.wikipedia.org`; feeds exist only for `en`.
- All network code lives in `src/api/wiki.ts`. Components never call `fetch` directly.
- Map raw responses to our own small types at the API boundary; components never see raw Wikimedia shapes.

## Security rules
- Never render third-party HTML without `prepareArticle()` from `src/lib/sanitize.ts`.
- `dangerouslySetInnerHTML` is allowed only for `prepareArticle().html`, with a comment pointing at the sanitizer.
- Only `https://`, `http://` and `#/article/` URLs may survive sanitizing. External links get `target="_blank" rel="noopener noreferrer"`.
- No secrets, keys or tracking in the client.

## Testing rules
- Pure logic goes in `src/lib/` and must have property-based tests with fast-check.
- Randomness is always injected as a seeded `Rng` (`src/lib/rng.ts`) so tests are deterministic.
- Write properties as invariants from the spec (e.g. "exactly one correct option", "clue never contains the answer").
- Unit tests stay offline. Live-API checks are throwaway scripts, never committed.

## Accessibility rules
- Every interactive element is a real `<button>` or `<a>`; keyboard and focus-visible must work.
- Decorative emoji and chrome get `aria-hidden="true"`.
- Respect `prefers-reduced-motion` (all animations are disabled in `styles.css`).
- Status changes use `role="status"` or `aria-live="polite"`.
