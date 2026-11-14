export const PALETTE = {
  space: '#05070f',
  space2: '#0b1020',
  star: '#f5f7ff',
  ice: '#bfe8ff',
  ice2: '#7cc7e8',
  fire: '#ff7a1a',
  fire2: '#ffb347',
  smoke: '#6b5a4a',
  deltaGreen: '#2f7d4f',
  deltaLight: '#7fbf6a',
  water: '#1f4e8c',
  waterLight: '#4aa3df',
  soil: '#8a5a2b',
  soilLight: '#c89b5a',
  rock: '#5c6470',
  rockLight: '#9aa4b2',
  uiBg: '#10141f',
  uiPanel: '#1b2233',
  uiPanel2: '#273149',
  uiText: '#f2f6ff',
  uiMuted: '#a9b4c8',
  accent: '#ffd166',
  accent2: '#4cc9f0',
  danger: '#ff5c5c',
  injury: '#ff8fa3',
  success: '#7ee787',
  shadow: '#000000',
  white: '#ffffff',
} as const;

export type PaletteColor = (typeof PALETTE)[keyof typeof PALETTE];

export interface ContrastPair {
  name: string;
  foreground: PaletteColor;
  background: PaletteColor;
}

export const UI_CONTRAST_PAIRS: ContrastPair[] = [
  { name: 'body on app', foreground: PALETTE.uiText, background: PALETTE.uiBg },
  { name: 'body on panel', foreground: PALETTE.uiText, background: PALETTE.uiPanel },
  { name: 'body on raised panel', foreground: PALETTE.uiText, background: PALETTE.uiPanel2 },
  { name: 'muted on app', foreground: PALETTE.uiMuted, background: PALETTE.uiBg },
  { name: 'muted on panel', foreground: PALETTE.uiMuted, background: PALETTE.uiPanel },
  { name: 'accent on panel', foreground: PALETTE.accent, background: PALETTE.uiPanel },
  { name: 'accent2 on app', foreground: PALETTE.accent2, background: PALETTE.uiBg },
  { name: 'injury on panel', foreground: PALETTE.injury, background: PALETTE.uiPanel },
  { name: 'success on panel', foreground: PALETTE.success, background: PALETTE.uiPanel },
  { name: 'ink on accent button', foreground: PALETTE.uiBg, background: PALETTE.accent },
  { name: 'ink on cyan button', foreground: PALETTE.uiBg, background: PALETTE.accent2 },
];

function channel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const red = Number.parseInt(clean.slice(0, 2), 16);
  const green = Number.parseInt(clean.slice(2, 4), 16);
  const blue = Number.parseInt(clean.slice(4, 6), 16);
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}
