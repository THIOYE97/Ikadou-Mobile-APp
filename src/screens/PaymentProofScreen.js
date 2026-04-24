import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../components/UI';
import { submitPaymentProof, getClientPaymentReference } from '../api/payments';

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
  error: '#D64545',
  errorSoft: 'rgba(214,69,69,0.10)',
  success: '#14A44D',
  successSoft: 'rgba(20,164,77,0.10)',
  blueSoft: 'rgba(59,130,246,0.10)',
};

function formatXof(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function getMethodMeta(method) {
  switch (method) {
    case 'mobile_money':
      return {
        label: 'Mobile Money',
        icon: 'phone-portrait-outline',
        color: BRAND.orange,
        bg: BRAND.orangeSoft,
      };
    case 'bank_transfer':
      return {
        label: 'Virement bancaire',
        icon: 'business-outline',
        color: BRAND.teal,
        bg: BRAND.tealSoft,
      };
    case 'cash':
      return {
        label: 'Cash',
        icon: 'cash-outline',
        color: '#2563EB',
        bg: BRAND.blueSoft,
      };
    default:
      return {
        label: 'Paiement',
        icon: 'card-outline',
        color: BRAND.teal,
        bg: BRAND.tealSoft,
      };
  }
}

export default function PaymentProofScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { paymentId, projectId } = route.params ?? {};

  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const [payment, setPayment] = useState(null);

  const [infoModal, setInfoModal] = useState({
    visible: false,
    title: '',
    message: '',
    tone: 'info',
  });

  useEffect(() => {
    loadPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  async function loadPayment() {
    try {
      setLoadingPayment(true);
      const res = await getClientPaymentReference(paymentId);
      const data = res?.data?.data ?? null;
      setPayment(data);
    } catch (e) {
      openInfoModal({
        title: 'Chargement impossible',
        message: "Impossible de récupérer les détails du paiement pour le moment.",
        tone: 'danger',
      });
    } finally {
      setLoadingPayment(false);
    }
  }

  function openInfoModal({ title, message, tone = 'info' }) {
    setInfoModal({
      visible: true,
      title,
      message,
      tone,
    });
  }

  function closeInfoModal() {
    setInfoModal({
      visible: false,
      title: '',
      message: '',
      tone: 'info',
    });
  }

  async function pickImages() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!res.canceled && res.assets?.length) {
      setFiles((prev) => [...prev, ...res.assets].slice(0, 5));
    }
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function closeSuccessModal() {
    setSuccessModalVisible(false);
  }

  function goBackAfterSuccess() {
    setSuccessModalVisible(false);

    if (projectId) {
      navigation.navigate('ProjectTab', {
        screen: 'ProjectHome',
      });
      return;
    }

    navigation.goBack();
  }

  async function submit() {
    if (!files.length) {
      openInfoModal({
        title: 'Preuve requise',
        message: 'Ajoutez au moins une image de preuve de paiement.',
        tone: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      await submitPaymentProof({
        paymentId,
        note,
        files,
      });

      setSuccessModalVisible(true);
    } catch (e) {
      openInfoModal({
        title: 'Envoi impossible',
        message: "Impossible d'envoyer la preuve pour le moment.",
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }

  const methodMeta = useMemo(
    () => getMethodMeta(payment?.payment_method),
    [payment?.payment_method]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={BRAND.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Preuve de paiement</Text>
            <Text style={styles.headerSub}>Ajoutez vos justificatifs</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 120, 140) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loadingPayment ? (
            <View style={styles.loaderCard}>
              <ActivityIndicator color={BRAND.teal} />
              <Text style={styles.loaderText}>Chargement des informations du paiement…</Text>
            </View>
          ) : null}

          {!loadingPayment ? (
            <>
              <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <View style={styles.heroIconWrap}>
                    <Ionicons name="document-attach-outline" size={22} color={BRAND.teal} />
                  </View>

                  <View style={[styles.methodPill, { backgroundColor: methodMeta.bg }]}>
                    <Ionicons name={methodMeta.icon} size={14} color={methodMeta.color} />
                    <Text style={[styles.methodPillText, { color: methodMeta.color }]}>
                      {methodMeta.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.heroTitle}>Finalisez votre paiement</Text>
                <Text style={styles.heroSub}>
                  Ajoutez votre justificatif après avoir effectué le règlement selon les instructions ci-dessous.
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.cardTitle}>Résumé du paiement</Text>

                <SummaryRow
                  label="Référence"
                  value={payment?.reference_code || payment?.ref || '—'}
                />
                <SummaryRow
                  label="Montant"
                  value={
                    payment?.amount != null
                      ? `${formatXof(payment.amount)} ${payment.currency || 'FCFA'}`
                      : '—'
                  }
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
                <Text style={styles.cardTitle}>Instructions de paiement</Text>

                {payment?.client_instruction_note ? (
                  <View style={styles.mainInstructionBox}>
                    <Ionicons name="information-circle-outline" size={18} color={BRAND.teal} />
                    <Text style={styles.mainInstructionText}>
                      {payment.client_instruction_note}
                    </Text>
                  </View>
                ) : null}

                <DynamicPaymentInstructions payment={payment} />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Pièces jointes</Text>

                <TouchableOpacity style={styles.uploadBtn} onPress={pickImages} activeOpacity={0.9}>
                  <Ionicons name="image-outline" size={16} color={BRAND.teal} />
                  <Text style={styles.uploadBtnText}>Ajouter des images</Text>
                </TouchableOpacity>

                {files.length > 0 ? (
                  <View style={styles.filesGrid}>
                    {files.map((file, index) => (
                      <View key={`${file.uri}_${index}`} style={styles.fileBox}>
                        <Image source={{ uri: file.uri }} style={styles.fileImage} />

                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => removeFile(index)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.helperText}>
                    Ajoutez votre reçu, votre bordereau ou la capture du transfert effectué.
                  </Text>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Commentaire</Text>
                <Input
                  placeholder="Ajoutez un commentaire utile pour le traitement…"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={5}
                  style={{ minHeight: 120, textAlignVertical: 'top' }}
                />
              </View>

              <View style={styles.notice}>
                <Ionicons name="shield-checkmark-outline" size={18} color={BRAND.teal} />
                <Text style={styles.noticeText}>
                  Votre preuve sera vérifiée par l’équipe Ikadou. Vous serez notifié dès validation.
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={submit}
            disabled={loading || loadingPayment}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Envoyer ma preuve</Text>
            )}
          </TouchableOpacity>
        </View>

        <ProofSentModal
          visible={successModalVisible}
          onClose={closeSuccessModal}
          onDone={goBackAfterSuccess}
        />

        <IkadouInfoModal
          visible={infoModal.visible}
          title={infoModal.title}
          description={infoModal.message}
          tone={infoModal.tone}
          onClose={closeInfoModal}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DynamicPaymentInstructions({ payment }) {
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
            <Text style={styles.instructionTitle}>{item.provider || 'Mobile Money'}</Text>
            <InstructionRow label="Nom" value={item.holder_name || '—'} />
            <InstructionRow label="Numéro" value={item.phone || '—'} />
            {item.note ? <Text style={styles.instructionNote}>{item.note}</Text> : null}
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
            {item.account_name ? <InstructionRow label="Titulaire" value={item.account_name} /> : null}
            {item.iban ? <InstructionRow label="IBAN" value={item.iban} /> : null}
            {item.swift ? <InstructionRow label="SWIFT" value={item.swift} /> : null}
            {item.account_number ? (
              <InstructionRow label="Compte" value={item.account_number} />
            ) : null}
            {item.note ? <Text style={styles.instructionNote}>{item.note}</Text> : null}
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
            {item.address ? <InstructionRow label="Adresse" value={item.address} /> : null}
            {item.hours ? <InstructionRow label="Horaires" value={item.hours} /> : null}
            {item.phone ? <InstructionRow label="Contact" value={item.phone} /> : null}
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

function SummaryRow({ label, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function InstructionRow({ label, value }) {
  return (
    <View style={styles.instructionRow}>
      <Text style={styles.instructionRowLabel}>{label}</Text>
      <Text style={styles.instructionRowValue}>{value}</Text>
    </View>
  );
}

function ProofSentModal({ visible, onClose, onDone }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconWrap}>
            <Ionicons name="checkmark-circle" size={28} color={BRAND.success} />
          </View>

          <Text style={styles.modalTitle}>Preuve envoyée</Text>
          <Text style={styles.modalText}>
            Votre justificatif a bien été soumis. Il sera traité par l’équipe interne et vous serez notifié dès validation.
          </Text>

          <View style={styles.modalInfoBox}>
            <View style={styles.modalInfoRow}>
              <Ionicons name="document-text-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>Justificatif enregistré</Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>Traitement interne en cours</Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Ionicons name="notifications-outline" size={16} color={BRAND.teal} />
              <Text style={styles.modalInfoText}>Notification après validation</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.modalPrimaryBtn} onPress={onDone} activeOpacity={0.9}>
            <Text style={styles.modalPrimaryBtnText}>Retour aux paiements</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalGhostBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.modalGhostBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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

  loaderCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },

  loaderText: {
    fontSize: 13,
    color: BRAND.textSoft,
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
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
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

  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: BRAND.text,
    fontWeight: '700',
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

  instructionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 8,
  },

  instructionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },

  instructionRowLabel: {
    fontSize: 12,
    color: BRAND.textSoft,
  },

  instructionRowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: BRAND.text,
    fontWeight: '700',
  },

  instructionNote: {
    marginTop: 8,
    fontSize: 12,
    color: BRAND.textSoft,
    lineHeight: 18,
  },

  emptyInstructionText: {
    fontSize: 12,
    color: BRAND.textSoft,
    lineHeight: 18,
  },

  uploadBtn: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  uploadBtnText: {
    color: BRAND.teal,
    fontWeight: '800',
    fontSize: 14,
  },

  helperText: {
    color: BRAND.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },

  filesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  fileBox: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: BRAND.border,
  },

  fileImage: {
    width: '100%',
    height: '100%',
  },

  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
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

  submitBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
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