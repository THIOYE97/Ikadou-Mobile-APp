import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BRAND = {
  bg: '#F7F4EF',
  teal: '#008C8C',
};

export default function BootstrapScreen({ navigation }) {
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const entries = await AsyncStorage.multiGet([
          '@ikadou:onboarded',
          '@ikadou:accessToken',
          '@ikadou:user',
        ]);

        const data = Object.fromEntries(entries);

        const onboarded = data['@ikadou:onboarded'];
        const accessToken = data['@ikadou:accessToken'];
        const rawUser = data['@ikadou:user'];

        let parsedUser = null;
        try {
          parsedUser = rawUser ? JSON.parse(rawUser) : null;
        } catch (_) {
          parsedUser = rawUser || null;
        }

        const isConnected = Boolean(accessToken && parsedUser);
        const hasSeenOnboarding = onboarded === 'true';

        console.log('BOOTSTRAP onboarded =', onboarded);
        console.log('BOOTSTRAP accessToken =', accessToken ? 'YES' : 'NO');
        console.log('BOOTSTRAP user =', parsedUser ? 'YES' : 'NO');
        console.log('BOOTSTRAP isConnected =', isConnected);
        console.log('BOOTSTRAP hasSeenOnboarding =', hasSeenOnboarding);

        if (!mounted) return;

        setTimeout(() => {
          if (!mounted) return;

          if (isConnected || hasSeenOnboarding) {
            navigation.replace('Main');
          } else {
            navigation.replace('Onboarding');
          }
        }, 50);
      } catch (error) {
        console.log('BOOTSTRAP ERROR =', error?.message);

        if (!mounted) return;

        setTimeout(() => {
          if (!mounted) return;
          navigation.replace('Onboarding');
        }, 50);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.centered}>
        <ActivityIndicator color={BRAND.teal} size="large" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});