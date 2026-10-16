'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { PLACEHOLDER_PHOTO } from './photos';

export function ProductGallery({
  photos,
  name,
}: {
  photos: { url: string; alt?: string }[];
  name: string;
}) {
  const list = photos.length ? photos : [{ url: PLACEHOLDER_PHOTO, alt: name }];
  const [index, setIndex] = useState(0);
  const current = list[index];
  const go = (delta: number) => setIndex((i) => (i + delta + list.length) % list.length);

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface">
        {/* biome-ignore lint/performance/noImgElement: local SVG placeholders and seller URLs */}
        <img src={current.url} alt={current.alt ?? name} className="h-full w-full object-cover" />
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Photo précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Photo suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {list.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {list.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              className={`h-20 w-24 shrink-0 overflow-hidden rounded-md ring-2 ${
                i === index ? 'ring-brand' : 'ring-line'
              }`}
            >
              {/* biome-ignore lint/performance/noImgElement: thumbnails */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
