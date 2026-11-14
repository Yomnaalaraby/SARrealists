'use client';

import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import type { LensStatus } from '../types';

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: ReactNode;
}

export const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(function PixelButton(
  { variant = 'primary', className = '', type = 'button', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`pixel-button pixel-button--${variant} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
});

export function PixelPanel({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pixel-panel ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function PixelBadge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'danger' | 'success' | 'cyan';
  className?: string;
}) {
  return <span className={`pixel-badge pixel-badge--${tone} ${className}`.trim()}>{children}</span>;
}

const STATUS_LABEL: Record<LensStatus, string> = {
  clear: 'Clear',
  weak: 'Weak',
  blind: 'Blind',
};

const STATUS_ICON: Record<LensStatus, string> = {
  clear: '●',
  weak: '◐',
  blind: '○',
};

export function StatusBadge({ status, label }: { status: LensStatus; label?: string }) {
  return (
    <span className={`pixel-status pixel-status--${status}`}>
      <span aria-hidden="true">{STATUS_ICON[status]}</span>
      <span>{label ?? STATUS_LABEL[status]}</span>
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="pixel-heading">
      {eyebrow ? <p className="pixel-eyebrow">{eyebrow}</p> : null}
      <h2 className="pixel-title">{title}</h2>
      {children ? <p className="pixel-subtitle">{children}</p> : null}
    </header>
  );
}
