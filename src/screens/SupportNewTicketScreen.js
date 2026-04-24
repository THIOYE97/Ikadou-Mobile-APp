import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FormNotice from '../components/FormNotice';
import {
  createClientTicket,
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
};

const CATEGORIES = [
  { value: 'other', label: 'Autre', icon: 'apps-outline' },
  { value: 'payment', label: 'Paiement', icon: 'card-outline' },
  { value: 'account', label: 'Compte', icon: 'person-outline' },
  { value: 'terrain', label: 'Terrain', icon: 'home-outline' },
  { value: 'visit', label: 'Visite', icon: 'calendar-outline' },
  { value: 'bug', label: 'Bug', icon: 'bug-outline' },
];

const PRIORITIES = [
  { value: 'low', label: 'Faible' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Élevée' },
];

export default function SupportNewTicketScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [notice, setNotice] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

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

  async function submit() {
    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();

    if (!cleanSubject) {
      showNotice('error', 'Sujet requis', 'Ajoute un sujet court pour ton ticket.');
      return;
    }

    setLoading(true);
    hideNotice();

    try {
      const created = await createClientTicket({
        subject: cleanSubject,
        description: null,
        category,
        priority,
      });

      const ticket = created.item;

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

      navigation.replace('SupportTicket', { ticketId: ticket.id });
    } catch (e) {
      console.log('SUPPORT CREATE ERROR =', e?.response?.data || e?.message);
      showNotice('error', 'Erreur', "Impossible de créer le ticket pour le moment.");
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
            <View style={styles.kickerRow}>
              <View style={styles.kickerDot} />
              <Text style={styles.kicker}>SUPPORT IKADOU</Text>
            </View>
            <Text style={styles.headerTitle}>Nouveau ticket</Text>
            <Text style={styles.headerSub}>
              Décris ton besoin clairement pour obtenir une réponse plus rapide.
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 120, 140) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormNotice
            visible={notice.visible}
            type={notice.type}
            title={notice.title}
            message={notice.message}
            onClose={hideNotice}
          />

          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={BRAND.teal} />
            </View>
            <Text style={styles.heroTitle}>Créer une demande bien structurée</Text>
            <Text style={styles.heroText}>
              Un bon sujet, une description claire et des images utiles permettent à l’équipe support
              de traiter ton ticket plus vite.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sujet</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Problème de paiement"
              placeholderTextColor="#8A8A8A"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Catégorie</Text>
            <View style={styles.chipsWrap}>
              {CATEGORIES.map((item) => {
                const active = category === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCategory(item.value)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={item.icon}
                      size={14}
                      color={active ? BRAND.teal : BRAND.textSoft}
                    />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Priorité</Text>
            <View style={styles.chipsWrap}>
              {PRIORITIES.map((item) => {
                const active = priority === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setPriority(item.value)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Décris le problème ou la demande…"
              placeholderTextColor="#8A8A8A"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Pièces jointes</Text>
              <Text style={styles.cardTitleHint}>{files.length}/5</Text>
            </View>

            <TouchableOpacity style={styles.uploadBtn} onPress={pickImages} activeOpacity={0.9}>
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

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 2,
  },

  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },

  kickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.orange,
  },

  kicker: {
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '800',
    letterSpacing: 1,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: BRAND.text,
  },

  headerSub: {
    fontSize: 13,
    color: BRAND.textSoft,
    marginTop: 4,
    lineHeight: 18,
  },

  content: {
    paddingHorizontal: 16,
  },

  heroCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
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
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 6,
  },

  heroText: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
  },

  card: {
    backgroundColor: BRAND.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 14,
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  cardTitleHint: {
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 14,
    color: BRAND.text,
    fontSize: 14,
  },

  textarea: {
    minHeight: 120,
    paddingTop: 12,
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: '#FAF7F2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  chipActive: {
    backgroundColor: BRAND.tealSoft,
    borderColor: 'rgba(0,140,140,0.22)',
  },

  chipText: {
    fontSize: 13,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  chipTextActive: {
    color: BRAND.teal,
  },

  uploadBtn: {
    minHeight: 48,
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

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    backgroundColor: BRAND.bg,
  },

  submitBtn: {
    minHeight: 52,
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
    fontWeight: '800',
    fontSize: 15,
  },
});