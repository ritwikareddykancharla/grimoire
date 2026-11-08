import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { Lang } from './api/wiki';
import { parseHash, type Route } from './lib/routes';

function subscribeHash(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash);
  return parseHash(hash);
}

export function navigate(href: string): void {
  window.location.hash = href.replace(/^#/, '');
}

const LANG_KEY = 'grimoire.readingLevel';

export function useReadingLevel(): [Lang, (lang: Lang) => void] {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) === 'simple' ? 'simple' : 'en'));
  const update = useCallback((next: Lang) => {
    localStorage.setItem(LANG_KEY, next);
    setLang(next);
  }, []);
  return [lang, update];
}

export type Async<T> =
  | { state: 'loading' }
  | { state: 'error'; error: Error }
  | { state: 'ready'; value: T };

/** Run an async loader whenever `deps` change; ignores results from stale runs. */
export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[]): [Async<T>, () => void] {
  const [result, setResult] = useState<Async<T>>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setResult({ state: 'loading' });
    load().then(
      (value) => live && setResult({ state: 'ready', value }),
      (error: unknown) => live && setResult({ state: 'error', error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      live = false;
    };
  }, [...deps, attempt]);

  return [result, () => setAttempt((n) => n + 1)];
}

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} · Grimoire '95` : "Grimoire '95";
  }, [title]);
}
