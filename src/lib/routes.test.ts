import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { articleHref, canonicalTitle, parseHash, wikiHrefToRoute } from './routes';

// Article titles: anything printable that is not blank and has no leading namespace prefix.
const title = fc
  .string({ minLength: 1, maxLength: 60, unit: 'grapheme' })
  .filter((t) => t.trim().length > 0 && !t.includes(':'));

describe('routes', () => {
  it('articleHref and parseHash round-trip any title', () => {
    fc.assert(
      fc.property(title, (t) => {
        expect(parseHash(articleHref(t))).toEqual({ name: 'article', title: canonicalTitle(t) });
      }),
    );
  });

  it('wiki links become in-app routes that parse back to the same article', () => {
    fc.assert(
      fc.property(title, fc.option(fc.stringMatching(/^[A-Za-z_]{1,12}$/), { nil: undefined }), (t, anchor) => {
        const href = `./${encodeURIComponent(canonicalTitle(t))}${anchor ? `#${anchor}` : ''}`;
        const route = wikiHrefToRoute(href);
        expect(route).not.toBeNull();
        expect(parseHash(route as string)).toEqual({ name: 'article', title: canonicalTitle(t) });
      }),
    );
  });

  it('keeps non-article namespaces out of the app', () => {
    for (const href of ['./File:Ghost.png', './Category:Ghosts', './Special:Random', './Help:Contents', './Template:Infobox']) {
      expect(wikiHrefToRoute(href)).toBeNull();
    }
    expect(wikiHrefToRoute('https://example.com')).toBeNull();
  });

  it('parses the fixed routes', () => {
    expect(parseHash('')).toEqual({ name: 'home' });
    expect(parseHash('#/')).toEqual({ name: 'home' });
    expect(parseHash('#/manor')).toEqual({ name: 'manor' });
    expect(parseHash('#/article/%E0%A4%A')).toEqual({ name: 'notfound', path: '/article/%E0%A4%A' });
  });
});
