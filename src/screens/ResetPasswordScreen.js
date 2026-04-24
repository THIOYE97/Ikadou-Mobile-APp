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
import { resetPassword } from '../api/auth';
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
  error: '#D64545',
};

export default function ResetPasswordScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const email = route?.params?.email || '';
  const maskedTarget = route?.params?.maskedTarget || email;
  const redirect = route?.params?.redirect ?? 'Main';

  const [form, setForm] = useState({
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notice, setNotice] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

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
    if (!form.code.trim()) {
      showNotice('error', 'Code requis', 'Veuillez saisir le code reçu.');
      return;
    }

    if (!form.newPassword || form.newPassword.length < 6) {
      showNotice(
        'error',
        'Mot de passe invalide',
        'Le mot de passe doit contenir au moins 6 caractères.'
      );
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      showNotice(
        'error',
        'Confirmation invalide',
        'Les mots de passe ne correspondent pas.'
      );
      return;
    }

    setLoading(true);
    hideNotice();

    try {
      await resetPassword({
        email,
        code: form.code.trim(),
        newPassword: form.newPassword,
      });

      showNotice(
        'success',
        'Succès',
        'Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.'
      );

      setTimeout(() => {
        navigation.replace('Login', { redirect });
      }, 900);
    } catch (err) {
      showNotice(
        'error',
        'Réinitialisation impossible',
        err?.response?.data?.message || 'Code invalide ou expiré.'
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
            <Text style={styles.title}>Nouveau mot de passe</Text>
            <Text style={styles.sub}>
              Saisissez le code envoyé à {maskedTarget} puis définissez votre nouveau mot de passe.
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
              <Text style={styles.label}>Code reçu</Text>
              <View style={styles.inputShell}>
                <Ionicons
                  name="key-outline"
                  size={16}
                  color={BRAND.textSoft}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor="#9A9388"
                  value={form.code}
                  onChangeText={(v) => {
                    set('code', v.replace(/\D/g, '').slice(0, 6));
                    if (notice.visible) hideNotice();
                  }}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <View style={styles.inputShell}>
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={BRAND.textSoft}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Au moins 6 caractères"
                  placeholderTextColor="#9A9388"
                  value={form.newPassword}
                  onChangeText={(v) => {
                    set('newPassword', v);
                    if (notice.visible) hideNotice();
                  }}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.trailingBtn}
                  onPress={() => setShowNewPassword((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={BRAND.textSoft}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={styles.inputShell}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={BRAND.textSoft}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Retapez le mot de passe"
                  placeholderTextColor="#9A9388"
                  value={form.confirmPassword}
                  onChangeText={(v) => {
                    set('confirmPassword', v);
                    if (notice.visible) hideNotice();
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.trailingBtn}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={BRAND.textSoft}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryCta, loading && { opacity: 0.72 }]}
              onPress={submit}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryCtaText}>
                {loading ? 'Mise à jour…' : 'Mettre à jour'}
              </Text>
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
    maxWidth: 330,
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
  trailingBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
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
});