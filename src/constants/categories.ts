import type { Category } from '../store';

export const BUILT_IN_CATEGORIES: Category[] = [
  { name: 'Groceries', icon: '🛒' },
  { name: 'Dining',    icon: '🍽️' },
  { name: 'Coffee',    icon: '☕' },
  { name: 'Transport', icon: '🚕' },
  { name: 'Bills',     icon: '💡' },
  { name: 'Fun',       icon: '🎬' },
  { name: 'Shopping',  icon: '🛍️' },
  { name: 'Health',    icon: '💊' },
];

export const EMOJI_SUGGESTIONS: string[] = [
  '🏠', '🚗', '✈️', '🍕', '☕', '🍺', '👥',
];

export const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#8b5cf6',
  Dining:    '#f59e0b',
  Coffee:    '#b45309',
  Transport: '#0ea5e9',
  Bills:     '#ef4444',
  Fun:       '#ec4899',
  Shopping:  '#10b981',
  Health:    '#14b8a6',
};
