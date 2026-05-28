import { useAppStore } from '../store';

export function useBudget() {
  const currency = useAppStore((s) => s.currency);
  const budgets = useAppStore((s) => s.budgets);
  const saveBudget = useAppStore((s) => s.saveBudget);
  const clearBudgetForCurrency = useAppStore((s) => s.clearBudgetForCurrency);

  return {
    budget: budgets[currency.code] ?? 0,   // active currency's budget
    budgets,
    saveBudget,
    clearBudgetForCurrency,
  };
}
