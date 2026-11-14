import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseGameContent } from '../src/game/content';
import type { GameContent } from '../src/game/types';

export function loadTestContent(): GameContent {
  const dir = path.resolve(process.cwd(), 'public', 'game');
  const read = (name: string): unknown =>
    JSON.parse(readFileSync(path.join(dir, name), 'utf8')) as unknown;
  return parseGameContent({
    story: read('story.json'),
    lenses: read('lenses.json'),
    missions: read('missions.json'),
    reveal: read('reveal.json'),
    facts: read('facts.json'),
  });
}

export function cloneContent(content: GameContent): GameContent {
  return JSON.parse(JSON.stringify(content)) as GameContent;
}
