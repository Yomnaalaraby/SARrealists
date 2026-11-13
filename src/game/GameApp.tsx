'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import './game.css';
import { PixelCanvas } from './art/PixelCanvas';
import { AcademyBriefing } from './components/AcademyBriefing';
import { Briefing } from './components/Briefing';
import { DecisionPanel } from './components/DecisionPanel';
import { EarthReveal } from './components/EarthReveal';
import { LanguageToggle } from './components/LanguageToggle';
import { LensCodex } from './components/LensCodex';
import { LensPicker } from './components/LensPicker';
import { LensResults } from './components/LensResults';
import { MissionReport } from './components/MissionReport';
import { OutcomePanel } from './components/OutcomePanel';
import { RealityCheck } from './components/RealityCheck';
import { PixelBadge, PixelButton, PixelPanel } from './components/ui';
import { parseCoreContent, parseReveal } from './content';
import { isRtl, t } from './i18n';
import {
  createGameReducer,
  createInitialState,
  createReport,
  loadBestReport,
  persistBestReport,
} from './state';
import type {
  CoreContent,
  GameState,
  Language,
  MissionReport as MissionReportType,
  Reveal,
} from './types';

const SCENES: Record<string, 'smoke' | 'ice' | 'delta' | 'coast'> = {
  'm1-smoke': 'smoke',
  'm2-glacier': 'ice',
  'm3-delta': 'delta',
  'm4-foundations': 'coast',
};

function readLanguage(): Language {
  try {
    const stored = window.localStorage.getItem('captain-dio:language');
    return stored === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

export function GameApp() {
  const [language, setLanguage] = useState<Language>('en');
  const [core, setCore] = useState<CoreContent | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const [best, setBest] = useState<MissionReportType | null>(null);
  const preferencesLoaded = useRef(false);

  const reducer = useMemo(
    () => (core ? createGameReducer(core) : (state: GameState) => state),
    [core],
  );
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguage(readLanguage());
    setBest(loadBestReport());
    preferencesLoaded.current = true;
  }, []);

  useEffect(() => {
    if (!preferencesLoaded.current) {
      return;
    }
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl(language) ? 'rtl' : 'ltr';
    try {
      window.localStorage.setItem('captain-dio:language', language);
    } catch {
      // Language still applies for this session when storage is unavailable.
    }
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const [story, lenses, missions, facts] = await Promise.all([
          fetch('/game/story.json').then((response) => response.json()),
          fetch('/game/lenses.json').then((response) => response.json()),
          fetch('/game/missions.json').then((response) => response.json()),
          fetch('/game/facts.json').then((response) => response.json()),
        ]);
        if (!cancelled) {
          setCore(parseCoreContent({ story, lenses, missions, facts }));
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.phase !== 'reveal' || reveal || !core) {
      return;
    }
    let cancelled = false;
    fetch('/game/reveal.json')
      .then((response) => response.json())
      .then((raw: unknown) => {
        if (!cancelled) {
          setReveal(parseReveal(raw));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [state.phase, reveal, core]);

  const report = useMemo(
    () => (core ? createReport(core, state) : null),
    [core, state],
  );

  useEffect(() => {
    if (state.phase !== 'report' || !report) {
      return;
    }
    persistBestReport(report);
    const timer = window.setTimeout(() => setBest(loadBestReport()), 0);
    return () => window.clearTimeout(timer);
  }, [state.phase, report]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [state.phase, state.missionIndex]);

  const onLanguage = useCallback((next: Language) => setLanguage(next), []);

  if (loadError) {
    return (
      <main className="game-shell" dir={isRtl(language) ? 'rtl' : 'ltr'}>
        <PixelPanel className="game-message">
          <h1>{t(language, 'gameTitle')}</h1>
          <p>{t(language, 'loadError')}</p>
          <PixelButton onClick={() => window.location.reload()}>{t(language, 'retry')}</PixelButton>
        </PixelPanel>
      </main>
    );
  }

  if (!core) {
    return (
      <main className="game-shell" dir={isRtl(language) ? 'rtl' : 'ltr'}>
        <PixelPanel className="game-message">
          <h1>{t(language, 'gameTitle')}</h1>
          <p>{t(language, 'loading')}</p>
        </PixelPanel>
      </main>
    );
  }

  const mission = core.missions.missions[state.missionIndex];
  const lastRecord = state.decisions[state.decisions.length - 1];

  const header = (
    <header className="game-header">
      <div className="game-header__brand">
        <span className="game-header__mark" aria-hidden="true">◈</span>
        <div>
          <p className="pixel-eyebrow">{t(language, 'gameTitle')}</p>
          <strong>{mission ? mission.alias : t(language, 'reportTitle')}</strong>
        </div>
      </div>
      <div className="game-header__progress" aria-label={t(language, 'progress')}>
        {core.missions.missions.map((entry, index) => (
          <span
            key={entry.id}
            className={`progress-dot ${index < state.decisions.length ? 'is-done' : ''} ${index === state.missionIndex ? 'is-current' : ''}`}
            aria-hidden="true"
          />
        ))}
        <span className="progress-text">
          {t(language, 'missionLabel')} {Math.min(state.missionIndex + 1, core.missions.missions.length)} / {core.missions.missions.length}
        </span>
      </div>
      <div className="game-header__actions">
        <PixelButton variant="ghost" onClick={() => setCodexOpen(true)}>
          {t(language, 'codex')}
        </PixelButton>
        <LanguageToggle language={language} onChange={onLanguage} />
      </div>
    </header>
  );

  const renderPhase = (): ReactNode => {
    switch (state.phase) {
      case 'title':
        return (
          <section className="title-screen">
            <PixelCanvas scene="space" seed="title" label={t(language, 'gameTitle')} />
            <div className="title-screen__content">
              <PixelBadge tone="accent">{t(language, 'placeholderBanner')}</PixelBadge>
              <h1>{t(language, 'gameTitle')}</h1>
              <p>{t(language, 'gameSubtitle')}</p>
              <div className="title-screen__actions">
                <PixelButton onClick={() => dispatch({ type: 'START' })}>{t(language, 'start')}</PixelButton>
              </div>
              {best ? (
                <p className="muted">
                  {t(language, 'yourBest')}: {best.score} · {best.healthyCrew}/8 {t(language, 'healthyCrew')}
                </p>
              ) : null}
            </div>
          </section>
        );

      case 'academy':
        return (
          <AcademyBriefing
            language={language}
            onContinue={() => dispatch({ type: 'ACADEMY_COMPLETE' })}
          />
        );

      case 'briefing':
        return (
          <Briefing
            mission={mission}
            missionIndex={state.missionIndex}
            missionCount={core.missions.missions.length}
            story={core.story}
            crew={state.crew}
            language={language}
            scene={SCENES[mission.id] ?? 'smoke'}
            consultedRole={state.consultedRole}
            onConsult={(role) => dispatch({ type: 'CONSULT', role })}
            onContinue={() => dispatch({ type: 'BRIEFING_COMPLETE' })}
          />
        );

      case 'lens-pick':
        return (
          <LensPicker
            lenses={core.lenses.lenses}
            picked={state.pickedLenses}
            language={language}
            onToggle={(lensId) => dispatch({ type: 'TOGGLE_LENS', lensId })}
            onConfirm={() => dispatch({ type: 'CONFIRM_LENSES' })}
            onOpenCodex={() => setCodexOpen(true)}
          />
        );

      case 'lens-results':
        return (
          <LensResults
            mission={mission}
            picked={state.pickedLenses}
            lenses={core.lenses.lenses}
            language={language}
            onContinue={() => dispatch({ type: 'CONTINUE_TO_DECISION' })}
            onOpenCodex={() => setCodexOpen(true)}
          />
        );

      case 'decision':
        return (
          <DecisionPanel
            mission={mission}
            language={language}
            onDecide={(decision) => dispatch({ type: 'DECIDE', decision })}
          />
        );

      case 'outcome':
        if (!lastRecord) {
          return null;
        }
        return (
          <OutcomePanel
            mission={mission}
            record={lastRecord}
            story={core.story}
            language={language}
            onContinue={() => dispatch({ type: 'CONTINUE_TO_REALITY' })}
          />
        );

      case 'reality-check':
        return (
          <RealityCheck
            mission={mission}
            picked={state.pickedLenses}
            lenses={core.lenses.lenses}
            language={language}
            isLast={state.missionIndex >= core.missions.missions.length - 1}
            onContinue={() => dispatch({ type: 'NEXT_MISSION' })}
          />
        );

      case 'reveal':
        if (!reveal) {
          return (
            <PixelPanel className="game-message">
              <p>{t(language, 'loading')}</p>
            </PixelPanel>
          );
        }
        return (
          <EarthReveal
            reveal={reveal}
            missions={core.missions.missions}
            language={language}
            onContinue={() => dispatch({ type: 'SHOW_REPORT' })}
          />
        );

      case 'report':
        if (!report || !reveal) {
          return null;
        }
        return (
          <MissionReport
            report={report}
            story={core.story}
            missions={core.missions.missions}
            reveal={reveal}
            decisions={state.decisions}
            language={language}
            onReplay={() => dispatch({ type: 'RESET' })}
          />
        );

      default:
        return null;
    }
  };

  return (
    <main className="game-shell" dir={isRtl(language) ? 'rtl' : 'ltr'}>
      {header}
      <div className="game-stage">{renderPhase()}</div>
      <LensCodex
        lenses={core.lenses.lenses}
        language={language}
        open={codexOpen}
        onClose={() => setCodexOpen(false)}
      />
    </main>
  );
}
