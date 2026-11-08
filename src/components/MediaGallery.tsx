import { useRef, useState } from 'react';
import type { MediaItem } from '../api/wiki';

const MAX_ITEMS = 12;

export function MediaGallery({ items }: { items: MediaItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<MediaItem | null>(null);
  const shown = items.slice(0, MAX_ITEMS);
  if (shown.length === 0) return null;

  function show(item: MediaItem) {
    setCurrent(item);
    dialogRef.current?.showModal();
  }

  return (
    <section className="panel gallery" aria-label="Media gallery">
      <h2 className="panel-title">Media Gallery</h2>
      <ul className="gallery-grid">
        {shown.map((item) => (
          <li key={item.title}>
            <button type="button" className="gallery-thumb" onClick={() => show(item)}>
              <img src={item.src} alt={item.caption ?? ''} loading="lazy" />
              <span className="visually-hidden">Enlarge {item.caption ?? 'image'}</span>
            </button>
          </li>
        ))}
      </ul>
      <dialog ref={dialogRef} className="window lightbox" onClose={() => setCurrent(null)}>
        <div className="titlebar">
          <span className="titlebar-text">{current?.caption ?? 'Image'}</span>
          <form method="dialog">
            <button type="submit" className="titlebar-close" aria-label="Close image">
              ×
            </button>
          </form>
        </div>
        {current && (
          <figure>
            <img src={current.src} alt={current.caption ?? ''} />
            {current.caption && <figcaption>{current.caption}</figcaption>}
          </figure>
        )}
      </dialog>
    </section>
  );
}
