import DOMPurify from 'dompurify';
import { wikiHrefToRoute } from './routes';

export interface ArticleSection {
  id: string;
  title: string;
}

export interface PreparedArticle {
  html: string;
  sections: ArticleSection[];
}

/** Chrome that makes sense on wikipedia.org but not inside a CD-ROM encyclopedia. */
const STRIP_SELECTORS = [
  'script', 'style', 'link', 'meta', 'noscript', 'iframe', 'object', 'embed', 'form', 'input', 'button',
  'sup.reference', '.mw-ref', '.reference', '.mw-references-wrap', 'ol.references',
  '.navbox', '.navbox-styles', '.vertical-navbox', '.sidebar', '.ambox', '.ombox', '.tmbox',
  '.mbox-small', '.metadata', '.noprint', '.mw-editsection', '.shortdescription',
  '.sistersitebox', '.portalbox', '.side-box', '.authority-control', '.hatnote', '.mw-empty-elt',
].join(',');

const BORING_SECTIONS =
  /^(references|notes|citations|sources|external links|other websites|further reading|bibliography|footnotes|works cited|notes and references|explanatory notes|references and notes)$/i;

/** Ids are prefixed so article content can never clobber app globals or DOMPurify's checks. */
const ID_PREFIX = 'g-';

function absolutize(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url;
}

function unwrap(el: Element): void {
  el.replaceWith(...Array.from(el.childNodes));
}

// `target`/`rel`/`loading` did not survive sanitizing when set beforehand, so
// they are added in a DOMPurify hook, only on links whose href it already approved.
let hooksInstalled = false;
function installPurifyHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && /^https?:\/\//i.test(node.getAttribute('href') ?? '')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    } else if (node.tagName === 'IMG') {
      node.setAttribute('loading', 'lazy');
    }
  });
}

/**
 * Turn raw Parsoid HTML from the Wikipedia REST API into safe, trimmed markup
 * for the article view. Everything is parsed inertly, rewritten, then passed
 * through DOMPurify as the very last step before it reaches the page.
 */
export function prepareArticle(rawHtml: string, lang: string): PreparedArticle {
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const body = doc.body;

  body.querySelectorAll(STRIP_SELECTORS).forEach((el) => el.remove());

  body.querySelectorAll('section').forEach((section) => {
    const heading = section.querySelector(':scope > h2, :scope > .mw-heading > h2');
    if (heading && BORING_SECTIONS.test(heading.textContent?.trim() ?? '')) section.remove();
  });

  // Images open nothing; links around them only lead to File: pages.
  body.querySelectorAll('a').forEach((a) => {
    if (a.querySelector('img')) unwrap(a);
  });

  body.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    const route = wikiHrefToRoute(href);
    if (route) {
      a.setAttribute('href', route);
      a.removeAttribute('title');
      return;
    }
    if (href.startsWith('./')) {
      a.setAttribute('href', `https://${lang}.wikipedia.org/wiki/${href.slice(2)}`);
    } else if (/^(https?:)?\/\//i.test(href)) {
      a.setAttribute('href', absolutize(href));
    } else {
      unwrap(a);
    }
  });

  body.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src) img.setAttribute('src', absolutize(src));
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      img.setAttribute('srcset', srcset.split(',').map((part) => absolutize(part.trim())).join(', '));
    }
    img.removeAttribute('resource');
  });

  const sections: ArticleSection[] = [];
  body.querySelectorAll('[id]').forEach((el) => {
    el.id = `${ID_PREFIX}${el.id}`;
  });
  body.querySelectorAll('h2').forEach((h2, i) => {
    const title = h2.textContent?.trim() ?? '';
    if (!title) return;
    if (!h2.id) h2.id = `${ID_PREFIX}section-${i}`;
    sections.push({ id: h2.id, title });
  });

  installPurifyHooks();
  const html = DOMPurify.sanitize(body.innerHTML, {
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'iframe'],
    ALLOWED_URI_REGEXP: /^(?:https?:\/\/|#\/article\/)/i,
  });

  return { html, sections };
}
