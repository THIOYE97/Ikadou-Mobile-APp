import React, { useEffect, useMemo, useState } from 'react';
import { requireAuthOrRedirect } from '../lib/requireAuthNavigation';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  createClientProject,
  getClientProject,
  saveProjectSimulation,
  startProjectVisitStep,
} from '../api/clientProjects';

const BRAND = {
  bg: '#F3F3F3',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#666666',
  border: '#E7E7E7',
  teal: '#008C8C',
  tealDark: '#006D6D',
  tealSoft: 'rgba(0,140,140,0.08)',
  orange: '#F28C28',
  orangeSoft: 'rgba(242,140,40,0.10)',
  error: '#D64545',
  success: '#14A44D',
};

const DURATIONS = [
  { label: '5 ans', value: 60 },
  { label: '7 ans', value: 84 },
  { label: '10 ans', value: 120 },
  { label: '15 ans', value: 180 },
  { label: '20 ans', value: 240 },
  { label: '25 ans', value: 300 },
];

const RATES = [
  { label: '3 %', value: 3 },
  { label: '5 %', value: 5 },
];

function calcMonthlyPayment({ price, apport, rate, durationMonths }) {
  const principal = price - apport;

  if (principal <= 0) {
    return {
      payment: 0,
      totalInterests: 0,
      totalCost: 0,
      periods: 0,
      principal: 0,
    };
  }

  const monthlyRate = (rate / 100) / 12;
  const periods = durationMonths;

  const payment =
    monthlyRate === 0
      ? principal / periods
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) /
        (Math.pow(1 + monthlyRate, periods) - 1);

  const totalCost = payment * periods;
  const totalInterests = totalCost - principal;

  return { payment, totalInterests, totalCost, periods, principal };
}

function fmt(n) {
  return Math.round(Number(n || 0)).toLocaleString('fr-FR');
}

function sanitizeNumeric(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

function getStepBadgeMeta(status) {
  switch (status) {
    case 'completed':
      return { label: 'Terminé', color: BRAND.success, bg: 'rgba(20,164,77,0.10)' };
    case 'in_progress':
      return { label: 'En cours', color: BRAND.orange, bg: BRAND.orangeSoft };
    default:
      return { label: 'À venir', color: BRAND.textSoft, bg: '#F3F3F3' };
  }
}

export default function SimulatorScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const initialPrice = route?.params?.initialPrice ?? '';
  const terrainTitleFromRoute = route?.params?.terrainTitle ?? null;
  const terrainIdFromRoute = route?.params?.terrainId ?? null;
  const projectIdFromRoute = route?.params?.projectId ?? null;

  const [price, setPrice] = useState('');
  const [apport, setApport] = useState('');
  const [rate, setRate] = useState(5);
  const [duration, setDuration] = useState(120);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);

  const [project, setProject] = useState(null);
  const [projectReady, setProjectReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [simulatorNotice, setSimulatorNotice] = useState({
  visible: false,
  type: 'error',
  title: '',
  message: '',
});

  useEffect(() => {
    if (initialPrice) {
      setPrice(sanitizeNumeric(initialPrice));
    }
  }, [initialPrice]);

  useEffect(() => {
    ensureProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdFromRoute]);

  async function ensureProject() {
    try {
      setProjectReady(false);

      let res;
      if (projectIdFromRoute) {
        res = await getClientProject(projectIdFromRoute);
      } else {
        res = await createClientProject({
          terrainId: terrainIdFromRoute ?? undefined,
          source: 'simulator_direct',
        });
      }

      const currentProject = res?.data?.data ?? null;
      setProject(currentProject);

      const simulation = currentProject?.steps?.simulation?.data ?? null;

      if (simulation) {
        if (simulation.price != null) setPrice(String(simulation.price));
        if (simulation.apport != null) setApport(String(simulation.apport));
        if (simulation.rate != null) setRate(Number(simulation.rate));
        if (simulation.durationMonths != null) setDuration(Number(simulation.durationMonths));

        const p = Number(simulation.price || 0);
        const a = Number(simulation.apport || 0);

        if (
          simulation.monthlyPayment != null ||
          simulation.totalCost != null ||
          simulation.totalInterests != null
        ) {
          setResult({
            payment: Number(simulation.monthlyPayment || 0),
            totalInterests: Number(simulation.totalInterests || 0),
            totalCost: Number(simulation.totalCost || 0),
            periods: Number(simulation.durationMonths || 0),
            principal: p - a,
            freqLabel: 'Mensuel',
          });
        }
      }
    } catch (error) {
      const friendly = getSimulatorFriendlyError(
  error,
  "Impossible de charger votre simulation pour le moment."
);
showSimulatorError(friendly.title, friendly.message);
    } finally {
      setProjectReady(true);
    }
  }
function showSimulatorError(title, message) {
  setSimulatorNotice({
    visible: true,
    type: 'error',
    title,
    message,
  });
}

function hideSimulatorNotice() {
  setSimulatorNotice((prev) => ({ ...prev, visible: false }));
}

function getSimulatorFriendlyError(error, fallbackMessage) {
  const status = error?.response?.status;
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    '';

  if (
    status === 401 ||
    backendMessage.includes('Missing or invalid authorization header') ||
    backendMessage.includes('Invalid or expired token') ||
    backendMessage.includes('Invalid token payload')
  ) {
    return {
      title: 'Connexion requise',
      message: 'Reconnectez-vous pour enregistrer ou poursuivre votre simulation.',
    };
  }

  if (backendMessage.includes('Aucune simulation active trouvée')) {
    return {
      title: 'Simulation indisponible',
      message: 'Aucune simulation active n’a été trouvée. Relancez une nouvelle simulation pour continuer.',
    };
  }

  return {
    title: 'Impossible de continuer',
    message: fallbackMessage,
  };
}

  async function handleStartNewProject() {
    const allowed = await requireAuthOrRedirect(navigation, {
      title: 'Connexion requise',
      message:
        "Connectez-vous pour enregistrer une nouvelle simulation et suivre vos démarches.",
      redirectTo: 'Simulator',
      redirectParams: {
        terrainId: terrainIdFromRoute ?? null,
        terrainTitle: terrainTitleFromRoute ?? null,
        initialPrice: initialPrice ? sanitizeNumeric(initialPrice) : '',
      },
      replace: true,
      disableBack: true,
    });

    if (!allowed) return;

    try {
      setBusy(true);

      const res = await createClientProject({
        terrainId: terrainIdFromRoute ?? undefined,
        source: 'simulator_restart',
      });

      const nextProject = res?.data?.data ?? null;
      if (!nextProject?.id) {
        showSimulatorError(
  'Création impossible',
  "La nouvelle simulation n'a pas pu être créée pour le moment."
);
        return;
      }

      setProject(nextProject);
      setResult(null);
      setErrors({});
      setApport('');
      setRate(5);
      setDuration(120);
      setPrice(initialPrice ? sanitizeNumeric(initialPrice) : '');

      navigation.setParams?.({
        projectId: nextProject.id,
      });
    } catch (error) {
      if (error?.response?.status === 401) return;

      const friendly = getSimulatorFriendlyError(
  error,
  "Impossible de commencer une nouvelle simulation."
);
showSimulatorError(friendly.title, friendly.message);

      Alert.alert('Erreur', message);
    } finally {
      setBusy(false);
    }
  }

  function validate() {
    const e = {};
    const p = parseFloat(sanitizeNumeric(price));
    const a = parseFloat(sanitizeNumeric(apport) || '0');

    if (!price || Number.isNaN(p) || p < 10000) {
      e.price = 'Montant minimum : 10 000 FCFA';
    } else if (p > 500000000) {
      e.price = 'Montant maximum : 500 000 000 FCFA';
    }

    if (apport && (Number.isNaN(a) || a < 0)) {
      e.apport = 'Apport invalide';
    } else if (!Number.isNaN(a) && !Number.isNaN(p) && a > p) {
      e.apport = "L'apport ne peut pas dépasser le prix";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function compute() {
    if (!project?.id) {
  showSimulatorError(
    'Simulation indisponible',
    'Aucune simulation active n’a été trouvée. Lancez une nouvelle simulation pour continuer.'
  );
  return;
}

    try {
      setBusy(true);

      const localResult = calcMonthlyPayment({
        price: parseFloat(sanitizeNumeric(price)),
        apport: parseFloat(sanitizeNumeric(apport) || '0'),
        rate,
        durationMonths: duration,
      });

      const nextResult = { ...localResult, freqLabel: 'Mensuel' };
      setResult(nextResult);

      const res = await saveProjectSimulation(project.id, {
        price: Number(sanitizeNumeric(price)),
        apport: Number(sanitizeNumeric(apport) || 0),
        rate,
        durationMonths: duration,
        monthlyPayment: nextResult.payment,
        totalCost: nextResult.totalCost,
        totalInterests: nextResult.totalInterests,
      });

      setProject(res?.data?.data ?? project);
    } catch (error) {
      const friendly = getSimulatorFriendlyError(
  error,
  "Impossible d'enregistrer la simulation."
);
showSimulatorError(friendly.title, friendly.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVisitStep() {
    if (!project?.id) {
  showSimulatorError(
    'Simulation indisponible',
    'Vous devez d’abord disposer d’une simulation active avant de poursuivre.'
  );
  return;
}

    const allowed = await requireAuthOrRedirect(navigation, {
      title: 'Connexion requise',
      message:
        "Connectez-vous pour poursuivre après votre simulation et réserver une visite.",
      redirectTo: 'Simulator',
      redirectParams: {
        terrainId: terrainIdFromRoute ?? null,
        terrainTitle: terrainTitleFromRoute ?? null,
        initialPrice: sanitizeNumeric(price || initialPrice || ''),
        projectId: project?.id ?? null,
      },
      replace: true,
      disableBack: true,
    });

    if (!allowed) return;

    try {
      setBusy(true);
      await startProjectVisitStep(project.id);

      navigation.navigate('BookVisit', {
        projectId: project.id,
        terrain:
          project?.terrain_id || project?.terrain_title
            ? {
                id: project?.terrain_id ?? terrainIdFromRoute ?? null,
                title: project?.terrain_title ?? terrainTitleFromRoute ?? 'Terrain',
                location: project?.terrain_location ?? '',
              }
            : undefined,
        source: 'simulator',
      });
    } catch (error) {
      const friendly = getSimulatorFriendlyError(
  error,
  "Impossible d'ouvrir l'étape visite."
);
showSimulatorError(friendly.title, friendly.message);
    } finally {
      setBusy(false);
    }
  }

  function handleLeadStep() {
    if (!project?.id) {
  showSimulatorError(
    'Simulation indisponible',
    'Vous devez d’abord disposer d’une simulation active avant de poursuivre.'
  );
  return;
}

    navigation.navigate('LeadCapture', {
      source: 'simulator',
      projectId: project.id,
      terrainId: project?.terrain_id ?? terrainIdFromRoute ?? null,
      terrainTitle: project?.terrain_title ?? terrainTitleFromRoute ?? null,
    });
  }

  const projectSteps = useMemo(() => {
    if (!project?.steps) {
      return [
        { key: 'simulation', label: 'Simulation', status: 'in_progress' },
        { key: 'visite', label: 'Visite', status: 'pending' },
        { key: 'achat', label: 'Achat', status: 'pending' },
      ];
    }

    return [
      project.steps.simulation,
      project.steps.visite,
      project.steps.achat,
    ];
  }, [project]);

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
            <Text style={styles.headerTitle}>Simulateur terrain</Text>
            <Text style={styles.headerSub}>Estimation indicative uniquement</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 28, 40) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.disclaimerBanner}>
            <View style={styles.disclaimerTopRow}>
              <Ionicons name="information-circle-outline" size={18} color={BRAND.orange} />
              <Text style={styles.disclaimerTitle}>Simulation indicative</Text>
            </View>

            {simulatorNotice.visible ? (
  <View style={styles.simNotice}>
    <View style={styles.simNoticeHeader}>
      <View style={styles.simNoticeIconWrap}>
        <Ionicons name="alert-circle-outline" size={16} color={BRAND.danger} />
      </View>

      <Text style={styles.simNoticeTitle}>{simulatorNotice.title}</Text>

      <TouchableOpacity onPress={hideSimulatorNotice} activeOpacity={0.8}>
        <Ionicons name="close" size={18} color={BRAND.textSoft} />
      </TouchableOpacity>
    </View>

    <Text style={styles.simNoticeText}>{simulatorNotice.message}</Text>
  </View>
) : null}

            <Text style={styles.disclaimerLead}>
              Les montants affichés ici sont fournis à titre purement estimatif.
            </Text>

            <Text style={styles.disclaimerText}>
              Cette simulation ne constitue ni une offre, ni un engagement contractuel, ni une
              validation de financement de la part de Ikadou. Elle sert uniquement à vous donner un
              ordre d’idée avant un échange avec nos équipes.
            </Text>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="calculator-outline" size={22} color={BRAND.teal} />
              </View>

              <TouchableOpacity
                style={styles.newProjectBtn}
                onPress={handleStartNewProject}
                activeOpacity={0.9}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color={BRAND.teal} size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={15} color={BRAND.teal} />
                    <Text style={styles.newProjectBtnText}>Nouvelle simulation</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.heroTitle}>Estimez votre mensualité</Text>
            <Text style={styles.heroSub}>
              Ajustez le prix, votre apport, la durée et le taux pour obtenir une estimation
              mensuelle indicative.
            </Text>

            {(project?.terrain_title || terrainTitleFromRoute) ? (
              <View style={styles.contextPill}>
                <Ionicons name="business-outline" size={14} color={BRAND.teal} />
                <Text style={styles.contextPillText} numberOfLines={1}>
                  {project?.terrain_title ?? terrainTitleFromRoute}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Progression enregistrée</Text>

            {!projectReady ? (
              <View style={styles.projectLoadingRow}>
                <ActivityIndicator color={BRAND.teal} size="small" />
                <Text style={styles.projectLoadingText}>Préparation de votre simulation…</Text>
              </View>
            ) : (
              <View style={styles.projectStepsWrap}>
                {projectSteps.map((step, index) => {
                  const meta = getStepBadgeMeta(step?.status);
                  return (
                    <View key={step?.key ?? index} style={styles.projectStepRow}>
                      <View style={styles.projectStepLeft}>
                        <View style={styles.projectStepIndex}>
                          <Text style={styles.projectStepIndexText}>{index + 1}</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.projectStepTitle}>{step?.label ?? 'Étape'}</Text>
                          <Text style={styles.projectStepSub}>
                            {step?.key === 'simulation'
                              ? 'Estimation enregistrée'
                              : step?.key === 'visite'
                              ? 'Visite à planifier'
                              : 'Suite du parcours'}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.stepStatusPill, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.stepStatusText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Montants</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prix du terrain (FCFA) *</Text>
              <TextInput
                style={[styles.input, errors.price && styles.inputError]}
                placeholder="Ex : 5 000 000"
                placeholderTextColor="#8A8A8A"
                value={price}
                onChangeText={(v) => {
                  setPrice(sanitizeNumeric(v));
                  setErrors((e) => ({ ...e, price: '' }));
                }}
                keyboardType="number-pad"
              />
              {errors.price ? <Text style={styles.errMsg}>{errors.price}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apport personnel (FCFA)</Text>
              <TextInput
                style={[styles.input, errors.apport && styles.inputError]}
                placeholder="Ex : 1 000 000"
                placeholderTextColor="#8A8A8A"
                value={apport}
                onChangeText={(v) => {
                  setApport(sanitizeNumeric(v));
                  setErrors((e) => ({ ...e, apport: '' }));
                }}
                keyboardType="number-pad"
              />
              {errors.apport ? <Text style={styles.errMsg}>{errors.apport}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.sliderHeader}>
                <Text style={styles.inputLabel}>Taux d’intérêt annuel</Text>
                <Text style={styles.sliderValue}>{rate.toFixed(0)} %</Text>
              </View>

              <View style={styles.rateRow}>
                {RATES.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.rateBtn, rate === item.value && styles.rateBtnActive]}
                    onPress={() => setRate(item.value)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.rateBtnText,
                        rate === item.value && styles.rateBtnTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Durée de remboursement</Text>
            <View style={styles.chipGrid}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.chip, duration === d.value && styles.chipActive]}
                  onPress={() => setDuration(d.value)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={duration === d.value ? BRAND.teal : BRAND.textSoft}
                  />
                  <Text style={[styles.chipText, duration === d.value && styles.chipTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fréquence</Text>
            <View style={styles.frequencyFixedBox}>
              <Ionicons name="calendar-outline" size={16} color={BRAND.teal} />
              <Text style={styles.frequencyFixedText}>Mensuelle uniquement</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.computeBtn}
            onPress={compute}
            activeOpacity={0.9}
            disabled={busy || !projectReady}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={16} color="#fff" />
                <Text style={styles.computeText}>Calculer l’estimation</Text>
              </>
            )}
          </TouchableOpacity>

          {result ? (
            <View style={styles.resultsContainer}>
              <View style={styles.resultHighlight}>
                <View style={styles.resultHighlightIconWrap}>
                  <Ionicons name="cash-outline" size={22} color={BRAND.teal} />
                </View>

                <Text style={styles.resultHighlightLabel}>Mensualité estimée</Text>
                <Text style={styles.resultHighlightAmount}>{fmt(result.payment)}</Text>
                <Text style={styles.resultHighlightCurrency}>FCFA · Hors assurance</Text>
              </View>

              <View style={styles.resultCard}>
                <ResultRow
                  icon="wallet-outline"
                  label="Montant à financer"
                  value={`${fmt(result.principal)} FCFA`}
                />
                <ResultRow
                  icon="trending-up-outline"
                  label="Total intérêts"
                  value={`${fmt(result.totalInterests)} FCFA`}
                  accent
                />
                <ResultRow
                  icon="bar-chart-outline"
                  label="Coût total estimé"
                  value={`${fmt(result.totalCost)} FCFA`}
                  bold
                />
                <ResultRow
                  icon="repeat-outline"
                  label="Nombre de mensualités"
                  value={`${result.periods}`}
                />
              </View>

              <View style={styles.disclaimer}>
                <Ionicons name="information-circle-outline" size={16} color={BRAND.orange} />
                <Text style={styles.disclaimerText}>
                  Cette estimation n’engage pas Ikadou. Les conditions réelles peuvent varier selon
                  votre dossier, le terrain concerné et les échanges ultérieurs.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.visitCtaCard}
                onPress={handleVisitStep}
                activeOpacity={0.9}
                disabled={busy}
              >
                <View style={styles.ctaHeader}>
                  <Ionicons name="calendar-outline" size={18} color={BRAND.text} />
                  <Text style={styles.ctaCardTitle}>Poursuivre vers une visite</Text>
                </View>

                <Text style={styles.ctaCardSub}>
                  Si vous souhaitez aller plus loin, vous pouvez planifier une visite avec un
                  conseiller Ikadou.
                </Text>

                <View style={styles.visitCtaBtn}>
                  <Ionicons name="navigate-outline" size={15} color="#fff" />
                  <Text style={styles.ctaCardBtnText}>Réserver une visite</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ctaCard}
                onPress={handleLeadStep}
                activeOpacity={0.9}
              >
                <View style={styles.ctaHeader}>
                  <Ionicons name="call-outline" size={18} color={BRAND.text} />
                  <Text style={styles.ctaCardTitle}>Être accompagné</Text>
                </View>

                <Text style={styles.ctaCardSub}>
                  Laissez vos coordonnées si vous souhaitez être recontacté après cette simulation.
                </Text>

                <View style={styles.ctaCardBtn}>
                  <Ionicons name="chatbubble-ellipses-outline" size={15} color="#fff" />
                  <Text style={styles.ctaCardBtnText}>Être recontacté</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ResultRow({ icon, label, value, accent, bold }) {
  return (
    <View style={styles.resultRow}>
      <View style={styles.resultRowLeft}>
        <Ionicons name={icon} size={15} color={accent ? BRAND.orange : BRAND.textSoft} />
        <Text style={styles.resultRowLabel}>{label}</Text>
      </View>

      <Text
        style={[
          styles.resultRowValue,
          accent && { color: BRAND.orange },
          bold && { color: BRAND.teal, fontWeight: '800' },
        ]}
      >
        {value}
      </Text>
    </View>
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

  content: {
    paddingHorizontal: 16,
  },

  disclaimerBanner: {
    backgroundColor: BRAND.orangeSoft,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(242,140,40,0.14)',
  },

  disclaimerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
  },

  disclaimerLead: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.text,
    fontWeight: '700',
    marginBottom: 6,
  },

  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.textSoft,
    flex: 1,
  },

  heroCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    marginBottom: 14,
  },

  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },

  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  newProjectBtn: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: BRAND.tealSoft,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  newProjectBtnText: {
    color: BRAND.teal,
    fontSize: 12,
    fontWeight: '800',
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

  contextPill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: BRAND.tealSoft,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  contextPillText: {
    color: BRAND.teal,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 240,
  },

  card: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  projectLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  projectLoadingText: {
    fontSize: 13,
    color: BRAND.textSoft,
  },

  projectStepsWrap: {
    gap: 10,
  },

  projectStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  projectStepLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  projectStepIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  projectStepIndexText: {
    color: BRAND.teal,
    fontWeight: '800',
    fontSize: 12,
  },

  projectStepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 2,
  },

  projectStepSub: {
    fontSize: 12,
    color: BRAND.textSoft,
  },

  stepStatusPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  stepStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  inputGroup: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.textSoft,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: BRAND.text,
    fontSize: 15,
  },

  inputError: {
    borderColor: BRAND.error,
  },

  errMsg: {
    color: BRAND.error,
    fontSize: 12,
    marginTop: 4,
  },

  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  sliderValue: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.teal,
  },

  rateRow: {
    flexDirection: 'row',
    gap: 10,
  },

  rateBtn: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND.border,
  },

  rateBtnActive: {
    backgroundColor: BRAND.tealSoft,
    borderColor: BRAND.teal,
  },

  rateBtnText: {
    fontSize: 14,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  rateBtnTextActive: {
    color: BRAND.teal,
    fontWeight: '800',
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  chipActive: {
    backgroundColor: BRAND.tealSoft,
    borderColor: BRAND.teal,
  },

  chipText: {
    fontSize: 13,
    color: BRAND.textSoft,
    fontWeight: '600',
  },

  chipTextActive: {
    color: BRAND.teal,
    fontWeight: '800',
  },

  frequencyFixedBox: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(0,140,140,0.15)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  frequencyFixedText: {
    color: BRAND.teal,
    fontSize: 14,
    fontWeight: '800',
  },

  computeBtn: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    gap: 8,
  },

  computeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  resultsContainer: {
    marginBottom: 12,
  },

  resultHighlight: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },

  resultHighlightIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  resultHighlightLabel: {
    fontSize: 12,
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    fontWeight: '700',
  },

  resultHighlightAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: BRAND.teal,
    lineHeight: 40,
  },

  resultHighlightCurrency: {
    fontSize: 13,
    color: BRAND.textSoft,
    marginTop: 4,
  },

  resultCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 14,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    gap: 10,
  },

  resultRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },

  resultRowLabel: {
    fontSize: 13,
    color: BRAND.textSoft,
    flex: 1,
  },

  resultRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.text,
    textAlign: 'right',
  },

  disclaimer: {
    backgroundColor: BRAND.orangeSoft,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  visitCtaCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    marginBottom: 14,
  },

  ctaCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
  },

  ctaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },

  ctaCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND.text,
  },

  ctaCardSub: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
    marginBottom: 14,
  },

  visitCtaBtn: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  ctaCardBtn: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: BRAND.orange,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  ctaCardBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  simNotice: {
  backgroundColor: BRAND.dangerSoft,
  borderRadius: 18,
  padding: 14,
  marginBottom: 14,
  borderWidth: 1,
  borderColor: 'rgba(214,69,69,0.14)',
},

simNoticeHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  marginBottom: 8,
},

simNoticeIconWrap: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: '#fff',
  alignItems: 'center',
  justifyContent: 'center',
},

simNoticeTitle: {
  flex: 1,
  fontSize: 14,
  fontWeight: '800',
  color: BRAND.text,
},

simNoticeText: {
  fontSize: 12,
  lineHeight: 18,
  color: BRAND.textSoft,
},
});