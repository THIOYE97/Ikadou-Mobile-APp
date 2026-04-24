import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { logout } from '../api/auth';
import { getMyVisits } from '../api/leads';
import { getClientTickets } from '../api/support';
import { protectedClient } from '../api/client';
import FormNotice from '../components/FormNotice';

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
  badgeBg: '#111111',
};

function normalizeVisitsResponse(r) {
  const data = r?.data?.data?.items ?? r?.data?.items ?? r?.data?.data ?? r?.data ?? [];
  return Array.isArray(data) ? data : [];
}

function normalizeTicketsResponse(r) {
  const data = r?.items ?? r?.data?.data ?? r?.data ?? [];
  return Array.isArray(data) ? data : [];
}

function normalizePaymentsResponse(r) {
  const data = r?.data?.data?.items ?? r?.data?.items ?? r?.data?.data ?? r?.data ?? [];
  return Array.isArray(data) ? data : [];
}

function normalizeVisitStatus(status) {
  const s = String(status || '').toLowerCase();

  if (['confirmed', 'scheduled', 'pending', 'requested', 'rescheduled', 'planned'].includes(s)) {
    return 'in_progress';
  }

  if (['completed', 'done', 'realized', 'realised', 'visited'].includes(s)) {
    return 'completed';
  }

  if (['cancelled', 'canceled', 'rejected', 'no_show'].includes(s)) {
    return 'cancelled';
  }

  return 'other';
}

function normalizePaymentStatus(status) {
  const s = String(status || '').toLowerCase();

  if (['pending', 'partial', 'processing', 'submitted'].includes(s)) {
    return 'in_progress';
  }

  if (['confirmed', 'paid', 'approved', 'completed'].includes(s)) {
    return 'completed';
  }

  if (['failed', 'cancelled', 'canceled', 'refunded', 'rejected'].includes(s)) {
    return 'closed';
  }

  return 'other';
}

function normalizeTicketStatus(ticket) {
  const unread = Number(ticket?.unread_count_client ?? ticket?.unreadCountClient ?? ticket?.unread ?? 0) || 0;
  const raw = String(ticket?.status || '').toLowerCase();

  if (unread > 0) return 'in_progress';
  if (['open', 'pending', 'in_progress', 'waiting_reply', 'assigned'].includes(raw)) return 'in_progress';
  if (['resolved', 'closed', 'done'].includes(raw)) return 'closed';

  return 'other';
}

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);
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

  const loadProfileData = useCallback(async () => {
    setLoading(true);

    try {
      const [rawUser, token] = await Promise.all([
        AsyncStorage.getItem('@ikadou:user'),
        AsyncStorage.getItem('@ikadou:accessToken'),
      ]);

      let parsedUser = null;

      if (rawUser) {
        try {
          parsedUser = JSON.parse(rawUser);
        } catch (_) {
          parsedUser = null;
        }
      }

      setUser(parsedUser);

      if (!token) {
        setVisits([]);
        setTickets([]);
        setPayments([]);
        setAuthResolved(true);
        return;
      }

      const [visitsRes, ticketsRes, paymentsRes] = await Promise.all([
        getMyVisits().catch(() => null),
        getClientTickets().catch(() => null),
        protectedClient.get('/client/payments').catch(() => null),
      ]);

      setVisits(visitsRes ? normalizeVisitsResponse(visitsRes) : []);
      setTickets(ticketsRes ? normalizeTicketsResponse(ticketsRes) : []);
      setPayments(paymentsRes ? normalizePaymentsResponse(paymentsRes) : []);
      setAuthResolved(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      hideNotice();
      loadProfileData();
    }, [hideNotice, loadProfileData])
  );

  async function handleLogout() {
    hideNotice();

    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (_) {
      showNotice('error', 'Erreur', 'Impossible de se déconnecter pour le moment.');
    }
  }

  const initials = useMemo(() => {
    if (!user) return '';
    return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }, [user]);

  const activeVisits = useMemo(
    () => visits.filter((v) => normalizeVisitStatus(v?.status) === 'in_progress'),
    [visits]
  );

  const activeTickets = useMemo(
    () => tickets.filter((t) => normalizeTicketStatus(t) === 'in_progress'),
    [tickets]
  );

  const activePayments = useMemo(
    () => payments.filter((p) => normalizePaymentStatus(p?.status) === 'in_progress'),
    [payments]
  );

  const visitsCount = activeVisits.length;
  const ticketsCount = activeTickets.length;
  const paymentsCount = activePayments.length;

  const supportUnreadCount = useMemo(() => {
    return activeTickets.reduce((sum, t) => {
      const unread =
        Number(t?.unread_count_client ?? t?.unreadCountClient ?? t?.unread ?? 0) || 0;
      return sum + unread;
    }, 0);
  }, [activeTickets]);

  if (!authResolved && loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.bootLoaderWrap}>
          <ActivityIndicator color={BRAND.teal} />
          <Text style={styles.bootLoaderText}>Chargement de votre espace…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={[
            styles.guestScroll,
            { paddingBottom: Math.max(insets.bottom + 20, 28) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.guestTopRow}>
            <View style={{ width: 40 }} />

            <View style={styles.guestLogoMark}>
              <View style={styles.guestLogoLine} />
              <Text style={styles.guestLogoText}>ikadou</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          <View style={styles.guestHero}>
            <Text style={styles.guestHeroTitle}>Mon espace</Text>
            <Text style={styles.guestHeroSub}>
              Connectez-vous pour retrouver vos paiements, vos visites et votre suivi client.
            </Text>
          </View>

          <View style={styles.guestCardModern}>
            <FormNotice
              visible={notice.visible}
              type={notice.type}
              title={notice.title}
              message={notice.message}
              onClose={hideNotice}
            />

            <View style={styles.guestBadge}>
              <Ionicons name="lock-closed-outline" size={18} color={BRAND.teal} />
              <Text style={styles.guestBadgeText}>Espace sécurisé</Text>
            </View>

            <View style={styles.guestInfoBox}>
              <View style={styles.guestInfoRow}>
                <View style={styles.guestInfoIconWrap}>
                  <Ionicons name="card-outline" size={15} color={BRAND.teal} />
                </View>
                <Text style={styles.guestInfoText}>Suivre vos paiements</Text>
              </View>

              <View style={styles.guestInfoRow}>
                <View style={styles.guestInfoIconWrap}>
                  <Ionicons name="calendar-outline" size={15} color={BRAND.teal} />
                </View>
                <Text style={styles.guestInfoText}>Retrouver vos visites</Text>
              </View>

              <View style={styles.guestInfoRow}>
                <View style={styles.guestInfoIconWrap}>
                  <Ionicons name="chatbubble-ellipses-outline" size={15} color={BRAND.teal} />
                </View>
                <Text style={styles.guestInfoText}>Contacter le support plus facilement</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtnModern}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnModernText}>Se connecter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtnModern}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryBtnModernText}>Créer un compte</Text>
            </TouchableOpacity>

            <Text style={styles.guestHintText}>
              Créez votre espace en quelques étapes seulement.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const infoItems = [
    { icon: 'document-text-outline', label: 'CGU', onPress: () => navigation.navigate('CGU') },
    { icon: 'shield-checkmark-outline', label: 'Confidentialité', onPress: () => navigation.navigate('Confidentialite') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 28, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <FormNotice
          visible={notice.visible}
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onClose={hideNotice}
        />

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Mon espace</Text>
          <Text style={styles.pageSubtitle}>Gérez votre parcours simplement.</Text>
        </View>

        <View style={styles.userCard}>
          <View style={styles.userTopRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitials}>{initials || 'I'}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>
                {user.firstName} {user.lastName}
              </Text>
              {!!user.phone && <Text style={styles.userContact}>{user.phone}</Text>}
              {!!user.email && <Text style={styles.userContact}>{user.email}</Text>}
            </View>

            <View style={styles.verifiedPill}>
              <Ionicons name="checkmark-circle" size={14} color={BRAND.success} />
              <Text style={styles.verifiedPillText}>Actif</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Visites"
            value={loading ? '…' : String(visitsCount)}
            icon="calendar-outline"
            onPress={() => navigation.navigate('MyVisits')}
          />
          <StatCard
            label="Paiements"
            value={loading ? '…' : String(paymentsCount)}
            icon="card-outline"
            onPress={() => navigation.navigate('MyPayments')}
          />
          <StatCard
            label="Support"
            value={loading ? '…' : String(ticketsCount)}
            icon={supportUnreadCount > 0 ? 'notifications' : 'chatbubble-ellipses-outline'}
            badge={supportUnreadCount}
            onPress={() => navigation.navigate('SupportHome')}
          />
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={BRAND.teal} />
            <Text style={styles.loaderText}>Chargement du suivi…</Text>
          </View>
        ) : null}

        <SectionTitle title="Informations utiles" />

        <View style={styles.menuCard}>
          {infoItems.map((item, i) => (
            <MenuItem
              key={item.label}
              item={item}
              bordered={i < infoItems.length - 1}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.9}>
          <Ionicons name="log-out-outline" size={18} color={BRAND.danger} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Ikadou v1.0.0 · Mali</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function StatCard({ label, value, icon, badge = 0, onPress }) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={18} color={BRAND.teal} />
        {badge > 0 ? (
          <View style={styles.smallBellBadge}>
            <Text style={styles.smallBellBadgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function MenuItem({ item, bordered }) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, bordered && styles.menuItemBorder]}
      onPress={item.onPress}
      activeOpacity={0.85}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemIconWrap}>
          <Ionicons name={item.icon} size={18} color={BRAND.text} style={styles.menuItemIcon} />
          {item.unread > 0 ? (
            <View style={styles.menuBellDot}>
              <Ionicons name="notifications" size={10} color="#fff" />
            </View>
          ) : null}
        </View>

        <Text style={styles.menuItemLabel}>{item.label}</Text>
      </View>

      <View style={styles.menuItemRight}>
        {typeof item.count === 'number' ? (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{item.count}</Text>
          </View>
        ) : null}

        <Ionicons name="chevron-forward" size={18} color="#999" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },

  bootLoaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  bootLoaderText: {
    color: BRAND.textSoft,
    fontSize: 13,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  guestScroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    justifyContent: 'center',
  },

  pageHeader: { marginBottom: 18 },
  pageTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.textSoft,
  },

  userCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    marginBottom: 14,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.teal,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 4,
  },
  userContact: {
    fontSize: 13,
    color: BRAND.textSoft,
    marginTop: 1,
  },
  verifiedPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: BRAND.successSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedPillText: {
    color: BRAND.success,
    fontSize: 12,
    fontWeight: '700',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: BRAND.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statIconWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  smallBellBadge: {
    position: 'absolute',
    top: -7,
    right: -11,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  smallBellBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.text,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: BRAND.textSoft,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: BRAND.textSoft,
    marginBottom: 10,
    marginTop: 4,
  },

  loaderBox: {
    backgroundColor: BRAND.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 10,
  },
  loaderText: {
    color: BRAND.textSoft,
    fontSize: 13,
  },

  menuCard: {
    backgroundColor: BRAND.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    overflow: 'hidden',
    marginBottom: 18,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 10,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  menuItemIconWrap: {
    width: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBellDot: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemIcon: {
    width: 22,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 14,
    color: BRAND.text,
    fontWeight: '600',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    color: BRAND.teal,
    fontSize: 12,
    fontWeight: '800',
  },

  logoutBtn: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: '#F0C9C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: {
    color: BRAND.danger,
    fontWeight: '800',
    fontSize: 14,
  },

  version: {
    textAlign: 'center',
    color: BRAND.textSoft,
    fontSize: 11,
  },

  guestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  guestLogoMark: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  guestLogoLine: {
    width: 30,
    height: 3,
    borderRadius: 999,
    backgroundColor: BRAND.orange,
    marginBottom: 4,
    transform: [{ skewX: '-18deg' }],
  },

  guestLogoText: {
    color: BRAND.teal,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  guestHero: {
    marginBottom: 18,
  },

  guestHeroTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  guestHeroSub: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
    maxWidth: 330,
  },

  guestCardModern: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
  },

  guestBadge: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: BRAND.tealSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 16,
  },

  guestBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.teal,
  },

  guestInfoBox: {
    backgroundColor: '#FCFAF7',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },

  guestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  guestInfoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  guestInfoText: {
    flex: 1,
    color: BRAND.text,
    fontSize: 13,
    fontWeight: '600',
  },

  primaryBtnModern: {
    width: '100%',
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  primaryBtnModernText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  secondaryBtnModern: {
    width: '100%',
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryBtnModernText: {
    color: BRAND.text,
    fontWeight: '700',
    fontSize: 13,
  },

  guestHintText: {
    marginTop: 10,
    textAlign: 'center',
    color: BRAND.textSoft,
    fontSize: 12,
    lineHeight: 18,
  },
});