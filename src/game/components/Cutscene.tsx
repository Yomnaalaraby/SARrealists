'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { t } from '../i18n';
import type { Language } from '../types';
import { PixelButton, PixelPanel } from './ui';

function segmentGraphemes(value: string): string[] {
  const Segmenter = (
    Intl as unknown as {
      Segmenter?: new (
        locale: string,
        options: { granularity: 'grapheme' },
      ) => { segment: (input: string) => Iterable<{ segment: string }> };
    }
  ).Segmenter;
  if (Segmenter) {
    return [...new Segmenter('en', { granularity: 'grapheme' }).segment(value)].map(
      (part) => part.segment,
    );
  }
  return [...value];
}

interface CutsceneProps {
  text: string;
  language: Language;
  onComplete: () => void;
  title?: string;
  continueLabel?: string;
  speedMs?: number;
  showAction?: boolean;
}

export function Cutscene({
  text,
  language,
  onComplete,
  title,
  continueLabel,
  speedMs = 22,
  showAction = true,
}: CutsceneProps) {
  const reducedMotion = useReducedMotion();
  const graphemes = useMemo(() => segmentGraphemes(text), [text]);
  const [count, setCount] = useState(reducedMotion ? graphemes.length : 0);

  useEffect(() => {
    if (reducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(graphemes.length);
      return;
    }
    setCount(0);
    const timer = window.setInterval(() => {
      setCount((current) => {
        if (current >= graphemes.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, speedMs);
    return () => window.clearInterval(timer);
  }, [graphemes, reducedMotion, speedMs]);

  const complete = useCallback(() => setCount(graphemes.length), [graphemes.length]);
  const isComplete = count >= graphemes.length;

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        complete();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [complete]);

  return (
    <PixelPanel className="cutscene">
      <div className="cutscene__screen" onClick={isComplete ? undefined : complete} role="presentation">
        {title ? <p className="pixel-eyebrow">{title}</p> : null}
        <p className="cutscene__text" aria-live="polite">
          {graphemes.slice(0, count).join('')}
          {!isComplete ? <span className="cutscene__cursor" aria-hidden="true">▌</span> : null}
        </p>
      </div>
      {showAction ? (
        <div className="cutscene__actions">
          {!isComplete ? (
            <PixelButton variant="ghost" onClick={complete}>
              {t(language, 'skip')}
            </PixelButton>
          ) : (
            <PixelButton onClick={onComplete}>{continueLabel ?? t(language, 'continue')}</PixelButton>
          )}
        </div>
      ) : null}
    </PixelPanel>
  );
}
