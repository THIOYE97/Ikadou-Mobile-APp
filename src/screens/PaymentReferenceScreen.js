import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getClientPaymentReference } from '../api/payments';

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
  blue: '#2563EB',
  blueSoft: 'rgba(37,99,235,0.10)',
  error: '#D64545',
  errorSoft: 'rgba(214,69,69,0.10)',
};

function formatAmount(value, currency = 'FCFA') {
  return `${Number(value || 0).toLocaleString('fr-FR')} ${currency}`;
}

function getMethodMeta(method) {
  switch (method) {
    case 'mobile_money':
      return {
        label: 'Mobile Money',
        icon: 'phone-portrait-outline',
        color: BRAND.orange,
        bg: BRAND.orangeSoft,
        title: 'Effectuez votre paiement Mobile Money',
        subtitle: 'Utilisez les informations ci-dessous pour payer puis revenez envoyer votre preuve.',
      };
    case 'bank_transfer':
      return {
        label: 'Virement bancaire',
        icon: 'business-outline',
        color: BRAND.teal,
        bg: BRAND.tealSoft,
        title: 'Effectuez votre virement',
        subtitle: 'Utilisez les coordonnées bancaires ci-dessous puis revenez envoyer votre preuve.',
      };
    case 'cash':
      return {
        label: 'Cash',
        icon: 'cash-outline',
        color: BRAND.blue,
        bg: BRAND.blueSoft,
        title: 'Présentez-vous pour régler',
        subtitle: 'Utilisez les informations ci-dessous pour effectuer votre paiement cash.',
      };
    default:
      return {
        label: 'Paiement',
        icon: 'card-outline',
        color: BRAND.teal,
        bg: BRAND.tealSoft,
        title: 'Finalisez votre paiement',
        subtitle: 'Suivez les instructions ci-dessous pour régler votre paiement.',
      };
  }
}

export default function PaymentReferenceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { paymentId, projectId } = route.params ?? {};
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  const [infoModal, setInfoModal] = useState({
    visible: false,
    title: '',
    description: '',
    tone: 'info',
  });

  useEffect(() => {
    getClientPaymentReference(paymentId)
      .then((r) => setPayment(r.data?.data ?? null))
      .catch(() => {
        openInfoModal({
          title: 'Chargement impossible',
          description: 'Impossible de charger les informations du paiement.',
          tone: 'danger',
        });
      })
      .finally(() => setLoading(false));
  }, [paymentId]);

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

  async function copyValue(value, label) {
    if (!value) return;
    await Clipboard.setStringAsync(String(value));

    openInfoModal({
      title: 'Copié',
      description: `${label} a bien été copié.`,
      tone: 'info',
    });
  }

  const methodMeta = useMemo(
    () => getMethodMeta(payment?.payment_method),
    [payment?.payment_method]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={BRAND.teal} size="large" />
        <Text style={styles.loadingText}>Chargement des informations de paiement…</Text>
      </View>
    );
  }

  if (!payment) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Informations de paiement introuvables.</Text>
        </View>

        <IkadouInfoModal
          visible={infoModal.visible}
          title={infoModal.title}
          description={infoModal.description}
          tone={infoModal.tone}
          onClose={closeInfoModal}
        />
      </SafeAreaView>
    );
  }

  const amount = Number(payment.amount_xof ?? payment.amountXof ?? payment.amount ?? 0);
  const reference = payment.reference_code ?? payment.ref ?? '—';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={BRAND.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Paiement</Text>
          <Text style={styles.headerSub}>Suivez les instructions de règlement</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 84, 96) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <Ionicons name={methodMeta.icon} size={22} color={methodMeta.color} />
            </View>

            <View style={[styles.methodPill, { backgroundColor: methodMeta.bg }]}>
              <Ionicons name={methodMeta.icon} size={14} color={methodMeta.color} />
              <Text style={[styles.methodPillText, { color: methodMeta.color }]}>
                {methodMeta.label}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{methodMeta.title}</Text>
          <Text style={styles.heroSub}>{methodMeta.subtitle}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Résumé du paiement</Text>

          <SummaryRow
            label="Référence"
            value={reference}
            copyable
            onCopy={() => copyValue(reference, 'La référence')}
          />

          <SummaryRow
            label="Montant"
            value={formatAmount(amount, payment.currency || 'FCFA')}
          />

          <SummaryRow
            label="Terrain"
            value={payment?.terrain?.title || payment?.terrain_title || '—'}
          />

          <SummaryRow
            label="Mode"
            value={methodMeta.label}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instructions de règlement</Text>

          {payment.client_instruction_note ? (
            <View style={styles.mainInstructionBox}>
              <Ionicons name="information-circle-outline" size={18} color={BRAND.teal} />
              <Text style={styles.mainInstructionText}>
                {payment.client_instruction_note}
              </Text>
            </View>
          ) : null}

          <DynamicReferenceInstructions
            payment={payment}
            onCopy={copyValue}
          />
        </View>

        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={18} color={BRAND.teal} />
          <Text style={styles.noticeText}>
            Une fois le paiement effectué, revenez dans l’application pour envoyer votre preuve.
            L’équipe Ikadou validera ensuite la réception.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 10, 18) }]}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.9}
        >
          <Text style={styles.secondaryBtnText}>Plus tard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            navigation.navigate('PaymentProof', {
              paymentId,
              projectId,
            })
          }
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>J’ai effectué le paiement</Text>
        </TouchableOpacity>
      </View>

      <IkadouInfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        description={infoModal.description}
        tone={infoModal.tone}
        onClose={closeInfoModal}
      />
    </SafeAreaView>
  );
}

function DynamicReferenceInstructions({ payment, onCopy }) {
  const method = payment?.payment_method;
  const instructions = payment?.instructions || {};

  if (method === 'mobile_money') {
    const accounts = Array.isArray(instructions.accounts) ? instructions.accounts : [];

    if (!accounts.length) {
      return (
        <Text style={styles.emptyInstructionText}>
          Les informations Mobile Money seront affichées ici.
        </Text>
      );
    }

    return (
      <View style={styles.instructionsWrap}>
        {accounts.map((item, index) => (
          <View key={`mm-${index}`} style={styles.instructionCard}>
            <View style={styles.instructionTitleRow}>
              <Text style={styles.instructionTitle}>{item.provider || 'Mobile Money'}</Text>
            </View>

            <InstructionField
              label="Nom"
              value={item.holder_name || '—'}
              onCopy={item.holder_name ? () => onCopy(item.holder_name, 'Le nom du titulaire') : null}
            />

            <InstructionField
              label="Numéro"
              value={item.phone || '—'}
              onCopy={item.phone ? () => onCopy(item.phone, 'Le numéro') : null}
            />

            {item.note ? (
              <Text style={styles.instructionNote}>{item.note}</Text>
            ) : null}
          </View>
        ))}
      </View>
    );
  }

  if (method === 'bank_transfer') {
    const accounts = Array.isArray(instructions.accounts) ? instructions.accounts : [];

    if (!accounts.length) {
      return (
        <Text style={styles.emptyInstructionText}>
          Les coordonnées bancaires seront affichées ici.
        </Text>
      );
    }

    return (
      <View style={styles.instructionsWrap}>
        {accounts.map((item, index) => (
          <View key={`bank-${index}`} style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>{item.bank_name || 'Compte bancaire'}</Text>

            {item.account_name ? (
              <InstructionField
                label="Titulaire"
                value={item.account_name}
                onCopy={() => onCopy(item.account_name, 'Le titulaire')}
              />
            ) : null}

            {item.account_number ? (
              <InstructionField
                label="Compte"
                value={item.account_number}
                onCopy={() => onCopy(item.account_number, 'Le numéro de compte')}
              />
            ) : null}

            {item.iban ? (
              <InstructionField
                label="IBAN"
                value={item.iban}
                onCopy={() => onCopy(item.iban, 'L’IBAN')}
              />
            ) : null}

            {item.swift ? (
              <InstructionField
                label="SWIFT"
                value={item.swift}
                onCopy={() => onCopy(item.swift, 'Le code SWIFT')}
              />
            ) : null}

            {item.note ? (
              <Text style={styles.instructionNote}>{item.note}</Text>
            ) : null}
          </View>
        ))}
      </View>
    );
  }

  if (method === 'cash') {
    const locations = Array.isArray(instructions.locations) ? instructions.locations : [];

    if (!locations.length) {
      return (
        <Text style={styles.emptyInstructionText}>
          Les points de paiement cash seront affichés ici.
        </Text>
      );
    }

    return (
      <View style={styles.instructionsWrap}>
        {locations.map((item, index) => (
          <View key={`cash-${index}`} style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>{item.label || 'Point de paiement'}</Text>

            {item.address ? (
              <InstructionField
                label="Adresse"
                value={item.address}
                onCopy={() => onCopy(item.address, 'L’adresse')}
              />
            ) : null}

            {item.hours ? (
              <InstructionField
                label="Horaires"
                value={item.hours}
              />
            ) : null}

            {item.phone ? (
              <InstructionField
                label="Contact"
                value={item.phone}
                onCopy={() => onCopy(item.phone, 'Le contact')}
              />
            ) : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <Text style={styles.emptyInstructionText}>
      Les instructions de paiement seront affichées ici.
    </Text>
  );
}

function SummaryRow({ label, value, copyable = false, onCopy }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>

      <View style={styles.summaryValueWrap}>
        <Text style={styles.summaryValue}>{value}</Text>

        {copyable && onCopy ? (
          <TouchableOpacity style={styles.inlineCopyBtn} onPress={onCopy} activeOpacity={0.85}>
            <Ionicons name="copy-outline" size={14} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function InstructionField({ label, value, onCopy = null }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.copyRow}>
        <Text style={styles.value}>{value}</Text>

        {onCopy ? (
          <TouchableOpacity style={styles.copyBtn} onPress={onCopy} activeOpacity={0.85}>
            <Ionicons name="copy-outline" size={16} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>
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
          <Text style={styles.modalText}>{description}</Text>

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

  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },

  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.tealSoft,
  },

  methodPill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  methodPillText: {
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

  summaryCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 14,
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
    marginBottom: 10,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },

  summaryLabel: {
    fontSize: 13,
    color: BRAND.textSoft,
  },

  summaryValueWrap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },

  summaryValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 13,
    color: BRAND.text,
    fontWeight: '700',
  },

  inlineCopyBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainInstructionBox: {
    backgroundColor: BRAND.tealSoft,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  mainInstructionText: {
    flex: 1,
    fontSize: 12,
    color: BRAND.teal,
    lineHeight: 18,
    fontWeight: '600',
  },

  instructionsWrap: {
    gap: 10,
  },

  instructionCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    padding: 14,
  },

  instructionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  instructionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 8,
  },

  fieldBlock: {
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    color: BRAND.textSoft,
    marginBottom: 4,
  },

  value: {
    flex: 1,
    fontSize: 14,
    color: BRAND.text,
    fontWeight: '600',
  },

  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  instructionNote: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.textSoft,
    marginTop: 4,
  },

  emptyInstructionText: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.textSoft,
  },

  notice: {
    backgroundColor: BRAND.tealSoft,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },

  noticeText: {
    flex: 1,
    fontSize: 12,
    color: BRAND.teal,
    lineHeight: 18,
    fontWeight: '600',
  },

  footer: {
  flexDirection: 'row',
  gap: 10,
  paddingHorizontal: 16,
  paddingTop: 10,
  borderTopWidth: 1,
  borderTopColor: BRAND.border,
  backgroundColor: BRAND.bg,
},

  secondaryBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
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

  primaryBtn: {
    flex: 1.7,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
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
    backgroundColor: BRAND.tealSoft,
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