import { describe, expect, it } from 'vitest';
import {
  BEST_REPORT_KEY,
  loadBestReport,
  persistBestReport,
} from '../src/game/state';
import type { MissionReport } from '../src/game/types';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const report = (score: number): MissionReport => ({
  version: 'v1',
  completedAt: '2026-11-14T00:00:00.000Z',
  healthyCrew: 8,
  injuredRoles: [],
  bestDecisions: 4,
  totalMissions: 4,
  endingId: 'pathfinder',
  score,
});

describe('best report persistence', () => {
  it('saves the first report and only replaces it with a better score', () => {
    const storage = new MemoryStorage();
    expect(persistBestReport(report(500), storage).saved).toBe(true);
    expect(loadBestReport(storage)?.score).toBe(500);

    expect(persistBestReport(report(400), storage).saved).toBe(false);
    expect(loadBestReport(storage)?.score).toBe(500);

    expect(persistBestReport(report(700), storage).saved).toBe(true);
    expect(loadBestReport(storage)?.score).toBe(700);
  });

  it('ignores corrupt or foreign data', () => {
    const storage = new MemoryStorage();
    storage.setItem(BEST_REPORT_KEY, '{not json');
    expect(loadBestReport(storage)).toBeNull();
    storage.setItem(BEST_REPORT_KEY, JSON.stringify({ version: 'v0' }));
    expect(loadBestReport(storage)).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    expect(loadBestReport(null)).toBeNull();
    expect(persistBestReport(report(100), null).saved).toBe(false);
  });
});
