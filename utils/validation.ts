export const AMOUNT_MIN = 0.01;
export const AMOUNT_MAX = 999_999;
export const USER_NAME_MAX = 40;

export const sanitizeUserNameInput = (v: string): string =>
  v.replace(/[^a-zA-Z\s'-]/g, '');

export const validateUserName = (name: string): string | null => {
  const t = name.trim();
  if (!t) return 'Name is required';
  if (t.length < 2) return 'Name must be at least 2 characters';
  if (t.length > USER_NAME_MAX) return `Name must be ${USER_NAME_MAX} characters or less`;
  return null;
};

export function sanitizeAmountInput(raw: string): string {
  let s = raw.replace(/[^0-9.]/g, '');
  const parts = s.split('.');
  if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
  if (s.length > 1 && s[0] === '0' && s[1] !== '.') s = s.slice(1);
  return s;
}

// Returns false if value exceeds the allowed range — caller should reject the input.
// Empty string returns true (user is mid-delete). Min enforced at save time only.
export function validateAmountField(value: string): boolean {
  if (!value) return true;
  const n = parseFloat(value);
  return isNaN(n) || n <= AMOUNT_MAX;
}
