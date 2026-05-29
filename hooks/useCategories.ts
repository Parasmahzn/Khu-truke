import { useAppStore } from '../store';

export function useCategories() {
  const customCategories = useAppStore((s) => s.customCategories);
  const builtInCategories = useAppStore((s) => s.builtInCategories);
  const addCustomCategory = useAppStore((s) => s.addCustomCategory);
  const removeCustomCategory = useAppStore((s) => s.removeCustomCategory);
  const updateCustomCategory = useAppStore((s) => s.updateCustomCategory);
  const updateBuiltInCategory = useAppStore((s) => s.updateBuiltInCategory);
  const removeBuiltInCategory = useAppStore((s) => s.removeBuiltInCategory);

  const allCategories = [...builtInCategories, ...customCategories].filter(
    (cat, i, arr) => arr.findIndex((c) => c.name === cat.name) === i,
  );

  return {
    customCategories,
    builtInCategories,
    allCategories,
    addCustomCategory,
    removeCustomCategory,
    updateCustomCategory,
    updateBuiltInCategory,
    removeBuiltInCategory,
  };
}
