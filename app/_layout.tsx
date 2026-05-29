import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppStore } from '../store';
import { ThemeProvider } from '../context/ThemeContext';

SplashScreen.preventAutoHideAsync();

function SplashGate({ children }: { children: React.ReactNode }) {
  const ready = useAppStore((s) => s.ready);

  useEffect(() => {
    useAppStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <SplashGate>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add-edit" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="manage-categories" />
            <Stack.Screen name="manage-tags" />
            <Stack.Screen name="manage-currency" />
            <Stack.Screen name="backup-restore" />
            <Stack.Screen name="category-detail" />
          </Stack>
          <StatusBar style="auto" />
        </SplashGate>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
