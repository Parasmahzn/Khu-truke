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

export function formatSmartMoney(n: number): string {
  const cents = Math.round(n * 100) % 100;
  if (cents === 0) return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatMoney(n: number, withCents = true): string {
  if (withCents) return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export type DateGroup = {
  dateKey: string;
  label: string;
  expenses: Expense[];
  total: number;
};

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function groupExpensesByDate(expenses: Expense[]): DateGroup[] {
  const now = new Date();
  const todayKey = localDateKey(now);
  const yd = new Date(now);
  yd.setDate(yd.getDate() - 1);
  const yesterdayKey = localDateKey(yd);

  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const key = localDateKey(new Date(e.date));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, exps]) => {
      let label: string;
      if (key === todayKey) label = 'TODAY';
      else if (key === yesterdayKey) label = 'YESTERDAY';
      else {
        const d = new Date(key + 'T12:00:00');
        label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
      }
      return {
        dateKey: key,
        label,
        expenses: exps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        total: sumAmount(exps),
      };
    });
}
