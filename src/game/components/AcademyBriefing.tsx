'use client';

import { useState } from 'react';
import { PixelCanvas } from '../art/PixelCanvas';
import { t } from '../i18n';
import type { Language, Story } from '../types';
import { DialogueScene } from './DialogueScene';
import { PixelButton, PixelPanel, SectionHeading } from './ui';

export function AcademyBriefing({
  language,
  story,
  onContinue,
}: {
  language: Language;
  story: Story;
  onContinue: () => void;
}) {
  const [stage, setStage] = useState<'dialogue' | 'academy'>('dialogue');

  if (stage === 'dialogue') {
    return (
      <section className="phase phase--academy" aria-labelledby="academy-title">
        <div className="phase__art">
          <PixelCanvas scene="bridge" seed="arrival-dialogue" label={t(language, 'academyTitle')} />
        </div>
        <PixelPanel className="phase__panel">
          <DialogueScene
            lines={story.intro}
            story={story}
            language={language}
            title={t(language, 'academyTitle')}
            continueLabel={t(language, 'academyDialogueContinue')}
            onComplete={() => setStage('academy')}
          />
        </PixelPanel>
      </section>
    );
  }

  const cards = [
    { title: t(language, 'academyCard1Title'), body: t(language, 'academyCard1Body'), icon: '◉' },
    { title: t(language, 'academyCard2Title'), body: t(language, 'academyCard2Body'), icon: '☁' },
    { title: t(language, 'academyCard3Title'), body: t(language, 'academyCard3Body'), icon: '≈' },
  ];

  return (
    <section className="phase phase--academy" aria-labelledby="academy-title">
      <div className="phase__art">
        <PixelCanvas scene="bridge" seed="academy" label={t(language, 'academyTitle')} />
      </div>
      <PixelPanel className="phase__panel">
        <SectionHeading eyebrow={t(language, 'gameTitle')} title={t(language, 'academyTitle')}>
          {t(language, 'gameSubtitle')}
        </SectionHeading>
        <div className="academy-grid">
          {cards.map((card, index) => (
            <article className="academy-card" key={card.title}>
              <span className="academy-card__icon" aria-hidden="true">
                {card.icon}
              </span>
              <p className="pixel-eyebrow">{String(index + 1).padStart(2, '0')}</p>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
        <div className="phase__actions">
          <PixelButton onClick={onContinue}>{t(language, 'academyStart')}</PixelButton>
        </div>
      </PixelPanel>
    </section>
  );
}
