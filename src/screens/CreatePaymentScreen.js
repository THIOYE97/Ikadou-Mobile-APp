import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/UI';
import {
  createClientPayment,
  searchTerrainsForPayment,
  getClientPaymentOptions,
} from '../api/payments';
import { requireAuthOrRedirect } from '../lib/requireAuthNavigation';

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
  danger: '#D64545',
  dangerSoft: 'rgba(214,69,69,0.10)',
};

const PAYMENT_REASONS = [
  { value: 'reservation', label: 'Réservation' },
  { value: 'installment', label: 'Échéance' },
  { value: 'balance', label: 'Solde' },
  { value: 'other', label: 'Autre' },
];

function normalizeAmount(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

function formatXof(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function getMethodIcon(code) {
  switch (code) {
    case 'mobile_money':
      return 'phone-portrait-outline';
    case 'bank_transfer':
      return 'business-outline';
    case 'cash':
      return 'cash-outline';
    default:
      return 'card-outline';
  }
}

export default function CreatePaymentScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const initialTerrain = route?.params?.terrain ?? null;
  const terrainIdFromRoute = route?.params?.terrainId ?? initialTerrain?.id ?? null;
  const terrainTitleFromRoute = route?.params?.terrainTitle ?? initialTerrain?.title ?? null;
  const projectId = route?.params?.projectId ?? null;

  const [selectedTerrain, setSelectedTerrain] = useState(
    initialTerrain ||
      (terrainIdFromRoute
        ? {
            id: terrainIdFromRoute,
            title: terrainTitleFromRoute ?? 'Terrain',
          }
        : null)
  );

  const [terrainQuery, setTerrainQuery] = useState(initialTerrain?.title ?? terrainTitleFromRoute ?? '');
  const [terrainResults, setTerrainResults] = useState([]);
  const [searchingTerrain, setSearchingTerrain] = useState(false);

  const [paymentOptions, setPaymentOptions] = useState([]);
  const [recommendedMethod, setRecommendedMethod] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [form, setForm] = useState({
    amount: '',
    reason: 'reservation',
    paymentMethod: '',
    note: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [infoModal, setInfoModal] = useState({
    visible: false,
    title: '',
    message: '',
    tone: 'info',
  });

  const selectedMethod = useMemo(
    () => paymentOptions.find((item) => item.code === form.paymentMethod) ?? null,
    [paymentOptions, form.paymentMethod]
  );

  const reasonLabel = useMemo(
    () => PAYMENT_REASONS.find((r) => r.value === form.reason)?.label ?? '—',
    [form.reason]
  );

  useEffect(() => {
    loadPaymentOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPaymentOptions() {
    try {
      setLoadingOptions(true);

      const res = await getClientPaymentOptions({
        projectId: projectId || undefined,
        terrainId: selectedTerrain?.id || undefined,
      });

      const data = res?.data?.data ?? {};
      const methods = Array.isArray(data?.methods) ? data.methods : [];
      const recommended = data?.recommendedMethod ?? null;

      setPaymentOptions(methods);
      setRecommendedMethod(recommended);

      const fallbackCode = recommended || methods?.[0]?.code || '';
      setForm((prev) => ({
        ...prev,
        paymentMethod: prev.paymentMethod || fallbackCode,
      }));
    } catch (error) {
      const methods = [
        {
          code: 'mobile_money',
          label: 'Mobile Money',
          description: 'Payez rapidement avec votre numéro mobile.',
          instructions: { accounts: [] },
        },
        {
          code: 'bank_transfer',
          label: 'Virement bancaire',
          description: 'Effectuez un virement vers un compte Ikadou.',
          instructions: { accounts: [] },
        },
        {
          code: 'cash',
          label: 'Cash',
          description: 'Payez directement auprès de Ikadou.',
          instructions: { locations: [] },
        },
      ];

      setPaymentOptions(methods);
      setRecommendedMethod('mobile_money');
      setForm((prev) => ({
        ...prev,
        paymentMethod: prev.paymentMethod || 'mobile_money',
      }));
    } finally {
      setLoadingOptions(false);
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

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  async function searchTerrain() {
    if (!terrainQuery.trim()) return;

    setSearchingTerrain(true);
    try {
      const res = await searchTerrainsForPayment({ search: terrainQuery });
      setTerrainResults(res.items || []);
    } catch {
      setTerrainResults([]);
      openInfoModal({
        title: 'Recherche impossible',
        message: 'Impossible de rechercher les terrains pour le moment.',
        tone: 'danger',
      });
    } finally {
      setSearchingTerrain(false);
    }
  }

  function chooseTerrain(item) {
    setSelectedTerrain(item);
    setTerrainQuery(item?.title ?? '');
    setTerrainResults([]);
    if (errors.terrain) {
      setErrors((prev) => ({ ...prev, terrain: '' }));
    }
  }

  function clearTerrain() {
    setSelectedTerrain(null);
    setTerrainQuery('');
    setTerrainResults([]);
  }

  function validate() {
    const next = {};

    if (!selectedTerrain?.id) next.terrain = 'Terrain requis';

    const amountNumber = Number(normalizeAmount(form.amount));
    if (!form.amount?.trim()) next.amount = 'Montant requis';
    else if (!amountNumber || amountNumber <= 0) next.amount = 'Montant invalide';

    if (!form.reason?.trim()) next.reason = 'Motif requis';
    if (!form.paymentMethod?.trim()) next.paymentMethod = 'Mode de paiement requis';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    const allowed = await requireAuthOrRedirect(navigation, {
      title: 'Connexion requise',
      message: 'Connectez-vous pour créer un paiement et suivre sa validation.',
      redirectTo: 'CreatePayment',
      redirectParams: {
        projectId,
        terrainId: selectedTerrain?.id ?? terrainIdFromRoute ?? null,
        terrainTitle: selectedTerrain?.title ?? terrainTitleFromRoute ?? null,
      },
    });

    if (!allowed) return;
    if (!validate()) return;

    const normalizedAmount = Number(normalizeAmount(form.amount));

    setLoading(true);
    try {
      const res = await createClientPayment({
        terrainId: selectedTerrain.id,
        projectId: projectId || undefined,
        amount: normalizedAmount,
        reason: form.reason,
        paymentMethod: form.paymentMethod,
        note: form.note.trim() || undefined,
      });

      const payment = res?.data?.data ?? res?.data ?? null;
      const paymentId = payment?.id;

      if (!paymentId) {
        throw new Error('Paiement introuvable');
      }

      navigation.replace('PaymentReference', {
        paymentId,
        projectId: projectId || undefined,
      });
    } catch (err) {
      if (err?.response?.status === 401) return;

      openInfoModal({
        title: 'Paiement impossible',
        message:
          err?.response?.data?.message ||
          'Impossible de créer le paiement pour le moment.',
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }

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
            <Text style={styles.headerTitle}>Nouveau paiement</Text>
            <Text style={styles.headerSub}>Choisissez votre mode de règlement</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 110, 130) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="card-outline" size={22} color={BRAND.teal} />
            </View>

            <Text style={styles.heroTitle}>Préparez votre paiement</Text>
            <Text style={styles.heroSub}>
              Choisissez le terrain, indiquez le montant, puis sélectionnez le mode de paiement le plus adapté.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Terrain</Text>

            {selectedTerrain ? (
              <View style={styles.selectedTerrainCard}>
                <View style={styles.selectedTerrainHead}>
                  <Ionicons name="checkmark-circle" size={18} color={BRAND.success} />
                  <Text style={styles.selectedTerrainHeadText}>Terrain sélectionné</Text>
                </View>

                <Text style={styles.selectedTerrainTitle}>{selectedTerrain.title}</Text>
                <Text style={styles.selectedTerrainMeta}>
                  {selectedTerrain.location ?? '—'}
                </Text>

                {selectedTerrain.price != null ? (
                  <Text style={styles.selectedTerrainPrice}>
                    {formatXof(selectedTerrain.price)} FCFA
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={clearTerrain}
                  activeOpacity={0.85}
                >
                  <Text style={styles.linkBtnText}>Changer le terrain</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Input
                  label="Rechercher un terrain *"
                  placeholder="Titre, ville, localisation…"
                  value={terrainQuery}
                  onChangeText={setTerrainQuery}
                  error={errors.terrain}
                />

                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={searchTerrain}
                  activeOpacity={0.9}
                >
                  {searchingTerrain ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="search-outline" size={16} color="#fff" />
                      <Text style={styles.searchBtnText}>Rechercher</Text>
                    </>
                  )}
                </TouchableOpacity>

                {terrainResults.length > 0 ? (
                  <View style={styles.resultsCard}>
                    {terrainResults.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.resultItem}
                        onPress={() => chooseTerrain(item)}
                        activeOpacity={0.85}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.resultTitle}>{item.title}</Text>
                          <Text style={styles.resultMeta} numberOfLines={1}>
                            {item.location ?? '—'}
                          </Text>
                        </View>

                        <Ionicons name="chevron-forward" size={18} color={BRAND.textSoft} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Paiement</Text>

            <Input
              label="Montant (FCFA) *"
              placeholder="Ex : 250000"
              value={form.amount}
              onChangeText={(v) => set('amount', v)}
              keyboardType="number-pad"
              error={errors.amount}
            />

            <Text style={styles.fieldLabel}>Motif *</Text>
            <View style={styles.reasonGrid}>
              {PAYMENT_REASONS.map((item) => {
                const active = form.reason === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.reasonChip, active && styles.reasonChipActive]}
                    onPress={() => set('reason', item.value)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.reasonChipText, active && styles.reasonChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.reason ? <Text style={styles.errorText}>{errors.reason}</Text> : null}

            <Input
              label="Note (optionnel)"
              placeholder="Une précision utile pour Ikadou"
              value={form.note}
              onChangeText={(v) => set('note', v)}
              multiline
              numberOfLines={4}
              style={{ minHeight: 96, textAlignVertical: 'top' }}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mode de paiement</Text>

            {loadingOptions ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator color={BRAND.teal} />
                <Text style={styles.loaderText}>Chargement des options…</Text>
              </View>
            ) : (
              <>
                <View style={styles.methodList}>
                  {paymentOptions.map((method) => {
                    const active = form.paymentMethod === method.code;
                    const recommended = recommendedMethod === method.code;

                    return (
                      <TouchableOpacity
                        key={method.code}
                        style={[styles.methodCard, active && styles.methodCardActive]}
                        onPress={() => set('paymentMethod', method.code)}
                        activeOpacity={0.88}
                      >
                        <View style={styles.methodLeft}>
                          <View style={[styles.methodIconWrap, active && styles.methodIconWrapActive]}>
                            <Ionicons
                              name={getMethodIcon(method.code)}
                              size={18}
                              color={active ? BRAND.teal : BRAND.textSoft}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={styles.methodTitleRow}>
                              <Text style={styles.methodTitle}>{method.label}</Text>
                              {recommended ? (
                                <View style={styles.recommendedBadge}>
                                  <Text style={styles.recommendedBadgeText}>Recommandé</Text>
                                </View>
                              ) : null}
                            </View>

                            <Text style={styles.methodDescription}>
                              {method.description || 'Mode de paiement disponible'}
                            </Text>
                          </View>
                        </View>

                        <Ionicons
                          name={active ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={active ? BRAND.teal : BRAND.textSoft}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {errors.paymentMethod ? (
                  <Text style={styles.errorText}>{errors.paymentMethod}</Text>
                ) : null}
              </>
            )}
          </View>

          {selectedMethod ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Instructions</Text>
              <PaymentInstructions method={selectedMethod} />
            </View>
          ) : null}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Résumé</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Terrain</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {selectedTerrain?.title || '—'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Montant</Text>
              <Text style={styles.summaryValue}>
                {form.amount ? `${formatXof(normalizeAmount(form.amount))} FCFA` : '—'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Motif</Text>
              <Text style={styles.summaryValue}>{reasonLabel}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Mode</Text>
              <Text style={styles.summaryValue}>{selectedMethod?.label || '—'}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Créer le paiement</Text>
            )}
          </TouchableOpacity>
        </View>

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

function PaymentInstructions({ method }) {
  const instructions = method?.instructions || {};
  const accounts = Array.isArray(instructions.accounts) ? instructions.accounts : [];
  const locations = Array.isArray(instructions.locations) ? instructions.locations : [];

  if (method.code === 'mobile_money') {
    return (
      <View style={styles.instructionsWrap}>
        {accounts.length > 0 ? (
          accounts.map((item, index) => (
            <View key={`${method.code}-${index}`} style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>{item.provider || 'Mobile Money'}</Text>
              {item.holder_name ? (
                <InstructionRow label="Nom" value={item.holder_name} />
              ) : null}
              {item.phone ? (
                <InstructionRow label="Numéro" value={item.phone} />
              ) : null}
              {item.note ? (
                <Text style={styles.instructionNote}>{item.note}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyInstructionText}>
            Les informations Mobile Money seront disponibles dès configuration côté backoffice.
          </Text>
        )}
      </View>
    );
  }

  if (method.code === 'bank_transfer') {
    return (
      <View style={styles.instructionsWrap}>
        {accounts.length > 0 ? (
          accounts.map((item, index) => (
            <View key={`${method.code}-${index}`} style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>{item.bank_name || 'Compte bancaire'}</Text>
              {item.account_name ? (
                <InstructionRow label="Titulaire" value={item.account_name} />
              ) : null}
              {item.iban ? <InstructionRow label="IBAN" value={item.iban} /> : null}
              {item.swift ? <InstructionRow label="SWIFT" value={item.swift} /> : null}
              {item.account_number ? (
                <InstructionRow label="Compte" value={item.account_number} />
              ) : null}
              {item.note ? (
                <Text style={styles.instructionNote}>{item.note}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyInstructionText}>
            Les coordonnées bancaires seront affichées ici après configuration côté backoffice.
          </Text>
        )}
      </View>
    );
  }

  if (method.code === 'cash') {
    return (
      <View style={styles.instructionsWrap}>
        {locations.length > 0 ? (
          locations.map((item, index) => (
            <View key={`${method.code}-${index}`} style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>{item.label || 'Point de paiement'}</Text>
              {item.address ? (
                <InstructionRow label="Adresse" value={item.address} />
              ) : null}
              {item.hours ? (
                <InstructionRow label="Horaires" value={item.hours} />
              ) : null}
              {item.phone ? (
                <InstructionRow label="Contact" value={item.phone} />
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyInstructionText}>
            Les points de paiement cash seront affichés ici après configuration côté backoffice.
          </Text>
        )}
      </View>
    );
  }

  return (
    <Text style={styles.emptyInstructionText}>
      Les instructions de paiement seront affichées ici.
    </Text>
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
      color: BRAND.danger,
      bg: BRAND.dangerSoft,
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
              tone === 'danger' && { backgroundColor: BRAND.danger },
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

  selectedTerrainCard: {
    backgroundColor: BRAND.tealSoft,
    borderRadius: 18,
    padding: 14,
  },

  selectedTerrainHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },

  selectedTerrainHeadText: {
    color: BRAND.success,
    fontSize: 12,
    fontWeight: '800',
  },

  selectedTerrainTitle: {
    fontSize: 15,
    color: BRAND.text,
    fontWeight: '800',
    marginBottom: 4,
  },

  selectedTerrainMeta: {
    fontSize: 12,
    color: BRAND.textSoft,
    marginBottom: 4,
  },

  selectedTerrainPrice: {
    fontSize: 14,
    color: BRAND.teal,
    fontWeight: '800',
    marginBottom: 8,
  },

  linkBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },

  linkBtnText: {
    color: BRAND.teal,
    fontWeight: '800',
    fontSize: 13,
  },

  searchBtn: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },

  searchBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  resultsCard: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
  },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    backgroundColor: '#fff',
  },

  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 2,
  },

  resultMeta: {
    fontSize: 12,
    color: BRAND.textSoft,
  },

  fieldLabel: {
    fontSize: 12,
    color: BRAND.textSoft,
    fontWeight: '700',
    marginBottom: 8,
  },

  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },

  reasonChip: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  reasonChipActive: {
    backgroundColor: BRAND.tealSoft,
    borderColor: BRAND.teal,
  },

  reasonChipText: {
    fontSize: 13,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  reasonChipTextActive: {
    color: BRAND.teal,
  },

  errorText: {
    marginTop: 6,
    color: BRAND.danger,
    fontSize: 12,
  },

  loaderBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
  },

  loaderText: {
    color: BRAND.textSoft,
    fontSize: 13,
  },

  methodList: {
    gap: 10,
  },

  methodCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.white,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  methodCardActive: {
    borderColor: BRAND.teal,
    backgroundColor: BRAND.tealSoft,
  },

  methodLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },

  methodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  methodIconWrapActive: {
    backgroundColor: '#fff',
  },

  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },

  methodTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
  },

  recommendedBadge: {
    backgroundColor: BRAND.orangeSoft,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  recommendedBadgeText: {
    color: BRAND.orange,
    fontSize: 10,
    fontWeight: '800',
  },

  methodDescription: {
    fontSize: 12,
    color: BRAND.textSoft,
    lineHeight: 17,
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

  summaryCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 14,
  },

  summaryTitle: {
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

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    backgroundColor: BRAND.bg,
  },

  primaryBtn: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
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