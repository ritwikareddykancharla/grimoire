# Implementation Plan: Grimoire '95

- [x] 1. Project scaffold and steering
  - Vite + React + TypeScript (strict), Vitest + fast-check, DOMPurify
  - Steering docs: product, tech, structure
  - MIT license, README, .gitignore that keeps `/.kiro`
  - _Requirements: 7.1, 7.2_

- [x] 2. Pure core logic with property-based tests
  - [x] 2.1 Seeded RNG and shuffle (`src/lib/rng.ts`), property P1
  - [x] 2.2 Hash routes and wiki link rewriting (`src/lib/routes.ts`), property P11
    - _Requirements: 3.3_
  - [x] 2.3 Riddle generator (`src/lib/quiz.ts`), properties P2–P8
    - _Requirements: 5.5–5.8, 5.10_
  - [x] 2.4 Mind Manor reducer (`src/lib/manor.ts`), properties P9–P10
    - _Requirements: 5.1–5.4_
  - [x] 2.5 Article sanitizer (`src/lib/sanitize.ts`), property P12
    - _Requirements: 3.2–3.4_

- [x] 3. Wikimedia data layer (`src/api/wiki.ts`)
  - Typed mappers, Api-User-Agent header, promise cache with eviction on failure, `WikiError` with status
  - _Requirements: 1.1, 2.1, 3.1, 3.5, 5.5_

- [x] 4. App shell
  - Window chrome, toolbar (Home, Random, Mind Manor), status bar with attribution
  - Reading level toggle persisted to localStorage
  - _Requirements: 2.5, 4.1, 4.2, 6.1_

- [x] 5. Home screen with featured article, picture of the day, on this day
  - _Requirements: 1.1–1.4_

- [x] 6. Search combobox with debounced suggestions and keyboard support
  - _Requirements: 2.1–2.4_

- [x] 7. Article reader with TOC, media gallery lightbox, credit footer, 404 and Simple-mode fallbacks
  - _Requirements: 3.1–3.7, 4.3_

- [x] 8. Mind Manor game UI (map, lanterns, riddles, feedback, learn more, win/lose)
  - _Requirements: 5.1–5.10_

- [x] 9. Responsive layout and reduced-motion support
  - _Requirements: 6.2–6.4_

- [x] 10. GitHub Pages deployment
  - [x] 10.1 Workflow: test, build, deploy on push to `main`
  - [x] 10.2 Create the public GitHub repo, push, enable Pages (Source: GitHub Actions)
  - [x] 10.3 Add the live URL to README and the repo About section
  - _Requirements: 7.3_

- [ ] 11. Polish pass in a real browser
  - [ ] 11.1 Manual check of every route on desktop and a 360 px viewport
  - [ ] 11.2 Keyboard-only run through search, article TOC, gallery and a full Mind Manor game
  - [ ] 11.3 Tune article CSS against 5 varied articles (person, place, event, science, list)
  - _Requirements: 6.1–6.4_

- [ ] 12. Stretch features (pick by remaining time)
  - [ ] 12.1 "Timeline" view: browse events for any date with a date picker
  - [ ] 12.2 Sound effects (door creak, lantern out) with a mute toggle, off by default
  - [ ] 12.3 Bookmarks ("Spellbook") saved in localStorage
  - [ ] 12.4 Mind Manor daily seed so everyone gets the same riddles each day, plus a shareable score card

- [ ] 13. Submission
  - [ ] 13.1 Record a demo video under 3 minutes (no copyrighted music) and upload it to YouTube as public
  - [ ] 13.2 Write the "How we used Kiro" section (specs, steering, hooks, PBT, MCP)
  - [ ] 13.3 Optional bonus prizes: social post with #KiroweenHackathon26, blog post
  - [ ] 13.4 Submit on Devpost before Fri Dec 4, 2026, 2:00 PM PT
