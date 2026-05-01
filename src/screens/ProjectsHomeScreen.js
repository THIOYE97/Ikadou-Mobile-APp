import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listClientProjects, cancelClientProject } from '../api/clientProjects';
import { getClientPayments } from '../api/payments';


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
  blackSoft: '#1C1A17',
};

function getProjectStatusMeta(status) {
  switch (String(status || '').toLowerCase()) {
    case 'completed':
      return {
        label: 'Terminé',
        color: BRAND.teal,
        bg: BRAND.tealSoft,
        icon: 'ribbon-outline',
      };
    case 'cancelled':
      return {
        label: 'Annulé',
        color: BRAND.danger,
        bg: BRAND.dangerSoft,
        icon: 'close-circle-outline',
      };
    default:
      return {
        label: 'En cours',
        color: BRAND.orange,
        bg: BRAND.orangeSoft,
        icon: 'time-outline',
      };
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

function getStepAccent(step) {
  switch (String(step || '').toLowerCase()) {
    case 'simulation':
      return { icon: 'calculator-outline', color: BRAND.teal, bg: BRAND.tealSoft };
    case 'visite':
      return { icon: 'calendar-outline', color: BRAND.orange, bg: BRAND.orangeSoft };
    case 'achat':
      return { icon: 'card-outline', color: BRAND.success, bg: BRAND.successSoft };
    default:
      return { icon: 'layers-outline', color: BRAND.teal, bg: BRAND.tealSoft };
  }
}
function getValidatedPaidAmount(project, payments = []) {
  const terrainId = project?.terrain_id ?? project?.terrainId ?? null;

  if (!terrainId) return 0;

  return payments
    .filter((p) => {
      const sameTerrain =
        String(p?.terrain_id ?? p?.terrainId ?? '') === String(terrainId);

      const confirmed = ['confirmed', 'paid', 'approved', 'completed'].includes(
        String(p?.status || '').toLowerCase()
      );

      return sameTerrain && confirmed;
    })
    .reduce((sum, p) => {
      return sum + Number(p?.amount_xof ?? p?.amount ?? 0);
    }, 0);
}

function getTerrainTotal(project) {
  return (
    Number(
      project?.terrain_price ??
      project?.price ??
      project?.amount_total ??
      project?.steps?.achat?.terrain_price ??
      project?.steps?.achat?.total_amount ??
      0
    ) || 0
  );
}


function getProjectProgress(project) {
  const steps = Object.values(project?.steps || {});
  const done = steps.filter((s) => s?.status === 'completed').length;
  return `${done}/${steps.length || 3}`;
}

function shouldDisplayProject(project) {
  return project?.steps?.simulation?.status === 'completed';
}

function formatProjectDate(value) {
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

function formatMoney(value, currency = 'FCFA') {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
}


function getPaymentSummary(project) {
  const steps = project?.steps || {};
  const achat = steps?.achat || {};

  const paymentCount =
    Number(
      project?.payments_count ??
        project?.payment_count ??
        project?.paymentsCount ??
        achat?.payments_count ??
        achat?.payment_count ??
        achat?.paymentsCount ??
        0
    ) || 0;

  const hasPaymentStarted =
    achat?.status === 'completed' ||
    achat?.status === 'in_progress' ||
    paymentCount > 0 ||
    !!achat?.payment_id;

  if (!hasPaymentStarted) {
    return {
      label: getCurrentStepLabel(project?.current_step),
      icon: 'layers-outline',
    };
  }

  return {
    label:
      paymentCount > 0
        ? `Paiement commencé · ${paymentCount} paiement${paymentCount > 1 ? 's' : ''}`
        : 'Paiement commencé',
    icon: 'card-outline',
  };
}

function hasProjectPaymentStarted(project) {
  const steps = project?.steps || {};
  const achat = steps?.achat || {};

  const paymentCount =
    Number(
      project?.payments_count ??
        project?.payment_count ??
        project?.paymentsCount ??
        achat?.payments_count ??
        achat?.payment_count ??
        achat?.paymentsCount ??
        0
    ) || 0;

  return (
    achat?.status === 'completed' ||
    achat?.status === 'in_progress' ||
    paymentCount > 0 ||
    !!achat?.payment_id
  );
}

function normalizePaymentsResponse(res) {
  const data =
    res?.data?.data?.items ??
    res?.data?.items ??
    res?.data?.data ??
    res?.data ??
    [];

  return Array.isArray(data) ? data : [];
}

function getProjectTerrainKey(project) {
  return String(
    project?.terrain_id ??
      project?.terrainId ??
      project?.terrain?.id ??
      project?.steps?.achat?.terrain_id ??
      project?.steps?.achat?.terrainId ??
      project?.id
  );
}

function getProjectRank(project) {
  const status = String(project?.status || '').toLowerCase();

  if (status === 'completed') return 50;
  if (status === 'active' || status === 'in_progress') return 40;
  if (status === 'cancelled') return 10;
  return 20;
}

function getProjectTimestamp(project) {
  const raw = project?.updated_at || project?.created_at;
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function dedupeProjectsByTerrain(projects = []) {
  const map = new Map();

  projects.forEach((project) => {
    const key = getProjectTerrainKey(project);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, project);
      return;
    }

    const existingRank = getProjectRank(existing);
    const nextRank = getProjectRank(project);

    if (
      nextRank > existingRank ||
      (nextRank === existingRank && getProjectTimestamp(project) > getProjectTimestamp(existing))
    ) {
      map.set(key, project);
    }
  });

  return Array.from(map.values());
}

export default function ProjectsHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [cancelledInfoModal, setCancelledInfoModal] = useState({
    visible: false,
    project: null,
  });

  const [cancelConfirmModal, setCancelConfirmModal] = useState({
    visible: false,
    project: null,
  });

  const [createGuideModal, setCreateGuideModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

 const load = useCallback(async () => {
  const [projectsRes, paymentsRes] = await Promise.all([
    listClientProjects(),
    getClientPayments().catch(() => null),
  ]);

  const rows = projectsRes?.data?.data ?? [];
  const allPayments = paymentsRes ? normalizePaymentsResponse(paymentsRes) : [];

  setItems(Array.isArray(rows) ? rows : []);
  setPayments(allPayments);
}, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const visibleProjects = useMemo(
  () => dedupeProjectsByTerrain(items.filter((p) => shouldDisplayProject(p))),
  [items]
);

  const activeProjects = useMemo(
    () =>
      visibleProjects.filter(
        (p) => String(p?.status || '').toLowerCase() !== 'cancelled'
      ),
    [visibleProjects]
  );

  const cancelledProjects = useMemo(
    () =>
      visibleProjects.filter(
        (p) => String(p?.status || '').toLowerCase() === 'cancelled'
      ),
    [visibleProjects]
  );

  function openProject(project) {
    navigation.navigate('ProjectDetails', {
      projectId: project.id,
      initialProject: project,
    });
  }

  function handleCancelledProjectPress(project) {
    setCancelledInfoModal({
      visible: true,
      project,
    });
  }

  function requestCancelProject(project) {
    setCancelConfirmModal({
      visible: true,
      project,
    });
  }

  async function confirmCancelProject() {
    const project = cancelConfirmModal.project;
    if (!project?.id || cancelling) return;

    setCancelling(true);

    try {
      await cancelClientProject(project.id, {
        reason: 'Annulé par le client depuis l’application',
      });

      setCancelConfirmModal({
        visible: false,
        project: null,
      });

      await load();
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingOrb}>
          <ActivityIndicator color={BRAND.teal} size="large" />
        </View>
        <Text style={styles.loadingText}>Chargement de vos projets…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FlatList
        data={activeProjects}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Math.max(insets.bottom + 28, 40) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BRAND.teal}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.headerHero}>
              <View style={styles.headerTopRowCentered}>
                <View style={styles.headerTextWrapCentered}>
                  <View style={styles.headerKickerWrapCentered}>
                    <View style={styles.headerKickerDot} />
                    <Text style={styles.headerKicker}>PARCOURS CLIENT</Text>
                  </View>

                  <Text style={styles.pageTitleCentered}>Mes projets</Text>
                  <Text style={styles.pageSubtitleCentered}>
                    Suivez l’avancement de vos terrains, de la simulation jusqu’aux paiements.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.createProjectBtn}
                onPress={() => setCreateGuideModal(true)}
                activeOpacity={0.9}
              >
                <View style={styles.createProjectBtnIconWrap}>
                  <Ionicons name="add-circle-outline" size={18} color={BRAND.teal} />
                </View>
                <Text style={styles.createProjectBtnText}>Comment créer un projet ?</Text>
              </TouchableOpacity>

              <View style={styles.headerStatsRow}>
                <MiniStatCard
                  icon="layers-outline"
                  label="Actifs"
                  value={String(activeProjects.length)}
                />
                <MiniStatCard
                  icon="close-circle-outline"
                  label="Annulés"
                  value={String(cancelledProjects.length)}
                  danger
                />
              </View>
            </View>

            {activeProjects.length > 0 ? (
              <Text style={styles.sectionTitle}>Projets en cours</Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="folder-open-outline" size={30} color={BRAND.teal} />
            </View>

            <Text style={styles.emptyTitle}>Aucun projet pour le moment</Text>
            <Text style={styles.emptySub}>
              Vos projets apparaîtront ici dès que votre parcours terrain commencera.
            </Text>

            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => setCreateGuideModal(true)}
              activeOpacity={0.9}
            >
              <Text style={styles.emptyActionBtnText}>Comment créer un projet ?</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
         <ProjectListCard
  project={item}
  payments={payments}
  index={index}
  onPress={() => openProject(item)}
  onCancel={() => requestCancelProject(item)}
/>
        )}
        ListFooterComponent={
          cancelledProjects.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Projets annulés</Text>
              {cancelledProjects.map((item, index) => (
                <CancelledProjectCard
                  key={item.id}
                  project={item}
                  index={index}
                  onPress={() => handleCancelledProjectPress(item)}
                />
              ))}
            </>
          ) : null
        }
      />

      <CancelProjectConfirmModal
        visible={cancelConfirmModal.visible}
        project={cancelConfirmModal.project}
        loading={cancelling}
        onClose={() =>
          setCancelConfirmModal({
            visible: false,
            project: null,
          })
        }
        onConfirm={confirmCancelProject}
      />

      <CancelledProjectInfoModal
        visible={cancelledInfoModal.visible}
        project={cancelledInfoModal.project}
        onClose={() =>
          setCancelledInfoModal({
            visible: false,
            project: null,
          })
        }
      />

      <CreateProjectGuideModal
        visible={createGuideModal}
        onClose={() => setCreateGuideModal(false)}
        onOpenTerrains={() => {
          setCreateGuideModal(false);
          navigation.navigate('DiscoverTab', {
            screen: 'DiscoverHome',
          });
        }}
      />
    </SafeAreaView>
  );
}

function MiniStatCard({ icon, label, value, danger = false }) {
  return (
    <View style={styles.miniStatCard}>
      <View
        style={[
          styles.miniStatIconWrap,
          danger && { backgroundColor: BRAND.dangerSoft },
        ]}
      >
        <Ionicons
          name={icon}
          size={15}
          color={danger ? BRAND.danger : BRAND.teal}
        />
      </View>

      <View>
        <Text style={styles.miniStatValue}>{value}</Text>
        <Text style={styles.miniStatLabel}>{label}</Text>
      </View>
    </View>
  );
}

function ProjectListCard({ project, payments = [], onPress, onCancel, index }) {
  const projectMeta = getProjectStatusMeta(project?.status);
  const stepMeta = getStepAccent(project?.current_step);
  const paymentSummary = getPaymentSummary(project);
  const paymentStarted = hasProjectPaymentStarted(project);
  const paidAmount = getValidatedPaidAmount(project, payments);
const totalAmount = getTerrainTotal(project);

  return (
    <View
      style={[
        styles.projectCard,
        index === 0 && styles.projectCardFeatured,
      ]}
    >
    
      <View style={styles.projectCardGlow} />

      <TouchableOpacity onPress={onPress} activeOpacity={0.92}>
        <View style={styles.projectCardTop}>
          <View style={styles.projectMainBlock}>
            <View style={[styles.stepAccentWrap, { backgroundColor: stepMeta.bg }]}>
              <Ionicons name={stepMeta.icon} size={18} color={stepMeta.color} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.projectTitle} numberOfLines={1}>
                {project?.title ?? 'Projet'}
              </Text>
              <Text style={styles.projectSub} numberOfLines={1}>
                {project?.terrain_title ?? 'Terrain non encore sélectionné'}
              </Text>
            </View>
          </View>

          <View style={[styles.projectStatusPill, { backgroundColor: projectMeta.bg }]}>
            <Ionicons
              name={projectMeta.icon}
              size={12}
              color={projectMeta.color}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.projectStatusText, { color: projectMeta.color }]}>
              {projectMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <InfoPill
  icon={paymentSummary.icon}
  text={paymentSummary.label}
  success={paymentStarted}
/>

{paymentStarted && paidAmount > 0 ? (
  <PaymentAmountPill
    text={`${formatMoney(paidAmount)} validés / ${formatMoney(totalAmount)}`}
  />
) : null}
          <InfoPill
            icon="stats-chart-outline"
            text={`Progression ${getProjectProgress(project)}`}
          />
          <InfoPill
            icon="time-outline"
            text={formatProjectDate(project?.updated_at || project?.created_at)}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.projectFooter}>
        {paymentStarted ? (
  <View style={styles.lockedProjectBtn}>
    <Ionicons name="lock-closed-outline" size={14} color={BRAND.textSoft} />
    <Text style={styles.lockedProjectBtnText}>Non annulable</Text>
  </View>
) : (
  <TouchableOpacity
    style={styles.cancelProjectBtn}
    onPress={onCancel}
    activeOpacity={0.9}
  >
    <Ionicons name="close-circle-outline" size={14} color={BRAND.danger} />
    <Text style={styles.cancelProjectBtnText}>Annuler</Text>
  </TouchableOpacity>
)}

        <TouchableOpacity
          style={styles.openProjectBtn}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <Text style={styles.openText}>Voir les détails</Text>

          <View style={styles.openArrowWrap}>
            <Ionicons name="chevron-forward" size={16} color={BRAND.teal} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoPill({ icon, text, success = false }) {
  return (
    <View style={[styles.infoPill, success && styles.infoPillSuccess]}>
      <Ionicons
        name={icon}
        size={13}
        color={success ? BRAND.success : BRAND.textSoft}
      />
      
      <Text
        style={[styles.infoPillText, success && styles.infoPillTextSuccess]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

function PaymentAmountPill({ text }) {
  return (
    <View style={styles.paymentAmountPill}>
      <View style={styles.paymentAmountIconWrap}>
        <Ionicons name="cash-outline" size={13} color={BRAND.success} />
      </View>

      <Text style={styles.paymentAmountText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function CancelledProjectCard({ project, onPress, index }) {
  return (
    <TouchableOpacity
      style={[
        styles.cancelledCard,
        index === 0 && styles.cancelledCardFirst,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.cancelledTop}>
        <View style={styles.cancelledIconWrap}>
          <Ionicons name="close-circle-outline" size={18} color={BRAND.danger} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.cancelledTitle} numberOfLines={1}>
            {project?.title ?? 'Projet annulé'}
          </Text>
          <Text style={styles.cancelledSub} numberOfLines={1}>
            {project?.terrain_title ?? 'Terrain non sélectionné'}
          </Text>
        </View>
      </View>

      <Text style={styles.cancelledText}>
        {project?.cancel_reason
          ? `Raison : ${project.cancel_reason}`
          : 'Ce projet a été annulé.'}
      </Text>

      <View style={styles.openRowCancelled}>
        <Text style={styles.openTextCancelled}>Voir le résumé</Text>
        <View style={styles.openArrowWrapCancelled}>
          <Ionicons name="information-circle-outline" size={16} color={BRAND.danger} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CancelProjectConfirmModal({ visible, project, loading, onClose, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconWrap, { backgroundColor: BRAND.dangerSoft }]}>
            <Ionicons name="warning-outline" size={26} color={BRAND.danger} />
          </View>

          <Text style={styles.modalTitle}>Annuler ce projet ?</Text>
          <Text style={styles.modalDescription}>
            Ce projet sera retiré de vos projets actifs et déplacé dans la section des projets annulés.
          </Text>

          <View style={styles.modalInfoBox}>
            <View style={styles.modalMiniRow}>
              <Ionicons name="folder-outline" size={15} color={BRAND.textSoft} />
              <Text style={styles.modalMiniText}>
                {project?.title ?? 'Projet'}
              </Text>
            </View>

            <View style={styles.modalMiniRow}>
              <Ionicons name="home-outline" size={15} color={BRAND.textSoft} />
              <Text style={styles.modalMiniText}>
                {project?.terrain_title ?? 'Terrain non sélectionné'}
              </Text>
            </View>
          </View>

          <View style={styles.modalActionsCol}>
            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { backgroundColor: BRAND.danger }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.modalPrimaryBtnText}>
                {loading ? 'Annulation…' : 'Oui, annuler'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.modalSecondaryBtnText}>Garder le projet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CancelledProjectInfoModal({ visible, project, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconWrap, { backgroundColor: BRAND.dangerSoft }]}>
            <Ionicons name="close-circle-outline" size={26} color={BRAND.danger} />
          </View>

          <Text style={styles.modalTitle}>Projet annulé</Text>
          <Text style={styles.modalDescription}>
            Ce projet ne fait plus partie de votre parcours actif.
          </Text>

          <View style={styles.modalInfoBox}>
            <View style={styles.modalMiniRow}>
              <Ionicons name="folder-outline" size={15} color={BRAND.textSoft} />
              <Text style={styles.modalMiniText}>
                {project?.title ?? 'Projet'}
              </Text>
            </View>

            <View style={styles.modalMiniRow}>
              <Ionicons name="home-outline" size={15} color={BRAND.textSoft} />
              <Text style={styles.modalMiniText}>
                {project?.terrain_title ?? 'Terrain non sélectionné'}
              </Text>
            </View>

            <View style={styles.modalMiniRow}>
              <Ionicons name="time-outline" size={15} color={BRAND.textSoft} />
              <Text style={styles.modalMiniText}>
                Mis à jour : {formatProjectDate(project?.updated_at || project?.created_at)}
              </Text>
            </View>

            {project?.cancel_reason ? (
              <View style={styles.modalMiniRow}>
                <Ionicons name="document-text-outline" size={15} color={BRAND.textSoft} />
                <Text style={styles.modalMiniText}>
                  {project.cancel_reason}
                </Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.modalPrimaryBtn, { backgroundColor: BRAND.danger }]}
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

function CreateProjectGuideModal({ visible, onClose, onOpenTerrains }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconWrap, { backgroundColor: BRAND.tealSoft }]}>
            <Ionicons name="add-circle-outline" size={26} color={BRAND.teal} />
          </View>

          <Text style={styles.modalTitle}>Créer un projet</Text>
          <Text style={styles.modalDescription}>
            Pour démarrer un projet, suivez simplement ces étapes.
          </Text>

          <View style={styles.guideList}>
            <View style={styles.guideRow}>
              <View style={styles.guideIconWrap}>
                <Ionicons name="home-outline" size={16} color={BRAND.teal} />
              </View>
              <Text style={styles.guideText}>Allez dans la liste des terrains.</Text>
            </View>

            <View style={styles.guideRow}>
              <View style={styles.guideIconWrap}>
                <Ionicons name="calculator-outline" size={16} color={BRAND.teal} />
              </View>
              <Text style={styles.guideText}>
                Lancez une simulation de financement si vous voulez commencer en paiement échelonné.
              </Text>
            </View>

            <View style={styles.guideRow}>
              <View style={styles.guideIconWrap}>
                <Ionicons name="calendar-outline" size={16} color={BRAND.teal} />
              </View>
              <Text style={styles.guideText}>Enchaînez avec par programmer une visite du terrain selectionné.</Text>
            </View>

            <View style={styles.guideRow}>
              <View style={styles.guideIconWrap}>
                <Ionicons name="card-outline" size={16} color={BRAND.teal} />
              </View>
              <Text style={styles.guideText}>
                Continuez ensuite avec les paiements jusqu’à finalisation.
              </Text>
            </View>
          </View>

          <View style={styles.modalActionsCol}>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={onOpenTerrains}
              activeOpacity={0.9}
            >
              <Text style={styles.modalPrimaryBtnText}>Voir les terrains</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={onClose}
              activeOpacity={0.9}
            >
              <Text style={styles.modalSecondaryBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },

  centered: {
    flex: 1,
    backgroundColor: BRAND.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingOrb: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: BRAND.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },

  list: {
    paddingHorizontal: 16,
  },

  headerHero: {
    marginTop: 10,
    marginBottom: 18,
  },

  headerStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  miniStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  miniStatIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniStatValue: {
    fontSize: 18,
    color: BRAND.text,
    fontWeight: '800',
    marginBottom: 1,
  },

  miniStatLabel: {
    fontSize: 12,
    color: BRAND.textSoft,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 12,
    marginTop: 2,
  },

  projectCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#111111',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  projectCardFeatured: {
    borderColor: 'rgba(0,140,140,0.18)',
  },

  projectCardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,140,140,0.05)',
  },

  projectCardTop: {
    marginBottom: 14,
  },

  projectMainBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },

  stepAccentWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  projectTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 4,
  },

  projectSub: {
    fontSize: 12,
    color: BRAND.textSoft,
    lineHeight: 18,
  },

  projectStatusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  projectStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  metaGrid: {
    gap: 8,
    marginBottom: 14,
  },

  infoPill: {
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: '#FCFAF7',
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  infoPillText: {
    flex: 1,
    fontSize: 12,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  projectFooter: {
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cancelProjectBtn: {
    minHeight: 36,
    borderRadius: 14,
    backgroundColor: BRAND.dangerSoft,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  cancelProjectBtnText: {
    color: BRAND.danger,
    fontSize: 12,
    fontWeight: '800',
  },

  openProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  openText: {
    color: BRAND.teal,
    fontSize: 13,
    fontWeight: '800',
  },

  openArrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelledCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1D2D2',
    padding: 16,
    marginBottom: 14,
  },

  cancelledCardFirst: {
    marginTop: 2,
  },

  cancelledTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  cancelledIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelledTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 2,
  },

  cancelledSub: {
    fontSize: 12,
    color: BRAND.textSoft,
  },

  cancelledText: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.textSoft,
  },

  openRowCancelled: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1DCDC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  openTextCancelled: {
    color: BRAND.danger,
    fontSize: 13,
    fontWeight: '800',
  },

  openArrowWrapCancelled: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },

  emptyIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySub: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
    textAlign: 'center',
    marginBottom: 16,
  },

  emptyActionBtn: {
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyActionBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
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

  modalInfoBox: {
    backgroundColor: '#FCFAF7',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    marginBottom: 18,
    gap: 10,
  },

  modalMiniRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  modalMiniText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.textSoft,
  },

  guideList: {
    gap: 12,
    marginBottom: 18,
  },

  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  guideIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  guideText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.text,
    fontWeight: '600',
  },

  modalActionsCol: {
    gap: 10,
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

  modalSecondaryBtn: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalSecondaryBtnText: {
    color: BRAND.text,
    fontWeight: '700',
    fontSize: 14,
  },

  headerTopRowCentered: {
    alignItems: 'center',
    marginBottom: 14,
  },

  headerTextWrapCentered: {
    width: '100%',
    alignItems: 'center',
  },

  headerKickerWrapCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },

  headerKickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.orange,
  },

  headerKicker: {
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  pageTitleCentered: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: BRAND.blackSoft,
    marginBottom: 8,
    letterSpacing: -0.6,
    textAlign: 'center',
  },

  pageSubtitleCentered: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
    textAlign: 'center',
    maxWidth: 310,
  },

  createProjectBtn: {
    minHeight: 48,
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.white,
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#111111',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  createProjectBtnIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  createProjectBtnText: {
    color: BRAND.teal,
    fontSize: 13,
    fontWeight: '800',
  },
  infoPillSuccess: {
  backgroundColor: BRAND.successSoft,
  borderColor: 'rgba(20,164,77,0.22)',
},

infoPillTextSuccess: {
  color: BRAND.success,
},

lockedProjectBtn: {
  minHeight: 36,
  borderRadius: 14,
  backgroundColor: '#F1EEE8',
  paddingHorizontal: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
},

lockedProjectBtnText: {
  color: BRAND.textSoft,
  fontSize: 12,
  fontWeight: '800',
},
paymentAmountPill: {
  minHeight: 42,
  borderRadius: 15,
  backgroundColor: 'rgba(20,164,77,0.07)',
  borderWidth: 1,
  borderColor: 'rgba(20,164,77,0.18)',
  paddingHorizontal: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

paymentAmountIconWrap: {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: BRAND.white,
  alignItems: 'center',
  justifyContent: 'center',
},

paymentAmountText: {
  flex: 1,
  color: BRAND.success,
  fontSize: 12,
  fontWeight: '900',
},
});