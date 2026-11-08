import { useEffect, useMemo } from 'react';
import { getArticleHtml, getMedia, getSummary, WikiError, type Lang } from '../api/wiki';
import { useAsync, useDocumentTitle } from '../hooks';
import { displayTitle } from '../lib/routes';
import { prepareArticle } from '../lib/sanitize';
import { ErrorPanel, Loading } from './Feedback';
import { MediaGallery } from './MediaGallery';

interface Props {
  title: string;
  lang: Lang;
  onUseFull: () => void;
}

export function ArticleView({ title, lang, onUseFull }: Props) {
  useDocumentTitle(displayTitle(title));

  const [result, retry] = useAsync(async () => {
    const [summary, html, media] = await Promise.all([
      getSummary(title, lang),
      getArticleHtml(title, lang),
      getMedia(title, lang).catch(() => []),
    ]);
    return { summary, media, article: prepareArticle(html, lang) };
  }, [title, lang]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.querySelector('.content')?.scrollTo({ top: 0 });
  }, [title]);

  const wikiUrl = useMemo(() => `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`, [title, lang]);

  if (result.state === 'loading') return <Loading label={`Summoning “${displayTitle(title)}”…`} />;

  if (result.state === 'error') {
    const missing = result.error instanceof WikiError && result.error.status === 404;
    if (missing && lang === 'simple') {
      return (
        <ErrorPanel title="No simple spirit haunts this page.">
          <p>
            Simple English Wikipedia has no article called <strong>{displayTitle(title)}</strong> yet.
          </p>
          <button type="button" className="button primary" onClick={onUseFull}>
            Read the full article instead
          </button>
        </ErrorPanel>
      );
    }
    return (
      <ErrorPanel title={missing ? 'This page has passed on.' : 'The séance was interrupted.'} onRetry={missing ? undefined : retry}>
        <p>
          {missing ? (
            <>
              There is no article called <strong>{displayTitle(title)}</strong>. Try the search box.
            </>
          ) : (
            'Wikipedia could not be reached. Check your connection.'
          )}
        </p>
      </ErrorPanel>
    );
  }

  const { summary, media, article } = result.value;
  const lead = summary.originalimage ?? summary.thumbnail;

  return (
    <div className="article-layout">
      <aside className="article-sidebar">
        {article.sections.length > 0 && (
          <nav className="panel toc" aria-label="Contents">
            <h2 className="panel-title">Contents</h2>
            <ol>
              {article.sections.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <MediaGallery items={media} />
      </aside>

      <article className="article panel">
        <header className="article-header">
          <div>
            <p className="kicker">{lang === 'simple' ? 'Simple English' : 'Encyclopedia article'}</p>
            <h1>{summary.title}</h1>
            {summary.description && <p className="muted">{summary.description}</p>}
          </div>
          {lead && <img className="article-lead" src={lead.source} alt="" />}
        </header>
        {/* prepareArticle() runs everything through DOMPurify; see src/lib/sanitize.ts */}
        <div className="article-body" dangerouslySetInnerHTML={{ __html: article.html }} />
        <footer className="article-credit">
          This article comes from{' '}
          <a href={wikiUrl} target="_blank" rel="noopener noreferrer">
            Wikipedia
          </a>{' '}
          and is available under{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
            CC BY-SA 4.0
          </a>
          . Grimoire trims references and site navigation. See the original for citations and edit history.
        </footer>
      </article>
    </div>
  );
}
