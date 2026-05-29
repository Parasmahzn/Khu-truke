import { useAppStore } from '../store';

export function useUserProfile() {
  const userName = useAppStore((s) => s.userName);
  const profileImage = useAppStore((s) => s.profileImage);
  const currency = useAppStore((s) => s.currency);
  const onboarded = useAppStore((s) => s.onboarded);
  const setup = useAppStore((s) => s.setup);
  const joinedAt = useAppStore((s) => s.joinedAt);
  const expenses = useAppStore((s) => s.expenses);

  const isUserConfigured =
    !!userName || setup || Object.values(expenses).some((a) => a.length > 0);

  const completeSetup = useAppStore((s) => s.completeSetup);
  const markOnboarded = useAppStore((s) => s.markOnboarded);
  const saveCurrency = useAppStore((s) => s.saveCurrency);
  const saveProfileImage = useAppStore((s) => s.saveProfileImage);
  const saveUserName = useAppStore((s) => s.saveUserName);

  return {
    userName,
    profileImage,
    currency,
    onboarded,
    setup,
    joinedAt,
    isUserConfigured,
    completeSetup,
    markOnboarded,
    saveCurrency,
    saveProfileImage,
    saveUserName,
  };
}
