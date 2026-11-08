# Grimoire '95 🎃📖

**The 90s multimedia CD-ROM encyclopedia, raised from the dead on live Wikipedia data.**

Kiroween 2026 entry, **Resurrection** category.

In the 90s, encyclopedias came on CD-ROM. They had media galleries, timelines and a quiz game that turned reading into an adventure. Wikipedia replaced them with something far bigger, but dense, citation-heavy pages are hard going for kids. Grimoire '95 brings the old way of exploring back, with Wikipedia's 6+ million articles behind it and a Halloween coat of paint.

## Features

- **Home screen:** today's featured article, the picture of the day and "on this day" history from Wikipedia's daily feed.
- **Article reader:** clean, serif encyclopedia pages with a table of contents, a media gallery with a lightbox, and in-app links between articles. References, banners and site navigation are trimmed away.
- **Simple / Full reading level:** switch between Simple English Wikipedia (for younger readers) and full English Wikipedia. The choice is remembered.
- **Mind Manor:** a haunted-mansion trivia game generated fresh from today's history. Answer riddles to open the doors from the Foyer to the Attic before your 3 lanterns go out. Every answer links to the article behind it.
- **Search** with live suggestions and full keyboard support, plus a **Random** button.
- **Zero setup:** no backend, no account, no API key. Static files you can host anywhere.

## Run it locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # property-based + unit tests
npm run build    # production build in dist/
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: tests, build, then publish to GitHub Pages. In the repo, set **Settings → Pages → Source** to **GitHub Actions** once.

## How it is built

- React 19, TypeScript (strict), Vite 8. Plain CSS for the 95-era chrome.
- Data from the public Wikimedia REST APIs, called straight from the browser.
- All article HTML is parsed inertly, trimmed and passed through [DOMPurify](https://github.com/cure53/DOMPurify) before it reaches the page.
- Game logic, riddle generation, routing and sanitizing are pure modules in `src/lib/`, each covered by [fast-check](https://fast-check.dev/) property-based tests.

## How Kiro was used

The `/.kiro` folder is part of the submission:

- **Steering** (`.kiro/steering/`): `product.md` (audience, pillars, tone), `tech.md` (stack, API, security, testing and accessibility rules) and `structure.md` (layout and conventions). These keep every generated change consistent, for example "never render HTML without `prepareArticle()`".
- **Spec** (`.kiro/specs/grimoire/`): requirements in EARS form, a design with 12 numbered correctness properties, and a task plan. Each property maps to acceptance criteria and to a fast-check test.
- **Property-based testing:** every spec property is a fast-check test. When a check against live data showed that "on this day" text often repeats its own year ("…the Franco-German War of 1870"), giving away year riddles, the fix went in together with a generator that leaks years on purpose, so property P6 now guards it permanently.
- **Hooks** (`.kiro/hooks/`): run the test suite when a source file is saved, remind the agent to add properties when `src/lib` changes, and typecheck when the agent finishes a turn.

_A longer write-up, including a comparison with vibe coding, is in progress for the Devpost submission._

## Credits and license

- Code: [MIT](./LICENSE).
- Article text and images come from [Wikipedia](https://www.wikipedia.org/) and [Wikimedia Commons](https://commons.wikimedia.org/) under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) and their individual licenses. Every article view links to its source.
- Grimoire '95 is an independent project and is not affiliated with the Wikimedia Foundation or with any 90s encyclopedia publisher.
