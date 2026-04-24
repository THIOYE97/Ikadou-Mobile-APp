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
  'Objet et champ d’application',
  'Définitions',
  'Cadre légal applicable',
  'Accès à la plateforme',
  'Inscription et compte utilisateur',
  'Publications d’annonces',
  'Vérification des titres fonciers',
  'Transactions et financement',
  'Obligations des parties',
  'Responsabilités',
  'Propriété intellectuelle',
  'Données personnelles',
  'Résiliation',
  'Litiges et juridiction',
  'Dispositions finales',
];

export default function CGUScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={BRAND.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>CGU</Text>
          <Text style={styles.headerSub}>Conditions Générales d’Utilisation</Text>
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
          <View style={styles.badge}>
            <Ionicons name="document-text-outline" size={14} color={BRAND.teal} />
            <Text style={styles.badgeText}>Document légal</Text>
          </View>

          <Text style={styles.heroTitle}>Conditions Générales d’Utilisation</Text>
          <Text style={styles.heroSub}>
            Ces conditions encadrent l’utilisation de la plateforme Ikadou dans le respect
            du droit malien, du Code Domanial et Foncier et des règles applicables aux
            transactions électroniques.
          </Text>

          <View style={styles.metaWrap}>
            <MetaPill icon="calendar-outline" text="Mise à jour : 1er avril 2026" />
            <MetaPill icon="shield-checkmark-outline" text="Droit malien applicable" />
          </View>
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
          title="Objet et champ d’application"
          paragraphs={[
            "Les présentes CGU définissent les modalités d’accès et d’utilisation de la plateforme Ikadou, accessible via le site web et l’application mobile.",
            "Toute utilisation de la plateforme implique l’acceptation pleine et entière des présentes conditions. L’usage professionnel peut relever de conditions particulières complémentaires.",
          ]}
        />

        <SectionBlock
          number="02"
          title="Définitions"
          list={[
            "Plateforme : ensemble des services numériques Ikadou, incluant site, application mobile, simulateur et messagerie.",
            "Utilisateur : toute personne physique ou morale utilisant la plateforme.",
            "Vendeur : utilisateur publiant une annonce foncière.",
            "Terrain : parcelle à usage résidentiel, agricole, commercial ou industriel au Mali.",
            "Titre foncier : document officiel attestant la propriété selon la législation applicable.",
            "Annonce : offre de vente ou location publiée sur la plateforme.",
          ]}
        />

        <SectionBlock
          number="03"
          title="Cadre légal applicable"
          paragraphs={[
            "Ikadou opère dans le respect du Code Domanial et Foncier, des textes sur les collectivités territoriales, des règles d’immatriculation, de la loi sur les transactions électroniques et de la loi malienne sur la protection des données.",
            "Les règles communautaires UEMOA et les instructions applicables aux services financiers numériques complètent ce cadre lorsque cela est nécessaire.",
          ]}
        />

        <CalloutCard
          variant="teal"
          icon="library-outline"
          title="Repère important"
          text="Le cadre juridique cité dans les CGU renvoie notamment au Code Domanial et Foncier, à la loi sur les transactions électroniques et à la loi malienne sur la protection des données."
        />

        <SectionBlock
          number="04"
          title="Accès à la plateforme"
          paragraphs={[
            "Ikadou s’efforce d’assurer un accès continu à la plateforme, sous réserve des opérations de maintenance, mises à jour ou incidents techniques.",
            "L’accès est réservé aux personnes majeures ou aux personnes morales légalement constituées. L’utilisateur reste responsable de ses équipements et de sa connexion.",
          ]}
        />

        <SectionBlock
          number="05"
          title="Inscription et compte utilisateur"
          paragraphs={[
            "Certaines fonctionnalités exigent la création d’un compte avec des informations exactes, complètes et à jour.",
            "L’utilisateur doit garder ses identifiants confidentiels, signaler toute utilisation non autorisée et ne pas créer plusieurs comptes pour contourner une restriction.",
          ]}
        />

        <CalloutCard
          variant="orange"
          icon="alert-circle-outline"
          title="Attention"
          text="Toute usurpation d’identité ou fourniture de fausses informations peut exposer l’utilisateur à des sanctions prévues par le droit applicable."
        />

        <SectionBlock
          number="06"
          title="Publications d’annonces"
          paragraphs={[
            "Le vendeur doit être propriétaire légal ou détenir un mandat valable, fournir les documents utiles et publier des informations exactes sur le terrain.",
            "Ikadou peut refuser, modifier ou supprimer une annonce qui ne respecte pas les critères de qualité ou les présentes CGU.",
          ]}
        />

        <SectionBlock
          number="07"
          title="Vérification des titres fonciers"
          paragraphs={[
            "Ikadou propose un service de vérification portant sur l’authenticité du titre, l’identité du propriétaire inscrit, l’existence de charges ou oppositions, ainsi que la cohérence cadastrale.",
            "Cette vérification reste un service d’information complémentaire et ne remplace pas l’analyse d’un notaire ou d’un conseil juridique.",
          ]}
        />

        <CalloutCard
          variant="teal"
          icon="shield-checkmark-outline"
          title="Rappel foncier"
          text="Les CGU rappellent que seul le titre foncier constitue la preuve absolue de propriété, tandis que certains autres documents peuvent n’accorder qu’un droit précaire."
        />

        <SectionBlock
          number="08"
          title="Transactions et financement"
          paragraphs={[
            "Ikadou agit comme plateforme d’intermédiation. Les transactions sont conclues directement entre les parties et doivent être sécurisées selon les règles applicables, notamment avec l’intervention du notaire lorsque nécessaire.",
            "Le simulateur de financement est purement indicatif. Il ne constitue ni une offre de crédit ni un engagement contractuel.",
          ]}
        />

        <SectionBlock
          number="09"
          title="Obligations des parties"
          paragraphs={[
            "Ikadou doit fournir une plateforme fonctionnelle, modérer les contenus dans un délai raisonnable et protéger les données personnelles.",
            "L’utilisateur doit respecter la loi, publier des informations exactes, ne pas perturber la plateforme et respecter les droits de propriété intellectuelle.",
          ]}
        />

        <SectionBlock
          number="10"
          title="Responsabilités"
          paragraphs={[
            "Ikadou agit comme intermédiaire technique et ne garantit pas l’exactitude de toutes les informations publiées par les vendeurs ni la parfaite exécution des transactions entre utilisateurs.",
            "Chaque utilisateur demeure responsable de ses publications, déclarations et décisions prises à partir des informations disponibles sur la plateforme.",
          ]}
        />

        <SectionBlock
          number="11"
          title="Propriété intellectuelle"
          paragraphs={[
            "Les éléments de la plateforme — identité visuelle, interfaces, textes, bases de données et fonctionnalités — sont protégés et restent la propriété d’Ikadou.",
            "Les contenus publiés par les utilisateurs restent leur propriété, avec une licence d’usage accordée à Ikadou pour présenter et promouvoir les annonces.",
          ]}
        />

        <SectionBlock
          number="12"
          title="Données personnelles"
          paragraphs={[
            "Le traitement des données personnelles est encadré par la politique de confidentialité d’Ikadou.",
            "Les utilisateurs disposent des droits prévus par la réglementation applicable et peuvent exercer ces droits auprès d’Ikadou.",
          ]}
        />

        <SectionBlock
          number="13"
          title="Résiliation"
          paragraphs={[
            "L’utilisateur peut fermer son compte à tout moment. Ikadou peut suspendre ou résilier un compte en cas de violation des CGU, de fraude, de fausses informations ou d’obligation légale.",
          ]}
        />

        <SectionBlock
          number="14"
          title="Litiges et juridiction compétente"
          paragraphs={[
            "Les CGU prévoient d’abord une tentative de règlement amiable, puis éventuellement un recours à la médiation.",
            "À défaut, les litiges relèvent des juridictions compétentes indiquées dans le document légal.",
          ]}
        />

        <SectionBlock
          number="15"
          title="Dispositions finales"
          paragraphs={[
            "Ikadou peut mettre à jour les CGU et notifier les changements substantiels aux utilisateurs.",
            "Si une clause est jugée inapplicable, les autres dispositions restent en vigueur.",
          ]}
        />

        <View style={styles.contactCard}>
          <Text style={styles.cardTitle}>Contact légal</Text>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('mailto:legal@ikadou.com')}
            activeOpacity={0.85}
          >
            <View style={styles.contactIconWrap}>
              <Ionicons name="mail-outline" size={16} color={BRAND.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Adresse e-mail</Text>
              <Text style={styles.contactValue}>legal@ikadou.com</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={BRAND.textSoft} />
          </TouchableOpacity>

          <Text style={styles.footNote}>
            Les CGU mentionnent également Bamako comme ancrage juridique et opérationnel de référence pour la plateforme.
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
    backgroundColor: BRAND.tealSoft,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.teal,
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
    backgroundColor: BRAND.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionNumberText: {
    color: BRAND.orange,
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