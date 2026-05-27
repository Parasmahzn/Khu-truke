import type { Category } from '../store';

export const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Bills',     icon: '💡' },
  { name: 'Coffee',    icon: '☕' },
  { name: 'Dining',    icon: '🍽️' },
  { name: 'Fun',       icon: '🎉' },
  { name: 'Groceries', icon: '🛒' },
  { name: 'Health',    icon: '💊' },
  { name: 'Shopping',  icon: '🛍️' },
  { name: 'Transport', icon: '🚕' },
];

export const EMOJI_SUGGESTIONS: string[] = [
  '🏠', '🚗', '✈️', '🍕', '☕', '🍺', '👥',
];
