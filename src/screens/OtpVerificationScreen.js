import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Pressable,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  verifyRegisterOtp,
  verifyLoginOtp,
  loginPhoneVerifyCode,
  loginPhoneRequestCode,
  resendRegisterOtp,
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

export default function OtpVerificationScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const successTimerRef = useRef(null);

  const flow = route?.params?.flow || 'register';
  const target = route?.params?.target || '';
  const maskedTarget = route?.params?.maskedTarget || target;
  const channel = route?.params?.channel || 'email';
  const redirect = route?.params?.redirect || 'Main';
  const registrationSessionId = route?.params?.registrationSessionId || null;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [notice, setNotice] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

  const fadeNotice = useRef(new Animated.Value(0)).current;

  const config = useMemo(() => {
    if (flow === 'login_phone') {
      return {
        title: 'Code de connexion',
        sub: `Saisissez le code envoyé à ${maskedTarget}.`,
        icon: channel === 'whatsapp' ? 'logo-whatsapp' : 'chatbubble-ellipses-outline',
        accent: channel === 'whatsapp' ? BRAND.orange : BRAND.teal,
        accentSoft: channel === 'whatsapp' ? BRAND.orangeSoft : BRAND.tealSoft,
      };
    }

    if (flow === 'login_step_up') {
      return {
        title: 'Vérification',
        sub: `Pour continuer, entrez le code envoyé à ${maskedTarget}.`,
        icon: 'shield-checkmark-outline',
        accent: BRAND.teal,
        accentSoft: BRAND.tealSoft,
      };
    }

    return {
      title: 'Valider votre inscription',
      sub: `Entrez le code envoyé à ${maskedTarget}.`,
      icon: channel === 'email' ? 'mail-outline' : 'shield-checkmark-outline',
      accent: channel === 'whatsapp' ? BRAND.orange : BRAND.teal,
      accentSoft: channel === 'whatsapp' ? BRAND.orangeSoft : BRAND.tealSoft,
    };
  }, [flow, maskedTarget, channel]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  function showNotice(type, title, message, autoHide = false) {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }

    setNotice({
      visible: true,
      type,
      title,
      message,
    });

    fadeNotice.setValue(0);
    Animated.timing(fadeNotice, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (autoHide) {
      successTimerRef.current = setTimeout(() => {
        hideNotice();
        successTimerRef.current = null;
      }, 2600);
    }
  }

  function hideNotice() {
    setNotice((prev) => ({ ...prev, visible: false }));
  }

  function normalizeCode(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 6);
  }

  function animateError() {
    pulse.setValue(0.985);
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1.02,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }

  function focusInput() {
    inputRef.current?.focus();
  }

  function dismissKeyboardAndNotice() {
    Keyboard.dismiss();
  }

  async function submit() {
    if (!code.trim() || code.trim().length < 4) {
      animateError();
      focusInput();
      showNotice('error', 'Code requis', 'Veuillez saisir le code reçu.');
      return;
    }

    setLoading(true);
    hideNotice();

    try {
      if (flow === 'login_phone') {
        await loginPhoneVerifyCode({
          phone: target,
          code: code.trim(),
        });
      } else if (flow === 'login_step_up') {
        await verifyLoginOtp({
          target,
          code: code.trim(),
        });
      } else {
        await verifyRegisterOtp({
          registrationSessionId,
          code: code.trim(),
        });
      }

      showNotice('success', 'Vérification réussie', 'Redirection en cours...', true);

      navigation.reset({
        index: 0,
        routes: [{ name: redirect }],
      });
    } catch (err) {
      animateError();
      focusInput();
      showNotice(
        'error',
        'Vérification impossible',
        err?.response?.data?.message || 'Code invalide ou expiré.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendCode(nextChannel = null) {
    setResending(true);
    hideNotice();

    try {
      if (flow === 'login_phone') {
        await loginPhoneRequestCode({
          phone: target,
          channel: nextChannel || channel,
        });

        if (nextChannel && nextChannel !== channel) {
          navigation.setParams({
            channel: nextChannel,
          });
        }

        showNotice(
          'success',
          'Code renvoyé',
          'Un nouveau code de vérification a bien été envoyé.',
          true
        );
      } else if (flow === 'register') {
        const res = await resendRegisterOtp({
          registrationSessionId,
          channel: nextChannel || channel,
        });

        const data = res?.data?.data ?? res?.data ?? {};

        navigation.setParams({
          channel: data?.verification?.channel || nextChannel || channel,
          maskedTarget: data?.verification?.target || maskedTarget,
        });

        showNotice(
          'success',
          'Code renvoyé',
          'Un nouveau code a été envoyé.',
          true
        );
      } else {
        showNotice(
          'info',
          'Renvoyer le code',
          "Le renvoi automatique n'est pas encore branché pour ce parcours."
        );
      }
    } catch (err) {
      showNotice(
        'error',
        'Envoi impossible',
        err?.response?.data?.message || "Impossible de renvoyer le code pour le moment."
      );
    } finally {
      setResending(false);
    }
  }

  function goBackSafe() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Login');
  }

  const codeChars = Array.from({ length: 6 }).map((_, index) => code[index] || '');
  const activeIndex = Math.min(code.length, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable style={styles.flex} onPress={dismissKeyboardAndNotice}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom + 20, 28) },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
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
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.sub}>{config.sub}</Text>
            </View>

            <Animated.View
              style={[
                styles.card,
                {
                  transform: [{ scale: pulse }],
                },
              ]}
            >
              <View style={[styles.badge, { backgroundColor: config.accentSoft }]}>
                <Ionicons name={config.icon} size={18} color={config.accent} />
                <Text style={[styles.badgeText, { color: config.accent }]}>
                  {channel === 'whatsapp'
                    ? 'WhatsApp'
                    : channel === 'sms'
                    ? 'SMS'
                    : 'Email'}
                </Text>
              </View>

              {notice.visible ? (
                <Animated.View style={{ opacity: fadeNotice }}>
                  <FormNotice
                    visible={notice.visible}
                    type={notice.type}
                    title={notice.title}
                    message={notice.message}
                    onClose={hideNotice}
                  />
                </Animated.View>
              ) : null}

              <Pressable style={styles.otpWrap} onPress={focusInput}>
                <View style={styles.codeRow}>
                  {codeChars.map((char, index) => {
                    const filled = !!char;
                    const active = isFocused && index === activeIndex && code.length < 6;

                    return (
                      <View
                        key={`otp-cell-${index}`}
                        style={[
                          styles.codeCell,
                          filled && {
                            borderColor: config.accent,
                            backgroundColor: config.accentSoft,
                          },
                          active && {
                            borderColor: config.accent,
                            shadowColor: config.accent,
                            shadowOpacity: 0.18,
                            shadowRadius: 10,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 2,
                          },
                        ]}
                      >
                        <Text style={styles.codeCellText}>{char}</Text>
                      </View>
                    );
                  })}
                </View>

                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={(v) => {
                    setCode(normalizeCode(v));
                    if (notice.visible) hideNotice();
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  style={styles.hiddenInput}
                  caretHidden
                  selection={{ start: code.length, end: code.length }}
                />
              </Pressable>

              {flow === 'register' && channel !== 'email' ? (
                <View style={styles.channelSwitchRow}>
                  <TouchableOpacity
                    style={[
                      styles.channelChip,
                      channel === 'sms' && styles.channelChipActive,
                    ]}
                    onPress={() => resendCode('sms')}
                    activeOpacity={0.85}
                    disabled={resending}
                  >
                    <Text
                      style={[
                        styles.channelChipText,
                        channel === 'sms' && styles.channelChipTextActive,
                      ]}
                    >
                      SMS
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.channelChip,
                      channel === 'whatsapp' && styles.channelChipActiveOrange,
                    ]}
                    onPress={() => resendCode('whatsapp')}
                    activeOpacity={0.85}
                    disabled={resending}
                  >
                    <Text
                      style={[
                        styles.channelChipText,
                        channel === 'whatsapp' && styles.channelChipTextActive,
                      ]}
                    >
                      WhatsApp
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <Text style={styles.helper}>
                Saisissez le code à 6 chiffres reçu sur votre canal sélectionné.
              </Text>

              <TouchableOpacity
                style={[
                  styles.primaryCta,
                  loading && { opacity: 0.72 },
                  channel === 'whatsapp' && { backgroundColor: BRAND.orange },
                ]}
                onPress={submit}
                disabled={loading}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryCtaText}>
                  {loading ? 'Vérification…' : 'Valider le code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ghostRow}
                onPress={() => resendCode()}
                disabled={resending}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="refresh-outline"
                  size={15}
                  color={channel === 'whatsapp' ? BRAND.orange : BRAND.teal}
                />
                <Text
                  style={[
                    styles.ghostRowText,
                    { color: channel === 'whatsapp' ? BRAND.orange : BRAND.teal },
                  ]}
                >
                  {resending ? 'Envoi…' : 'Renvoyer le code'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 28,
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

  badge: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 18,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  otpWrap: {
    marginBottom: 12,
  },

  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  codeCell: {
    flex: 1,
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: BRAND.border,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  codeCellText: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.text,
  },

  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: 58,
  },

  channelSwitchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  channelChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  channelChipActive: {
    borderColor: BRAND.teal,
    backgroundColor: BRAND.tealSoft,
  },

  channelChipActiveOrange: {
    borderColor: BRAND.orange,
    backgroundColor: BRAND.orangeSoft,
  },

  channelChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.textSoft,
  },

  channelChipTextActive: {
    color: BRAND.text,
    fontWeight: '800',
  },

  helper: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.textSoft,
    marginBottom: 14,
  },

  primaryCta: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  primaryCtaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  ghostRow: {
    minHeight: 42,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  ghostRowText: {
    fontSize: 13,
    fontWeight: '700',
  },
});