import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
  dangerSoft: 'rgba(214,69,69,0.08)',
  neutral: '#6F6B64',
  neutralSoft: '#F1EEE8',
  blackSoft: '#1C1A17',
};

const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];

function normalizePaymentsResponse(r) {
  const data = r?.data?.data?.items ?? r?.data?.data ?? r?.data?.items ?? r?.data ?? [];
  return Array.isArray(data) ? data : [];
}

function normalizeStatus(status) {
  const s = String(status || '').toLowerCase();

  if (['confirmed', 'done', 'completed', 'paid', 'success', 'succeeded'].includes(s)) {
    return 'confirmed';
  }

  if (['pending', 'created', 'initiated', 'processing', 'waiting', 'awaiting_confirmation'].includes(s)) {
    return 'pending';
  }

  if (['failed', 'error', 'declined'].includes(s)) {
    return 'failed';
  }

  if (['cancelled', 'canceled', 'void', 'voided'].includes(s)) {
    return 'cancelled';
  }

  if (['refunded', 'refund', 'partially_refunded'].includes(s)) {
    return 'refunded';
  }

  return 'unknown';
}

function normalizeProofStatus(status) {
  const s = String(status || '').toLowerCase();

  if (['approved', 'validated', 'validé', 'valide', 'accepted'].includes(s)) {
    return 'approved';
  }

  if (['submitted', 'sent', 'uploaded', 'pending', 'under_review', 'reviewing'].includes(s)) {
    return s === 'under_review' || s === 'reviewing' ? 'under_review' : 'submitted';
  }

  if (['rejected', 'refused', 'invalid'].includes(s)) {
    return 'rejected';
  }

  return 'none';
}

function getPaymentStatusUi(status) {
  const normalized = normalizeStatus(status);

  if (normalized === 'confirmed') {
    return {
      label: 'Confirmé',
      textColor: BRAND.success,
      bgColor: BRAND.successSoft,
      borderColor: 'rgba(20,164,77,0.20)',
      icon: 'checkmark-circle-outline',
    };
  }

  if (normalized === 'pending') {
    return {
      label: 'En attente',
      textColor: BRAND.orange,
      bgColor: BRAND.orangeSoft,
      borderColor: 'rgba(242,140,40,0.20)',
      icon: 'time-outline',
    };
  }

  if (normalized === 'failed') {
    return {
      label: 'Échoué',
      textColor: BRAND.danger,
      bgColor: BRAND.dangerSoft,
      borderColor: 'rgba(214,69,69,0.20)',
      icon: 'close-circle-outline',
    };
  }

  if (normalized === 'cancelled') {
    return {
      label: 'Annulé',
      textColor: BRAND.danger,
      bgColor: BRAND.dangerSoft,
      borderColor: 'rgba(214,69,69,0.20)',
      icon: 'ban-outline',
    };
  }

  if (normalized === 'refunded') {
    return {
      label: 'Remboursé',
      textColor: BRAND.neutral,
      bgColor: BRAND.neutralSoft,
      borderColor: '#E3DDD3',
      icon: 'return-down-back-outline',
    };
  }

  return {
    label: status || 'Statut inconnu',
    textColor: BRAND.textSoft,
    bgColor: '#F4F1EC',
    borderColor: BRAND.border,
    icon: 'help-circle-outline',
  };
}

function getProofStatusUi(status) {
  const normalized = normalizeProofStatus(status);

  if (normalized === 'approved') {
    return {
      label: 'Justificatif validé',
      shortLabel: 'Validé',
      textColor: BRAND.success,
      bgColor: BRAND.successSoft,
      borderColor: 'rgba(20,164,77,0.20)',
      icon: 'shield-checkmark-outline',
    };
  }

  if (normalized === 'rejected') {
    return {
      label: 'Justificatif rejeté',
      shortLabel: 'Rejeté',
      textColor: BRAND.danger,
      bgColor: BRAND.dangerSoft,
      borderColor: 'rgba(214,69,69,0.20)',
      icon: 'document-attach-outline',
    };
  }

  if (normalized === 'under_review') {
    return {
      label: 'Justificatif en revue',
      shortLabel: 'En revue',
      textColor: BRAND.orange,
      bgColor: BRAND.orangeSoft,
      borderColor: 'rgba(242,140,40,0.20)',
      icon: 'hourglass-outline',
    };
  }

  if (normalized === 'submitted') {
    return {
      label: 'Justificatif soumis',
      shortLabel: 'Soumis',
      textColor: BRAND.orange,
      bgColor: BRAND.orangeSoft,
      borderColor: 'rgba(242,140,40,0.20)',
      icon: 'document-text-outline',
    };
  }

  return {
    label: 'Aucun justificatif',
    shortLabel: 'Aucun',
    textColor: BRAND.textSoft,
    bgColor: '#F4F1EC',
    borderColor: BRAND.border,
    icon: 'document-outline',
  };
}

function getPaymentMethodLabel(method) {
  switch (String(method || '').toLowerCase()) {
    case 'mobile_money':
      return 'Mobile Money';
    case 'bank_transfer':
      return 'Virement bancaire';
    case 'cash':
      return 'Cash';
    case 'card':
    case 'bank_card':
      return 'Carte bancaire';
    default:
      return 'Paiement';
  }
}

function getPaymentAmount(payment) {
  return Number(payment?.amount_xof ?? payment?.amountXof ?? payment?.amount ?? payment?.total_amount ?? 0);
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

function formatDate(dateValue) {
  if (!dateValue) return 'Date indisponible';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return 'Date indisponible';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function getPaymentDate(payment) {
  return payment?.paid_at ?? payment?.confirmed_at ?? payment?.created_at ?? payment?.date ?? payment?.updated_at;
}

function sortPaymentsByDateDesc(a, b) {
  const aDate = new Date(getPaymentDate(a) ?? 0).getTime();
  const bDate = new Date(getPaymentDate(b) ?? 0).getTime();
  return bDate - aDate;
}

function getPaymentTitle(payment) {
  return payment?.reference_code ?? payment?.ref ?? payment?.provider_ref ?? `Paiement ${payment?.id ?? ''}`.trim();
}

function getTerrainTitle(payment) {
  return payment?.terrain_title ?? payment?.terrainTitle ?? payment?.terrain_ref ?? payment?.terrainRef ?? 'Terrain';
}

function getPaymentPopupContent(payment) {
  const status = normalizeStatus(payment?.status);
  const proofStatus = normalizeProofStatus(payment?.proof_status);
  const paymentUi = getPaymentStatusUi(payment?.status);
  const proofUi = getProofStatusUi(payment?.proof_status);

  const common = {
    accent: paymentUi.textColor,
    accentSoft: paymentUi.bgColor,
    icon: paymentUi.icon,
    paymentStatusLabel: paymentUi.label,
    proofStatusLabel: proofUi.label,
    reference: getPaymentTitle(payment),
    terrainTitle: getTerrainTitle(payment),
    amount: formatMoney(getPaymentAmount(payment)),
    method: getPaymentMethodLabel(payment?.payment_method ?? payment?.method_type),
    dateLabel: formatDate(getPaymentDate(payment)),
    ctaLabel: 'Compris',
    action: null,
  };

  if (status === 'confirmed') {
    return {
      ...common,
      icon: 'checkmark-circle-outline',
      accent: BRAND.success,
      accentSoft: BRAND.successSoft,
      title: 'Paiement confirmé',
      description: 'Ce paiement a été validé. Vous pouvez conserver cette référence pour votre suivi.',
    };
  }

  if (status === 'failed') {
    return {
      ...common,
      icon: 'close-circle-outline',
      accent: BRAND.danger,
      accentSoft: BRAND.dangerSoft,
      title: 'Paiement échoué',
      description: 'La tentative de paiement n’a pas abouti. Vous pouvez reprendre le paiement depuis la référence associée.',
      ctaLabel: 'Reprendre le paiement',
      action: 'open_reference',
    };
  }

  if (status === 'cancelled') {
    return {
      ...common,
      icon: 'ban-outline',
      accent: BRAND.danger,
      accentSoft: BRAND.dangerSoft,
      title: 'Paiement annulé',
      description: 'Ce paiement a été annulé. Il reste affiché dans votre historique pour garder une trace du dossier.',
    };
  }

  if (status === 'refunded') {
    return {
      ...common,
      icon: 'return-down-back-outline',
      accent: BRAND.neutral,
      accentSoft: BRAND.neutralSoft,
      title: 'Paiement remboursé',
      description: 'Ce paiement a été remboursé. Le remboursement peut dépendre du canal ou du délai bancaire utilisé.',
    };
  }

  if (proofStatus === 'approved') {
    return {
      ...common,
      icon: 'shield-checkmark-outline',
      accent: BRAND.success,
      accentSoft: BRAND.successSoft,
      title: 'Justificatif validé',
      description: 'Votre justificatif a été accepté. Le paiement peut encore attendre la confirmation finale avant d’être marqué confirmé.',
    };
  }

  if (proofStatus === 'rejected') {
    return {
      ...common,
      icon: 'document-attach-outline',
      accent: BRAND.danger,
      accentSoft: BRAND.dangerSoft,
      title: 'Justificatif rejeté',
      description: 'Le justificatif envoyé n’a pas été accepté. Vous pouvez soumettre une nouvelle preuve plus lisible ou conforme.',
      ctaLabel: 'Soumettre à nouveau',
      action: 'open_reference',
    };
  }

  if (proofStatus === 'under_review') {
    return {
      ...common,
      icon: 'hourglass-outline',
      accent: BRAND.orange,
      accentSoft: BRAND.orangeSoft,
      title: 'Justificatif en revue',
      description: 'Votre justificatif est en cours de vérification par l’équipe Ikadou. Aucune modification n’est nécessaire pour le moment.',
    };
  }

  if (proofStatus === 'submitted') {
    return {
      ...common,
      icon: 'document-text-outline',
      accent: BRAND.orange,
      accentSoft: BRAND.orangeSoft,
      title: 'Justificatif soumis',
      description: 'Votre justificatif a bien été transmis. Il sera vérifié avant la confirmation définitive du paiement.',
    };
  }

  return {
    ...common,
    icon: 'time-outline',
    accent: BRAND.orange,
    accentSoft: BRAND.orangeSoft,
    title: 'Paiement en attente',
    description: 'Ce paiement est toujours en attente. Vous pouvez ouvrir la référence pour finaliser ou consulter les instructions.',
    ctaLabel: 'Voir la référence',
    action: 'open_reference',
  };
}

export default function MyPaymentsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', description: '' });

  const loadPayments = useCallback(async () => {
    const res = await getClientPayments({ page: 1, limit: 50 });
    setPayments(normalizePaymentsResponse(res));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        setLoading(true);

        try {
          const res = await getClientPayments({ page: 1, limit: 50 });

          if (mounted) {
            setPayments(normalizePaymentsResponse(res));
          }
        } catch {
          if (mounted) {
            setPayments([]);
            setInfoModal({
              visible: true,
              title: 'Chargement impossible',
              description: 'Impossible de charger vos paiements pour le moment.',
            });
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      })();

      return () => {
        mounted = false;
      };
    }, [])
  );

  const stats = useMemo(() => {
    return payments.reduce(
      (acc, payment) => {
        const status = normalizeStatus(payment?.status);
        const proofStatus = normalizeProofStatus(payment?.proof_status);
        const amount = getPaymentAmount(payment);

        acc.total += 1;
        acc.amountTotal += amount;

        if (status === 'confirmed') {
          acc.confirmed += 1;
          acc.amountConfirmed += amount;
        } else if (status === 'failed') {
          acc.failed += 1;
        } else if (status === 'cancelled') {
          acc.cancelled += 1;
        } else if (status === 'refunded') {
          acc.refunded += 1;
        } else {
          acc.pending += 1;
        }

        if (['submitted', 'under_review'].includes(proofStatus)) {
          acc.proofPending += 1;
        }

        if (proofStatus === 'rejected' || ['failed', 'cancelled'].includes(status)) {
          acc.notifications += 1;
        }

        return acc;
      },
      {
        total: 0,
        confirmed: 0,
        pending: 0,
        failed: 0,
        cancelled: 0,
        refunded: 0,
        proofPending: 0,
        notifications: 0,
        amountTotal: 0,
        amountConfirmed: 0,
      }
    );
  }, [payments]);

  const progress = useMemo(() => {
    if (!stats.amountTotal) return 0;
    return Math.min(100, Math.round((stats.amountConfirmed / stats.amountTotal) * 100));
  }, [stats.amountConfirmed, stats.amountTotal]);

  const sections = useMemo(() => {
    const pending = payments
      .filter((p) => normalizeStatus(p?.status) === 'pending' || normalizeStatus(p?.status) === 'unknown')
      .sort(sortPaymentsByDateDesc);

    const confirmed = payments
      .filter((p) => normalizeStatus(p?.status) === 'confirmed')
      .sort(sortPaymentsByDateDesc);

    const failed = payments
      .filter((p) => normalizeStatus(p?.status) === 'failed')
      .sort(sortPaymentsByDateDesc);

    const closed = payments
      .filter((p) => ['cancelled', 'refunded'].includes(normalizeStatus(p?.status)))
      .sort(sortPaymentsByDateDesc);

    return [
      { title: 'En attente', data: pending },
      { title: 'Confirmés', data: confirmed },
      { title: 'Échoués', data: failed },
      { title: 'Annulés et remboursés', data: closed },
    ].filter((section) => section.data.length > 0);
  }, [payments]);

  async function onRefresh() {
    setRefreshing(true);

    try {
      await loadPayments();
    } catch {
      setPayments([]);
    } finally {
      setRefreshing(false);
    }
  }

  function openReference(payment) {
    setSelectedPayment(null);

    navigation.navigate('PaymentReference', {
      paymentId: payment?.id,
      payment,
    });
  }

  function openPayment(payment) {
    setSelectedPayment(payment);
  }

  const paymentModal = selectedPayment ? getPaymentPopupContent(selectedPayment) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={18} color={BRAND.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mes paiements</Text>
          <Text style={styles.headerSub}>Suivez vos paiements et justificatifs</Text>
        </View>

        <PaymentNotificationBadge count={stats.notifications} />
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <View style={styles.loaderOrb}>
            <ActivityIndicator color={BRAND.teal} />
          </View>
          <Text style={styles.loaderText}>Chargement des paiements…</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 24, 34) },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.teal} />}
          ListHeaderComponent={
            payments.length > 0 ? (
              <View style={styles.heroCard}>
                <View style={styles.heroTop}>
                  <View style={styles.heroIconWrap}>
                    <Ionicons name="wallet-outline" size={22} color={BRAND.teal} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>Suivi de vos paiements</Text>
                    <Text style={styles.heroSub}>
                      Retrouvez la progression globale, les statuts de paiement et la validation des justificatifs.
                    </Text>
                  </View>
                </View>

                <PaymentProgressCard
                  progress={progress}
                  confirmedAmount={stats.amountConfirmed}
                  totalAmount={stats.amountTotal}
                />

                <View style={styles.statsRow}>
                  <PaymentStat icon="time-outline" label="En attente" value={stats.pending} color={BRAND.orange} bg={BRAND.orangeSoft} />
                  <PaymentStat icon="checkmark-circle-outline" label="Confirmés" value={stats.confirmed} color={BRAND.success} bg={BRAND.successSoft} />
                  <PaymentStat icon="alert-circle-outline" label="À vérifier" value={stats.notifications} color={BRAND.danger} bg={BRAND.dangerSoft} />
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="card-outline" size={30} color={BRAND.teal} />
              </View>

              <Text style={styles.emptyTitle}>Aucun paiement</Text>
              <Text style={styles.emptySub}>
                Vos paiements, remboursements et justificatifs apparaîtront ici dès qu’un dossier sera créé.
              </Text>

              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('DiscoverTab')}
                activeOpacity={0.9}
              >
                <Text style={styles.exploreBtnText}>Explorer les terrains</Text>
              </TouchableOpacity>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              <View style={styles.sectionCount}>
                <Text style={styles.sectionCountText}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <PaymentTimelineCard
              payment={item}
              isLast={index === section.data.length - 1}
              onPress={() => openPayment(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 18 }} />}
        />
      )}

      <PaymentInfoModal
        visible={!!selectedPayment}
        payment={selectedPayment}
        content={paymentModal}
        onClose={() => setSelectedPayment(null)}
        onPrimaryAction={() => {
          if (paymentModal?.action === 'open_reference') {
            openReference(selectedPayment);
            return;
          }

          setSelectedPayment(null);
        }}
      />

      <InfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        description={infoModal.description}
        onClose={() => setInfoModal({ visible: false, title: '', description: '' })}
      />
    </SafeAreaView>
  );
}

function PaymentNotificationBadge({ count }) {
  return (
    <View style={styles.notificationBtn}>
      <Ionicons name="notifications-outline" size={18} color={BRAND.text} />

      {count > 0 ? (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function PaymentProgressCard({ progress, confirmedAmount, totalAmount }) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressTopRow}>
        <View>
          <Text style={styles.progressLabel}>Progression globale</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>

        <View style={styles.progressIconWrap}>
          <Ionicons name="trending-up-outline" size={18} color={BRAND.teal} />
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.progressAmountsRow}>
        <Text style={styles.progressAmountText}>{formatMoney(confirmedAmount)} validés</Text>
        <Text style={styles.progressAmountText}>{formatMoney(totalAmount)} total</Text>
      </View>
    </View>
  );
}

function PaymentStat({ icon, label, value, color, bg }) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PaymentTimelineCard({ payment, isLast, onPress }) {
  const statusUi = getPaymentStatusUi(payment?.status);
  const proofUi = getProofStatusUi(payment?.proof_status);
  const amount = getPaymentAmount(payment);
  const dateLabel = formatDate(getPaymentDate(payment));
  const paymentMethod = getPaymentMethodLabel(payment?.payment_method ?? payment?.method_type);

  return (
    <TouchableOpacity style={styles.timelineRow} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: statusUi.bgColor, borderColor: statusUi.borderColor }]}>
          <Ionicons name={statusUi.icon} size={14} color={statusUi.textColor} />
        </View>

        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>

      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{getPaymentTitle(payment)}</Text>
            <Text style={styles.cardSubTitle} numberOfLines={1}>{getTerrainTitle(payment)}</Text>
          </View>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: statusUi.bgColor,
                borderColor: statusUi.borderColor,
              },
            ]}
          >
            <Ionicons name={statusUi.icon} size={12} color={statusUi.textColor} />
            <Text style={[styles.statusText, { color: statusUi.textColor }]}>{statusUi.label}</Text>
          </View>
        </View>

        <Text style={styles.amountText}>{formatMoney(amount)}</Text>

        <View style={styles.metaGrid}>
          <MetaChip icon="calendar-outline" label={dateLabel} />
          <MetaChip icon="wallet-outline" label={paymentMethod} />
        </View>

        <View style={styles.proofRow}>
          <View
            style={[
              styles.proofPill,
              {
                backgroundColor: proofUi.bgColor,
                borderColor: proofUi.borderColor,
              },
            ]}
          >
            <Ionicons name={proofUi.icon} size={13} color={proofUi.textColor} />
            <Text style={[styles.proofText, { color: proofUi.textColor }]} numberOfLines={1}>
              {proofUi.label}
            </Text>
          </View>

          <View style={styles.cardChevron}>
            <Ionicons name="chevron-forward" size={17} color={BRAND.textSoft} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MetaChip({ icon, label }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={13} color={BRAND.textSoft} />
      <Text style={styles.metaChipText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function PaymentInfoModal({ visible, payment, content, onClose, onPrimaryAction }) {
  if (!content || !payment) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCardCompact}>
          <View style={styles.modalHeaderCompact}>
            <View style={[styles.modalIconWrapCompact, { backgroundColor: content.accentSoft }]}>
              <Ionicons name={content.icon} size={22} color={content.accent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitleCompact}>{content.title}</Text>

              <View style={[styles.modalStatusPillCompact, { backgroundColor: content.accentSoft }]}>
                <Text style={[styles.modalStatusText, { color: content.accent }]}>
                  {content.paymentStatusLabel}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close" size={18} color={BRAND.textSoft} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescriptionCompact}>{content.description}</Text>

          <View style={styles.modalInfoCardCompact}>
            <ModalInfoRow icon="receipt-outline" label="Référence" value={content.reference} />
            <ModalInfoRow icon="cash-outline" label="Montant" value={content.amount} />
            <ModalInfoRow icon="wallet-outline" label="Méthode" value={content.method} />
            <ModalInfoRow icon="home-outline" label="Terrain" value={content.terrainTitle} />
            <ModalInfoRow icon="calendar-outline" label="Date" value={content.dateLabel} />
            <ModalInfoRow icon="document-text-outline" label="Justificatif" value={content.proofStatusLabel} />
          </View>

          <TouchableOpacity style={styles.modalPrimaryBtnCompact} onPress={onPrimaryAction} activeOpacity={0.9}>
            <Text style={styles.modalPrimaryBtnText}>{content.ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ModalInfoRow({ icon, label, value }) {
  return (
    <View style={styles.modalInfoRowCompact}>
      <View style={styles.modalInfoIconCompact}>
        <Ionicons name={icon} size={14} color={BRAND.teal} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.modalInfoLabelCompact}>{label}</Text>
        <Text style={styles.modalInfoValueCompact} numberOfLines={1}>{value || '—'}</Text>
      </View>
    </View>
  );
}

function InfoModal({ visible, title, description, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCardCompact}>
          <View style={styles.modalHeaderCompact}>
            <View style={[styles.modalIconWrapCompact, { backgroundColor: BRAND.tealSoft }]}>
              <Ionicons name="information-circle-outline" size={22} color={BRAND.teal} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitleCompact}>{title}</Text>
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close" size={18} color={BRAND.textSoft} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescriptionCompact}>{description}</Text>

          <TouchableOpacity style={styles.modalPrimaryBtnCompact} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.modalPrimaryBtnText}>Compris</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },

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
    fontWeight: '900',
    color: BRAND.text,
  },

  headerSub: {
    fontSize: 13,
    color: BRAND.textSoft,
    marginTop: 2,
  },

  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BRAND.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: BRAND.bg,
  },

  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },

  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  loaderOrb: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loaderText: {
    fontSize: 13,
    color: BRAND.textSoft,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#111111',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: BRAND.text,
    marginBottom: 4,
  },

  heroSub: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.textSoft,
  },

  progressCard: {
    backgroundColor: '#FCFAF7',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
  },

  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  progressLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: BRAND.textSoft,
    marginBottom: 2,
  },

  progressValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    color: BRAND.text,
  },

  progressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#EFE9DF',
    overflow: 'hidden',
    marginBottom: 9,
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: BRAND.teal,
  },

  progressAmountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  progressAmountText: {
    flex: 1,
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#FCFAF7',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },

  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  statValue: {
    fontSize: 17,
    fontWeight: '900',
    color: BRAND.text,
  },

  statLabel: {
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '700',
    marginTop: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: BRAND.textSoft,
  },

  sectionCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  sectionCountText: {
    color: BRAND.teal,
    fontSize: 12,
    fontWeight: '900',
  },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },

  timelineRail: {
    width: 34,
    alignItems: 'center',
  },

  timelineDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: BRAND.border,
    marginTop: 6,
    marginBottom: -8,
  },

  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    shadowColor: '#111111',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: BRAND.text,
    marginBottom: 2,
  },

  cardSubTitle: {
    fontSize: 12,
    color: BRAND.textSoft,
    fontWeight: '600',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },

  amountText: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
    color: BRAND.teal,
    marginBottom: 10,
  },

  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 10,
  },

  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FCFAF7',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },

  metaChipText: {
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '700',
    maxWidth: 140,
  },

  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  proofPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  proofText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },

  cardChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4F1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },

  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: BRAND.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySub: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
    textAlign: 'center',
    marginBottom: 14,
  },

  exploreBtn: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  exploreBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,17,17,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  modalCardCompact: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  modalHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  modalIconWrapCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalTitleCompact: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    color: BRAND.text,
    marginBottom: 5,
  },

  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4F1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalDescriptionCompact: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.textSoft,
    marginBottom: 12,
  },

  modalStatusPillCompact: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },

  modalStatusText: {
    fontSize: 12,
    fontWeight: '900',
  },

  modalInfoCardCompact: {
    gap: 8,
    marginBottom: 14,
  },

  modalInfoRowCompact: {
    backgroundColor: '#FCFAF7',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  modalInfoIconCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalInfoLabelCompact: {
    fontSize: 10,
    color: BRAND.textSoft,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },

  modalInfoValueCompact: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: BRAND.text,
  },

  modalPrimaryBtnCompact: {
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalPrimaryBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
});