'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCrewMember, localize } from '../content';
import { t } from '../i18n';
import type { DialogueLine, Language, LocalizedText, Story } from '../types';
import { CrewPortrait } from './CrewPortrait';
import { PixelButton } from './ui';

function speakerInfo(line: DialogueLine, story: Story): {
  name: LocalizedText;
  title: LocalizedText;
} {
  if (line.speaker === 'captain') {
    return {
      name: story.captain,
      title: { en: 'Captain', ar: 'الكابتن' },
    };
  }
  if (line.speaker === 'ai') {
    return {
      name: story.ai,
      title: { en: 'Ship intelligence', ar: 'ذكاء السفينة' },
    };
  }
  const member = getCrewMember(story, line.speaker);
  return { name: member.name, title: member.title };
}

export function DialogueScene({
  lines,
  story,
  language,
  title,
  continueLabel,
  onComplete,
}: {
  lines: DialogueLine[];
  story: Story;
  language: Language;
  title?: string;
  continueLabel?: string;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const line = lines[index] ?? lines[0];
  const info = speakerInfo(line, story);
  const isLast = index >= lines.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((current) => Math.min(current + 1, lines.length - 1));
  }, [isLast, lines.length, onComplete]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onComplete();
      } else if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowRight') {
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, onComplete]);

  if (!line) {
    return null;
  }

  return (
    <section className="dialogue-scene" aria-labelledby="dialogue-speaker">
      {title ? <p className="pixel-eyebrow dialogue-scene__title">{title}</p> : null}
      <div className="dialogue-scene__stage">
        <div className={`dialogue-scene__portrait dialogue-scene__portrait--${line.speaker}`}>
          <CrewPortrait speaker={line.speaker} size={104} />
        </div>
        <div className="dialogue-scene__content">
          <div className="dialogue-scene__meta">
            <h3 id="dialogue-speaker">{localize(info.name, language)}</h3>
            <span>{localize(info.title, language)}</span>
          </div>
          <p className="dialogue-scene__line" aria-live="polite">
            {localize(line.text, language)}
          </p>
          <p className="dialogue-scene__progress" aria-label={t(language, 'dialogueProgress')}>
            {String(index + 1).padStart(2, '0')} / {String(lines.length).padStart(2, '0')}
          </p>
        </div>
      </div>
      <div className="dialogue-scene__actions">
        <PixelButton variant="ghost" onClick={onComplete}>
          {t(language, 'skip')}
        </PixelButton>
        <PixelButton onClick={advance}>
          {isLast ? (continueLabel ?? t(language, 'continue')) : t(language, 'next')}
        </PixelButton>
      </div>
    </section>
  );
}
