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
  blackSoft: '#1C1A17',
};

const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function normalizeVisitsResponse(r) {
  const data = r?.data?.data?.items ?? r?.data?.items ?? r?.data?.data ?? r?.data ?? [];
  return Array.isArray(data) ? data : [];
}

function classifyVisitStatus(status) {
  const s = String(status || '').toLowerCase();

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

function formatTime(value) {
  if (!value) return 'Heure non renseignée';
  return String(value).slice(0, 5);
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
  const timeLabel = formatTime(visit?.visit_time ?? visit?.slot);
  const note = visit?.notes ?? visit?.note ?? null;

  if (normalized === 'completed') {
    return {
      icon: 'checkmark-circle-outline',
      accent: BRAND.success,
      accentSoft: BRAND.successSoft,
      title: 'Visite réalisée',
      description: 'Cette visite a déjà été effectuée. Voici le résumé du rendez-vous.',
      ctaLabel: 'Compris',
      statusLabel: 'Réalisée',
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
      description: 'Cette visite n’est plus active. Les informations restent disponibles pour votre suivi.',
      ctaLabel: 'Compris',
      statusLabel: 'Annulée',
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
    description: 'Votre rendez-vous terrain est planifié. Présentez-vous à l’heure indiquée.',
    ctaLabel: 'D’accord',
    statusLabel: 'À venir',
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
    const res = await getMyVisits();
    setVisits(normalizeVisitsResponse(res));
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

  const stats = useMemo(() => {
    return visits.reduce(
      (acc, visit) => {
        const type = classifyVisitStatus(visit?.status);
        acc[type] += 1;
        return acc;
      },
      { upcoming: 0, completed: 0, cancelled: 0 }
    );
  }, [visits]);

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
    } catch {
      setVisits([]);
    } finally {
      setRefreshing(false);
    }
  }

  const visitModal = selectedVisit ? getVisitPopupContent(selectedVisit) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={18} color={BRAND.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mes visites</Text>
          <Text style={styles.headerSub}>Suivez vos rendez-vous terrain</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <View style={styles.loaderOrb}>
            <ActivityIndicator color={BRAND.teal} />
          </View>
          <Text style={styles.loaderText}>Chargement des visites…</Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.teal} />
          }
          ListHeaderComponent={
            visits.length > 0 ? (
              <View style={styles.heroCard}>
                <View style={styles.heroTop}>
                  <View style={styles.heroIconWrap}>
                    <Ionicons name="calendar-outline" size={22} color={BRAND.teal} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>Suivi de vos visites</Text>
                    <Text style={styles.heroSub}>
                      Retrouvez vos rendez-vous à venir, réalisés ou annulés.
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <VisitStat icon="time-outline" label="À venir" value={stats.upcoming} color={BRAND.orange} bg={BRAND.orangeSoft} />
                  <VisitStat icon="checkmark-circle-outline" label="Réalisées" value={stats.completed} color={BRAND.success} bg={BRAND.successSoft} />
                  <VisitStat icon="close-circle-outline" label="Annulées" value={stats.cancelled} color={BRAND.danger} bg={BRAND.dangerSoft} />
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-clear-outline" size={30} color={BRAND.teal} />
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
            <VisitCard visit={item} onPress={() => setSelectedVisit(item)} />
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

function VisitStat({ icon, label, value, color, bg }) {
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

function VisitCard({ visit, onPress }) {
  const dateValue = visit.visit_date ?? visit.date;
  const timeValue = formatTime(visit.visit_time ?? visit.slot);
  const terrainTitle = visit.terrainTitle ?? visit.terrain_title ?? 'Terrain';
  const location = visit.location ?? visit.terrain_location ?? '—';
  const note = visit.notes ?? visit.note ?? null;
  const statusUi = getVisitStatusUi(visit.status);

  const d = dateValue ? new Date(dateValue) : null;
  const hasValidDate = d && !Number.isNaN(d.getTime());

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{hasValidDate ? d.getDate() : '—'}</Text>
        <Text style={styles.dateMonth}>{hasValidDate ? MONTHS_FR[d.getMonth()] : '—'}</Text>
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

        <MetaRow icon="calendar-outline" text={formatVisitDate(dateValue)} />
        <MetaRow icon="time-outline" text={timeValue} />
        <MetaRow icon="location-outline" text={location} />

        {note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteText} numberOfLines={2}>
              {note}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardChevron}>
        <Ionicons name="chevron-forward" size={17} color={BRAND.textSoft} />
      </View>
    </TouchableOpacity>
  );
}

function MetaRow({ icon, text }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={13} color={BRAND.textSoft} />
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function VisitInfoModal({ visible, visit, onClose }) {
  if (!visit) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCardCompact}>
          <View style={styles.modalHeaderCompact}>
            <View style={[styles.modalIconWrapCompact, { backgroundColor: visit.accentSoft }]}>
              <Ionicons name={visit.icon} size={22} color={visit.accent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitleCompact}>{visit.title}</Text>

              <View style={[styles.modalStatusPillCompact, { backgroundColor: visit.accentSoft }]}>
                <Text style={[styles.modalStatusText, { color: visit.accent }]}>
                  {visit.statusLabel}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close" size={18} color={BRAND.textSoft} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescriptionCompact}>{visit.description}</Text>

          <View style={styles.modalInfoCardCompact}>
            <ModalInfoRow icon="home-outline" label="Terrain" value={visit.terrainTitle} />
            <ModalInfoRow icon="calendar-outline" label="Date" value={visit.dateLabel} />
            <ModalInfoRow icon="time-outline" label="Heure" value={visit.timeLabel} />
            <ModalInfoRow icon="location-outline" label="Lieu" value={visit.location} />
            {visit.note ? (
              <ModalInfoRow icon="document-text-outline" label="Note" value={visit.note} multiline />
            ) : null}
          </View>

          <TouchableOpacity style={styles.modalPrimaryBtnCompact} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.modalPrimaryBtnText}>{visit.ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ModalInfoRow({ icon, label, value, multiline = false }) {
  return (
    <View style={styles.modalInfoRowCompact}>
      <View style={styles.modalInfoIconCompact}>
        <Ionicons name={icon} size={14} color={BRAND.teal} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.modalInfoLabelCompact}>{label}</Text>
        <Text style={styles.modalInfoValueCompact} numberOfLines={multiline ? 3 : 1}>
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
    fontWeight: '900',
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

  card: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#111111',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  dateBox: {
    width: 54,
    height: 62,
    borderRadius: 18,
    backgroundColor: BRAND.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(0,140,140,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateDay: {
    fontSize: 21,
    lineHeight: 23,
    fontWeight: '900',
    color: BRAND.teal,
  },

  dateMonth: {
    fontSize: 11,
    color: BRAND.teal,
    textTransform: 'lowercase',
    fontWeight: '700',
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },

  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
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
    fontWeight: '900',
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
    fontWeight: '600',
  },

  noteBox: {
    marginTop: 8,
    backgroundColor: '#FCFAF7',
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

  cardChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4F1EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
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