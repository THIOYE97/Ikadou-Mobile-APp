import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getClientTickets } from '../api/support';

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
  purple: '#7B4BB7',
  purpleSoft: 'rgba(123,75,183,0.10)',
  neutralSoft: '#F1EEE8',
};

function statusMeta(status) {
  switch (status) {
    case 'open':
      return {
        label: 'Ouvert',
        color: BRAND.orange,
        bg: BRAND.orangeSoft,
        icon: 'radio-button-on-outline',
      };
    case 'in_progress':
      return {
        label: 'En cours',
        color: BRAND.teal,
        bg: BRAND.tealSoft,
        icon: 'sync-outline',
      };
    case 'waiting_client':
      return {
        label: 'Action requise',
        color: BRAND.purple,
        bg: BRAND.purpleSoft,
        icon: 'alert-circle-outline',
      };
    case 'resolved':
      return {
        label: 'Résolu',
        color: BRAND.success,
        bg: BRAND.successSoft,
        icon: 'checkmark-done-outline',
      };
    case 'closed':
    case 'closed_by_agent':
    case 'closed_by_client':
      return {
        label: 'Clôturé',
        color: BRAND.textSoft,
        bg: BRAND.neutralSoft,
        icon: 'lock-closed-outline',
      };
    default:
      return {
        label: status || '—',
        color: BRAND.textSoft,
        bg: BRAND.neutralSoft,
        icon: 'ellipse-outline',
      };
  }
}

function priorityMeta(priority) {
  const p = String(priority || '').toLowerCase();

  if (p === 'urgent' || p === 'high') {
    return {
      label: p === 'urgent' ? 'Urgente' : 'Élevée',
      color: BRAND.danger,
      bg: BRAND.dangerSoft,
      icon: 'flame-outline',
      borderColor: 'rgba(214,69,69,0.20)',
    };
  }

  if (p === 'medium') {
    return {
      label: 'Moyenne',
      color: BRAND.orange,
      bg: BRAND.orangeSoft,
      icon: 'flag-outline',
      borderColor: 'rgba(242,140,40,0.20)',
    };
  }

  if (p === 'low') {
    return {
      label: 'Faible',
      color: BRAND.teal,
      bg: BRAND.tealSoft,
      icon: 'leaf-outline',
      borderColor: 'rgba(0,140,140,0.20)',
    };
  }

  return {
    label: priority || '—',
    color: BRAND.textSoft,
    bg: BRAND.neutralSoft,
    icon: 'flag-outline',
    borderColor: BRAND.border,
  };
}

function isTicketActive(status) {
  const s = String(status || '').toLowerCase();
  return ['open', 'in_progress', 'waiting_client', 'pending'].includes(s);
}

function isTicketClosedLike(status) {
  const s = String(status || '').toLowerCase();
  return ['resolved', 'closed', 'closed_by_agent', 'closed_by_client'].includes(s);
}

function buildClosedTicketMessage(ticket) {
  const s = statusMeta(ticket?.status);
  return {
    title: `Ticket ${s.label.toLowerCase()}`,
    description:
      `Ce ticket est actuellement "${s.label}". ` +
      `Seuls les tickets encore ouverts ou ceux qui nécessitent une action de votre part peuvent être rouverts depuis cet écran.`,
    accent: s.color,
    accentBg: s.bg,
    icon: s.icon,
  };
}

export default function SupportHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lockedTicketModal, setLockedTicketModal] = useState({
    visible: false,
    ticket: null,
  });

  const load = useCallback(async () => {
    const res = await getClientTickets({ page: 1, limit: 50 });
    setTickets(res.items || []);
  }, []);

  useEffect(() => {
    load()
      .catch((e) => console.log('SUPPORT HOME LOAD ERROR =', e?.response?.data || e?.message))
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

  const sections = useMemo(() => {
    const activeTickets = tickets.filter((t) => isTicketActive(t.status));
    const archivedTickets = tickets.filter((t) => isTicketClosedLike(t.status));

    return [
      {
        title: 'Tickets ouverts',
        subtitle: 'Continuez les échanges qui demandent encore une action',
        data: activeTickets,
        tone: 'active',
      },
      {
        title: 'Résolus et clôturés',
        subtitle: 'Historique des tickets déjà traités',
        data: archivedTickets,
        tone: 'archived',
      },
    ].filter((section) => section.data.length > 0);
  }, [tickets]);

  const openCount = useMemo(
    () => tickets.filter((t) => isTicketActive(t.status)).length,
    [tickets]
  );

  function openTicket(ticket) {
    if (isTicketClosedLike(ticket?.status)) {
      setLockedTicketModal({
        visible: true,
        ticket,
      });
      return;
    }

    navigation.navigate('SupportTicket', { ticketId: ticket.id });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={BRAND.teal} size="large" />
        <Text style={styles.helper}>Chargement de vos tickets…</Text>
      </View>
    );
  }

  const lockedMeta = lockedTicketModal.ticket
    ? buildClosedTicketMessage(lockedTicketModal.ticket)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Support</Text>
          <Text style={styles.headerSub}>Discutez avec notre équipe d’assistance</Text>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('SupportNewTicket')}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="chatbubbles-outline" size={22} color={BRAND.teal} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Vos conversations avec Ikadou</Text>
          <Text style={styles.heroSub}>
            Les tickets ouverts restent accessibles en priorité. Les tickets résolus ou clôturés sont conservés plus bas pour référence.
          </Text>
        </View>

        <View style={styles.heroCountPill}>
          <Text style={styles.heroCountText}>{openCount}</Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
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
              <Ionicons name="chatbubble-ellipses-outline" size={30} color={BRAND.teal} />
            </View>
            <Text style={styles.emptyTitle}>Aucune discussion pour le moment</Text>
            <Text style={styles.emptySub}>
              Ouvrez un ticket pour signaler un souci ou poser une question.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => navigation.navigate('SupportNewTicket')}
              activeOpacity={0.9}
            >
              <Text style={styles.emptyActionText}>Créer un ticket</Text>
            </TouchableOpacity>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionSub}>{section.subtitle}</Text>
            </View>

            <View
              style={[
                styles.sectionCount,
                section.tone === 'active' ? styles.sectionCountActive : styles.sectionCountArchived,
              ]}
            >
              <Text
                style={[
                  styles.sectionCountText,
                  section.tone === 'active'
                    ? styles.sectionCountTextActive
                    : styles.sectionCountTextArchived,
                ]}
              >
                {section.data.length}
              </Text>
            </View>
          </View>
        )}
        renderItem={({ item, section }) => (
          <TicketCard
            ticket={item}
            onPress={() => openTicket(item)}
            archived={section.tone === 'archived'}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 18 }} />}
      />

      <Modal
        visible={lockedTicketModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedTicketModal({ visible: false, ticket: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconWrap,
                { backgroundColor: lockedMeta?.accentBg || BRAND.neutralSoft },
              ]}
            >
              <Ionicons
                name={lockedMeta?.icon || 'information-circle-outline'}
                size={28}
                color={lockedMeta?.accent || BRAND.textSoft}
              />
            </View>

            <Text style={styles.modalTitle}>{lockedMeta?.title || 'Ticket'}</Text>
            <Text style={styles.modalDesc}>
              {lockedMeta?.description || 'Ce ticket ne peut pas être rouvert ici.'}
            </Text>

            <View style={styles.modalTicketBox}>
              <Text style={styles.modalTicketSubject} numberOfLines={2}>
                {lockedTicketModal.ticket?.subject || 'Ticket'}
              </Text>

              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Référence</Text>
                <Text style={styles.modalMetaValue}>
                  {lockedTicketModal.ticket?.ref || lockedTicketModal.ticket?.id}
                </Text>
              </View>

              <View style={styles.modalMetaRow}>
                <Text style={styles.modalMetaLabel}>Statut actuel</Text>
                <Text
                  style={[
                    styles.modalMetaValue,
                    { color: lockedMeta?.accent || BRAND.text },
                  ]}
                >
                  {statusMeta(lockedTicketModal.ticket?.status).label}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setLockedTicketModal({ visible: false, ticket: null })}
              activeOpacity={0.9}
            >
              <Text style={styles.modalPrimaryBtnText}>Compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TicketCard({ ticket, onPress, archived = false }) {
  const s = statusMeta(ticket.status);
  const p = priorityMeta(ticket.priority);

  return (
    <TouchableOpacity
      style={[
        styles.ticketCard,
        archived && styles.ticketCardArchived,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.ticketTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ticketSubject} numberOfLines={1}>
            {ticket.subject}
          </Text>
          <Text style={styles.ticketRef}>
            {ticket.ref || ticket.id}
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
          <Ionicons name={s.icon} size={12} color={s.color} />
          <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <Text style={styles.ticketDesc} numberOfLines={2}>
        {ticket.description || 'Aucune description'}
      </Text>

      <View style={styles.ticketBottom}>
        <View
          style={[
            styles.priorityPill,
            {
              backgroundColor: p.bg,
              borderColor: p.borderColor,
            },
          ]}
        >
          <Ionicons name={p.icon} size={12} color={p.color} />
          <Text style={[styles.priorityText, { color: p.color }]}>{p.label}</Text>
        </View>

        {!!ticket.unread_count_client && ticket.unread_count_client > 0 && !archived ? (
          <View style={styles.unreadPill}>
            <Text style={styles.unreadText}>{ticket.unread_count_client}</Text>
          </View>
        ) : (
          <Ionicons
            name={archived ? 'lock-closed-outline' : 'chevron-forward'}
            size={18}
            color="#999"
          />
        )}
      </View>
    </TouchableOpacity>
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

  helper: {
    color: BRAND.textSoft,
    fontSize: 13,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },

  headerTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 2,
  },

  headerSub: {
    fontSize: 13,
    color: BRAND.textSoft,
  },

  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
    fontSize: 16,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 4,
  },

  heroSub: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
  },

  heroCountPill: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  heroCountText: {
    color: BRAND.teal,
    fontSize: 13,
    fontWeight: '800',
  },

  list: {
    paddingHorizontal: 16,
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

  emptyActionBtn: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyActionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: BRAND.textSoft,
    marginBottom: 2,
  },

  sectionSub: {
    fontSize: 12,
    color: BRAND.textSoft,
    maxWidth: 250,
  },

  sectionCount: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  sectionCountActive: {
    backgroundColor: BRAND.tealSoft,
  },

  sectionCountArchived: {
    backgroundColor: BRAND.neutralSoft,
  },

  sectionCountText: {
    fontSize: 12,
    fontWeight: '800',
  },

  sectionCountTextActive: {
    color: BRAND.teal,
  },

  sectionCountTextArchived: {
    color: BRAND.textSoft,
  },

  ticketCard: {
    backgroundColor: BRAND.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 12,
  },

  ticketCardArchived: {
    opacity: 0.92,
  },

  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },

  ticketSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 3,
  },

  ticketRef: {
    fontSize: 11,
    color: BRAND.textSoft,
  },

  statusPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  ticketDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
    marginBottom: 12,
  },

  ticketBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  priorityPill: {
    flex: 1,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },

  priorityText: {
    fontSize: 12,
    fontWeight: '800',
  },

  unreadPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },

  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
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

  modalDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
    textAlign: 'center',
    marginBottom: 16,
  },

  modalTicketBox: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
  },

  modalTicketSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 10,
  },

  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 10,
  },

  modalMetaLabel: {
    fontSize: 12,
    color: BRAND.textSoft,
  },

  modalMetaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND.text,
    textAlign: 'right',
    flexShrink: 1,
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