import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FormNotice from '../components/FormNotice';
import {
  getClientTicketDetail,
  addClientTicketMessage,
  uploadClientTicketAttachments,
} from '../api/support';

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
  danger: '#D64545',
  dangerSoft: 'rgba(214,69,69,0.10)',
  blackSoft: '#1C1A17',
};

function formatMessageDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function getMessageText(msg) {
  return msg?.message ?? msg?.content ?? '';
}

function shouldHideTechnicalImageMessage(text, attachmentsCount) {
  const normalized = String(text || '').trim().toLowerCase();
  return attachmentsCount > 0 && normalized === 'image jointe';
}

export default function SupportTicketScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { ticketId } = route.params ?? {};

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState([]);

  const [notice, setNotice] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const [viewer, setViewer] = useState({
    visible: false,
    uri: '',
  });

  const showNotice = useCallback((type, title, text) => {
    setNotice({
      visible: true,
      type,
      title,
      message: text,
    });
  }, []);

  const hideNotice = useCallback(() => {
    setNotice((prev) => {
      if (!prev.visible) return prev;
      return { ...prev, visible: false };
    });
  }, []);

  const openViewer = useCallback((uri) => {
    if (!uri) return;
    setViewer({
      visible: true,
      uri,
    });
  }, []);

  const closeViewer = useCallback(() => {
    setViewer({
      visible: false,
      uri: '',
    });
  }, []);

  const load = useCallback(async () => {
    const { item } = await getClientTicketDetail(ticketId);
    setTicket(item);
  }, [ticketId]);

  useEffect(() => {
    load()
      .catch((e) => {
        console.log('SUPPORT DETAIL LOAD ERROR =', e?.response?.data || e?.message);
        showNotice(
          'error',
          'Chargement impossible',
          'Impossible de charger la discussion pour le moment.'
        );
      })
      .finally(() => setLoading(false));
  }, [load, showNotice]);

  async function pickImages() {
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

  async function send() {
    const content = message.trim();
    const hasMessage = !!content;
    const hasFiles = files.length > 0;

    if (!hasMessage && !hasFiles) return;

    hideNotice();
    setSending(true);

    try {
      let createdMessage = null;
      const effectiveMessage = hasMessage ? content : hasFiles ? 'Image jointe' : '';

      if (effectiveMessage) {
        const res = await addClientTicketMessage(ticketId, { message: effectiveMessage });
        createdMessage = res?.item ?? null;
      }

      if (hasFiles) {
        await uploadClientTicketAttachments({
          ticketId,
          files,
          messageId: createdMessage?.id || null,
        });
      }

      setMessage('');
      setFiles([]);
      Keyboard.dismiss();
      await load();
    } catch (e) {
      console.log('SUPPORT SEND ERROR =', e?.response?.data || e?.message);
      showNotice(
        'error',
        'Envoi impossible',
        e?.response?.data?.message || 'Impossible d’envoyer votre message pour le moment.'
      );
    } finally {
      setSending(false);
    }
  }

  const messages = useMemo(() => ticket?.messages || [], [ticket]);
  const attachments = useMemo(() => ticket?.attachments || [], [ticket]);

  const attachmentsByMessageId = useMemo(() => {
    const map = {};

    attachments.forEach((item) => {
      const key = item?.message_id;
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });

    return map;
  }, [attachments]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingOrb}>
          <ActivityIndicator color={BRAND.teal} />
        </View>
        <Text style={styles.helper}>Chargement de la discussion…</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.centered}>
        <Text style={styles.helper}>Discussion introuvable.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 6 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={BRAND.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerBadge}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={BRAND.teal} />
              <Text style={styles.headerBadgeText}>Support</Text>
            </View>

            <Text style={styles.headerTitle} numberOfLines={1}>
              {ticket.subject}
            </Text>

            <Text style={styles.headerSub}>
              {messages.length} message{messages.length > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.headerGhost} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 150, 170) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <FormNotice
            visible={notice.visible}
            type={notice.type}
            title={notice.title}
            message={notice.message}
            onClose={hideNotice}
          />

          <View style={styles.threadIntroCard}>
            <View style={styles.threadIntroIcon}>
              <Ionicons name="sparkles-outline" size={16} color={BRAND.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.threadIntroTitle}>Discussion ouverte avec Ikadou</Text>
              <Text style={styles.threadIntroText}>
                Échangez avec l’équipe support et ajoutez des images si nécessaire.
              </Text>
            </View>
          </View>

          {messages.map((msg, index) => {
            const mine = msg.sender_type === 'client';
            const author = msg.author_name || msg.author || (mine ? 'Vous' : 'Support');
            const messageDate = formatMessageDate(msg.created_at || msg.updated_at);
            const linkedAttachments = attachmentsByMessageId[msg.id] || [];
            const rawText = getMessageText(msg);
            const hideText = shouldHideTechnicalImageMessage(rawText, linkedAttachments.length);

            return (
              <View
                key={msg.id ?? `message-${index}`}
                style={[
                  styles.messageRow,
                  mine ? styles.messageRowMine : styles.messageRowTheir,
                ]}
              >
                {!mine ? (
                  <View style={styles.avatarTheir}>
                    <Ionicons name="headset-outline" size={14} color={BRAND.teal} />
                  </View>
                ) : null}

                <View
                  style={[
                    styles.messageBubble,
                    mine ? styles.myBubble : styles.theirBubble,
                  ]}
                >
                  {!!rawText && !hideText ? (
                    <Text style={[styles.messageText, mine && styles.myText]}>
                      {rawText}
                    </Text>
                  ) : null}

                  {linkedAttachments.length > 0 ? (
                    <View style={styles.messageAttachments}>
                      {linkedAttachments.map((file, fileIndex) => {
                        const isImage =
                          String(file?.file_type || '').includes('image') ||
                          /\.(jpg|jpeg|png|webp|heic)$/i.test(file?.file_url || '');

                        if (!isImage) return null;

                        return (
                          <TouchableOpacity
                            key={file.id ?? `${msg.id}-att-${fileIndex}`}
                            activeOpacity={0.9}
                            onPress={() => openViewer(file.file_url)}
                          >
                            <Image
                              source={{ uri: file.file_url }}
                              style={styles.messageAttachmentImage}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}

                  {hideText && linkedAttachments.length > 0 ? (
                    <Text style={[styles.attachmentHint, mine && styles.attachmentHintMine]}>
                      {linkedAttachments.length > 1
                        ? `${linkedAttachments.length} images jointes`
                        : 'Image jointe'}
                    </Text>
                  ) : null}

                  <View style={styles.messageFooter}>
                    <Text style={[styles.messageMeta, mine && styles.myMeta]}>
                      {author}
                    </Text>
                    {messageDate ? (
                      <Text style={[styles.messageDate, mine && styles.myDate]}>
                        {messageDate}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 10, 18) }]}>
          {files.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filesRow}
            >
              {files.map((file, index) => (
                <View key={`${file.uri}_${index}`} style={styles.filePreviewBox}>
                  <Image source={{ uri: file.uri }} style={styles.filePreviewImage} />
                  <TouchableOpacity
                    style={styles.removePreviewBtn}
                    onPress={() => removeFile(index)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close" size={13} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.composerShell}>
            <TouchableOpacity
              style={styles.mediaBtn}
              onPress={pickImages}
              activeOpacity={0.85}
            >
              <Ionicons name="images-outline" size={18} color={BRAND.textSoft} />
            </TouchableOpacity>

            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Écrivez votre message…"
                placeholderTextColor="#8A8A8A"
                value={message}
                onChangeText={(value) => {
                  setMessage(value);
                  if (notice.visible) hideNotice();
                }}
                multiline
                textAlignVertical="top"
                selectionColor={BRAND.teal}
                autoCorrect
                autoCapitalize="sentences"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (sending || (!message.trim() && files.length === 0)) && styles.sendBtnDisabled,
              ]}
              onPress={send}
              disabled={sending || (!message.trim() && files.length === 0)}
              activeOpacity={0.9}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={viewer.visible}
          transparent
          animationType="fade"
          onRequestClose={closeViewer}
        >
          <View style={styles.viewerOverlay}>
            <Pressable style={styles.viewerBackdrop} onPress={closeViewer} />

            <View style={styles.viewerTopBar}>
              <TouchableOpacity
                style={styles.viewerCloseBtn}
                onPress={closeViewer}
                activeOpacity={0.9}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.viewerContent}>
              {!!viewer.uri ? (
                <Image
                  source={{ uri: viewer.uri }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingHorizontal: 24,
  },

  loadingOrb: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
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

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerGhost: {
    width: 42,
  },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND.tealSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  headerBadgeText: {
    color: BRAND.teal,
    fontSize: 12,
    fontWeight: '800',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.text,
    textAlign: 'center',
  },

  headerSub: {
    fontSize: 12,
    color: BRAND.textSoft,
    marginTop: 3,
  },

  content: {
    paddingHorizontal: 16,
    gap: 10,
  },

  threadIntroCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 8,
  },

  threadIntroIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  threadIntroTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 4,
  },

  threadIntroText: {
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.textSoft,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },

  messageRowMine: {
    justifyContent: 'flex-end',
  },

  messageRowTheir: {
    justifyContent: 'flex-start',
  },

  avatarTheir: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 6,
  },

  messageBubble: {
    maxWidth: '82%',
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },

  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: BRAND.teal,
    borderBottomRightRadius: 8,
  },

  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderBottomLeftRadius: 8,
  },

  messageText: {
    color: BRAND.text,
    fontSize: 14,
    lineHeight: 20,
  },

  myText: {
    color: '#fff',
  },

  messageAttachments: {
    marginTop: 10,
    gap: 8,
  },

  messageAttachmentImage: {
    width: 190,
    height: 190,
    borderRadius: 16,
    backgroundColor: '#EFEAE2',
  },

  attachmentHint: {
    marginTop: 8,
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  attachmentHintMine: {
    color: 'rgba(255,255,255,0.82)',
  },

  messageFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 7,
  },

  messageMeta: {
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  myMeta: {
    color: 'rgba(255,255,255,0.82)',
  },

  messageDate: {
    fontSize: 10,
    color: BRAND.textSoft,
  },

  myDate: {
    color: 'rgba(255,255,255,0.72)',
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    backgroundColor: BRAND.bg,
  },

  filesRow: {
    paddingBottom: 10,
    gap: 10,
  },

  filePreviewBox: {
    width: 76,
    height: 76,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.white,
  },

  filePreviewImage: {
    width: '100%',
    height: '100%',
  },

  removePreviewBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  composerShell: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },

  mediaBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },

  inputWrap: {
    flex: 1,
    minHeight: 52,
    maxHeight: 130,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.white,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },

  input: {
    color: BRAND.text,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 0,
    minHeight: 22,
    textAlignVertical: 'top',
  },

  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendBtnDisabled: {
    opacity: 0.45,
  },

  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
  },

  viewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  viewerTopBar: {
    paddingTop: 54,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },

  viewerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },

  viewerImage: {
    width: '100%',
    height: '82%',
  },
});