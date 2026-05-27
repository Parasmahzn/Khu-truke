import type { Currency } from '../store';

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',   label: 'US Dollar' },
  { code: 'EUR', symbol: '€',   label: 'Euro' },
  { code: 'GBP', symbol: '£',   label: 'British Pound' },
  { code: 'INR', symbol: '₹',   label: 'Indian Rupee' },
  { code: 'NPR', symbol: 'रू',  label: 'Nepali Rupee' },
  { code: 'JPY', symbol: '¥',   label: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥',   label: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$',  label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'THB', symbol: '฿',   label: 'Thai Baht' },
];
