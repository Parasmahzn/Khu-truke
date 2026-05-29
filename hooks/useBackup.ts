import { useAppStore } from '../store';

export function useBackup() {
  const exportBackup = useAppStore((s) => s.exportBackup);
  const importBackup = useAppStore((s) => s.importBackup);
  return { exportBackup, importBackup };
}
