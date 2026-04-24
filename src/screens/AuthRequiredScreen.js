import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BRAND = {
  bg: '#F7F4EF',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#6F6B64',
  border: '#E9E2D8',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.10)',
  orange: '#F28C28',
  orangeSoft: 'rgba(242,140,40,0.10)',
  blackSoft: '#1C1A17',
};

export default function AuthRequiredScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const title = route?.params?.title || 'Connexion requise';
  const message =
    route?.params?.message ||
    "Vous devez vous connecter pour accéder à cette partie de l’application.";

  const redirectTo = route?.params?.redirectTo || null;
  const redirectParams = route?.params?.redirectParams || null;

  function goToLogin() {
    navigation.replace('Login', {
      redirect: redirectTo,
      redirectParams,
    });
  }

  function goToRegister() {
    navigation.replace('Register', {
      redirect: redirectTo,
      redirectParams,
    });
  }

  function goBackSafe() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('DiscoverTab', {
      screen: 'DiscoverHome',
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 20, 28) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={goBackSafe}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={17} color={BRAND.text} />
            </TouchableOpacity>

            <View style={styles.logoMark}>
              <View style={styles.logoLine} />
              <Text style={styles.logoText}>ikadou</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          <View style={styles.hero}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sub}>{message}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.badge}>
              <Ionicons name="lock-closed-outline" size={18} color={BRAND.teal} />
              <Text style={styles.badgeText}>Espace sécurisé</Text>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="person-outline" size={15} color={BRAND.teal} />
                </View>
                <Text style={styles.infoText}>Accéder à vos projets</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="calendar-outline" size={15} color={BRAND.teal} />
                </View>
                <Text style={styles.infoText}>Réserver une visite</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="card-outline" size={15} color={BRAND.teal} />
                </View>
                <Text style={styles.infoText}>Suivre vos paiements</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={goToLogin}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>Se connecter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={goToRegister}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryBtnText}>Créer un compte</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={goBackSafe}
              activeOpacity={0.8}
            >
              <Text style={styles.ghostBtnText}>Retour</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoMark: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoLine: {
    width: 30,
    height: 3,
    borderRadius: 999,
    backgroundColor: BRAND.orange,
    marginBottom: 4,
    transform: [{ skewX: '-18deg' }],
  },

  logoText: {
    color: BRAND.teal,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  hero: {
    marginBottom: 18,
  },

  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: BRAND.blackSoft,
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  sub: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
    maxWidth: 330,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
  },

  badge: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: BRAND.tealSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 16,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.teal,
  },

  infoBox: {
    backgroundColor: '#FCFAF7',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoText: {
    flex: 1,
    color: BRAND.text,
    fontSize: 13,
    fontWeight: '600',
  },

  primaryBtn: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  secondaryBtn: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  secondaryBtnText: {
    color: BRAND.text,
    fontSize: 13,
    fontWeight: '700',
  },

  ghostBtn: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ghostBtnText: {
    color: BRAND.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
});