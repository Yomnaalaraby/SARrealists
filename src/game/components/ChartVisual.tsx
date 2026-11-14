'use client';

import { localize } from '../content';
import type { ChartSeries, Language } from '../types';

export function ChartVisual({
  series,
  language,
  alt,
}: {
  series: ChartSeries;
  language: Language;
  alt: string;
}) {
  const width = 320;
  const height = 160;
  const padding = 28;
  const values = series.points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (width - padding * 2) / Math.max(1, series.points.length - 1);
  const points = series.points
    .map((point, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((point.value - min) / span) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={alt} className="chart__svg">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" opacity="0.35" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" opacity="0.35" />
        <polyline points={points} fill="none" stroke="var(--accent-2)" strokeWidth="3" />
        {series.points.map((point, index) => {
          const x = padding + index * stepX;
          const y = height - padding - ((point.value - min) / span) * (height - padding * 2);
          return <circle key={point.date} cx={x} cy={y} r="4" fill="var(--accent)" />;
        })}
      </svg>
      <figcaption>
        <strong>{localize(series.label, language)}</strong> · {series.unit}
      </figcaption>
    </figure>
  );
}
