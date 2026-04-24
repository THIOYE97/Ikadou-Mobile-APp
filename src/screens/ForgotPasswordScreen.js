import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { forgotPassword } from '../api/auth';
import FormNotice from '../components/FormNotice';

const BRAND = {
  bg: '#F7F4EF',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#6F6B64',
  border: '#E9E2D8',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.10)',
  orange: '#F28C28',
  blackSoft: '#1C1A17',
};

export default function ForgotPasswordScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const redirect = route?.params?.redirect ?? 'Main';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [notice, setNotice] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

  function showNotice(type, title, message) {
    setNotice({
      visible: true,
      type,
      title,
      message,
    });
  }

  function hideNotice() {
    setNotice((prev) => ({ ...prev, visible: false }));
  }

  async function submit() {
    if (!email.trim()) {
      showNotice('error', 'Email requis', 'Veuillez renseigner votre adresse email.');
      return;
    }

    setLoading(true);
    hideNotice();

    try {
      const res = await forgotPassword({
        email: email.trim().toLowerCase(),
      });

      const data = res?.data?.data ?? res?.data ?? {};

      showNotice(
        'success',
        'Code envoyé',
        'Un code de réinitialisation va vous être demandé.'
      );

      navigation.navigate('ResetPassword', {
        email: email.trim().toLowerCase(),
        maskedTarget: data?.verification?.target,
        redirect,
      });
    } catch (err) {
      showNotice(
        'error',
        'Impossible de continuer',
        err?.response?.data?.message || "Impossible d'envoyer le code pour le moment."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 20, 28) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
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
            <Text style={styles.title}>Mot de passe oublié</Text>
            <Text style={styles.sub}>
              Entrez votre email pour recevoir un code de réinitialisation.
            </Text>
          </View>

          <View style={styles.card}>
            <FormNotice
              visible={notice.visible}
              type={notice.type}
              title={notice.title}
              message={notice.message}
              onClose={hideNotice}
            />

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputShell}>
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={BRAND.textSoft}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="vous@exemple.ml"
                  placeholderTextColor="#9A9388"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (notice.visible) hideNotice();
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryCta, loading && { opacity: 0.72 }]}
              onPress={submit}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryCtaText}>
                {loading ? 'Envoi…' : 'Recevoir un code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomLinkWrap}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.bottomLink}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
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
  logoMark: { alignItems: 'center', justifyContent: 'center' },
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
  hero: { marginBottom: 18 },
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
    maxWidth: 320,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
  },
  fieldBlock: { marginBottom: 12 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.textSoft,
    marginBottom: 6,
  },
  inputShell: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  leadingIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: BRAND.text,
    fontSize: 14,
    paddingVertical: 12,
    paddingRight: 8,
  },
  primaryCta: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryCtaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bottomLinkWrap: {
    alignItems: 'center',
    marginTop: 14,
  },
  bottomLink: {
    color: BRAND.teal,
    fontSize: 13,
    fontWeight: '700',
  },
});