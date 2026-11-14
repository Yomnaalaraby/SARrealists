'use client';

import { useEffect, useRef } from 'react';
import type { Sprite } from './sprites';

interface PixelSpriteProps {
  sprite: Sprite;
  scale?: number;
  className?: string;
  label?: string;
}

export function PixelSprite({ sprite, scale = 2, className, label }: PixelSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.clearRect(0, 0, sprite.width, sprite.height);
    context.imageSmoothingEnabled = false;
    for (let y = 0; y < sprite.rows.length; y += 1) {
      const row = sprite.rows[y];
      for (let x = 0; x < row.length; x += 1) {
        const key = row[x];
        if (key === '.') {
          continue;
        }
        const color = sprite.palette[key];
        if (!color) {
          continue;
        }
        context.fillStyle = color;
        context.fillRect(x, y, 1, 1);
      }
    }
  }, [sprite]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        width: sprite.width * scale,
        height: sprite.height * scale,
        imageRendering: 'pixelated',
        display: 'block',
      }}
    />
  );
}
