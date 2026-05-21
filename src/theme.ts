export const COLORS = {
  purple:     '#7c3aed',
  purpleSoft: '#ede9fe',
  purpleDark: '#5b21b6',
  ink:        '#1a1a1a',
  mute:       '#8a8a8a',
  line:       '#c9c9c9',
  paper:      '#fafaf7',
  white:      '#ffffff',
  danger:     '#dc2626',
  onPurple:   '#ffffff',
} as const;

export const DARK_COLORS = {
  purple:     '#8b5cf6',
  purpleSoft: '#2d1b69',
  purpleDark: '#c4b5fd',
  ink:        '#f5f5f5',
  mute:       '#a1a1aa',
  line:       '#3f3f46',
  paper:      '#0b0b0d',
  white:      '#1f1f23',
  danger:     '#fca5a5',
  onPurple:   '#ffffff',
} as const;

export type Colors = Record<keyof typeof COLORS, string>;

function Platform_select(ios: string, _android: string): string {
  return ios;
}

export const FONTS = {
  hand: Platform_select('Chalkboard SE', 'sans-serif'),
  ui:   Platform_select('System', 'Roboto'),
  mono: Platform_select('Menlo', 'monospace'),
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const RADIUS = { sm: 8, md: 12, lg: 18, xl: 22, pill: 999 } as const;
