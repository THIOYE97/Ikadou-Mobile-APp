import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  registerEmailInit,
  registerPhoneInit,
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

export default function RegisterDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const redirect = route?.params?.redirect ?? 'Main';
  const registrationDraft = route?.params?.registrationDraft ?? {};
  const initialMode = route?.params?.registerMode === 'phone' ? 'phone' : 'email';

  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    firstName: registrationDraft.firstName || '',
    lastName: registrationDraft.lastName || '',
    email: registrationDraft.email || '',
    phone: registrationDraft.phone || '',
    password: '',
    confirmPassword: '',
    phoneChannel: 'sms',
    country: '',
    city: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notice, setNotice] = useState({
    visible: false,
    type: 'error',
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

  function validateEmailMode() {
    if (!form.firstName.trim()) {
      showNotice('error', 'Prénom requis', 'Veuillez renseigner votre prénom.');
      return false;
    }

    if (!form.lastName.trim()) {
      showNotice('error', 'Nom requis', 'Veuillez renseigner votre nom.');
      return false;
    }

    if (!form.email.trim()) {
      showNotice('error', 'Email requis', 'Veuillez renseigner votre email.');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      showNotice('error', 'Email invalide', 'Veuillez saisir une adresse email valide.');
      return false;
    }

    if (!form.password || form.password.length < 6) {
      showNotice(
        'error',
        'Mot de passe invalide',
        'Le mot de passe doit contenir au moins 6 caractères.'
      );
      return false;
    }

    if (form.password !== form.confirmPassword) {
      showNotice(
        'error',
        'Confirmation invalide',
        'Les mots de passe ne correspondent pas.'
      );
      return false;
    }

    return true;
  }

  function validatePhoneMode() {
    if (!form.firstName.trim()) {
      showNotice('error', 'Prénom requis', 'Veuillez renseigner votre prénom.');
      return false;
    }

    if (!form.lastName.trim()) {
      showNotice('error', 'Nom requis', 'Veuillez renseigner votre nom.');
      return false;
    }

    if (!form.phone.trim()) {
      showNotice(
        'error',
        'Téléphone requis',
        'Veuillez renseigner votre numéro de téléphone.'
      );
      return false;
    }

    return true;
  }

  async function submitEmailMode() {
    const res = await registerEmailInit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      country: form.country.trim() || undefined,
      city: form.city.trim() || undefined,
    });

    const data = res?.data?.data ?? res?.data ?? {};

    showNotice(
      'success',
      'Compte presque prêt',
      'Votre code de vérification va être demandé.'
    );

    navigation.navigate('OtpVerification', {
      flow: 'register',
      registrationSessionId: data?.registrationSessionId,
      channel: data?.verification?.channel || 'email',
      maskedTarget: data?.verification?.target,
      redirect,
    });
  }

  async function submitPhoneMode() {
    const res = await registerPhoneInit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      channel: form.phoneChannel,
      country: form.country.trim() || undefined,
      city: form.city.trim() || undefined,
    });

    const data = res?.data?.data ?? res?.data ?? {};

    showNotice(
      'success',
      'Code envoyé',
      `Votre vérification continue par ${
        form.phoneChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'
      }.`
    );

    navigation.navigate('OtpVerification', {
      flow: 'register',
      registrationSessionId: data?.registrationSessionId,
      channel: data?.verification?.channel || form.phoneChannel,
      maskedTarget: data?.verification?.target,
      redirect,
    });
  }

  async function submit() {
    const isValid = mode === 'email' ? validateEmailMode() : validatePhoneMode();
    if (!isValid) return;

    setLoading(true);
    closeNotice();

    try {
      if (mode === 'phone') {
        await submitPhoneMode();
      } else {
        await submitEmailMode();
      }
    } catch (err) {
      showNotice(
        'error',
        'Inscription impossible',
        err?.response?.data?.message || "Impossible de poursuivre l'inscription pour le moment."
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
            <Text style={styles.title}>Finaliser le compte</Text>
            <Text style={styles.sub}>
              Complétez votre accès et choisissez comment vous souhaitez recevoir votre vérification.
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
              <View style={styles.twoCols}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Prénom</Text>
                  <View style={styles.inputShell}>
                    <TextInput
                      style={styles.input}
                      placeholder="Moussa"
                      placeholderTextColor="#9A9388"
                      value={form.firstName}
                      onChangeText={(v) => set('firstName', v)}
                      onFocus={closeNotice}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Nom</Text>
                  <View style={styles.inputShell}>
                    <TextInput
                      style={styles.input}
                      placeholder="Traoré"
                      placeholderTextColor="#9A9388"
                      value={form.lastName}
                      onChangeText={(v) => set('lastName', v)}
                      onFocus={closeNotice}
                    />
                  </View>
                </View>
              </View>

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
                        placeholder="Au moins 6 caractères"
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
                        placeholder="Retapez votre mot de passe"
                        placeholderTextColor="#9A9388"
                        value={form.confirmPassword}
                        onChangeText={(v) => set('confirmPassword', v)}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        onFocus={closeNotice}
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

              <View style={styles.twoCols}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Pays</Text>
                  <View style={styles.inputShell}>
                    <TextInput
                      style={styles.input}
                      placeholder="Mali"
                      placeholderTextColor="#9A9388"
                      value={form.country}
                      onChangeText={(v) => set('country', v)}
                      onFocus={closeNotice}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Ville</Text>
                  <View style={styles.inputShell}>
                    <TextInput
                      style={styles.input}
                      placeholder="Bamako"
                      placeholderTextColor="#9A9388"
                      value={form.city}
                      onChangeText={(v) => set('city', v)}
                      onFocus={closeNotice}
                    />
                  </View>
                </View>
              </View>
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
                  ? 'Créer mon compte'
                  : 'Recevoir le code'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Une vérification sera demandée juste après cette étape.
            </Text>
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

  twoCols: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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

  primaryCta: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  primaryCtaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  helperText: {
    marginTop: 10,
    textAlign: 'center',
    color: BRAND.textSoft,
    fontSize: 12,
    lineHeight: 18,
  },
});