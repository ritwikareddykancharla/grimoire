import { useState } from 'react';
import { getRandomTitle } from './api/wiki';
import { ArticleView } from './components/ArticleView';
import { Home } from './components/Home';
import { MindManor } from './components/MindManor';
import { SearchBox } from './components/SearchBox';
import { navigate, useReadingLevel, useRoute } from './hooks';
import { articleHref, displayTitle } from './lib/routes';

export function App() {
  const route = useRoute();
  const [lang, setLang] = useReadingLevel();
  const [status, setStatus] = useState('Ready');

  const caption =
    route.name === 'article' ? displayTitle(route.title) : route.name === 'manor' ? 'Mind Manor' : 'Home';

  async function summonRandom() {
    setStatus('Summoning a random spirit…');
    try {
      navigate(articleHref(await getRandomTitle(lang)));
      setStatus('Ready');
    } catch {
      setStatus('The spirits are silent. Check your connection and try again.');
    }
  }

  return (
    <div className="desktop">
      <div className="fog" aria-hidden="true" />
      <div className="window app-window">
        <header className="titlebar">
          <span className="titlebar-icon" aria-hidden="true">📖</span>
          <span className="titlebar-text">Grimoire &rsquo;95 &mdash; {caption}</span>
          <span className="titlebar-buttons" aria-hidden="true">
            <span>_</span>
            <span>□</span>
            <span>×</span>
          </span>
        </header>

        <nav className="toolbar" aria-label="Main">
          <a className="tool-button" href="#/" aria-current={route.name === 'home' ? 'page' : undefined}>
            <span aria-hidden="true">🏚️</span> Home
          </a>
          <button type="button" className="tool-button" onClick={summonRandom}>
            <span aria-hidden="true">🎲</span> Random
          </button>
          <a className="tool-button" href="#/manor" aria-current={route.name === 'manor' ? 'page' : undefined}>
            <span aria-hidden="true">🕯️</span> Mind Manor
          </a>
          <div className="toolbar-spacer" />
          <SearchBox lang={lang} />
          <fieldset className="level-toggle">
            <legend className="visually-hidden">Reading level</legend>
            <label className={lang === 'simple' ? 'active' : ''}>
              <input type="radio" name="level" checked={lang === 'simple'} onChange={() => setLang('simple')} />
              Simple
            </label>
            <label className={lang === 'en' ? 'active' : ''}>
              <input type="radio" name="level" checked={lang === 'en'} onChange={() => setLang('en')} />
              Full
            </label>
          </fieldset>
        </nav>

        <main className="content" id="main">
          {route.name === 'home' && <Home />}
          {route.name === 'article' && (
            <ArticleView key={`${lang}:${route.title}`} title={route.title} lang={lang} onUseFull={() => setLang('en')} />
          )}
          {route.name === 'manor' && <MindManor />}
          {route.name === 'notfound' && (
            <div className="panel empty-state">
              <h1>This page has passed on.</h1>
              <p>
                Nothing lives at <code>{route.path}</code>. <a href="#/">Return home</a>.
              </p>
            </div>
          )}
        </main>

        <footer className="statusbar">
          <span className="status-cell grow" role="status">
            {status}
          </span>
          <span className="status-cell">
            Reading level: {lang === 'simple' ? 'Simple English' : 'Full'}
          </span>
          <span className="status-cell">
            Text from{' '}
            <a href="https://www.wikipedia.org/" target="_blank" rel="noopener noreferrer">
              Wikipedia
            </a>{' '}
            ·{' '}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
              CC BY-SA 4.0
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}
