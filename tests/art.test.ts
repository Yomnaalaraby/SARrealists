import { describe, expect, it } from 'vitest';
import {
  SPRITES,
  getCrewSprite,
  getLensSprite,
  type Sprite,
} from '../src/game/art/sprites';
import {
  PALETTE,
  UI_CONTRAST_PAIRS,
  contrastRatio,
} from '../src/game/art/palette';
import { SCENE_HEIGHT, SCENE_WIDTH, mulberry32 } from '../src/game/art/scenes';

function assertSprite(sprite: Sprite): void {
  expect(sprite.rows).toHaveLength(sprite.height);
  for (const row of sprite.rows) {
    expect(row).toHaveLength(sprite.width);
    for (const key of row) {
      if (key === '.') {
        continue;
      }
      expect(sprite.palette[key], `${sprite.id} uses unregistered key ${key}`).toBeDefined();
    }
  }
}

describe('pixel sprites', () => {
  it('keeps every sprite rectangular and palette-safe', () => {
    for (const sprite of Object.values(SPRITES)) {
      assertSprite(sprite);
    }
    assertSprite(getCrewSprite('medic'));
  });

  it('recolors crew accents by role without mutating the base sprite', () => {
    const medic = getCrewSprite('medic');
    expect(medic.palette.a).toBe('#ff8fa3');
    expect(SPRITES.crew.palette.a).toBe('#ffd166');
  });

  it('exposes all seven lens icons', () => {
    for (const lens of ['brightness', 'water', 'moisture', 'motion', 'stability', 'iceflow', 'optical']) {
      const sprite = getLensSprite(lens);
      expect(sprite.width).toBe(16);
      assertSprite(sprite);
    }
  });
});

describe('palette', () => {
  it('meets 4.5:1 contrast for every declared UI pair', () => {
    for (const pair of UI_CONTRAST_PAIRS) {
      expect(
        contrastRatio(pair.foreground, pair.background),
        `${pair.name} contrast`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('defines the core named colors', () => {
    expect(PALETTE.space).toBe('#05070f');
    expect(PALETTE.uiText).toBe('#f2f6ff');
    expect(PALETTE.injury).toBe('#ff8fa3');
  });
});

describe('scenes', () => {
  it('keeps a stable seeded RNG sequence', () => {
    const first = mulberry32(42);
    const second = mulberry32(42);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
    expect(SCENE_WIDTH).toBe(160);
    expect(SCENE_HEIGHT).toBe(90);
  });
});
