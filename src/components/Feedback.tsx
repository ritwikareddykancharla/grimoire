import type { ReactNode } from 'react';

export function Loading({ label }: { label: string }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="ghost small" aria-hidden="true">
        <div className="ghost-eyes" />
      </div>
      <p>{label}</p>
      <div className="progress" aria-hidden="true">
        <div className="progress-bar" />
      </div>
    </div>
  );
}

export function ErrorPanel({ title, children, onRetry }: { title: string; children?: ReactNode; onRetry?: () => void }) {
  return (
    <div className="panel empty-state" role="alert">
      <h1>{title}</h1>
      {children}
      {onRetry && (
        <button type="button" className="button" onClick={onRetry}>
          Try the séance again
        </button>
      )}
    </div>
  );
}
