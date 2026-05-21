import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { Redirect } from 'expo-router';
import * as Updates from 'expo-updates';
import { useAppStore } from '../store';

export default function Index() {
  const { ready, isUserConfigured, onboarded } = useAppStore();

  useEffect(() => {
    async function checkUpdate() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          Alert.alert(
            'Update Available',
            'A new version is available. Please update to continue.',
            [
              {
                text: 'Update Now',
                onPress: async () => {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                },
              },
            ],
            { cancelable: false },
          );
        }
      } catch {
        // silently ignore in development or when updates are not configured
      }
    }
    checkUpdate();
  }, []);

  if (!ready) return null;

  if (isUserConfigured) return <Redirect href="/(tabs)" />;
  if (onboarded) return <Redirect href="/(auth)/setup" />;
  return <Redirect href="/(auth)/onboarding" />;
}
