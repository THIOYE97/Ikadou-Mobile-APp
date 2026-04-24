import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BRAND = {
  bg: '#FFFFFF',
  page: '#F7F4EF',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#6F6B64',
  border: '#E9E2D8',
  teal: '#00A8B5',
  tealSoft: 'rgba(0,168,181,0.10)',
  orange: '#FF5722',
  orangeSoft: 'rgba(255,87,34,0.10)',
  dark: '#0B1A1C',
};

const TOC = [
  'Vue d’ensemble',
  'Responsable du traitement',
  'Données collectées',
  'Finalités du traitement',
  'Bases légales',
  'Partage des données',
  'Durées de conservation',
  'Vos droits',
  'Cookies et traceurs',
  'Sécurité des données',
  'Transferts internationaux',
  'Mineurs',
  'Modifications',
  'Nous contacter',
];

export default function ConfidentialiteScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={BRAND.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Confidentialité</Text>
          <Text style={styles.headerSub}>Politique de protection des données</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 28, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={[styles.badge, { backgroundColor: BRAND.orangeSoft }]}>
            <Ionicons name="shield-checkmark-outline" size={14} color={BRAND.orange} />
            <Text style={[styles.badgeText, { color: BRAND.orange }]}>Vie privée</Text>
          </View>

          <Text style={styles.heroTitle}>Politique de Confidentialité</Text>
          <Text style={styles.heroSub}>
            Ikadou s’engage à protéger vos données personnelles dans le respect de la
            réglementation malienne, notamment la Loi N°2013-015 relative à la protection
            des données à caractère personnel.
          </Text>

          <View style={styles.metaWrap}>
            <MetaPill icon="calendar-outline" text="Mise à jour : 1er avril 2026" />
            <MetaPill icon="lock-closed-outline" text="Conforme Loi N°2013-015" />
            <MetaPill icon="mail-outline" text="DPO : privacy@ikadou.com" />
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="albums-outline"
            title="Données"
            text="Identité, contact, activité sur la plateforme et éléments utiles au service."
          />
          <SummaryCard
            icon="flag-outline"
            title="Finalités"
            text="Fournir le service, améliorer l’expérience et respecter les obligations légales."
          />
          <SummaryCard
            icon="shield-checkmark-outline"
            title="Vos droits"
            text="Accès, rectification, suppression, opposition, limitation et portabilité."
          />
        </View>

        <View style={styles.tocCard}>
          <Text style={styles.cardTitle}>Sommaire</Text>
          <View style={styles.tocList}>
            {TOC.map((item, index) => (
              <View key={item} style={styles.tocItem}>
                <View style={styles.tocNum}>
                  <Text style={styles.tocNumText}>{String(index + 1).padStart(2, '0')}</Text>
                </View>
                <Text style={styles.tocText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionBlock
          number="01"
          title="Vue d’ensemble"
          paragraphs={[
            "La présente politique décrit la manière dont Ikadou collecte, utilise, partage et protège vos données personnelles lorsque vous utilisez la plateforme.",
            "Le traitement est encadré par la loi malienne relative à la protection des données et par les décisions de l’autorité compétente.",
          ]}
        />

        <SectionBlock
          number="02"
          title="Responsable du traitement"
          paragraphs={[
            "Le responsable du traitement est Ikadou, avec un point de contact dédié à la protection des données via l’adresse privacy@ikadou.com.",
          ]}
        />

        <SectionBlock
          number="03"
          title="Données collectées"
          paragraphs={[
            "Ikadou peut traiter des données d’identité, de contact, de compte, des données liées aux annonces foncières, des données de communication ainsi que certaines données techniques de navigation.",
            "Des données de localisation ou d’usage peuvent également être collectées lorsque cela est nécessaire au fonctionnement ou à l’amélioration du service.",
          ]}
        />

        <CalloutCard
          variant="orange"
          icon="warning-outline"
          title="Données sensibles"
          text="La politique précise qu’Ikadou n’a pas vocation à collecter des données sensibles, sauf communication volontaire et strictement limitée au nécessaire."
        />

        <SectionBlock
          number="04"
          title="Finalités du traitement"
          list={[
            "Création et gestion du compte utilisateur.",
            "Publication et gestion des annonces.",
            "Mise en relation entre les parties.",
            "Vérification foncière et échanges de service.",
            "Amélioration de la plateforme et prévention de la fraude.",
            "Respect des obligations légales et réglementaires.",
          ]}
        />

        <SectionBlock
          number="05"
          title="Bases légales"
          paragraphs={[
            "Les traitements reposent, selon les cas, sur l’exécution du contrat, le consentement, l’obligation légale ou l’intérêt légitime d’Ikadou.",
          ]}
        />

        <SectionBlock
          number="06"
          title="Partage des données"
          paragraphs={[
            "Ikadou ne vend pas vos données. Elles peuvent être partagées avec des sous-traitants techniques, certains partenaires de service, des autorités compétentes en cas d’obligation légale, ou entre utilisateurs lorsque cela découle du fonctionnement de la plateforme.",
          ]}
        />

        <SectionBlock
          number="07"
          title="Durées de conservation"
          paragraphs={[
            "Les données sont conservées pendant la durée strictement nécessaire à chaque finalité, avec des périodes distinctes selon qu’il s’agit de comptes, d’annonces, de données de transaction, de logs techniques ou de préférences marketing.",
          ]}
        />

        <SectionBlock
          number="08"
          title="Vos droits"
          paragraphs={[
            "Conformément à la réglementation applicable, vous pouvez demander l’accès, la rectification, l’effacement, l’opposition, la limitation du traitement et, selon les cas, la portabilité de vos données.",
          ]}
        />

        <View style={styles.rightsGrid}>
          <RightCard icon="eye-outline" title="Accès" />
          <RightCard icon="create-outline" title="Rectification" />
          <RightCard icon="trash-outline" title="Effacement" />
          <RightCard icon="ban-outline" title="Opposition" />
          <RightCard icon="pause-circle-outline" title="Limitation" />
          <RightCard icon="download-outline" title="Portabilité" />
        </View>

        <SectionBlock
          number="09"
          title="Cookies et traceurs"
          paragraphs={[
            "La plateforme utilise des cookies essentiels, analytiques et, le cas échéant, marketing. Certains sont nécessaires au fonctionnement du service, d’autres reposent sur votre consentement.",
          ]}
        />

        <CalloutCard
          variant="orange"
          icon="information-circle-outline"
          title="Cookies essentiels"
          text="La politique rappelle que la désactivation de certains cookies essentiels peut altérer le bon fonctionnement de la plateforme."
        />

        <SectionBlock
          number="10"
          title="Sécurité des données"
          paragraphs={[
            "Ikadou met en œuvre des mesures techniques et organisationnelles adaptées : chiffrement, contrôle d’accès, journalisation, sauvegardes et évaluations de sécurité régulières.",
          ]}
        />

        <SectionBlock
          number="11"
          title="Transferts internationaux"
          paragraphs={[
            "Les données sont en principe hébergées au Mali ou dans l’espace UEMOA. En cas de transfert hors de cet espace, des garanties appropriées doivent être mises en place.",
          ]}
        />

        <SectionBlock
          number="12"
          title="Mineurs"
          paragraphs={[
            "La plateforme n’est pas destinée aux personnes de moins de 18 ans et Ikadou indique ne pas collecter sciemment de données concernant des mineurs.",
          ]}
        />

        <SectionBlock
          number="13"
          title="Modifications"
          paragraphs={[
            "Ikadou peut mettre à jour cette politique pour tenir compte des évolutions légales, réglementaires ou opérationnelles, avec information des utilisateurs lorsque cela est nécessaire.",
          ]}
        />

        <View style={styles.contactCard}>
          <Text style={styles.cardTitle}>Nous contacter</Text>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('mailto:privacy@ikadou.com')}
            activeOpacity={0.85}
          >
            <View style={styles.contactIconWrap}>
              <Ionicons name="mail-outline" size={16} color={BRAND.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Délégué à la protection des données</Text>
              <Text style={styles.contactValue}>privacy@ikadou.com</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={BRAND.textSoft} />
          </TouchableOpacity>

          <Text style={styles.footNote}>
            La politique mentionne également l’APDP du Mali comme autorité de contrôle compétente.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaPill({ icon, text }) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={14} color={BRAND.teal} />
      <Text style={styles.metaPillText}>{text}</Text>
    </View>
  );
}

function SummaryCard({ icon, title, text }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIconWrap}>
        <Ionicons name={icon} size={18} color={BRAND.teal} />
      </View>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryText}>{text}</Text>
    </View>
  );
}

function RightCard({ icon, title }) {
  return (
    <View style={styles.rightCard}>
      <View style={styles.rightIconWrap}>
        <Ionicons name={icon} size={16} color={BRAND.teal} />
      </View>
      <Text style={styles.rightTitle}>{title}</Text>
    </View>
  );
}

function SectionBlock({ number, title, paragraphs = [], list = [] }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionTop}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>{number}</Text>
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {paragraphs.map((p, index) => (
        <Text key={index} style={styles.paragraph}>
          {p}
        </Text>
      ))}

      {list.length > 0 ? (
        <View style={styles.bulletList}>
          {list.map((item, index) => (
            <View key={index} style={styles.bulletRow}>
              <Ionicons name="ellipse" size={8} color={BRAND.teal} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function CalloutCard({ variant = 'teal', icon, title, text }) {
  const isOrange = variant === 'orange';
  return (
    <View
      style={[
        styles.calloutCard,
        isOrange ? styles.calloutOrange : styles.calloutTeal,
      ]}
    >
      <View
        style={[
          styles.calloutIconWrap,
          isOrange ? styles.calloutIconOrange : styles.calloutIconTeal,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={isOrange ? BRAND.orange : BRAND.teal}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.calloutTitle}>{title}</Text>
        <Text style={styles.calloutText}>{text}</Text>
      </View>
    </View>
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
    backgroundColor: BRAND.bg,
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
    backgroundColor: BRAND.bg,
  },

  heroCard: {
    backgroundColor: BRAND.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 20,
    marginBottom: 14,
  },

  badge: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  heroTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 8,
  },

  heroSub: {
    fontSize: 14,
    lineHeight: 22,
    color: BRAND.textSoft,
    marginBottom: 14,
  },

  metaWrap: {
    gap: 8,
  },

  metaPill: {
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  metaPillText: {
    flex: 1,
    fontSize: 12,
    color: BRAND.textSoft,
    fontWeight: '600',
  },

  summaryGrid: {
    gap: 12,
    marginBottom: 14,
  },

  summaryCard: {
    backgroundColor: BRAND.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
  },

  summaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 4,
  },

  summaryText: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textSoft,
  },

  tocCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 12,
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
    marginBottom: 12,
  },

  tocList: {
    gap: 10,
  },

  tocItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  tocNum: {
    width: 34,
    height: 24,
    borderRadius: 8,
    backgroundColor: BRAND.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  tocNumText: {
    color: BRAND.orange,
    fontSize: 11,
    fontWeight: '800',
  },

  tocText: {
    flex: 1,
    color: BRAND.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  sectionCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 14,
  },

  sectionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },

  sectionNumber: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionNumberText: {
    color: BRAND.teal,
    fontSize: 12,
    fontWeight: '800',
  },

  sectionTitle: {
    flex: 1,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    color: BRAND.text,
  },

  paragraph: {
    fontSize: 14,
    lineHeight: 23,
    color: BRAND.textSoft,
    marginBottom: 10,
  },

  bulletList: {
    gap: 10,
    marginTop: 2,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 23,
    color: BRAND.textSoft,
  },

  rightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },

  rightCard: {
    width: '48%',
    minHeight: 92,
    backgroundColor: BRAND.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
  },

  rightIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  rightTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
  },

  calloutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },

  calloutTeal: {
    backgroundColor: 'rgba(0,168,181,0.06)',
    borderColor: 'rgba(0,168,181,0.16)',
  },

  calloutOrange: {
    backgroundColor: 'rgba(255,87,34,0.06)',
    borderColor: 'rgba(255,87,34,0.16)',
  },

  calloutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calloutIconTeal: {
    backgroundColor: BRAND.tealSoft,
  },

  calloutIconOrange: {
    backgroundColor: BRAND.orangeSoft,
  },

  calloutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 4,
  },

  calloutText: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
  },

  contactCard: {
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 6,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingHorizontal: 12,
  },

  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  contactLabel: {
    fontSize: 12,
    color: BRAND.textSoft,
    fontWeight: '700',
    marginBottom: 2,
  },

  contactValue: {
    fontSize: 14,
    color: BRAND.text,
    fontWeight: '700',
  },

  footNote: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.textSoft,
  },
});