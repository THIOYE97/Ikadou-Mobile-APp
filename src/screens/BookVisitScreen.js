import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/UI';
import { getVisitSlots, bookVisit } from '../api/leads';

function generateDays() {
  const days = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
const MOCK_SLOTS = ['08:00', '09:30', '11:00', '14:00', '15:30', '17:00'];

const BRAND = {
  bg: '#F3F3F3',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#666666',
  border: '#E7E7E7',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.08)',
  orange: '#F28C28',
  orangeSoft: 'rgba(242,140,40,0.12)',
  success: '#14A44D',
  successSoft: 'rgba(20,164,77,0.10)',
  error: '#D64545',
  errorSoft: 'rgba(214,69,69,0.10)',
};

export default function BookVisitScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { terrain, projectId, source } = route.params ?? {};
  const hasTerrain = Boolean(terrain?.id);
  const days = generateDays();

  const [selectedDay, setSelectedDay] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const [infoModal, setInfoModal] = useState({
    visible: false,
    title: '',
    description: '',
    tone: 'info',
  });

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!selectedDay) return;

    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);

    if (!hasTerrain) {
      setSlots(MOCK_SLOTS);
      setLoadingSlots(false);
      return;
    }

    getVisitSlots({
      terrainId: terrain?.id,
      date: selectedDay.toISOString().split('T')[0],
      projectId: projectId ?? undefined,
    })
      .then((r) => {
        const apiSlots = r?.data?.data?.slots ?? r?.data?.slots;

        if (Array.isArray(apiSlots) && apiSlots.length > 0) {
          const normalized = apiSlots
            .filter((item) => item?.available !== false)
            .map((item) => (typeof item === 'string' ? item : item.time))
            .filter(Boolean);

          setSlots(normalized.length ? normalized : MOCK_SLOTS);
        } else {
          setSlots(MOCK_SLOTS);
        }
      })
      .catch(() => setSlots(MOCK_SLOTS))
      .finally(() => setLoadingSlots(false));
  }, [selectedDay, terrain?.id, projectId, hasTerrain]);

  function openInfoModal({ title, description, tone = 'info' }) {
    setInfoModal({
      visible: true,
      title,
      description,
      tone,
    });
  }

  function closeInfoModal() {
    setInfoModal({
      visible: false,
      title: '',
      description: '',
      tone: 'info',
    });
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validateStep2() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Prénom requis';
    if (!form.lastName.trim()) e.lastName = 'Nom requis';
    if (!form.phone.trim()) e.phone = 'Téléphone requis';
    else if (!/^[0-9+\s]{8,15}$/.test(form.phone.trim())) e.phone = 'Format invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function ensureAuthenticatedOrRedirect() {
    const token = await AsyncStorage.getItem('@ikadou:accessToken');
    if (token) return true;

    setAuthModalVisible(true);
    return false;
  }

  function goToLogin() {
    setAuthModalVisible(false);
    navigation.navigate('Login', {
      redirectTo: 'BookVisit',
      redirectParams: { terrain, projectId, source },
    });
  }

  function goToRegister() {
    setAuthModalVisible(false);
    navigation.navigate('Register', {
      redirectTo: 'BookVisit',
      redirectParams: { terrain, projectId, source },
    });
  }

  function closeAuthModal() {
    setAuthModalVisible(false);
  }

  async function goToStep2() {
    const ok = await ensureAuthenticatedOrRedirect();
    if (!ok) return;

    if (!selectedDay || !selectedSlot) return;
    setStep(2);
  }

  function getSelectedDateLabel() {
    if (!selectedDay) return '—';
    return `${DAYS_FR[selectedDay.getDay()]} ${selectedDay.getDate()} ${MONTHS_FR[selectedDay.getMonth()]}`;
  }

  async function confirm() {
    const ok = await ensureAuthenticatedOrRedirect();
    if (!ok) return;

    if (!validateStep2()) return;

    setLoading(true);

    try {
      await bookVisit({
        projectId: projectId ?? undefined,
        terrainId: terrain?.id ?? undefined,
        date: selectedDay.toISOString().split('T')[0],
        slot: selectedSlot,
        notes: [
          `Réservation depuis mobile par ${form.firstName} ${form.lastName} (${form.phone})`,
          !hasTerrain
            ? "Préférence de visite saisie sans terrain encore sélectionné"
            : null,
          form.email?.trim() ? `Email: ${form.email.trim()}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      });

      setStep(3);
    } catch (err) {
      if (err?.response?.status === 401) {
        const allowed = await ensureAuthenticatedOrRedirect();
        if (!allowed) return;
      } else {
        const apiMessage = err?.response?.data?.message || err?.response?.data?.error;

        if (!hasTerrain) {
          openInfoModal({
            title: 'Terrain requis',
            description:
              apiMessage ||
              "Votre préférence de visite a bien été saisie côté écran, mais l’API demande encore un terrain sélectionné pour confirmer la réservation. Choisissez un terrain dans votre projet, puis réessayez.",
            tone: 'warning',
          });
        } else {
          openInfoModal({
            title: 'Réservation impossible',
            description: apiMessage || 'La réservation a échoué. Réessayez.',
            tone: 'danger',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSuccessDone() {
    if (projectId) {
      navigation.navigate('ProjectTab', {
        screen: 'ProjectHome',
      });
      return;
    }

    navigation.popToTop();
  }

  if (step === 3) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={42} color={BRAND.success} />
            </View>

            <Text style={styles.successTitle}>
              {hasTerrain ? 'Visite confirmée' : 'Préférence de visite enregistrée'}
            </Text>

            <View style={styles.successDetails}>
              <ConfirmRow
                icon="calendar-outline"
                label="Date"
                value={getSelectedDateLabel()}
              />
              <ConfirmRow icon="time-outline" label="Heure" value={selectedSlot} />
              <ConfirmRow
                icon="location-outline"
                label="Terrain"
                value={terrain?.title ?? 'À confirmer avec Ikadou'}
              />
              <ConfirmRow icon="call-outline" label="Contact" value={form.phone} />
            </View>

            <Text style={styles.successNote}>
              {hasTerrain
                ? 'Vous recevrez une confirmation. Un agent vous contactera si nécessaire.'
                : 'Votre demande a bien été enregistrée. Un conseiller Ikadou vous aidera à finaliser la visite avec le terrain le plus adapté à votre projet.'}
            </Text>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleSuccessDone}
              activeOpacity={0.9}
            >
              <Text style={styles.doneBtnText}>Retour au projet</Text>
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
            <Text style={styles.headerTitle}>
              {step === 1 ? 'Choisir une date' : 'Vos coordonnées'}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {terrain?.title
                ? terrain.title
                : projectId
                ? 'Projet en cours · terrain à confirmer'
                : 'Visite à organiser avec Ikadou'}
            </Text>
          </View>

          <Text style={styles.stepIndicator}>{step}/2</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${step * 50}%` }]} />
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
          {step === 1 ? (
            <>
              <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>Planifiez votre visite</Text>
                <Text style={styles.heroSub}>
                  {hasTerrain
                    ? 'Sélectionnez une date et un créneau disponibles pour visiter ce terrain.'
                    : 'Choisissez votre préférence de date et de créneau. Un conseiller Ikadou finalisera ensuite la visite avec vous, même si aucun terrain n’est encore sélectionné.'}
                </Text>
              </View>

              {!hasTerrain ? (
                <View style={styles.projectInfoCard}>
                  <View style={styles.projectInfoHeader}>
                    <Ionicons name="information-circle-outline" size={18} color={BRAND.teal} />
                    <Text style={styles.projectInfoTitle}>Visite sans terrain sélectionné</Text>
                  </View>
                  <Text style={styles.projectInfoText}>
                    Vous pouvez déjà indiquer la date qui vous convient. Le terrain précis pourra
                    être rattaché ensuite à votre projet avec l’équipe Ikadou.
                  </Text>
                </View>
              ) : null}

              <Text style={styles.sectionLabel}>Choisissez une date</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.daysScroll}
                contentContainerStyle={{ gap: 8 }}
              >
                {days.map((d, i) => {
                  const active = selectedDay?.toDateString() === d.toDateString();
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                      onPress={() => setSelectedDay(d)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.dayName, active && styles.dayNameActive]}>
                        {DAYS_FR[d.getDay()]}
                      </Text>
                      <Text style={[styles.dayNum, active && styles.dayNumActive]}>
                        {d.getDate()}
                      </Text>
                      <Text style={[styles.dayMonth, active && styles.dayMonthActive]}>
                        {MONTHS_FR[d.getMonth()]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {selectedDay ? (
                <>
                  <Text style={styles.sectionLabel}>
                    {hasTerrain ? 'Créneaux disponibles' : 'Créneaux souhaités'}
                  </Text>

                  {loadingSlots ? (
                    <View style={styles.loaderBox}>
                      <ActivityIndicator color={BRAND.teal} />
                      <Text style={styles.loaderText}>Chargement des créneaux…</Text>
                    </View>
                  ) : (
                    <View style={styles.slotsGrid}>
                      {slots.length === 0 ? (
                        <Text style={styles.noSlots}>Aucun créneau disponible ce jour.</Text>
                      ) : (
                        slots.map((s) => (
                          <TouchableOpacity
                            key={s}
                            style={[styles.slot, selectedSlot === s && styles.slotActive]}
                            onPress={() => setSelectedSlot(s)}
                            activeOpacity={0.85}
                          >
                            <Text style={[styles.slotText, selectedSlot === s && styles.slotTextActive]}>
                              {s}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.recap}>
                <Text style={styles.recapTitle}>Récapitulatif</Text>
                <ConfirmRow
                  icon="calendar-outline"
                  label="Date"
                  value={getSelectedDateLabel()}
                />
                <ConfirmRow icon="time-outline" label="Heure" value={selectedSlot} />
                <ConfirmRow
                  icon="business-outline"
                  label="Projet"
                  value={projectId ? 'Projet en cours' : 'Visite hors projet'}
                />
                <ConfirmRow
                  icon="location-outline"
                  label="Terrain"
                  value={terrain?.title ?? 'À confirmer avec Ikadou'}
                />

                <View style={styles.visitFeeInfoBox}>
                  <View style={styles.visitFeeInfoHeader}>
                    <Ionicons name="information-circle-outline" size={18} color={BRAND.orange} />
                    <Text style={styles.visitFeeInfoTitle}>Information importante</Text>
                  </View>

                  <Text style={styles.visitFeeInfoText}>
                    Les frais de visite s’élèvent à 10 000 FCFA. Ils couvrent l’organisation de
                    votre déplacement, les frais de terrain, ainsi qu’un accueil avec boisson et
                    collation pendant la visite. Vous bénéficiez donc vous aussi de ces avantages
                    sur place. Ces frais permettent de confirmer le rendez-vous et ne sont pas
                    remboursables après la visite effectuée.
                  </Text>
                </View>
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
                />
              </View>
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
          {step === 1 ? (
            <TouchableOpacity
              style={[styles.ctaBtn, (!selectedDay || !selectedSlot) && styles.ctaBtnDisabled]}
              disabled={!selectedDay || !selectedSlot}
              onPress={goToStep2}
              activeOpacity={0.9}
            >
              <Text style={styles.ctaText}>Continuer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
              onPress={confirm}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.ctaText}>
                  {hasTerrain
                    ? 'Confirmer la visite'
                    : 'Enregistrer ma préférence de visite'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <IkadouInfoModal
          visible={infoModal.visible}
          title={infoModal.title}
          description={infoModal.description}
          tone={infoModal.tone}
          onClose={closeInfoModal}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ConfirmRow({ icon, label, value }) {
  return (
    <View style={styles.confirmRow}>
      <Ionicons name={icon} size={16} color={BRAND.teal} style={styles.confirmIcon} />
      <Text style={styles.confirmLabel}>{label}</Text>
      <Text style={styles.confirmValue}>{value}</Text>
    </View>
  );
}



function IkadouInfoModal({ visible, title, description, tone = 'info', onClose }) {
  const toneMap = {
    info: {
      color: BRAND.teal,
      bg: BRAND.tealSoft,
      icon: 'information-circle-outline',
    },
    warning: {
      color: BRAND.orange,
      bg: BRAND.orangeSoft,
      icon: 'alert-circle-outline',
    },
    danger: {
      color: BRAND.error,
      bg: BRAND.errorSoft,
      icon: 'close-circle-outline',
    },
  };

  const current = toneMap[tone] || toneMap.info;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconWrap, { backgroundColor: current.bg }]}>
            <Ionicons name={current.icon} size={26} color={current.color} />
          </View>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalDescription}>{description}</Text>

          <TouchableOpacity
            style={[
              styles.modalPrimaryBtn,
              tone === 'danger' && { backgroundColor: BRAND.error },
              tone === 'warning' && { backgroundColor: BRAND.orange },
            ]}
            onPress={onClose}
            activeOpacity={0.9}
          >
            <Text style={styles.modalPrimaryBtnText}>Compris</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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

  stepIndicator: {
    fontSize: 14,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  progressBar: {
    height: 4,
    backgroundColor: '#EAEAEA',
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 14,
  },

  progressFill: {
    height: '100%',
    backgroundColor: BRAND.teal,
    borderRadius: 2,
  },

  content: {
    paddingHorizontal: 16,
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

  projectInfoCard: {
    backgroundColor: BRAND.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    marginBottom: 14,
  },

  projectInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  projectInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
  },

  projectInfoText: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },

  daysScroll: {
    marginBottom: 14,
  },

  dayChip: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 62,
  },

  dayChipActive: {
    backgroundColor: BRAND.tealSoft,
    borderColor: BRAND.teal,
  },

  dayName: {
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  dayNameActive: {
    color: BRAND.teal,
  },

  dayNum: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.text,
    marginVertical: 2,
  },

  dayNumActive: {
    color: BRAND.teal,
  },

  dayMonth: {
    fontSize: 11,
    color: BRAND.textSoft,
  },

  dayMonthActive: {
    color: BRAND.teal,
  },

  loaderBox: {
    backgroundColor: BRAND.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  loaderText: {
    color: BRAND.textSoft,
    fontSize: 13,
  },

  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },

  slot: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },

  slotActive: {
    backgroundColor: BRAND.tealSoft,
    borderColor: BRAND.teal,
  },

  slotText: {
    fontSize: 14,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  slotTextActive: {
    color: BRAND.teal,
  },

  noSlots: {
    fontSize: 13,
    color: BRAND.textSoft,
    fontStyle: 'italic',
  },

  recap: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 14,
  },

  recapTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
  },

  confirmIcon: {
    width: 20,
  },

  confirmLabel: {
    fontSize: 13,
    color: BRAND.textSoft,
    flex: 1,
  },

  confirmValue: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.text,
    maxWidth: '50%',
    textAlign: 'right',
  },

  visitFeeInfoBox: {
    marginTop: 12,
    backgroundColor: BRAND.orangeSoft,
    borderRadius: 18,
    padding: 14,
  },

  visitFeeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  visitFeeInfoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND.text,
  },

  visitFeeInfoText: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
  },

  formCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
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

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    backgroundColor: BRAND.bg,
  },

  ctaBtn: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaBtnDisabled: {
    opacity: 0.45,
  },

  ctaText: {
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
    marginBottom: 12,
    textAlign: 'center',
  },

  successDetails: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    marginBottom: 14,
  },

  successNote: {
    fontSize: 12,
    color: BRAND.textSoft,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },

  doneBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  doneBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  authModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,17,17,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  authModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: BRAND.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 22,
  },

  authModalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    alignSelf: 'center',
  },

  authModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.text,
    textAlign: 'center',
    marginBottom: 8,
  },

  authModalText: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
    textAlign: 'center',
    marginBottom: 16,
  },

  authModalInfoBox: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },

  authModalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  authModalInfoText: {
    flex: 1,
    fontSize: 13,
    color: BRAND.text,
    fontWeight: '600',
  },

  authPrimaryBtn: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  authPrimaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  authSecondaryBtn: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  authSecondaryBtnText: {
    color: BRAND.text,
    fontWeight: '700',
    fontSize: 14,
  },

  authGhostBtn: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  authGhostBtnText: {
    color: BRAND.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,17,17,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: BRAND.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 22,
  },

  modalIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.text,
    textAlign: 'center',
    marginBottom: 8,
  },

  modalDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
    textAlign: 'center',
    marginBottom: 18,
  },

  modalPrimaryBtn: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalPrimaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});