import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from '../src/game/GameApp';

function jsonResponse(name: string): Promise<{ json: () => Promise<unknown> }> {
  const file = path.resolve(process.cwd(), 'public', 'game', `${name}.json`);
  return Promise.resolve({ json: async () => JSON.parse(readFileSync(file, 'utf8')) as unknown });
}

describe('GameApp', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads core content without requesting the reveal', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const name = url.split('/').pop()?.replace('.json', '') ?? '';
      return jsonResponse(name);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<GameApp />);
    expect(await screen.findByRole('button', { name: /start mission/i })).toBeInTheDocument();
    expect(screen.getByText(/one planet left to understand/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('reveal.json'));
  });

  it('plays all four missions, loads the reveal lazily, and opens the report', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const name = url.split('/').pop()?.replace('.json', '') ?? '';
      return jsonResponse(name);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<GameApp />);

    fireEvent.click(await screen.findByRole('button', { name: /start mission/i }));
    fireEvent.click(screen.getByRole('button', { name: /help the crew/i }));

    const missions = [
      { lenses: [/surface brightness/i, /water and flood/i], decision: /^reroute$/i },
      { lenses: [/ice flow/i, /surface brightness/i], decision: /^go$/i },
      { lenses: [/water and flood/i, /soil moisture/i], decision: /^reroute$/i },
      { lenses: [/ground motion/i, /surface stability/i], decision: /^delay$/i },
    ];

    for (const [index, mission] of missions.entries()) {
      fireEvent.click(screen.getByRole('button', { name: /choose exactly two lenses/i }));
      for (const lens of mission.lenses) {
        fireEvent.click(screen.getByRole('button', { name: lens }));
      }
      fireEvent.click(screen.getByRole('button', { name: /analyze these lenses/i }));
      fireEvent.click(screen.getByRole('button', { name: /make the call/i }));
      fireEvent.click(screen.getByRole('button', { name: mission.decision }));
      fireEvent.click(screen.getByRole('button', { name: /reality check/i }));
      const nextLabel = index === missions.length - 1 ? /finish mission/i : /next mission/i;
      fireEvent.click(screen.getByRole('button', { name: nextLabel }));
    }

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('reveal.json')),
    );
    expect(await screen.findByRole('button', { name: /^next$/i })).toBeInTheDocument();
    for (let index = 0; index < 6; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: /open the mission report/i }));
    expect(screen.getByRole('heading', { name: /mission report/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore the real earth data/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/dashboard?siteId=nile_delta'),
    );
  });
});
