'use client';

import { useState } from 'react';
import type { LocalizedText } from '../types';
import { localize } from '../content';
import type { Language } from '../types';

export function BeforeAfterSlider({
  images,
  labels,
  alt,
  language,
}: {
  images: [string, string];
  labels?: [LocalizedText, LocalizedText];
  alt: LocalizedText;
  language: Language;
}) {
  const [position, setPosition] = useState(50);
  const beforeLabel = labels ? localize(labels[0], language) : 'Before';
  const afterLabel = labels ? localize(labels[1], language) : 'After';
  const description = localize(alt, language);

  return (
    <figure className="compare">
      <div className="compare__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/${images[0]}`}
          alt={`${description} — ${beforeLabel}`}
          width={160}
          height={90}
          loading="lazy"
          draggable={false}
        />
        <div className="compare__after" style={{ width: `${position}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/${images[1]}`}
            alt={`${description} — ${afterLabel}`}
            width={160}
            height={90}
            loading="lazy"
            draggable={false}
          />
        </div>
        <span className="compare__label compare__label--before">{beforeLabel}</span>
        <span className="compare__label compare__label--after">{afterLabel}</span>
      </div>
      <input
        className="compare__range"
        type="range"
        min={0}
        max={100}
        value={position}
        aria-label={`${description}: ${beforeLabel} / ${afterLabel}`}
        aria-valuetext={`${position}% ${afterLabel}`}
        onChange={(event) => setPosition(Number(event.target.value))}
      />
    </figure>
  );
}
