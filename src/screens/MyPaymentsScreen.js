import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
};

function statusMeta(status) {
  switch (status) {
    case 'confirmed':
    case 'done':
    case 'completed':
      return { label: 'Confirmé', color: BRAND.success, bg: BRAND.successSoft };
    case 'pending':
      return { label: 'En attente', color: BRAND.orange, bg: BRAND.orangeSoft };
    case 'failed':
      return { label: 'Échoué', color: BRAND.danger, bg: BRAND.dangerSoft };
    case 'refunded':
      return { label: 'Remboursé', color: BRAND.textSoft, bg: '#F1F1F1' };
    default:
      return { label: status || '—', color: BRAND.textSoft, bg: '#F1F1F1' };
  }
}

function proofMeta(status) {
  switch (status) {
    case 'approved':
      return 'Justificatif validé';
    case 'submitted':
      return 'Justificatif soumis';
    case 'under_review':
      return 'Justificatif en revue';
    case 'rejected':
      return 'Justificatif rejeté';
    default:
      return 'Aucun justificatif';
  }
}

function getPaymentMethodLabel(method) {
  switch (method) {
    case 'mobile_money':
      return 'Mobile Money';
    case 'bank_transfer':
      return 'Virement bancaire';
    case 'cash':
      return 'Cash';
    default:
      return 'Paiement';
  }
}

function formatDate(dateValue) {
  if (!dateValue) return '—';
  try {
    return new Date(dateValue).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function MyPaymentsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [doneModal, setDoneModal] = useState({
    visible: false,
    payment: null,
  });

  const [proofPendingModal, setProofPendingModal] = useState({
    visible: false,
    payment: null,
  });

  const [infoModal, setInfoModal] = useState({
    visible: false,
    title: '',
    description: '',
  });

  const load = useCallback(async () => {
    const res = await getClientPayments({ page: 1, limit: 50 });
    const rows = res.data?.data ?? res.data?.items ?? [];
    setItems(Array.isArray(rows) ? rows : []);
  }, []);

  useEffect(() => {
    load()
      .catch(() => {
        setInfoModal({
          visible: true,
          title: 'Chargement impossible',
          description: 'Impossible de charger vos paiements pour le moment.',
        });
      })
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

  function openPayment(payment) {
  const status = String(payment?.status || '').toLowerCase();
  const proofStatus = String(payment?.proof_status || '').toLowerCase();

  const isConfirmed = ['confirmed', 'done', 'completed'].includes(status);

  const hasProofSubmitted = [
    'submitted',
    'under_review',
    'approved',
  ].includes(proofStatus);

  if (isConfirmed) {
    setDoneModal({
      visible: true,
      payment,
    });
    return;
  }

  if (hasProofSubmitted) {
    setProofPendingModal({
      visible: true,
      payment,
    });
    return;
  }

  navigation.navigate('PaymentReference', {
    paymentId: payment.id,
    payment,
  });
}

  function closeProofPendingModal() {
    setProofPendingModal({
      visible: false,
      payment: null,
    });
  }

  function closeDoneModal() {
    setDoneModal({
      visible: false,
      payment: null,
    });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={BRAND.teal} size="large" />
        <Text style={styles.loadingText}>Chargement des paiements…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={BRAND.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mes paiements</Text>
          <Text style={styles.headerSub}>Suivez vos paiements et leur validation</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Math.max(insets.bottom + 20, 28) },
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
          items.length > 0 ? (
            <View style={styles.heroCard}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="wallet-outline" size={22} color={BRAND.teal} />
              </View>

              <Text style={styles.heroTitle}>Historique de vos paiements</Text>
              <Text style={styles.heroSub}>
                Consultez chaque paiement, suivez son statut et vérifiez rapidement si votre justificatif a été validé.
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="card-outline" size={30} color={BRAND.teal} />
            </View>

            <Text style={styles.emptyTitle}>Aucun paiement pour le moment</Text>
            <Text style={styles.emptySub}>
              Pour créer un paiement, ouvrez d’abord un projet puis poursuivez votre parcours depuis ce projet.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const meta = statusMeta(item.status);
          const amount = Number(item.amount_xof ?? item.amountXof ?? item.amount ?? 0);
          const paymentMethod = getPaymentMethodLabel(item.payment_method);
          const createdAt = formatDate(item.created_at);

          return (
            <TouchableOpacity
              style={[
                styles.card,
                index === 0 && styles.firstCard,
              ]}
              onPress={() => openPayment(item)}
              activeOpacity={0.92}
            >
              <View style={styles.cardGlow} />

              <View style={styles.cardTop}>
                <View style={styles.cardIdentity}>
                  <View style={styles.cardIconWrap}>
                    <Ionicons name="card-outline" size={18} color={BRAND.teal} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardRef} numberOfLines={1}>
                      {item.reference_code ?? item.ref ?? 'Paiement'}
                    </Text>
                    <Text style={styles.cardTerrain} numberOfLines={1}>
                      {item.terrain_title ?? item.terrain_ref ?? 'Terrain'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amount}>{amount.toLocaleString('fr-FR')} FCFA</Text>
              </View>

              <View style={styles.metaGrid}>
                <MetaChip
                  icon="wallet-outline"
                  label={paymentMethod}
                />
                <MetaChip
                  icon="document-text-outline"
                  label={proofMeta(item.proof_status)}
                />
                <MetaChip
                  icon="calendar-outline"
                  label={createdAt}
                />
              </View>

              <View style={styles.cardFooter}>
               <Text style={styles.openText}>
  {['confirmed', 'done', 'completed'].includes(String(item?.status || '').toLowerCase())
    ? 'Paiement confirmé'
    : ['submitted', 'under_review', 'approved'].includes(String(item?.proof_status || '').toLowerCase())
    ? 'Justificatif soumis'
    : 'Voir les détails'}
</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <DonePaymentModal
        visible={doneModal.visible}
        payment={doneModal.payment}
        onClose={closeDoneModal}
        onBackToList={closeDoneModal}
      />

      <ProofPendingModal
        visible={proofPendingModal.visible}
        payment={proofPendingModal.payment}
        onClose={closeProofPendingModal}
        onBackToList={closeProofPendingModal}
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

function MetaChip({ icon, label }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={14} color={BRAND.textSoft} />
      <Text style={styles.metaChipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function ProofPendingModal({ visible, payment, onClose, onBackToList }) {
  const amount = Number(payment?.amount_xof ?? payment?.amountXof ?? payment?.amount ?? 0);
  const proofStatus = String(payment?.proof_status || '').toLowerCase();

  const title =
    proofStatus === 'approved'
      ? 'Justificatif validé'
      : proofStatus === 'rejected'
      ? 'Justificatif rejeté'
      : 'Justificatif soumis';

  const text =
    proofStatus === 'approved'
      ? "Votre justificatif a été validé. Le paiement attend maintenant la confirmation finale de l’équipe Ikadou avant d’être considéré comme confirmé."
      : "Votre justificatif a bien été soumis. Vous ne pouvez plus modifier cette soumission pendant que l’équipe Ikadou vérifie votre paiement.";

  const icon =
    proofStatus === 'approved'
      ? 'checkmark-circle-outline'
      : 'time-outline';

  const iconColor =
    proofStatus === 'approved'
      ? BRAND.success
      : BRAND.orange;

  const iconBg =
    proofStatus === 'approved'
      ? BRAND.successSoft
      : BRAND.orangeSoft;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconWrap, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={30} color={iconColor} />
          </View>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{text}</Text>

          <View style={styles.modalInfoBox}>
            <View style={styles.modalInfoRow}>
              <Ionicons name="receipt-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>
                {payment?.reference_code ?? payment?.ref ?? 'Paiement'}
              </Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Ionicons name="cash-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>
                {amount.toLocaleString('fr-FR')} FCFA
              </Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Ionicons name="document-text-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>
                {proofMeta(payment?.proof_status)}
              </Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Ionicons name="hourglass-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>
                Statut paiement : {statusMeta(payment?.status).label}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.modalPrimaryBtn} onPress={onBackToList} activeOpacity={0.9}>
            <Text style={styles.modalPrimaryBtnText}>Retour à mes paiements</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalGhostBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.modalGhostBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function DonePaymentModal({ visible, payment, onClose, onBackToList }) {
  const amount = Number(payment?.amount_xof ?? payment?.amountXof ?? payment?.amount ?? 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconWrap}>
            <Ionicons name="checkmark-circle" size={30} color={BRAND.success} />
          </View>

          <Text style={styles.modalTitle}>Paiement confirmé</Text>
          <Text style={styles.modalText}>
            Ce paiement a bien été validé par l’équipe Ikadou. Voici les informations principales de votre paiement confirmé.
          </Text>

          <View style={styles.modalInfoBox}>
            <View style={styles.modalInfoRow}>
              <Ionicons name="receipt-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>
                {payment?.reference_code ?? payment?.ref ?? 'Paiement'}
              </Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Ionicons name="cash-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>
                {amount.toLocaleString('fr-FR')} FCFA
              </Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Ionicons name="wallet-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>
                {getPaymentMethodLabel(payment?.payment_method)}
              </Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Ionicons name="business-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>
                {payment?.terrain_title ?? payment?.terrain_ref ?? 'Terrain'}
              </Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Ionicons name="document-text-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>
                {proofMeta(payment?.proof_status)}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.modalPrimaryBtn} onPress={onBackToList} activeOpacity={0.9}>
            <Text style={styles.modalPrimaryBtnText}>Retour à mes paiements</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalGhostBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.modalGhostBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function InfoModal({ visible, title, description, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconWrap, { backgroundColor: BRAND.tealSoft }]}>
            <Ionicons name="information-circle-outline" size={28} color={BRAND.teal} />
          </View>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{description}</Text>

          <TouchableOpacity style={styles.modalPrimaryBtn} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.modalPrimaryBtnText}>Compris</Text>
          </TouchableOpacity>
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
    gap: 10,
  },

  loadingText: {
    color: BRAND.textSoft,
    fontSize: 13,
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
    fontWeight: '800',
    color: BRAND.text,
  },

  headerSub: {
    fontSize: 13,
    color: BRAND.textSoft,
    marginTop: 2,
  },

  list: {
    paddingHorizontal: 16,
    gap: 12,
  },

  heroCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    marginBottom: 14,
  },

  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 8,
  },

  heroSub: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
  },

  card: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },

  firstCard: {
    marginTop: 2,
  },

  cardGlow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,140,140,0.04)',
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },

  cardIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardRef: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 3,
  },

  cardTerrain: {
    fontSize: 12,
    color: BRAND.textSoft,
  },

  statusPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  amountRow: {
    marginBottom: 14,
  },

  amount: {
    fontSize: 30,
    fontWeight: '800',
    color: BRAND.teal,
  },

  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  metaChipText: {
    fontSize: 12,
    color: BRAND.textSoft,
    fontWeight: '600',
    maxWidth: 180,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  openText: {
    fontSize: 13,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  emptyCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },

  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0,140,140,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 18,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    alignSelf: 'center',
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.text,
    textAlign: 'center',
    marginBottom: 8,
  },

  modalText: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
    textAlign: 'center',
    marginBottom: 16,
  },

  modalInfoBox: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },

  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  modalInfoText: {
    flex: 1,
    fontSize: 13,
    color: BRAND.text,
    fontWeight: '600',
  },

  modalPrimaryBtn: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  modalPrimaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  modalGhostBtn: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalGhostBtnText: {
    color: BRAND.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
});