'use client';

import { useEffect, useRef } from 'react';
import { usePixelScale } from '../hooks/usePixelScale';
import { useReducedMotion } from '../hooks/useReducedMotion';
import {
  SCENE_HEIGHT,
  SCENE_WIDTH,
  drawScene,
  type SceneId,
} from './scenes';

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

interface PixelCanvasProps {
  scene: SceneId;
  seed?: string;
  className?: string;
  label?: string;
}

export function PixelCanvas({ scene, seed = 'aurelia', className, label }: PixelCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scale = usePixelScale(wrapperRef, SCENE_WIDTH, SCENE_HEIGHT);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = SCENE_WIDTH;
    canvas.height = SCENE_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    drawScene(context, scene, hashSeed(`${seed}:${scene}`), reducedMotion);
  }, [scene, seed, reducedMotion]);

  return (
    <div ref={wrapperRef} className={className} aria-hidden={label ? undefined : true}>
      <canvas
        ref={canvasRef}
        role={label ? 'img' : undefined}
        aria-label={label}
        style={{
          width: SCENE_WIDTH * scale,
          height: SCENE_HEIGHT * scale,
          imageRendering: 'pixelated',
          display: 'block',
        }}
      />
    </div>
  );
}
