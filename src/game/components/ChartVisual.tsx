'use client';

import { localize } from '../content';
import type { ChartSeries, Language } from '../types';

const PIXEL = 4;

function snap(value: number) {
  return Math.round(value / PIXEL) * PIXEL;
}

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

  const toPixelPoint = (value: number, index: number) => ({
    x: snap(padding + index * stepX),
    y: snap(
      Math.max(
        padding,
        Math.min(
          height - padding,
          height - padding - ((value - min) / span) * (height - padding * 2),
        ),
      ),
    ),
  });

  const linePixels = new Map<string, { x: number; y: number }>();
  series.points.forEach((point, index) => {
    const current = toPixelPoint(point.value, index);
    linePixels.set(`${current.x}:${current.y}`, current);

    if (index === 0) return;
    const previous = toPixelPoint(series.points[index - 1].value, index - 1);
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / PIXEL));

    for (let step = 0; step <= steps; step += 1) {
      const ratio = step / steps;
      const pixel = {
        x: snap(previous.x + dx * ratio),
        y: snap(previous.y + dy * ratio),
      };
      linePixels.set(`${pixel.x}:${pixel.y}`, pixel);
    }
  });

  const gridColumns: number[] = [];
  for (let x = padding; x <= width - padding; x += 16) gridColumns.push(x);
  const gridRows: number[] = [];
  for (let y = padding; y <= height - padding; y += 16) gridRows.push(y);

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={alt}
        className="chart__svg chart__svg--pixel"
        shapeRendering="crispEdges"
      >
        {gridColumns.map((x) => (
          <rect
            key={`grid-x-${x}`}
            x={x}
            y={padding}
            width={1}
            height={height - padding * 2}
            fill="currentColor"
            opacity={0.1}
          />
        ))}
        {gridRows.map((y) => (
          <rect
            key={`grid-y-${y}`}
            x={padding}
            y={y}
            width={width - padding * 2}
            height={1}
            fill="currentColor"
            opacity={0.1}
          />
        ))}

        <rect
          x={padding}
          y={height - padding - 2}
          width={width - padding * 2}
          height={2}
          fill="currentColor"
          opacity={0.35}
        />
        <rect
          x={padding}
          y={padding}
          width={2}
          height={height - padding * 2}
          fill="currentColor"
          opacity={0.35}
        />

        {Array.from(linePixels.values()).map((pixel) => (
          <rect
            key={`line-${pixel.x}-${pixel.y}`}
            x={pixel.x}
            y={pixel.y}
            width={PIXEL}
            height={PIXEL}
            fill="var(--accent-2)"
          />
        ))}

        {series.points.map((point, index) => {
          const pixel = toPixelPoint(point.value, index);
          return (
            <rect
              key={`point-${point.date}`}
              x={pixel.x - 1}
              y={pixel.y - 1}
              width={PIXEL + 2}
              height={PIXEL + 2}
              fill="var(--accent)"
            />
          );
        })}
      </svg>
      <figcaption>
        <strong>{localize(series.label, language)}</strong> · {series.unit}
      </figcaption>
    </figure>
  );
}
