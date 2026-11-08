import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { searchTitles, type Lang, type SearchHit } from '../api/wiki';
import { navigate } from '../hooks';
import { articleHref } from '../lib/routes';

const DEBOUNCE_MS = 200;

/** Accessible combobox: type, arrow through suggestions, Enter to open. */
export function SearchBox({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchTitles(q, lang, controller.signal).then(
        (results) => {
          setHits(results);
          setActive(-1);
        },
        () => {
          /* aborted or offline: keep the previous suggestions */
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, lang]);

  function openArticle(key: string) {
    navigate(articleHref(key));
    setQuery('');
    setHits([]);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(hits.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = hits[active] ?? hits[0];
      if (chosen) openArticle(chosen.key);
      else if (query.trim()) openArticle(query.trim());
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showList = open && hits.length > 0;

  return (
    <div className="search">
      <label htmlFor={`${listId}-input`} className="visually-hidden">
        Search the Grimoire
      </label>
      <input
        id={`${listId}-input`}
        ref={inputRef}
        className="search-input"
        type="search"
        placeholder="Search the Grimoire…"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className="search-results window" id={listId} role="listbox">
          {hits.map((hit, i) => (
            <li
              key={hit.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseDown={(e) => {
                e.preventDefault();
                openArticle(hit.key);
              }}
              onMouseEnter={() => setActive(i)}
            >
              {hit.thumbnail ? <img src={hit.thumbnail} alt="" /> : <span className="search-noimg" aria-hidden="true">📜</span>}
              <span>
                <strong>{hit.title}</strong>
                {hit.description && <small>{hit.description}</small>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
