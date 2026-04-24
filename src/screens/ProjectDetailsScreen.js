import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FormNotice from '../components/FormNotice';
import { getClientProject } from '../api/clientProjects';
import { getClientPayments } from '../api/payments';
import { getMyVisits } from '../api/leads';

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
  success: '#14A44D',
  successSoft: 'rgba(20,164,77,0.10)',
  danger: '#D64545',
  dangerSoft: 'rgba(214,69,69,0.10)',
};

function normalizeProjectResponse(res) {
  return res?.data?.data ?? res?.data ?? null;
}

function normalizePaymentsResponse(res) {
  const data = res?.data?.data?.items ?? res?.data?.items ?? res?.data?.data ?? res?.data ?? [];
  return Array.isArray(data) ? data : [];
}

function normalizeVisitsResponse(res) {
  const data = res?.data?.data?.items ?? res?.data?.items ?? res?.data?.data ?? res?.data ?? [];
  return Array.isArray(data) ? data : [];
}

function getProjectStatusMeta(status) {
  switch (String(status || '').toLowerCase()) {
    case 'completed':
      return { label: 'Terminé', color: BRAND.success, bg: BRAND.successSoft };
    case 'cancelled':
      return { label: 'Annulé', color: BRAND.danger, bg: BRAND.dangerSoft };
    default:
      return { label: 'En cours', color: BRAND.orange, bg: BRAND.orangeSoft };
  }
}

function getCurrentStepLabel(step) {
  switch (String(step || '').toLowerCase()) {
    case 'simulation':
      return 'Simulation';
    case 'visite':
      return 'Visite';
    case 'achat':
      return 'Paiement';
    default:
      return 'Projet';
  }
}

function getStepMeta(status) {
  switch (String(status || '').toLowerCase()) {
    case 'completed':
      return { label: 'Validée', color: BRAND.success, bg: BRAND.successSoft };
    case 'in_progress':
      return { label: 'En cours', color: BRAND.orange, bg: BRAND.orangeSoft };
    case 'cancelled':
      return { label: 'Annulée', color: BRAND.danger, bg: BRAND.dangerSoft };
    default:
      return { label: 'À démarrer', color: BRAND.textSoft, bg: '#F3F3F3' };
  }
}

function getVisitStatusMeta(status) {
  const s = String(status || '').toLowerCase();

  if (['done', 'completed', 'visited'].includes(s)) {
    return { label: 'Effectuée', color: BRAND.success, bg: BRAND.successSoft };
  }

  if (['cancelled', 'canceled', 'rejected'].includes(s)) {
    return { label: 'Annulée', color: BRAND.danger, bg: BRAND.dangerSoft };
  }

  return { label: 'Planifiée', color: BRAND.orange, bg: BRAND.orangeSoft };
}

function getPaymentStatusMeta(status) {
  const s = String(status || '').toLowerCase();

  if (['confirmed', 'paid', 'approved', 'completed'].includes(s)) {
    return { label: 'Confirmé', color: BRAND.success, bg: BRAND.successSoft };
  }

  if (['failed', 'cancelled', 'canceled', 'refunded', 'rejected'].includes(s)) {
    return { label: 'Annulé/échoué', color: BRAND.danger, bg: BRAND.dangerSoft };
  }

  return { label: 'En attente', color: BRAND.orange, bg: BRAND.orangeSoft };
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatTime(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

function formatMoney(amount, currency = 'FCFA') {
  return `${Number(amount || 0).toLocaleString('fr-FR')} ${currency}`;
}

export default function ProjectDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const projectId = route?.params?.projectId;
  const initialProject = route?.params?.initialProject ?? null;

  const [project, setProject] = useState(initialProject);
  const [payments, setPayments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [notice, setNotice] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

  const showNotice = useCallback((type, title, message) => {
    setNotice({
      visible: true,
      type,
      title,
      message,
    });
  }, []);

  const hideNotice = useCallback(() => {
    setNotice((prev) => {
      if (!prev.visible) return prev;
      return { ...prev, visible: false };
    });
  }, []);

  const loadProjectDetails = useCallback(async () => {
  const projectRes = await getClientProject(projectId);
  const projectData = normalizeProjectResponse(projectRes);

  setProject(projectData);

  const terrainId = projectData?.terrain_id ?? projectData?.terrainId ?? null;

  if (!terrainId) {
    setPayments([]);
    setVisits([]);
    return;
  }

  const [paymentsResponse, visitsResponse] = await Promise.all([
    getClientPayments({ terrainId }).catch(() => null),
    getMyVisits({ terrainId }).catch(() => null),
  ]);

  const allPayments = paymentsResponse ? normalizePaymentsResponse(paymentsResponse) : [];
  const allVisits = visitsResponse ? normalizeVisitsResponse(visitsResponse) : [];

  const filteredPayments = allPayments.filter(
    (item) => String(item?.terrain_id ?? item?.terrainId ?? '') === String(terrainId)
  );

  const filteredVisits = allVisits.filter(
    (item) => String(item?.terrain_id ?? item?.terrainId ?? '') === String(terrainId)
  );

  setPayments(filteredPayments);
  setVisits(filteredVisits);
}, [projectId]);

  useEffect(() => {
    hideNotice();
    loadProjectDetails()
      .catch((error) => {
        showNotice(
          'error',
          'Chargement impossible',
          error?.response?.data?.message || 'Impossible de charger ce projet pour le moment.'
        );
      })
      .finally(() => setLoading(false));
  }, [hideNotice, loadProjectDetails, showNotice]);

  async function onRefresh() {
    setRefreshing(true);
    hideNotice();

    try {
      await loadProjectDetails();
    } catch (error) {
      showNotice(
        'error',
        'Actualisation impossible',
        error?.response?.data?.message || 'Impossible d’actualiser ce projet.'
      );
    } finally {
      setRefreshing(false);
    }
  }

  const projectMeta = useMemo(
    () => getProjectStatusMeta(project?.status),
    [project]
  );

  const steps = useMemo(() => {
    return [
      project?.steps?.simulation,
      project?.steps?.visite,
      project?.steps?.achat,
    ].filter(Boolean);
  }, [project]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator color={BRAND.teal} size="large" />
        <Text style={styles.loadingText}>Chargement du projet…</Text>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <Text style={styles.emptyStateTitle}>Projet introuvable</Text>
        <Text style={styles.emptyStateText}>
          Impossible d’afficher ce projet pour le moment.
        </Text>
        <TouchableOpacity
          style={styles.backBtnPrimary}
          onPress={() => navigation.goBack()}
          activeOpacity={0.9}
        >
          <Text style={styles.backBtnPrimaryText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 24, 32) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.teal} />
        }
      >
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={17} color={BRAND.text} />
          </TouchableOpacity>

          <Text style={styles.topTitle}>Détail du projet</Text>

          <View style={{ width: 40 }} />
        </View>

        <FormNotice
          visible={notice.visible}
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onClose={hideNotice}
        />

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.projectTitle}>{project?.title ?? 'Projet'}</Text>
              <Text style={styles.projectSub}>
                {project?.terrain_title ?? 'Terrain non encore sélectionné'}
              </Text>
            </View>

            <View style={[styles.statusPill, { backgroundColor: projectMeta.bg }]}>
              <Text style={[styles.statusPillText, { color: projectMeta.color }]}>
                {projectMeta.label}
              </Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryBox
              icon="layers-outline"
              label="Étape actuelle"
              value={getCurrentStepLabel(project?.current_step)}
            />
            <SummaryBox
              icon="calendar-outline"
              label="Créé le"
              value={formatDate(project?.created_at)}
            />
            <SummaryBox
              icon="time-outline"
              label="Mis à jour"
              value={formatDate(project?.updated_at || project?.created_at)}
            />
            <SummaryBox
              icon="home-outline"
              label="Terrain"
              value={project?.terrain_title ?? 'À définir'}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            String(project?.status || '').toLowerCase() === 'cancelled' && styles.primaryBtnDisabled,
          ]}
          onPress={() =>
            navigation.navigate('CreatePayment', {
              source: 'project_detail',
              projectId: project.id,
              terrainId: project?.terrain_id ?? null,
              terrainTitle: project?.terrain_title ?? null,
            })
          }
          disabled={String(project?.status || '').toLowerCase() === 'cancelled'}
          activeOpacity={0.9}
        >
          <Ionicons name="card-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Créer un paiement</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Étapes du projet</Text>

        <View style={styles.card}>
          {steps.length > 0 ? (
            steps.map((step, index) => {
              const meta = getStepMeta(step?.status);
              return (
                <View
                  key={step?.key ?? `${index}-${step?.label ?? 'step'}`}
                  style={[styles.stepRow, index < steps.length - 1 && styles.stepRowBorder]}
                >
                  <View style={styles.stepLeft}>
                    <View style={styles.stepIndex}>
                      <Text style={styles.stepIndexText}>{index + 1}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepLabel}>{step?.label ?? 'Étape'}</Text>
                    </View>
                  </View>

                  <View style={[styles.stepStatusPill, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.stepStatusText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptySectionText}>Aucune étape disponible.</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Paiements</Text>

        <View style={styles.card}>
          {payments.length > 0 ? (
            payments.map((payment, index) => {
              const meta = getPaymentStatusMeta(payment?.status);
              return (
                <View
                  key={String(payment?.id ?? `payment-${index}`)}
                  style={[styles.timelineRow, index < payments.length - 1 && styles.timelineRowBorder]}
                >
                  <View style={styles.timelineIconWrap}>
                    <Ionicons name="card-outline" size={16} color={BRAND.teal} />
                  </View>

                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTop}>
                      <Text style={styles.timelineTitle}>
                        {formatMoney(payment?.amount_xof ?? payment?.amount, payment?.currency || 'FCFA')}
                      </Text>

                      <View style={[styles.stepStatusPill, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.stepStatusText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.timelineSub}>
                      Réf. : {payment?.reference_code ?? payment?.ref ?? payment?.id ?? '—'}
                    </Text>

                    <Text style={styles.timelineSub}>
                      {formatDate(payment?.created_at || payment?.paid_at || payment?.date_paiement)}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptySectionText}>
              Aucun paiement enregistré pour ce projet.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Visites</Text>

        <View style={styles.card}>
          {visits.length > 0 ? (
            visits.map((visit, index) => {
              const meta = getVisitStatusMeta(visit?.status);
              return (
                <View
                  key={String(visit?.id ?? `visit-${index}`)}
                  style={[styles.timelineRow, index < visits.length - 1 && styles.timelineRowBorder]}
                >
                  <View style={styles.timelineIconWrap}>
                    <Ionicons name="calendar-outline" size={16} color={BRAND.teal} />
                  </View>

                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTop}>
                      <Text style={styles.timelineTitle}>
                        {formatDate(visit?.visit_date || visit?.created_at)}
                        {formatTime(visit?.visit_time)
                          ? ` à ${formatTime(visit?.visit_time)}`
                          : ''}
                      </Text>

                      <View style={[styles.stepStatusPill, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.stepStatusText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.timelineSub}>
                      {visit?.terrain_title ?? project?.terrain_title ?? 'Terrain'}
                    </Text>

                    {visit?.notes ? (
                      <Text style={styles.timelineSub} numberOfLines={2}>
                        {visit.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptySectionText}>
              Aucune visite enregistrée pour ce projet.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryBox({ icon, label, value }) {
  return (
    <View style={styles.summaryBox}>
      <View style={styles.summaryIconWrap}>
        <Ionicons name={icon} size={16} color={BRAND.teal} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },

  centered: {
    flex: 1,
    backgroundColor: BRAND.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },

  loadingText: {
    color: BRAND.textSoft,
    fontSize: 13,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.text,
    textAlign: 'center',
  },

  emptyStateText: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
    textAlign: 'center',
  },

  backBtnPrimary: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  backBtnPrimaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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

  topTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND.text,
  },

  heroCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 14,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  projectTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 4,
  },

  projectSub: {
    fontSize: 13,
    color: BRAND.textSoft,
  },

  statusPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  summaryBox: {
    width: '47%',
    backgroundColor: '#FCFAF7',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 12,
  },

  summaryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  summaryLabel: {
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '700',
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 13,
    color: BRAND.text,
    fontWeight: '800',
    lineHeight: 18,
  },

  primaryBtn: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },

  primaryBtnDisabled: {
    backgroundColor: '#9DC8C8',
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 2,
  },

  card: {
    backgroundColor: BRAND.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.border,
    overflow: 'hidden',
    marginBottom: 16,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },

  stepLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepIndexText: {
    color: BRAND.teal,
    fontWeight: '800',
    fontSize: 12,
  },

  stepLabel: {
    fontSize: 13,
    color: BRAND.text,
    fontWeight: '700',
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

  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  timelineRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },

  timelineIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  timelineContent: {
    flex: 1,
  },

  timelineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },

  timelineTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
  },

  timelineSub: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.textSoft,
    marginTop: 2,
  },

  emptySectionText: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
  },
});