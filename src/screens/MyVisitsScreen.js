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
  dangerSoft: 'rgba(214,69,69,0.08)',
};

const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function normalizeVisitsResponse(r) {
  const data = r?.data?.data?.items ?? r?.data?.items ?? r?.data?.data ?? r?.data ?? [];
  return Array.isArray(data) ? data : [];
}

function classifyVisitStatus(status) {
  const s = String(status || '').toLowerCase();

  if (['confirmed', 'scheduled', 'pending', 'requested', 'rescheduled', 'planned'].includes(s)) {
    return 'upcoming';
  }

  if (['completed', 'done', 'realized', 'realised', 'visited'].includes(s)) {
    return 'completed';
  }

  if (['cancelled', 'canceled', 'rejected', 'no_show'].includes(s)) {
    return 'cancelled';
  }

  return 'upcoming';
}

function getVisitStatusUi(status) {
  const normalized = classifyVisitStatus(status);

  if (normalized === 'completed') {
    return {
      label: 'Réalisée',
      textColor: BRAND.success,
      bgColor: BRAND.successSoft,
      borderColor: 'rgba(20,164,77,0.20)',
      icon: 'checkmark-circle-outline',
    };
  }

  if (normalized === 'cancelled') {
    return {
      label: 'Annulée',
      textColor: BRAND.danger,
      bgColor: BRAND.dangerSoft,
      borderColor: 'rgba(214,69,69,0.20)',
      icon: 'close-circle-outline',
    };
  }

  return {
    label: 'À venir',
    textColor: BRAND.orange,
    bgColor: BRAND.orangeSoft,
    borderColor: 'rgba(242,140,40,0.20)',
    icon: 'time-outline',
  };
}

function formatVisitDate(dateValue) {
  if (!dateValue) return 'Date indisponible';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return 'Date indisponible';
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

function formatVisitFullDate(dateValue) {
  if (!dateValue) return 'Date indisponible';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return 'Date indisponible';
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function sortVisitsByDateDesc(a, b) {
  const aDate = new Date(a?.visit_date ?? a?.date ?? 0).getTime();
  const bDate = new Date(b?.visit_date ?? b?.date ?? 0).getTime();
  return bDate - aDate;
}

function getVisitPopupContent(visit) {
  const normalized = classifyVisitStatus(visit?.status);
  const terrainTitle = visit?.terrainTitle ?? visit?.terrain_title ?? 'Terrain';
  const location = visit?.location ?? visit?.terrain_location ?? 'Localisation non renseignée';
  const dateLabel = formatVisitFullDate(visit?.visit_date ?? visit?.date);
  const timeLabel = visit?.visit_time ?? visit?.slot ?? 'Heure non renseignée';
  const note = visit?.notes ?? visit?.note ?? null;

  if (normalized === 'completed') {
    return {
      icon: 'checkmark-circle-outline',
      accent: BRAND.success,
      accentSoft: BRAND.successSoft,
      title: 'Visite déjà réalisée',
      description:
        "Cette visite a déjà été effectuée. Vous pouvez consulter les informations du rendez-vous ci-dessous.",
      ctaLabel: 'Compris',
      statusLabel: 'Visite réalisée',
      terrainTitle,
      location,
      dateLabel,
      timeLabel,
      note,
    };
  }

  if (normalized === 'cancelled') {
    return {
      icon: 'close-circle-outline',
      accent: BRAND.danger,
      accentSoft: BRAND.dangerSoft,
      title: 'Visite annulée',
      description:
        "Cette visite n'est plus active. Les informations du rendez-vous sont affichées à titre de suivi.",
      ctaLabel: 'Compris',
      statusLabel: 'Visite annulée',
      terrainTitle,
      location,
      dateLabel,
      timeLabel,
      note,
    };
  }

  return {
    icon: 'calendar-outline',
    accent: BRAND.orange,
    accentSoft: BRAND.orangeSoft,
    title: 'Visite programmée',
    description:
      'Voici les informations de votre visite prévue. Présentez-vous à l’heure indiquée ou contactez Ikadou en cas de besoin.',
    ctaLabel: 'D’accord',
    statusLabel: 'Visite à venir',
    terrainTitle,
    location,
    dateLabel,
    timeLabel,
    note,
  };
}

export default function MyVisitsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const loadVisits = useCallback(async () => {
    try {
      const res = await getMyVisits();
      setVisits(normalizeVisitsResponse(res));
    } catch {
      setVisits([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        setLoading(true);
        try {
          const res = await getMyVisits();
          if (mounted) {
            setVisits(normalizeVisitsResponse(res));
          }
        } catch {
          if (mounted) {
            setVisits([]);
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

  const sections = useMemo(() => {
    const upcoming = visits
      .filter((v) => classifyVisitStatus(v?.status) === 'upcoming')
      .sort(sortVisitsByDateDesc);

    const completed = visits
      .filter((v) => classifyVisitStatus(v?.status) === 'completed')
      .sort(sortVisitsByDateDesc);

    const cancelled = visits
      .filter((v) => classifyVisitStatus(v?.status) === 'cancelled')
      .sort(sortVisitsByDateDesc);

    return [
      { title: 'À venir', data: upcoming },
      { title: 'Réalisées', data: completed },
      { title: 'Annulées', data: cancelled },
    ].filter((section) => section.data.length > 0);
  }, [visits]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadVisits();
    } finally {
      setRefreshing(false);
    }
  }

  function openVisit(visit) {
    setSelectedVisit(visit);
  }

  const visitModal = selectedVisit ? getVisitPopupContent(selectedVisit) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={BRAND.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mes visites</Text>
          <Text style={styles.headerSub}>Suivez vos rendez-vous terrain</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={BRAND.teal} />
          <Text style={styles.loaderText}>Chargement des visites…</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 24, 32) },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BRAND.teal}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-clear-outline" size={28} color={BRAND.teal} />
              </View>
              <Text style={styles.emptyTitle}>Aucune visite</Text>
              <Text style={styles.emptySub}>
                Vos visites à venir, réalisées ou annulées apparaîtront ici.
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
          renderItem={({ item }) => (
            <VisitCard visit={item} onPress={() => openVisit(item)} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 18 }} />}
        />
      )}

      <VisitInfoModal
        visible={!!selectedVisit}
        visit={visitModal}
        onClose={() => setSelectedVisit(null)}
      />
    </SafeAreaView>
  );
}

function VisitCard({ visit, onPress }) {
  const dateValue = visit.visit_date ?? visit.date;
  const timeValue = visit.visit_time ?? visit.slot ?? '—';
  const terrainTitle = visit.terrainTitle ?? visit.terrain_title ?? 'Terrain';
  const location = visit.location ?? visit.terrain_location ?? '—';
  const note = visit.notes ?? visit.note ?? null;

  const d = dateValue ? new Date(dateValue) : null;
  const statusUi = getVisitStatusUi(visit.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{d && !Number.isNaN(d.getTime()) ? d.getDate() : '—'}</Text>
        <Text style={styles.dateMonth}>
          {d && !Number.isNaN(d.getTime()) ? MONTHS_FR[d.getMonth()] : '—'}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {terrainTitle}
          </Text>

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
            <Text style={[styles.statusText, { color: statusUi.textColor }]}>
              {statusUi.label}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={BRAND.textSoft} />
          <Text style={styles.metaText}>{formatVisitDate(dateValue)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={BRAND.textSoft} />
          <Text style={styles.metaText}>{timeValue}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={BRAND.textSoft} />
          <Text style={styles.metaText} numberOfLines={1}>
            {location}
          </Text>
        </View>

        {note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteText} numberOfLines={2}>
              {note}
            </Text>
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#999" />
    </TouchableOpacity>
  );
}

function VisitInfoModal({ visible, visit, onClose }) {
  if (!visit) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconWrap, { backgroundColor: visit.accentSoft }]}>
            <Ionicons name={visit.icon} size={28} color={visit.accent} />
          </View>

          <Text style={styles.modalTitle}>{visit.title}</Text>
          <Text style={styles.modalDescription}>{visit.description}</Text>

          <View style={[styles.modalStatusPill, { backgroundColor: visit.accentSoft }]}>
            <Text style={[styles.modalStatusText, { color: visit.accent }]}>
              {visit.statusLabel}
            </Text>
          </View>

          <View style={styles.modalInfoCard}>
            <ModalInfoRow icon="home-outline" label="Terrain" value={visit.terrainTitle} />
            <ModalInfoRow icon="calendar-outline" label="Date" value={visit.dateLabel} />
            <ModalInfoRow icon="time-outline" label="Heure" value={visit.timeLabel} />
            <ModalInfoRow icon="location-outline" label="Localisation" value={visit.location} />
            {visit.note ? (
              <ModalInfoRow icon="document-text-outline" label="Note" value={visit.note} multiline />
            ) : null}
          </View>

          <TouchableOpacity style={styles.modalPrimaryBtn} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.modalPrimaryBtnText}>{visit.ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ModalInfoRow({ icon, label, value, multiline = false }) {
  return (
    <View style={styles.modalInfoRow}>
      <View style={styles.modalInfoIcon}>
        <Ionicons name={icon} size={16} color={BRAND.teal} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.modalInfoLabel}>{label}</Text>
        <Text
          style={styles.modalInfoValue}
          numberOfLines={multiline ? 4 : 2}
        >
          {value || '—'}
        </Text>
      </View>
    </View>
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
    fontWeight: '800',
    color: BRAND.text,
  },

  headerSub: {
    fontSize: 13,
    color: BRAND.textSoft,
    marginTop: 2,
  },

  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  loaderText: {
    fontSize: 13,
    color: BRAND.textSoft,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
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
    fontWeight: '800',
  },

  card: {
    backgroundColor: BRAND.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  dateBox: {
    width: 50,
    height: 56,
    borderRadius: 16,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateDay: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '900',
    color: BRAND.teal,
  },

  dateMonth: {
    fontSize: 11,
    color: BRAND.teal,
    textTransform: 'lowercase',
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },

  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.text,
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
    fontWeight: '800',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  metaText: {
    flex: 1,
    fontSize: 12,
    color: BRAND.textSoft,
  },

  noteBox: {
    marginTop: 8,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  noteText: {
    fontSize: 12,
    lineHeight: 17,
    color: BRAND.textSoft,
  },

  emptyCard: {
    backgroundColor: BRAND.white,
    borderRadius: 22,
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
    marginBottom: 12,
  },

  modalStatusPill: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  modalStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },

  modalInfoCard: {
    gap: 10,
    marginBottom: 18,
  },

  modalInfoRow: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  modalInfoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalInfoLabel: {
    fontSize: 12,
    color: BRAND.textSoft,
    marginBottom: 3,
  },

  modalInfoValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: BRAND.text,
  },

  modalPrimaryBtn: {
    minHeight: 48,
    borderRadius: 18,
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