import React from 'react';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store';
import SetupScreen from '../../screens/SetupScreen';

export default function SetupRoute() {
  const { completeSetup } = useAppStore();
  const router = useRouter();

  const handleDone = async (name: string, currencyCode: string) => {
    await completeSetup(name, currencyCode);
    router.replace('/(tabs)');
  };

  return <SetupScreen onDone={handleDone} />;
}
