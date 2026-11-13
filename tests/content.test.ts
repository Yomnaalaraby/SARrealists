import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  collectContentErrors,
  getCrewMember,
  getLens,
  getPlaceForMission,
  localize,
  parseGameContent,
} from '../src/game/content';
import { graphemeLength, validateGameContent } from '../src/game/validation';
import { cloneContent, loadTestContent } from './helpers';

describe('content', () => {
  const content = loadTestContent();

  it('parses the shipped content and exposes typed accessors', () => {
    expect(content.missions.missions).toHaveLength(4);
    expect(content.lenses.lenses).toHaveLength(7);
    expect(getLens(content, 'brightness').name.en).toContain('brightness');
    expect(getCrewMember(content.story, 'medic').role).toBe('medic');
    expect(getPlaceForMission(content, 'm1-smoke').siteId).toBe('california');
  });

  it('falls back to English and warns only in dev mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(localize({ en: 'Hello' }, 'ar', { dev: true, context: 'test' })).toBe('Hello');
    expect(warn).toHaveBeenCalledOnce();
    expect(localize({ en: 'Hello', ar: 'مرحبا' }, 'ar')).toBe('مرحبا');
    warn.mockClear();
    expect(localize({ en: 'Hello' }, 'ar')).toBe('Hello');
    expect(warn).not.toHaveBeenCalled();
  });

  it('counts Arabic graphemes rather than UTF-16 code units', () => {
    expect(graphemeLength('مرحبا')).toBe(5);
    expect(graphemeLength('👩‍🚀')).toBe(1);
  });

  it('rejects a bestDecision that is not in the mission decisions', () => {
    const broken = cloneContent(content);
    broken.missions.missions[0].decisions = ['go', 'delay'];
    const errors = collectContentErrors(broken);
    expect(errors.some((error) => error.includes('bestDecision'))).toBe(true);
    expect(() => parseGameContent(broken)).toThrow(/bestDecision/);
  });
});

describe('validation', () => {
  const publicDir = path.resolve(process.cwd(), 'public');
  const content = loadTestContent();

  it('accepts the shipped content', () => {
    expect(validateGameContent(content, { publicDir })).toEqual([]);
  });

  it('reports missing outcome entries', () => {
    const broken = cloneContent(content);
    const outcomes = broken.missions.missions[0].outcomes as unknown as Record<
      string,
      Record<string, unknown>
    >;
    delete outcomes.strong.go;
    const errors = validateGameContent(broken, { publicDir });
    expect(errors.some((error) => error.includes('outcomes.strong.go is missing'))).toBe(true);
  });

  it('reports missing images and http sources', () => {
    const broken = cloneContent(content);
    const visual = broken.missions.missions[0].lensResults.brightness?.visual;
    if (visual && visual.kind !== 'chart') {
      visual.images[0] = 'game/img/does-not-exist.png';
    }
    broken.missions.missions[0].realityCheck.source.url = 'http://example.com/source';
    const errors = validateGameContent(broken, { publicDir });
    expect(errors.some((error) => error.includes('Missing image file'))).toBe(true);
    expect(errors.some((error) => error.includes('https URL'))).toBe(true);
  });

  it('reports long text, bad dates, and spoilers', () => {
    const broken = cloneContent(content);
    broken.missions.missions[0].briefing.en = 'x'.repeat(401);
    broken.missions.missions[0].data.dates = ['2026-05-15', '2026-03-04'];
    broken.missions.missions[0].title.en = 'California';
    const errors = validateGameContent(broken, { publicDir });
    expect(errors.some((error) => error.includes('limit is 400'))).toBe(true);
    expect(errors.some((error) => error.includes('ascending order'))).toBe(true);
    expect(errors.some((error) => error.includes('leaks the real place name'))).toBe(true);
  });

  it('reports a missing reveal place', () => {
    const broken = cloneContent(content);
    delete broken.reveal.places['m1-smoke'];
    const errors = validateGameContent(broken, { publicDir });
    expect(errors.some((error) => error.includes('missing an entry'))).toBe(true);
  });
});
