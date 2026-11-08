// @vitest-environment jsdom
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { prepareArticle } from './sanitize';

const hostile = [
  '<script>alert(1)</script>',
  '<img src=x onerror="alert(1)">',
  '<a href="javascript:alert(1)">click</a>',
  '<a href="JaVaScRiPt:alert(1)">click</a>',
  '<iframe src="https://evil.example"></iframe>',
  '<svg><script>alert(1)</script></svg>',
  '<div onclick="alert(1)">x</div>',
  '<a href="data:text/html,<script>alert(1)</script>">x</a>',
  '<style>body{display:none}</style>',
  '<form action="https://evil.example"><input name="q"></form>',
  '<math><mi xlink:href="javascript:alert(1)">x</mi></math>',
];

const benign = [
  '<p>The <b>Headless Horseman</b> rides at night.</p>',
  '<a rel="mw:WikiLink" href="./Sleepy_Hollow">Sleepy Hollow</a>',
  '<a rel="mw:ExtLink" href="//example.org/legend">legend</a>',
  '<a href="./File:Pumpkin.jpg"><img src="//upload.wikimedia.org/p.jpg"></a>',
  '<section><h2 id="References">References</h2><ol class="references"><li>cite</li></ol></section>',
  '<sup class="reference"><a href="#cite_note-1">[1]</a></sup>',
  '<h2 id="History">History</h2><p>Long ago…</p>',
];

const fragment = fc.oneof(fc.constantFrom(...hostile), fc.constantFrom(...benign), fc.string({ maxLength: 40 }));
const documentHtml = fc.array(fragment, { maxLength: 12 }).map((parts) => `<!doctype html><html><body>${parts.join('')}</body></html>`);

function render(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
}

describe('prepareArticle', () => {
  it('never lets scripts, event handlers or unsafe URLs through', () => {
    fc.assert(
      fc.property(documentHtml, (raw) => {
        const host = render(prepareArticle(raw, 'en').html);
        expect(host.querySelector('script, iframe, style, form, input, object, embed')).toBeNull();
        for (const el of Array.from(host.querySelectorAll('*'))) {
          for (const attr of Array.from(el.attributes)) {
            expect(attr.name.startsWith('on')).toBe(false);
          }
        }
        for (const a of Array.from(host.querySelectorAll('a[href]'))) {
          expect(a.getAttribute('href')).toMatch(/^(https?:\/\/|#\/article\/)/);
        }
        for (const img of Array.from(host.querySelectorAll('img[src]'))) {
          expect(img.getAttribute('src')).not.toMatch(/^\s*javascript:/i);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('rewrites wiki links into app routes and opens external links in a new tab', () => {
    const host = render(prepareArticle(`<body>${benign.join('')}</body>`, 'en').html);
    const internal = host.querySelector('a[href^="#/article/"]');
    expect(internal?.getAttribute('href')).toBe('#/article/Sleepy_Hollow');
    const external = host.querySelector('a[href^="https://example.org"]');
    expect(external?.getAttribute('target')).toBe('_blank');
    expect(external?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('drops references and builds a table of contents from h2 headings', () => {
    const { html, sections } = prepareArticle(`<body>${benign.join('')}</body>`, 'en');
    expect(html).not.toContain('cite');
    expect(sections).toEqual([{ id: 'g-History', title: 'History' }]);
    expect(html).toContain('src="https://upload.wikimedia.org/p.jpg"');
  });
});
