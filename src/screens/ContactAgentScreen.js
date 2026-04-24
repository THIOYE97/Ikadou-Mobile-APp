import React, { useEffect, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/UI';
import { contactAgent } from '../api/leads';
import { openQuickSupportTicket } from '../api/support';

const BRAND = {
  bg: '#F3F3F3',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#666666',
  border: '#E7E7E7',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.08)',
  orange: '#F28C28',
  success: '#14A44D',
  successSoft: 'rgba(20,164,77,0.10)',
  error: '#D64545',
};

const MESSAGES = [
  "Je souhaite avoir plus d'informations sur ce terrain.",
  "Je suis intéressé(e), pouvez-vous me rappeler ?",
  'Quelles sont les conditions de paiement ?',
];

function buildSupportDescription({ terrain, form }) {
  return [
    'Nouvelle demande envoyée depuis la fiche terrain mobile.',
    '',
    `Terrain : ${terrain?.title ?? 'Terrain'}`,
    `Référence : ${terrain?.ref ?? terrain?.reference ?? '—'}`,
    `ID terrain : ${terrain?.id ?? '—'}`,
    `Localisation : ${terrain?.location ?? '—'}`,
    `Prix : ${Number(terrain?.price ?? 0).toLocaleString('fr-FR')} ${terrain?.currency ?? 'FCFA'}`,
    '',
    `Client : ${form.firstName} ${form.lastName}`,
    `Téléphone : ${form.phone}`,
    `Email : ${form.email?.trim() || '—'}`,
    '',
    'Message :',
    form.message?.trim() || '—',
  ].join('\n');
}

export default function ContactAgentScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { terrain } = route.params ?? {};

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    message: MESSAGES[0],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [supportCreated, setSupportCreated] = useState(false);

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
    else if (!/^[0-9+\s]{8,15}$/.test(form.phone.trim())) e.phone = 'Format de téléphone invalide';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!form.message.trim()) e.message = 'Message requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;

    setLoading(true);

    try {
      const leadRes = await contactAgent({
        terrainId: terrain?.id,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        message: form.message.trim(),
      });

      const leadId = leadRes?.data?.data?.id ?? null;

      let supportOk = false;

      try {
        const ticket = await openQuickSupportTicket({
          subject: `Contact agent — ${terrain?.title ?? 'Terrain'}${leadId ? ` — lead ${leadId}` : ''}`,
          description: buildSupportDescription({ terrain, form }),
          category: 'other',
          priority: 'medium',
        });

        supportOk = !!ticket?.id;
      } catch {
        supportOk = false;
      }

      setSupportCreated(supportOk);
      setSent(true);
    } catch (err) {
      Alert.alert(
        'Erreur',
        err?.response?.data?.message || "L'envoi a échoué. Vérifiez votre connexion et réessayez."
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

            <Text style={styles.successTitle}>Demande envoyée</Text>
            <Text style={styles.successSub}>
              Votre demande a bien été transmise. Un agent vous contactera sous 24h sur le numéro {form.phone}.
            </Text>

           

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>Retour à la fiche</Text>
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
            <Text style={styles.headerTitle}>Contacter un agent</Text>
            {terrain?.title ? (
              <Text style={styles.headerSub} numberOfLines={1}>{terrain.title}</Text>
            ) : null}
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
            <View style={styles.terrainBanner}>
              <Text style={styles.terrainBannerName} numberOfLines={1}>{terrain.title ?? 'Terrain'}</Text>
              <Text style={styles.terrainBannerLoc}>{terrain.location}</Text>
              <Text style={styles.terrainBannerPrice}>
                {Number(terrain.price).toLocaleString('fr-FR')} {terrain.currency ?? 'FCFA'}
              </Text>
            </View>
          ) : null}

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Vos coordonnées</Text>

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

            <Text style={styles.formTitleSecondary}>Message</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
              contentContainerStyle={{ gap: 8 }}
            >
              {MESSAGES.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.quickMsg, form.message === m && styles.quickMsgActive]}
                  onPress={() => set('message', m)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.quickMsgText, form.message === m && styles.quickMsgTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input
              placeholder="Votre message…"
              value={form.message}
              onChangeText={(v) => set('message', v)}
              multiline
              numberOfLines={4}
              style={{ minHeight: 110, textAlignVertical: 'top' }}
              error={errors.message}
            />
          </View>
<View style={styles.disclaimer}>
  <Ionicons name="shield-checkmark-outline" size={18} color={BRAND.teal} />
  <Text style={styles.disclaimerText}>
    Votre demande sera pris en compte,vous pouvez le suivre dans votre support
              client. En envoyant ce formulaire, vous acceptez que vos données soient utilisées pour
              traiter votre demande conformément à notre politique de confidentialité.
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
              {loading ? 'Envoi en cours…' : 'Envoyer ma demande'}
            </Text>
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
  terrainBanner: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    marginBottom: 14,
  },
  terrainBannerName: {
    fontSize: 17,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 4,
  },
  terrainBannerLoc: {
    fontSize: 12,
    color: BRAND.textSoft,
    marginBottom: 6,
  },
  terrainBannerPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.teal,
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
  formTitleSecondary: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickMsg: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    maxWidth: 240,
  },
  quickMsgActive: {
    borderColor: BRAND.teal,
    backgroundColor: BRAND.tealSoft,
  },
  quickMsgText: {
    fontSize: 12,
    color: BRAND.textSoft,
    fontWeight: '600',
  },
  quickMsgTextActive: {
    color: BRAND.teal,
    fontWeight: '700',
  },
  disclaimer: {
  backgroundColor: BRAND.tealSoft,
  borderRadius: 18,
  padding: 14,
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 10,
},
  disclaimerText: {
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
    marginBottom: 16,
  },
  successInfoBox: {
    width: '100%',
    backgroundColor: BRAND.tealSoft,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  successInfoText: {
    color: BRAND.teal,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  primaryBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
