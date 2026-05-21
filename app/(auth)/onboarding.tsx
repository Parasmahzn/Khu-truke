import React from 'react';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store';
import OnboardingScreen from '../../screens/OnboardingScreen';

export default function OnboardingRoute() {
  const { markOnboarded } = useAppStore();
  const router = useRouter();

  const handleDone = async () => {
    await markOnboarded();
    router.replace('/(auth)/setup');
  };

  return <OnboardingScreen onDone={handleDone} />;
}
