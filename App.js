import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setReady(true);
      await SplashScreen.hideAsync();
    };

    prepare();
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent={false} backgroundColor="#F7F4EF" />
      <AppNavigator initialRoute="Onboarding" />
    </SafeAreaProvider>
  );
}