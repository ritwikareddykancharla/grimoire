# Structure

```
src/
  main.tsx              React entry
  App.tsx               Window chrome, toolbar, routing switch, status bar
  hooks.ts              useRoute, useAsync, useReadingLevel, useDocumentTitle
  styles.css            All styles (95-era chrome + Halloween palette)
  api/
    wiki.ts             The only module that talks to Wikimedia
  lib/                  Pure, framework-free logic. Every file has a *.test.ts
    rng.ts              Seeded RNG + shuffle
    routes.ts           Hash routes, wiki link rewriting
    sanitize.ts         Parsoid HTML -> trimmed, DOMPurify-sanitized HTML + TOC
    quiz.ts             Riddle generation for Mind Manor
    manor.ts            Mind Manor game state machine (reducer)
  components/           React views. No business logic beyond wiring.
.kiro/
  steering/             product.md, tech.md, structure.md (this file)
  specs/grimoire/       requirements.md, design.md, tasks.md
  hooks/                Agent hooks (tests on save, PBT reminder, typecheck on stop)
```

## Conventions
- Components: PascalCase files, named exports (`export function Home()`), one main component per file.
- Lib modules: camelCase files, named exports, no React imports.
- Tests sit next to the module: `quiz.ts` -> `quiz.test.ts`.
- Routes are hash-based: `#/`, `#/article/<Canonical_Title>`, `#/manor`. Build hrefs with `articleHref()`.
- CSS class names are kebab-case and grouped in `styles.css` by section comments.
