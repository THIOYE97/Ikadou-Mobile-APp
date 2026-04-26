import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

const ACCESS_TOKEN_KEY = '@ikadou:accessToken';

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Onboarding');

  useEffect(() => {
    const prepare = async () => {
      try {
        const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

        if (token) {
          setInitialRoute('Main');
        } else {
          setInitialRoute('Onboarding');
        }
      } catch {
        setInitialRoute('Onboarding');
      } finally {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent={false} backgroundColor="#F7F4EF" />
      <AppNavigator initialRoute={initialRoute} />
    </SafeAreaProvider>
  );
}