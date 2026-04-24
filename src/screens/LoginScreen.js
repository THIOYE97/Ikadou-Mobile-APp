import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Animated,
  Easing,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  loginEmail,
  loginPhoneRequestCode,
  loginGoogle,
} from '../api/auth';
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
  orangeSoft: 'rgba(242,140,40,0.10)',
  blackSoft: '#1C1A17',
  error: '#D64545',
};

function SegmentedSwitch({
  value,
  options,
  onChange,
  activeColor = BRAND.teal,
  activeSoftColor = BRAND.tealSoft,
}) {
  const translateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const index = Math.max(
      0,
      options.findIndex((opt) => opt.value === value)
    );

    Animated.timing(translateAnim, {
      toValue: index,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, options, translateAnim]);

  const segmentWidth = `${100 / options.length}%`;

  const left = translateAnim.interpolate({
    inputRange: options.map((_, i) => i),
    outputRange: options.map((_, i) => `${i * (100 / options.length)}%`),
  });

  return (
    <View style={styles.segmentWrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.segmentThumb,
          {
            width: segmentWidth,
            left,
            backgroundColor: activeSoftColor,
            borderColor: activeColor,
          },
        ]}
      />
      {options.map((opt) => {
        const active = value === opt.value;

        return (
          <TouchableOpacity
            key={opt.value}
            style={styles.segmentBtn}
            activeOpacity={0.9}
            onPress={() => onChange(opt.value)}
          >
            <Ionicons
              name={opt.icon}
              size={15}
              color={active ? activeColor : BRAND.textSoft}
              style={{ marginBottom: 2 }}
            />
            <Text
              style={[
                styles.segmentText,
                active && { color: activeColor, fontWeight: '800' },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function LoginScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const redirect = route?.params?.redirect ?? 'Main';

  const [mode, setMode] = useState('email');
  const [form, setForm] = useState({
    email: '',
    password: '',
    phone: '',
    phoneChannel: 'sms',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notice, setNotice] = useState({
    visible: false,
    type: 'error', // error | success | info
    title: '',
    message: '',
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0.82);
    translateAnim.setValue(8);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [mode, fadeAnim, translateAnim]);

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

  function closeNotice() {
    setNotice((prev) => ({ ...prev, visible: false }));
  }

  async function submitGoogle() {
    try {
      showNotice(
        'info',
        'Connexion Google',
        'La connexion Google n’est pas encore activée sur cet écran.'
      );

      // Quand ton flow Google sera prêt, remplace ceci par ta logique réelle.
      // Exemple:
      // const res = await loginGoogle();
      // ...
    } catch (err) {
      showNotice(
        'error',
        'Google indisponible',
        err?.message || 'Impossible d’ouvrir la connexion Google.'
      );
    }
  }

  async function submitEmail() {
    if (!form.email.trim() || !form.password.trim()) {
      showNotice(
        'error',
        'Champs requis',
        'Veuillez renseigner votre email et votre mot de passe.'
      );
      return;
    }

    setLoading(true);
    closeNotice();

    try {
      const res = await loginEmail({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const data = res?.data?.data ?? res?.data ?? {};

      if (data?.status === 'verification_required') {
        showNotice(
          'info',
          'Vérification requise',
          'Un contrôle supplémentaire est nécessaire pour sécuriser votre connexion.'
        );

        navigation.navigate('OtpVerification', {
          flow: 'login_step_up',
          purpose: 'login_reverify',
          target: form.email.trim().toLowerCase(),
          maskedTarget: data?.verification?.target,
          channel: data?.verification?.channel,
          redirect,
        });
        return;
      }

      showNotice(
        'success',
        'Connexion réussie',
        'Redirection vers votre espace en cours...'
      );

      navigation.reset({
        index: 0,
        routes: [{ name: redirect }],
      });
    } catch (err) {
      showNotice(
        'error',
        'Connexion impossible',
        err?.response?.data?.message || 'Veuillez vérifier vos identifiants.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitPhone() {
    if (!form.phone.trim()) {
      showNotice(
        'error',
        'Téléphone requis',
        'Veuillez renseigner votre numéro.'
      );
      return;
    }

    setLoading(true);
    closeNotice();

    try {
      const res = await loginPhoneRequestCode({
        phone: form.phone.trim(),
        channel: form.phoneChannel,
      });

      const data = res?.data?.data ?? res?.data ?? {};

      showNotice(
        'success',
        'Code envoyé',
        `Un code a été envoyé via ${form.phoneChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}.`
      );

      navigation.navigate('OtpVerification', {
        flow: 'login_phone',
        purpose: 'login_phone',
        target: form.phone.trim(),
        maskedTarget: data?.verification?.target,
        channel: form.phoneChannel,
        redirect,
      });
    } catch (err) {
      showNotice(
        'error',
        'Connexion impossible',
        err?.response?.data?.message || 'Impossible d’envoyer le code.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (mode === 'email') return submitEmail();
    return submitPhone();
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
            {navigation.canGoBack() ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back" size={17} color={BRAND.text} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}

            <View style={styles.logoMark}>
              <View style={styles.logoLine} />
              <Text style={styles.logoText}>ikadou</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          <View style={styles.hero}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.sub}>
              Accédez à votre espace client avec votre email, votre téléphone ou Google.
            </Text>
          </View>

          <View style={styles.card}>
            <FormNotice
              visible={notice.visible}
              type={notice.type}
              title={notice.title}
              message={notice.message}
              onClose={closeNotice}
            />

            <SegmentedSwitch
              value={mode}
              onChange={(value) => {
                setMode(value);
                closeNotice();
              }}
              options={[
                { value: 'email', label: 'Email', icon: 'mail-outline' },
                { value: 'phone', label: 'Téléphone', icon: 'call-outline' },
              ]}
              activeColor={BRAND.teal}
              activeSoftColor={BRAND.tealSoft}
            />

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
                marginTop: 16,
              }}
            >
              {mode === 'email' ? (
                <>
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
                        value={form.email}
                        onChangeText={(v) => set('email', v)}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onFocus={closeNotice}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Mot de passe</Text>
                    <View style={styles.inputShell}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={16}
                        color={BRAND.textSoft}
                        style={styles.leadingIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Votre mot de passe"
                        placeholderTextColor="#9A9388"
                        value={form.password}
                        onChangeText={(v) => set('password', v)}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        onFocus={closeNotice}
                      />
                      <TouchableOpacity
                        style={styles.trailingBtn}
                        onPress={() => setShowPassword((prev) => !prev)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={BRAND.textSoft}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.inlineLinkWrap}
                    onPress={() => navigation.navigate('ForgotPassword')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.inlineLink}>Mot de passe oublié ?</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Téléphone</Text>
                    <View style={styles.inputShell}>
                      <Ionicons
                        name="call-outline"
                        size={16}
                        color={BRAND.textSoft}
                        style={styles.leadingIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="+22370000000"
                        placeholderTextColor="#9A9388"
                        value={form.phone}
                        onChangeText={(v) => set('phone', v)}
                        keyboardType="phone-pad"
                        onFocus={closeNotice}
                      />
                    </View>
                  </View>

                  <Text style={[styles.label, { marginBottom: 8 }]}>Recevoir le code par</Text>

                  <SegmentedSwitch
                    value={form.phoneChannel}
                    onChange={(value) => {
                      set('phoneChannel', value);
                      closeNotice();
                    }}
                    options={[
                      { value: 'sms', label: 'SMS', icon: 'chatbubble-ellipses-outline' },
                      { value: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
                    ]}
                    activeColor={form.phoneChannel === 'whatsapp' ? BRAND.orange : BRAND.teal}
                    activeSoftColor={
                      form.phoneChannel === 'whatsapp' ? BRAND.orangeSoft : BRAND.tealSoft
                    }
                  />
                </>
              )}
            </Animated.View>

            <TouchableOpacity
              style={[styles.primaryCta, loading && { opacity: 0.72 }]}
              onPress={submit}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryCtaText}>
                {loading
                  ? 'Chargement…'
                  : mode === 'email'
                  ? 'Se connecter'
                  : 'Recevoir le code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleRow}
              onPress={submitGoogle}
              activeOpacity={0.85}
              disabled={loading}
            >
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.bottomLinkWrap}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomLink}>Créer un compte</Text>
          </TouchableOpacity>
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
    maxWidth: 320,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
  },

  segmentWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#F5F1EA',
    borderRadius: 16,
    padding: 4,
    overflow: 'hidden',
  },

  segmentThumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 12,
    borderWidth: 1,
  },

  segmentBtn: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.textSoft,
  },

  fieldBlock: {
    marginBottom: 12,
  },

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

  leadingIcon: {
    marginRight: 8,
  },

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

  inlineLinkWrap: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },

  inlineLink: {
    color: BRAND.teal,
    fontSize: 12,
    fontWeight: '700',
  },

  primaryCta: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  primaryCtaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  googleRow: {
    minHeight: 44,
    borderRadius: 14,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },

  googleRowText: {
    color: BRAND.text,
    fontSize: 13,
    fontWeight: '700',
  },

  bottomLinkWrap: {
    alignItems: 'center',
    marginTop: 16,
  },

  bottomLink: {
    color: BRAND.teal,
    fontSize: 13,
    fontWeight: '700',
  },
});