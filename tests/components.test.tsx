import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BeforeAfterSlider } from '../src/game/components/BeforeAfterSlider';
import { CrewBar } from '../src/game/components/CrewBar';
import { Cutscene } from '../src/game/components/Cutscene';
import { LanguageToggle } from '../src/game/components/LanguageToggle';
import { LensPicker } from '../src/game/components/LensPicker';
import { createHealthyCrew } from '../src/game/engine';
import { loadTestContent } from './helpers';

describe('LensPicker', () => {
  const content = loadTestContent();

  it('requires exactly two lenses before confirming', () => {
    const onToggle = vi.fn();
    const onConfirm = vi.fn();
    render(
      <LensPicker
        lenses={content.lenses.lenses}
        picked={[]}
        language="en"
        onToggle={onToggle}
        onConfirm={onConfirm}
        onOpenCodex={vi.fn()}
      />,
    );
    const confirm = screen.getByRole('button', { name: /analyze these lenses/i });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /surface brightness/i }));
    expect(onToggle).toHaveBeenCalledWith('brightness');
  });

  it('disables unselected lenses when two are already chosen', () => {
    render(
      <LensPicker
        lenses={content.lenses.lenses}
        picked={['brightness', 'water']}
        language="en"
        onToggle={vi.fn()}
        onConfirm={vi.fn()}
        onOpenCodex={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /optical camera/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: /analyze these lenses/i })).toBeEnabled();
  });
});

describe('CrewBar', () => {
  const content = loadTestContent();

  it('labels injured crew and disables their consultation', () => {
    const crew = createHealthyCrew();
    crew.pilot = true;
    render(
      <CrewBar
        story={content.story}
        crew={crew}
        language="en"
        onConsult={vi.fn()}
        availableHints={content.missions.missions[0].crewHints}
      />,
    );
    expect(screen.getAllByText('Injured, out of action').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Injured, out of action' })).toBeDisabled();
  });
});

describe('LanguageToggle', () => {
  it('reports the selected language', () => {
    const onChange = vi.fn();
    render(<LanguageToggle language="en" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'ع' }));
    expect(onChange).toHaveBeenCalledWith('ar');
  });
});

describe('Cutscene', () => {
  it('can skip the typewriter and continue', () => {
    render(
      <Cutscene
        text="A long transmission from the bridge."
        language="en"
        onComplete={vi.fn()}
        speedMs={10000}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });
});

describe('BeforeAfterSlider', () => {
  it('exposes a labelled range control', () => {
    render(
      <BeforeAfterSlider
        images={['game/img/a.png', 'game/img/b.png']}
        alt={{ en: 'Two radar views' }}
        language="en"
      />,
    );
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuetext', '50% After');
    fireEvent.change(slider, { target: { value: '80' } });
    expect(slider).toHaveAttribute('aria-valuetext', '80% After');
  });
});
