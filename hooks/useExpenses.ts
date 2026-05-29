import { useAppStore } from '../store';

export function useExpenses() {
  // Subscribe only to the active currency's array — avoids re-renders on other currencies' changes
  const expenses = useAppStore((s) => s.expenses[s.currency.code] ?? []);
  const allExpensesRecord = useAppStore((s) => s.expenses);
  const selectExpenses = useAppStore((s) => s.selectExpenses);
  const addExpense = useAppStore((s) => s.addExpense);
  const updateExpense = useAppStore((s) => s.updateExpense);
  const deleteExpense = useAppStore((s) => s.deleteExpense);
  const clearExpensesForCurrency = useAppStore((s) => s.clearExpensesForCurrency);
  const countExpensesForCurrency = useAppStore((s) => s.countExpensesForCurrency);

  return {
    expenses,             // active currency's array
    allExpensesRecord,    // full Record<currencyCode, Expense[]> — for multi-currency access
    selectExpenses,       // (code?: string) => Expense[] — selector function
    addExpense,
    updateExpense,
    deleteExpense,
    clearExpensesForCurrency,
    countExpensesForCurrency,
  };
}
