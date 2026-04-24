import React, { useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState, useFocusEffect } from '@react-navigation/native';
import FormNotice from '../components/FormNotice';
import {
  createClientTicket,
  addClientTicketMessage,
  uploadClientTicketAttachments,
  getClientTickets,
} from '../api/support';

const BRAND = {
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#6F6B64',
  border: '#E9E2D8',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.10)',
  orange: '#F28C28',
  orangeSoft: 'rgba(242,140,40,0.10)',
  bgOverlay: 'rgba(17,17,17,0.32)',
  bgSoft: '#FCFAF7',
  danger: '#D64545',
  dangerSoft: 'rgba(214,69,69,0.10)',
  blackSoft: '#1C1A17',
  badgeBg: '#111111',
};

const HIDDEN_ROUTES = ['Onboarding', 'Login', 'Register'];

function normalizeTicketsResponse(r) {
  const data = r?.items ?? r?.data?.data ?? r?.data ?? [];
  return Array.isArray(data) ? data : [];
}

export default function SupportFab() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [notice, setNotice] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

  const routeNames = useNavigationState((state) => {
    const names = [];
    let current = state;

    while (current && current.routes) {
      const route = current.routes[current.index];
      names.push(route.name);
      current = route.state;
    }

    return names;
  });

  async function ensureAuthenticated() {
    const token = await AsyncStorage.getItem('@ikadou:accessToken');
    const user = await AsyncStorage.getItem('@ikadou:user');

    if (!token || !user) {
      setOpen(false);
      navigation.navigate('Login');
      return false;
    }

    return true;
  }

  const loadUnreadSupport = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('@ikadou:accessToken');
      const user = await AsyncStorage.getItem('@ikadou:user');

      if (!token || !user) {
        setUnreadCount(0);
        return;
      }

      const ticketsRes = await getClientTickets().catch(() => null);
      const tickets = ticketsRes ? normalizeTicketsResponse(ticketsRes) : [];

      const totalUnread = tickets.reduce((sum, ticket) => {
        const unread =
          Number(ticket?.unread_count_client ?? ticket?.unreadCountClient ?? ticket?.unread ?? 0) || 0;
        return sum + unread;
      }, 0);

      setUnreadCount(totalUnread);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnreadSupport();
    }, [loadUnreadSupport])
  );

  function showNotice(type, title, message) {
    setNotice({
      visible: true,
      type,
      title,
      message,
    });
  }

  function hideNotice() {
    setNotice((prev) => ({ ...prev, visible: false }));
  }

  function resetForm() {
    setSubject('');
    setDescription('');
    setFiles([]);
    hideNotice();
  }

  async function pickImages() {
    const ok = await ensureAuthenticated();
    if (!ok) return;

    hideNotice();

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const activeRoute = routeNames[routeNames.length - 1];
  const hidden = HIDDEN_ROUTES.includes(activeRoute);

  const bottomOffset = useMemo(
    () => Math.max(insets.bottom + 100, 122),
    [insets.bottom]
  );

  async function submit() {
    const ok = await ensureAuthenticated();
    if (!ok) return;

    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();

    if (!cleanSubject) {
      showNotice('error', 'Sujet requis', 'Ajoute un sujet court pour ton message.');
      return;
    }

    setLoading(true);
    hideNotice();

    try {
      const created = await createClientTicket({
        subject: cleanSubject,
        description: null,
        category: 'other',
        priority: 'medium',
      });

      const ticket = created?.item;

      if (!ticket?.id) {
        throw new Error('Ticket non créé');
      }

      const firstMessageText = cleanDescription || cleanSubject;
      let createdMessage = null;

      if (firstMessageText || files.length > 0) {
        const messageRes = await addClientTicketMessage(ticket.id, {
          message: firstMessageText || 'Image jointe',
        });
        createdMessage = messageRes?.item ?? null;
      }

      if (files.length > 0) {
        await uploadClientTicketAttachments({
          ticketId: ticket.id,
          files,
          messageId: createdMessage?.id || null,
        });
      }

      setOpen(false);
      resetForm();
      setUnreadCount(0);

      navigation.navigate('SupportTicket', { ticketId: ticket.id });
    } catch (e) {
      console.log('SUPPORT CREATE ERROR =', e?.response?.data || e?.message);
      showNotice('error', 'Erreur', "Impossible d'ouvrir la discussion support.");
    } finally {
      setLoading(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={[styles.fabWrap, { bottom: bottomOffset }]}>
         <TouchableOpacity
  style={styles.fab}
  onPress={async () => {
    const ok = await ensureAuthenticated();
    if (!ok) return;
    setOpen(true);
  }}
  activeOpacity={0.9}
>
  <Ionicons name="mail-outline" size={28} color="#fff" />

  {unreadCount > 0 ? (
    <View style={styles.fabBadge}>
      <Text style={styles.fabBadgeText}>
        {unreadCount > 9 ? '9+' : String(unreadCount)}
      </Text>
    </View>
  ) : null}
</TouchableOpacity>
        </View>
      </View>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setOpen(false);
            resetForm();
          }}
        >
          <Pressable
            style={[styles.sheet, { marginBottom: Math.max(insets.bottom + 20, 26) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderIcon}>
                <Ionicons name="sparkles-outline" size={18} color={BRAND.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Contacter le support</Text>
                <Text style={styles.sheetSub}>
                  Ouvre une discussion rapide et joins des images si nécessaire.
                </Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              <FormNotice
                visible={notice.visible}
                type={notice.type}
                title={notice.title}
                message={notice.message}
                onClose={hideNotice}
              />

              <TextInput
                style={styles.input}
                placeholder="Sujet"
                placeholderTextColor="#9A9388"
                value={subject}
                onChangeText={setSubject}
              />

              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Décris le problème ou la demande…"
                placeholderTextColor="#9A9388"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.tipBox}>
                <Ionicons name="information-circle-outline" size={16} color={BRAND.teal} />
                <Text style={styles.tipText}>
                  Indique le terrain, le paiement ou l’écran concerné pour une prise en charge plus rapide.
                </Text>
              </View>

              <View style={styles.attachCard}>
                <View style={styles.attachHeader}>
                  <Text style={styles.attachTitle}>Pièces jointes</Text>
                  <Text style={styles.attachCount}>{files.length}/5</Text>
                </View>

                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={pickImages}
                  activeOpacity={0.9}
                >
                  <View style={styles.uploadBtnIcon}>
                    <Ionicons name="image-outline" size={16} color={BRAND.teal} />
                  </View>
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
                    Ajoute des captures ou justificatifs si cela peut aider l’équipe support.
                  </Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setOpen(false);
                  resetForm();
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.cancelBtnText}>Fermer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={submit}
                disabled={loading}
                activeOpacity={0.9}
              >
                <Ionicons name="paper-plane-outline" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>
                  {loading ? 'Création…' : 'Créer le ticket'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    right: 14,
  },

  fab: {
    minHeight: 60,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingLeft: 10,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  fabBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BRAND.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    flexDirection: 'row',
    gap: 2,
  },

  fabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  overlay: {
    flex: 1,
    backgroundColor: BRAND.bgOverlay,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },

  sheet: {
    backgroundColor: BRAND.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    maxHeight: '84%',
  },

  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: BRAND.border,
    alignSelf: 'center',
    marginBottom: 14,
  },

  sheetHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },

  sheetHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: BRAND.text,
    marginBottom: 4,
  },

  sheetSub: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
  },

  input: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.bgSoft,
    paddingHorizontal: 14,
    color: BRAND.text,
    fontSize: 14,
    marginBottom: 12,
  },

  textarea: {
    minHeight: 120,
    paddingTop: 12,
  },

  tipBox: {
    backgroundColor: BRAND.tealSoft,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },

  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.teal,
    fontWeight: '600',
  },

  attachCard: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#FCFAF7',
    marginBottom: 14,
  },

  attachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  attachTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  attachCount: {
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '700',
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

  uploadBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 88,
    height: 88,
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

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },

  cancelBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelBtnText: {
    color: BRAND.text,
    fontWeight: '700',
    fontSize: 14,
  },

  submitBtn: {
    flex: 1.5,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  submitBtnDisabled: {
    opacity: 0.7,
  },

  submitBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
  fabWrap: {
  position: 'absolute',
  right: 18,
},

fab: {
  width: 58,
  height: 58,
  borderRadius: 29,
  backgroundColor: BRAND.teal,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.18,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 10,
},

fabBadge: {
  position: 'absolute',
  top: -4,
  right: -4,
  minWidth: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: BRAND.orange,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 6,
  borderWidth: 2,
  borderColor: BRAND.white,
},

fabBadgeText: {
  color: '#fff',
  fontSize: 11,
  fontWeight: '900',
},
});