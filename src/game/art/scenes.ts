import { PALETTE } from './palette';

export const SCENE_WIDTH = 160;
export const SCENE_HEIGHT = 90;

export type SceneId = 'space' | 'smoke' | 'ice' | 'delta' | 'coast' | 'bridge' | 'earth';

export function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fill(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
}

function stars(ctx: CanvasRenderingContext2D, random: () => number, count: number): void {
  for (let index = 0; index < count; index += 1) {
    const x = Math.floor(random() * SCENE_WIDTH);
    const y = Math.floor(random() * 55);
    ctx.fillStyle = index % 7 === 0 ? PALETTE.accent : PALETTE.star;
    ctx.fillRect(x, y, index % 5 === 0 ? 2 : 1, 1);
  }
}

function pixelDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (let y = -radius; y <= radius; y += 1) {
    const span = Math.floor(Math.sqrt(Math.max(0, radius * radius - y * y)));
    ctx.fillRect(cx - span, cy + y, span * 2 + 1, 1);
  }
}

function mountains(
  ctx: CanvasRenderingContext2D,
  baseY: number,
  color: string,
  random: () => number,
): void {
  ctx.fillStyle = color;
  let x = 0;
  while (x < SCENE_WIDTH) {
    const width = 8 + Math.floor(random() * 18);
    const height = 8 + Math.floor(random() * 22);
    for (let row = 0; row < height; row += 2) {
      const half = Math.floor((row / height) * (width / 2));
      ctx.fillRect(x + width / 2 - half, baseY - row, half * 2 + 1, 2);
    }
    x += width;
  }
}

function earth(ctx: CanvasRenderingContext2D): void {
  fill(ctx, PALETTE.space);
  pixelDisc(ctx, 80, 45, 29, PALETTE.ice2);
  pixelDisc(ctx, 80, 45, 27, PALETTE.water);
  ctx.fillStyle = PALETTE.deltaGreen;
  for (const [x, y, width, height] of [
    [60, 28, 18, 12],
    [86, 24, 14, 10],
    [92, 46, 16, 14],
    [64, 52, 14, 10],
    [76, 40, 10, 8],
  ]) {
    ctx.fillRect(x, y, width, height);
  }
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: SceneId,
  seed: number,
  reducedMotion = false,
): void {
  const random = mulberry32(seed);
  ctx.imageSmoothingEnabled = false;

  switch (scene) {
    case 'space': {
      fill(ctx, PALETTE.space);
      stars(ctx, random, 90);
      pixelDisc(ctx, 80, 135, 95, PALETTE.rock);
      pixelDisc(ctx, 80, 137, 92, PALETTE.ice2);
      ctx.fillStyle = PALETTE.space2;
      ctx.fillRect(0, 78, SCENE_WIDTH, 12);
      break;
    }
    case 'smoke': {
      fill(ctx, PALETTE.fire2);
      ctx.fillStyle = PALETTE.fire;
      ctx.fillRect(0, 45, SCENE_WIDTH, 45);
      mountains(ctx, 58, PALETTE.rock, random);
      ctx.globalAlpha = 0.7;
      for (let index = 0; index < 12; index += 1) {
        pixelDisc(
          ctx,
          10 + index * 14,
          26 + Math.floor(random() * 24),
          10 + Math.floor(random() * 9),
          index % 2 === 0 ? PALETTE.smoke : PALETTE.rockLight,
        );
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = PALETTE.soil;
      ctx.fillRect(0, 70, SCENE_WIDTH, 20);
      break;
    }
    case 'ice': {
      fill(ctx, PALETTE.ice2);
      ctx.fillStyle = PALETTE.ice;
      ctx.fillRect(0, 28, SCENE_WIDTH, 62);
      mountains(ctx, 45, PALETTE.rockLight, random);
      ctx.fillStyle = PALETTE.white;
      ctx.fillRect(0, 24, SCENE_WIDTH, 10);
      ctx.fillStyle = PALETTE.ice2;
      for (let index = 0; index < 8; index += 1) {
        const x = 10 + index * 20;
        ctx.fillRect(x, 55 + (index % 3) * 5, 3, 18);
      }
      break;
    }
    case 'delta': {
      fill(ctx, PALETTE.deltaLight);
      ctx.fillStyle = PALETTE.waterLight;
      ctx.fillRect(0, 62, SCENE_WIDTH, 28);
      ctx.fillStyle = PALETTE.deltaGreen;
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 6; column += 1) {
          ctx.fillRect(8 + column * 26, 18 + row * 15, 20, 10);
        }
      }
      ctx.fillStyle = PALETTE.water;
      ctx.fillRect(74, 0, 10, 90);
      ctx.fillRect(74, 50, 30, 8);
      ctx.fillRect(54, 58, 20, 8);
      break;
    }
    case 'coast': {
      fill(ctx, PALETTE.space2);
      ctx.fillStyle = PALETTE.water;
      ctx.fillRect(0, 48, SCENE_WIDTH, 42);
      ctx.fillStyle = PALETTE.soil;
      ctx.fillRect(0, 36, SCENE_WIDTH, 14);
      ctx.fillStyle = PALETTE.soilLight;
      ctx.fillRect(0, 32, SCENE_WIDTH, 6);
      for (let index = 0; index < 7; index += 1) {
        ctx.fillStyle = PALETTE.rockLight;
        ctx.fillRect(14 + index * 22, 20 + (index % 2) * 4, 10, 14);
        ctx.fillStyle = PALETTE.accent;
        ctx.fillRect(16 + index * 22, 23 + (index % 2) * 4, 3, 3);
      }
      break;
    }
    case 'bridge': {
      fill(ctx, PALETTE.space2);
      ctx.fillStyle = PALETTE.uiPanel;
      ctx.fillRect(0, 0, 26, 90);
      ctx.fillRect(134, 0, 26, 90);
      ctx.fillRect(0, 0, 160, 12);
      ctx.fillStyle = PALETTE.space;
      ctx.fillRect(32, 18, 96, 38);
      stars(ctx, random, 25);
      ctx.fillStyle = PALETTE.accent2;
      ctx.fillRect(34, 20, 92, 2);
      ctx.fillStyle = PALETTE.uiPanel2;
      ctx.fillRect(18, 64, 124, 18);
      ctx.fillStyle = PALETTE.accent;
      ctx.fillRect(24, 68, 14, 8);
      ctx.fillRect(44, 68, 14, 8);
      ctx.fillRect(64, 68, 14, 8);
      break;
    }
    case 'earth':
      earth(ctx);
      break;
  }

  if (!reducedMotion) {
    ctx.fillStyle = PALETTE.shadow;
    ctx.globalAlpha = 0.12;
    ctx.fillRect(0, 0, SCENE_WIDTH, 2);
    ctx.globalAlpha = 1;
  }
}
