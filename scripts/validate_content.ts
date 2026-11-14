import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { parseGameContent } from '../src/game/content';
import { validateGameContent } from '../src/game/validation';

const root = process.cwd();
const gameDir = path.join(root, 'public', 'game');
const publicDir = path.join(root, 'public');

function readJson(name: string): unknown {
  const file = path.join(gameDir, name);
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as unknown;
  } catch (error) {
    console.error(`Could not read or parse public/game/${name}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

const raw = {
  story: readJson('story.json'),
  lenses: readJson('lenses.json'),
  missions: readJson('missions.json'),
  reveal: readJson('reveal.json'),
  facts: readJson('facts.json'),
};

let content;
try {
  content = parseGameContent(raw);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Content schema validation failed:');
    for (const issue of error.issues) {
      console.error(`- ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exit(1);
}

const errors = validateGameContent(content, { publicDir });
if (errors.length > 0) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Content OK: ${content.missions.missions.length} missions, ${content.lenses.lenses.length} lenses, ${content.reveal.beats.length} reveal beats.`,
);
