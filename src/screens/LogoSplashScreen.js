import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND = {
  bg: '#F7F4EF',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#6F6B64',
  teal: '#008C8C',
  orange: '#F28C28',
};

export default function LogoSplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(18)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.delay(700),
    ]).start(() => {
      navigation.replace('Bootstrap');
    });
  }, [navigation, glowOpacity, logoOpacity, logoScale, logoTranslateY, textOpacity]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerWrap}>
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        />

        <Animated.Image
          source={require('../assets/logo.png')}
          resizeMode="contain"
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
            },
          ]}
        />

        <Animated.Text style={[styles.brandName, { opacity: textOpacity }]}>
          Ikadou
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: textOpacity }]}>
          Votre terrain en toute confiance
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },

  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  glow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 140, 140, 0.08)',
  },

  logo: {
    width: 150,
    height: 150,
    marginBottom: 18,
  },

  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND.text,
    letterSpacing: 0.3,
    marginBottom: 6,
  },

  tagline: {
    fontSize: 13,
    color: BRAND.textSoft,
    textAlign: 'center',
  },
});