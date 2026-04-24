import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/UI';
import { createLead } from '../api/leads';

const BRAND = {
  bg: '#F3F3F3',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#666666',
  border: '#E7E7E7',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.08)',
  orange: '#F28C28',
  orangeSoft: 'rgba(242,140,40,0.10)',
  success: '#14A44D',
  successSoft: 'rgba(20,164,77,0.10)',
  error: '#D64545',
};

export default function LeadCaptureScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { terrain, source = 'landing' } = route.params ?? {};

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const rawUser = await AsyncStorage.getItem('@ikadou:user');
        if (!rawUser) return;

        const user = JSON.parse(rawUser);

        setForm((prev) => ({
          ...prev,
          firstName: prev.firstName || user?.firstName || '',
          lastName: prev.lastName || user?.lastName || '',
          phone: prev.phone || user?.phone || '',
          email: prev.email || user?.email || '',
        }));
      } catch (_) {}
    })();
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Prénom requis';
    if (!form.lastName.trim()) e.lastName = 'Nom requis';
    if (!form.phone.trim()) e.phone = 'Téléphone requis';
    else if (!/^[0-9+\s]{8,15}$/.test(form.phone.trim())) {
      e.phone = 'Format invalide (ex : +223 7X XX XX XX)';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Adresse email invalide';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;

    setLoading(true);
    try {
      await createLead({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.replace(/\s/g, ''),
        email: form.email.trim() || undefined,
        terrainId: terrain?.id,
        source,
      });
      setSent(true);
    } catch (err) {
      Alert.alert(
        'Erreur d’envoi',
        err?.response?.data?.message ||
          'Impossible d’enregistrer votre demande. Vérifiez votre connexion et réessayez.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={42} color={BRAND.success} />
            </View>

            <Text style={styles.successTitle}>Demande enregistrée</Text>
            <Text style={styles.successSub}>
              Merci {form.firstName}. Un agent vous contactera très prochainement au{' '}
              {form.phone.replace(/\s/g, '')}.
            </Text>

            {terrain ? (
              <View style={styles.terrainPill}>
                <Ionicons name="location-outline" size={14} color={BRAND.teal} />
                <Text style={styles.terrainPillText}>
                  {terrain.title ?? 'Terrain sélectionné'}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.replace('Main')}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>Explorer les terrains</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryBtnText}>Retour</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
                  {navigation.canGoBack() && (
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                      <Ionicons name="arrow-back" size={18} color={BRAND.text} />
                    </TouchableOpacity>
                  )}

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Être recontacté</Text>
            <Text style={styles.headerSub}>Laissez vos coordonnées, c’est gratuit</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 120, 140) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {terrain ? (
            <View style={styles.terrainCard}>
              <Text style={styles.terrainCardLabel}>Terrain concerné</Text>
              <Text style={styles.terrainCardTitle}>{terrain.title}</Text>

              <View style={styles.terrainCardRow}>
                <View style={styles.terrainInfoWrap}>
                  <Ionicons name="location-outline" size={14} color={BRAND.textSoft} />
                  <Text style={styles.terrainCardInfo} numberOfLines={1}>
                    {terrain.location}
                  </Text>
                </View>

                <Text style={styles.terrainCardPrice}>
                  {Number(terrain.price).toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Parlons de votre projet</Text>
            <Text style={styles.heroSub}>
              Remplissez ce formulaire et un conseiller Ikadou vous recontacte rapidement.
            </Text>
          </View>

          <View style={styles.valueProps}>
            {[
              { icon: 'flash-outline', text: 'Réponse sous 24h' },
              { icon: 'shield-checkmark-outline', text: 'Sans engagement' },
              { icon: 'chatbubble-ellipses-outline', text: 'Conseils personnalisés' },
            ].map((p) => (
              <View key={p.text} style={styles.valueProp}>
                <Ionicons name={p.icon} size={18} color={BRAND.teal} />
                <Text style={styles.valuePropText}>{p.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Vos informations</Text>

            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Prénom *"
                  placeholder="Moussa"
                  value={form.firstName}
                  onChangeText={(v) => set('firstName', v)}
                  error={errors.firstName}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Input
                  label="Nom *"
                  placeholder="Traoré"
                  value={form.lastName}
                  onChangeText={(v) => set('lastName', v)}
                  error={errors.lastName}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </View>

            <View style={{ height: 12 }} />

            <Input
              label="Téléphone *"
              placeholder="+223 7X XX XX XX"
              value={form.phone}
              onChangeText={(v) => set('phone', v)}
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <Input
              label="Email (optionnel)"
              placeholder="vous@exemple.ml"
              value={form.email}
              onChangeText={(v) => set('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
          </View>

          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={18} color={BRAND.teal} />
            <Text style={styles.privacyText}>
              Vos données sont protégées et utilisées uniquement pour vous recontacter.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.submitText}>
              {loading ? 'Envoi en cours…' : 'Être recontacté gratuitement'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.replace('Main')}
            style={styles.skipLinkWrap}
            activeOpacity={0.85}
          >
            <Text style={styles.skipLink}>Continuer sans laisser mes coordonnées</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: { fontSize: 18, color: BRAND.text },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.text,
  },

  headerSub: {
    fontSize: 13,
    color: BRAND.textSoft,
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 16,
  },

  terrainCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    marginBottom: 14,
  },

  terrainCardLabel: {
    fontSize: 12,
    color: BRAND.textSoft,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  terrainCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 6,
  },

  terrainCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  terrainInfoWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  terrainCardInfo: {
    flex: 1,
    fontSize: 12,
    color: BRAND.textSoft,
  },

  terrainCardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.teal,
  },

  heroCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    marginBottom: 14,
  },

  heroTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 8,
  },

  heroSub: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
  },

  valueProps: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },

  valueProp: {
    flex: 1,
    backgroundColor: BRAND.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },

  valuePropText: {
    fontSize: 11,
    color: BRAND.textSoft,
    textAlign: 'center',
    fontWeight: '700',
  },

  formCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 14,
  },

  formTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },

  privacyNote: {
    backgroundColor: BRAND.tealSoft,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  privacyText: {
    flex: 1,
    fontSize: 12,
    color: BRAND.teal,
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    backgroundColor: BRAND.bg,
  },

  submitBtn: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  skipLinkWrap: {
    alignItems: 'center',
    marginTop: 10,
  },

  skipLink: {
    fontSize: 12,
    color: BRAND.textSoft,
  },

  successWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },

  successCard: {
    backgroundColor: BRAND.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 24,
    alignItems: 'center',
  },

  successIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: BRAND.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  successSub: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
    textAlign: 'center',
    marginBottom: 14,
  },

  terrainPill: {
    backgroundColor: BRAND.tealSoft,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  terrainPillText: {
    fontSize: 12,
    color: BRAND.teal,
    fontWeight: '700',
  },

  primaryBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  secondaryBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryBtnText: {
    color: BRAND.text,
    fontWeight: '700',
    fontSize: 14,
  },
});