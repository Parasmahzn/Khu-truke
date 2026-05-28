import { useAppStore } from '../store';

export function useTags() {
  const builtInTags = useAppStore((s) => s.builtInTags);
  const customTags = useAppStore((s) => s.customTags);
  const addCustomTag = useAppStore((s) => s.addCustomTag);
  const removeCustomTag = useAppStore((s) => s.removeCustomTag);
  const updateCustomTag = useAppStore((s) => s.updateCustomTag);
  const updateBuiltInTag = useAppStore((s) => s.updateBuiltInTag);

  const allTags = [...builtInTags, ...customTags].filter(
    (t, i, arr) => arr.indexOf(t) === i,
  );

  return { builtInTags, customTags, allTags, addCustomTag, removeCustomTag, updateCustomTag, updateBuiltInTag };
}
