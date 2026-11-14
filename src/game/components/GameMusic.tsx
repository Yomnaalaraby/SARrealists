'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { t } from '../i18n';
import type { Language } from '../types';
import { PixelButton } from './ui';

const STORAGE_KEY = 'captain-dio:music-muted';

export function GameMusic({ language }: { language: Language }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pathname = usePathname();
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      // Audio still works when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.3;
    audio.muted = muted;
    if (muted || pathname !== '/game') {
      audio.pause();
      if (pathname !== '/game') {
        audio.currentTime = 0;
      }
      return;
    }

    const tryPlay = () => {
      try {
        const result = audio.play();
        if (result && typeof result.catch === 'function') {
          void result.catch(() => {
            // Browsers require a user gesture before audio can start.
          });
        }
      } catch {
        // Some test environments do not implement HTMLMediaElement.play().
      }
    };
    tryPlay();
    const onGesture = () => tryPlay();
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [muted, pathname]);

  const toggle = () => {
    setMuted((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // The toggle still applies for this session.
      }
      return next;
    });
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/game/audio/space-theme.mp3"
        loop
        preload="auto"
        aria-hidden="true"
      />
      <PixelButton
        className="music-toggle"
        variant="ghost"
        onClick={toggle}
        aria-pressed={!muted}
        title={t(language, muted ? 'musicOn' : 'musicOff')}
      >
        <span aria-hidden="true">{muted ? '♪̶' : '♪'}</span>
        {t(language, muted ? 'musicOff' : 'musicOn')}
      </PixelButton>
    </>
  );
}
