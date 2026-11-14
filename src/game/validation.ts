import { existsSync } from 'node:fs';
import path from 'node:path';
import { collectContentErrors } from './content';
import {
  DECISIONS,
  QUALITY_TIERS,
  type GameContent,
  type LocalizedText,
  type Mission,
  type Visual,
} from './types';

export interface ValidationOptions {
  publicDir: string;
}

const TEXT_LIMITS = {
  title: 80,
  briefing: 400,
  caption: 200,
  outcomeText: 350,
  explain: 450,
  limits: 220,
  benefit: 260,
  hint: 220,
  lensText: 240,
  beat: 320,
  crewText: 200,
  closing: 220,
} as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function graphemeLength(value: string): number {
  const Segmenter = (
    Intl as unknown as {
      Segmenter?: new (
        locale: string,
        options: { granularity: 'grapheme' },
      ) => { segment: (input: string) => Iterable<{ segment: string }> };
    }
  ).Segmenter;
  if (Segmenter) {
    return [...new Segmenter('en', { granularity: 'grapheme' }).segment(value)].length;
  }
  return [...value].length;
}

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function checkText(
  errors: string[],
  text: LocalizedText,
  field: string,
  maxLength: number,
): void {
  for (const language of ['en', 'ar'] as const) {
    const value = text[language];
    if (value === undefined) {
      continue;
    }
    const length = graphemeLength(value);
    if (length > maxLength) {
      errors.push(`${field}.${language} is ${length} graphemes; limit is ${maxLength}`);
    }
    if (value.trim().length === 0) {
      errors.push(`${field}.${language} is empty`);
    }
  }
}

function checkSource(
  errors: string[],
  source: { title: string; url: string } | undefined,
  field: string,
): void {
  if (!source) {
    return;
  }
  if (!isHttpsUrl(source.url)) {
    errors.push(`${field}.url must be an https URL: ${source.url}`);
  }
  if (source.title.trim().length === 0) {
    errors.push(`${field}.title is empty`);
  }
}

function visualsForMission(mission: Mission): { field: string; visual: Visual }[] {
  return Object.entries(mission.lensResults).flatMap(([lensId, result]) =>
    result?.visual ? [{ field: `${mission.id}.lensResults.${lensId}.visual`, visual: result.visual }] : [],
  );
}

function imagePaths(visual: Visual): string[] {
  return visual.kind === 'chart' ? [] : [...visual.images];
}

function checkImagePath(errors: string[], publicDir: string, imagePath: string): void {
  if (imagePath.startsWith('/') || imagePath.includes('..')) {
    errors.push(`Image path must be relative to public/: ${imagePath}`);
    return;
  }
  const absolute = path.resolve(publicDir, imagePath);
  const relative = path.relative(publicDir, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    errors.push(`Image path escapes public/: ${imagePath}`);
    return;
  }
  if (!existsSync(absolute)) {
    errors.push(`Missing image file: public/${imagePath}`);
  }
}

export function validateGameContent(
  content: GameContent,
  options: ValidationOptions,
): string[] {
  const errors = collectContentErrors(content);
  const publicDir = path.resolve(options.publicDir);

  for (const lens of content.lenses.lenses) {
    checkText(errors, lens.name, `lenses.${lens.id}.name`, TEXT_LIMITS.lensText);
    checkText(errors, lens.measures, `lenses.${lens.id}.measures`, TEXT_LIMITS.lensText);
    checkText(errors, lens.teaches, `lenses.${lens.id}.teaches`, TEXT_LIMITS.lensText);
    checkText(errors, lens.limits, `lenses.${lens.id}.limits`, TEXT_LIMITS.lensText);
    checkSource(errors, lens.source, `lenses.${lens.id}.source`);
  }

  const placeNames = Object.values(content.reveal.places).flatMap((place) =>
    [place.name.en, place.name.ar].filter((name): name is string => Boolean(name)),
  );
  const placeNameVariants = [...new Set(
    placeNames.flatMap((name) => [name, name.split(',')[0].split('،')[0]].map((value) => value.trim())),
  )].filter((name) => name.length >= 4);

  for (const mission of content.missions.missions) {
    const prefix = `missions.${mission.id}`;
    checkText(errors, mission.title, `${prefix}.title`, TEXT_LIMITS.title);
    checkText(errors, mission.briefing, `${prefix}.briefing`, TEXT_LIMITS.briefing);
    checkText(errors, mission.realityCheck.explain, `${prefix}.realityCheck.explain`, TEXT_LIMITS.explain);
    checkText(errors, mission.realityCheck.limits, `${prefix}.realityCheck.limits`, TEXT_LIMITS.limits);
    checkText(errors, mission.realityCheck.benefit, `${prefix}.realityCheck.benefit`, TEXT_LIMITS.benefit);
    checkSource(errors, mission.realityCheck.source, `${prefix}.realityCheck.source`);

    if (mission.data.dates.length < 2) {
      errors.push(`${prefix}.data.dates must contain at least two acquisitions`);
    }
    let previous = '';
    for (const date of mission.data.dates) {
      if (!isIsoDate(date)) {
        errors.push(`${prefix}.data.dates has an invalid ISO date: ${date}`);
        continue;
      }
      if (previous && date < previous) {
        errors.push(`${prefix}.data.dates is not in ascending order: ${previous} then ${date}`);
      }
      previous = date;
    }
    if (!(mission.data.pixelMeters > 0)) {
      errors.push(`${prefix}.data.pixelMeters must be positive`);
    }
    if (!(mission.data.passes >= 1)) {
      errors.push(`${prefix}.data.passes must be at least 1`);
    }
    if (!(mission.data.baselineDays >= 0)) {
      errors.push(`${prefix}.data.baselineDays must be zero or positive`);
    }

    for (const lensId of Object.keys(mission.relevance)) {
      if (!(content.lenses.lenses.some((lens) => lens.id === lensId))) {
        errors.push(`${prefix}.relevance references unknown lens ${lensId}`);
      }
    }
    for (const [lensId, result] of Object.entries(mission.lensResults)) {
      if (!result) {
        continue;
      }
      checkText(errors, result.caption, `${prefix}.lensResults.${lensId}.caption`, TEXT_LIMITS.caption);
    }

    for (const tier of QUALITY_TIERS) {
      for (const decision of DECISIONS) {
        const outcome = mission.outcomes[tier]?.[decision];
        if (!outcome) {
          errors.push(`${prefix}.outcomes.${tier}.${decision} is missing`);
          continue;
        }
        checkText(
          errors,
          outcome.text,
          `${prefix}.outcomes.${tier}.${decision}.text`,
          TEXT_LIMITS.outcomeText,
        );
        if (outcome.followUp) {
          checkText(
            errors,
            outcome.followUp,
            `${prefix}.outcomes.${tier}.${decision}.followUp`,
            TEXT_LIMITS.outcomeText,
          );
        }
        if (new Set(outcome.injuredRoles).size !== outcome.injuredRoles.length) {
          errors.push(`${prefix}.outcomes.${tier}.${decision}.injuredRoles contains duplicates`);
        }
      }
    }

    for (const [role, hint] of Object.entries(mission.crewHints)) {
      if (hint) {
        checkText(errors, hint.text, `${prefix}.crewHints.${role}.text`, TEXT_LIMITS.hint);
      }
    }
    for (const [index, hint] of (mission.hints ?? []).entries()) {
      checkText(errors, hint, `${prefix}.hints.${index}`, TEXT_LIMITS.hint);
    }

    const missionJson = JSON.stringify(mission).toLowerCase();
    for (const placeName of placeNameVariants) {
      if (missionJson.includes(placeName.toLowerCase())) {
        errors.push(`${prefix} leaks the real place name "${placeName}" before the reveal`);
      }
    }

    for (const { field, visual } of visualsForMission(mission)) {
      checkText(errors, visual.alt, `${field}.alt`, TEXT_LIMITS.caption);
      const altJson = JSON.stringify(visual.alt).toLowerCase();
      for (const placeName of placeNameVariants) {
        if (altJson.includes(placeName.toLowerCase())) {
          errors.push(`${field}.alt leaks the real place name "${placeName}"`);
        }
      }
      for (const imagePath of imagePaths(visual)) {
        checkImagePath(errors, publicDir, imagePath);
      }
      if (visual.kind === 'chart') {
        let chartPrevious = '';
        for (const point of visual.series.points) {
          if (!isIsoDate(point.date)) {
            errors.push(`${field}.series has an invalid ISO date: ${point.date}`);
            continue;
          }
          if (chartPrevious && point.date < chartPrevious) {
            errors.push(`${field}.series is not in ascending date order`);
          }
          chartPrevious = point.date;
        }
      }
    }
  }

  for (const beat of content.reveal.beats) {
    checkText(errors, beat.text, `reveal.beats.${beat.id}.text`, TEXT_LIMITS.beat);
    checkSource(errors, beat.source, `reveal.beats.${beat.id}.source`);
  }
  for (const entry of content.reveal.crewRoleToRealWorld) {
    checkText(errors, entry.user, `reveal.crewRoleToRealWorld.${entry.role}.user`, TEXT_LIMITS.crewText);
    checkText(
      errors,
      entry.decides,
      `reveal.crewRoleToRealWorld.${entry.role}.decides`,
      TEXT_LIMITS.crewText,
    );
    checkSource(errors, entry.source, `reveal.crewRoleToRealWorld.${entry.role}.source`);
  }
  checkText(errors, content.reveal.closingLine, 'reveal.closingLine', TEXT_LIMITS.closing);

  for (const fact of content.facts.facts) {
    checkText(errors, fact.claim, `facts.${fact.id}.claim`, TEXT_LIMITS.briefing);
    if (fact.status === 'verified' && !fact.source) {
      errors.push(`facts.${fact.id} is verified but has no source`);
    }
    checkSource(errors, fact.source, `facts.${fact.id}.source`);
  }

  return errors;
}
