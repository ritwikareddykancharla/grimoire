import { getFeatured } from '../api/wiki';
import { useAsync, useDocumentTitle } from '../hooks';
import { formatYear } from '../lib/quiz';
import { articleHref } from '../lib/routes';
import { ErrorPanel, Loading } from './Feedback';

export function Home() {
  useDocumentTitle('');
  const today = new Date();
  const dateKey = today.toDateString();
  const [feed, retry] = useAsync(() => getFeatured(today), [dateKey]);
  const longDate = today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  return (
    <div className="home">
      <section className="hero">
        <div className="ghost" aria-hidden="true">
          <div className="ghost-eyes" />
        </div>
        <div>
          <h1 className="hero-title">
            Grimoire <span>&rsquo;95</span>
          </h1>
          <p className="hero-sub">
            The multimedia encyclopedia, raised from the dead. Six million articles, read in a calmer, friendlier
            way.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#/manor">
              Enter Mind Manor
            </a>
            <a className="button" href={articleHref('Halloween')}>
              Read about Halloween
            </a>
          </div>
        </div>
      </section>

      {feed.state === 'loading' && <Loading label="Opening today's pages…" />}
      {feed.state === 'error' && (
        <ErrorPanel title="Today's pages are lost in the fog." onRetry={retry}>
          <p>Wikipedia could not be reached. You can still search for an article above.</p>
        </ErrorPanel>
      )}
      {feed.state === 'ready' && (
        <div className="home-grid">
          {feed.value.featured && (
            <article className="panel featured">
              <h2 className="panel-title">Featured Article</h2>
              {feed.value.featured.thumbnail && (
                <img className="featured-img" src={feed.value.featured.thumbnail.source} alt="" />
              )}
              <h3>
                <a href={articleHref(feed.value.featured.key)}>{feed.value.featured.title}</a>
              </h3>
              {feed.value.featured.description && <p className="muted">{feed.value.featured.description}</p>}
              <p>{feed.value.featured.extract}</p>
              <a className="button" href={articleHref(feed.value.featured.key)}>
                Read the full article
              </a>
            </article>
          )}

          {feed.value.picture && (
            <figure className="panel picture">
              <h2 className="panel-title">Picture of the Day</h2>
              <img
                src={feed.value.picture.src}
                width={feed.value.picture.width}
                height={feed.value.picture.height}
                alt={feed.value.picture.description ?? feed.value.picture.title}
              />
              <figcaption>
                {feed.value.picture.description ?? feed.value.picture.title}
                {feed.value.picture.artist && <span className="muted"> · {feed.value.picture.artist}</span>}
              </figcaption>
            </figure>
          )}

          {feed.value.onThisDay.length > 0 && (
            <section className="panel on-this-day">
              <h2 className="panel-title">On {longDate}, long ago…</h2>
              <ol className="timeline">
                {feed.value.onThisDay.slice(0, 6).map((event) => (
                  <li key={`${event.year}-${event.text.slice(0, 24)}`}>
                    <span className="timeline-year">{formatYear(event.year)}</span>
                    <span>
                      {event.text}{' '}
                      {event.pages[0] && <a href={articleHref(event.pages[0].key)}>Read more</a>}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
