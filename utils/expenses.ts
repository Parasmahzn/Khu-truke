import type { Expense } from '../store';

export function sumAmount(list: Expense[]): number {
  return list.reduce((s, x) => s + x.amount, 0);
}

export function expensesOn(list: Expense[], dateObj: Date): Expense[] {
  const y = dateObj.getFullYear(), m = dateObj.getMonth(), d = dateObj.getDate();
  return list.filter((x) => {
    const dd = new Date(x.date);
    return dd.getFullYear() === y && dd.getMonth() === m && dd.getDate() === d;
  });
}

export function expensesInMonth(list: Expense[], year: number, month: number): Expense[] {
  return list.filter((x) => {
    const d = new Date(x.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function byCategory(list: Expense[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  list.forEach((x) => { map[x.category] = (map[x.category] || 0) + x.amount; });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function formatMoney(n: number, withCents = true): string {
  if (withCents) return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
