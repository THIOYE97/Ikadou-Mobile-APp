import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTerrainById } from '../api/terrains';

const { width } = Dimensions.get('window');

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
  purple: '#7B4BB7',
  purpleSoft: 'rgba(123,75,183,0.10)',
  green: '#6B9A2F',
  greenSoft: 'rgba(107,154,47,0.10)',
};

const resolveImageUrl = (img) => {
  if (!img) return null;
  if (typeof img === 'string') return img;
  return img.url || img.secure_url || img.src || img.path || img.image_url || null;
};

const normalizeImages = (terrain) => {
  const fromImages = Array.isArray(terrain?.images)
    ? terrain.images.map(resolveImageUrl).filter(Boolean)
    : [];

  const mainImage = resolveImageUrl(terrain?.mainImage);
  const merged = [...fromImages];

  if (mainImage && !merged.includes(mainImage)) {
    merged.unshift(mainImage);
  }

  return merged;
};

const normalizeFlexibleArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const mergeTerrainData = (base = {}, incoming = {}) => {
  const merged = { ...base, ...incoming };

  const baseImages = normalizeImages(base);
  const incomingImages = normalizeImages(incoming);

  return {
    ...merged,
    images: incomingImages.length ? incomingImages : baseImages,
    environmentBenefits:
      incoming.environmentBenefits ??
      incoming.environment_benefits ??
      base.environmentBenefits ??
      base.environment_benefits ??
      [],
    trustItems:
      incoming.trustItems ??
      incoming.trust_items ??
      base.trustItems ??
      base.trust_items ??
      [],
    agencyName:
      incoming.agencyName ??
      incoming.agency_name ??
      base.agencyName ??
      base.agency_name ??
      null,
    notaryName:
      incoming.notaryName ??
      incoming.notary_name ??
      base.notaryName ??
      base.notary_name ??
      null,
    notaryPhone:
      incoming.notaryPhone ??
      incoming.notary_phone ??
      base.notaryPhone ??
      base.notary_phone ??
      null,
    ninacad:
      incoming.ninacad ??
      incoming.ninacad_number ??
      base.ninacad ??
      base.ninacad_number ??
      null,
  };
};

function formatPrice(value, currency = 'FCFA') {
  return `${Number(value || 0).toLocaleString('fr-FR')} ${currency}`;
}

function getSurfaceValue(terrain) {
  if (terrain?.surface) return terrain.surface;
  if (terrain?.surfaceM2) return `${Number(terrain.surfaceM2).toLocaleString('fr-FR')} m²`;
  if (terrain?.surface_m2) return `${Number(terrain.surface_m2).toLocaleString('fr-FR')} m²`;
  return '—';
}

function getQuartierValue(terrain, zoneName) {
  return (
    terrain?.quartier ??
    terrain?.neighborhood ??
    terrain?.district ??
    terrain?.quarter ??
    zoneName
  );
}

function getEnvironmentItems(terrain) {
  return normalizeFlexibleArray(
    terrain?.environmentBenefits ||
      terrain?.environment_benefits ||
      terrain?.environment_features ||
      terrain?.nearbyAdvantages ||
      terrain?.nearby_advantages ||
      terrain?.location_highlights ||
      []
  );
}

function getTrustItems(terrain) {
  const items = normalizeFlexibleArray(
    terrain?.trustItems ||
      terrain?.trust_items ||
      terrain?.reassurance_items ||
      terrain?.confidence_items ||
      []
  );

  if (items.length > 0) return items;

  const fallback = [];
  if (terrain?.titleDeedAvailable || terrain?.titre_foncier || terrain?.land_title_available) {
    fallback.push('Titre foncier disponible');
  }
  if (terrain?.notaryName || terrain?.notary_name) {
    fallback.push('Suivi notarial disponible');
  }
  if (terrain?.ninacad || terrain?.ninacad_number) {
    fallback.push('Référence cadastrale renseignée');
  }
  return fallback;
}

function getAgencyName(terrain) {
  return (
    terrain?.agencyName ||
    terrain?.agency_name ||
    terrain?.sellerAgency ||
    terrain?.seller_agency ||
    terrain?.agency ||
    '—'
  );
}

function getNotaryName(terrain) {
  return terrain?.notaryName || terrain?.notary_name || '—';
}

function getNotaryPhone(terrain) {
  return terrain?.notaryPhone || terrain?.notary_phone || terrain?.notary_mobile || '—';
}

function getNinacad(terrain) {
  return terrain?.ninacad || terrain?.ninacad_number || terrain?.ninacode || '—';
}

function getOfferItems(terrain) {
  const items = [
    {
      icon: 'document-text-outline',
      title: 'Titre foncier disponible',
      subtitle: 'Le terrain est présenté avec ses garanties essentielles.',
    },
  ];

  if (terrain?.payment_mode || String(terrain?.description || '').toLowerCase().includes('echelon')) {
    items.push({
      icon: 'calendar-outline',
      title: 'Paiement échelonné possible',
      subtitle: 'Une simulation de financement peut être lancée dans l’application.',
    });
  }

  if (terrain?.location) {
    items.push({
      icon: 'location-outline',
      title: 'Localisation claire',
      subtitle: 'Le quartier et la position sont visibles dans la carte intégrée.',
    });
  }

  items.push({
    icon: 'shield-checkmark-outline',
    title: 'Accompagnement Ikadou',
    subtitle: 'Visite, simulation et accompagnement avant décision.',
  });

  return items;
}

function getHighlightTag(terrain) {
  const raw = `${terrain?.title || ''} ${terrain?.description || ''} ${terrain?.payment_mode || ''}`.toLowerCase();

  if (raw.includes('premium')) {
    return { label: 'Premium', bg: BRAND.purpleSoft, color: BRAND.purple };
  }
  if (raw.includes('agric') || raw.includes('hectare')) {
    return { label: 'Agricole', bg: BRAND.greenSoft, color: BRAND.green };
  }
  if (raw.includes('echelon') || raw.includes('tranche')) {
    return { label: 'Échelonné', bg: BRAND.orangeSoft, color: BRAND.orange };
  }
  return { label: 'Terrain', bg: BRAND.tealSoft, color: BRAND.teal };
}

export default function TerrainDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id, terrain: cached } = route.params ?? {};

  const [terrain, setTerrain] = useState(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [imgIndex, setImgIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (cached) {
      setTerrain(cached);
      setLoading(false);
    }

    if (!id) {
      setLoading(false);
      return;
    }

    getTerrainById(id)
      .then((r) => {
        if (!mounted) return;
        const fresh = r.data?.data ?? null;
        if (fresh) setTerrain((prev) => mergeTerrainData(prev, fresh));
      })
      .catch(() => {})
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const images = useMemo(() => {
    const list = normalizeImages(terrain);
    return list.length ? list : [null];
  }, [terrain]);

  const zoneName =
    typeof terrain?.zone === 'string'
      ? terrain.zone
      : terrain?.zone?.name ?? terrain?.zone_name ?? '—';

  const quartierValue = getQuartierValue(terrain, zoneName);
  const surfaceValue = getSurfaceValue(terrain);
  const title = terrain?.title ?? 'Terrain';
  const location = terrain?.location ?? 'Localisation indisponible';
  const price = Number(terrain?.price ?? 0);
  const currency = terrain?.currency === 'XOF' ? 'FCFA' : terrain?.currency ?? 'FCFA';
  const description = terrain?.description ?? '';
  const latitude = terrain?.latitude ?? terrain?.lat ?? null;
  const longitude = terrain?.longitude ?? terrain?.lng ?? null;

  const offers = getOfferItems(terrain);
  const tag = getHighlightTag(terrain);
  const environmentItems = getEnvironmentItems(terrain);
  const trustItems = getTrustItems(terrain);
  const agencyName = getAgencyName(terrain);
  const notaryName = getNotaryName(terrain);
  const notaryPhone = getNotaryPhone(terrain);
  const ninacad = getNinacad(terrain);

  const shortDescription =
    description && description.length > 220
      ? `${description.slice(0, 220).trim()}...`
      : description;

  function openInternalMap() {
    if (latitude == null || longitude == null) return;

    navigation.navigate('MapView', {
      source: 'terrain_detail',
      terrainId: terrain?.id ?? id ?? null,
      terrainTitle: title,
      terrainLocation: location,
      marker: {
        id: terrain?.id ?? id ?? 'terrain',
        title,
        description: location,
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
      initialCoordinates: {
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
    });
  }

  if (loading && !terrain) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={BRAND.teal} size="large" />
        <Text style={styles.loadingText}>Chargement du terrain…</Text>
      </View>
    );
  }

  if (!terrain) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Terrain introuvable.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.gallery}>
        <FlatList
          data={images}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setImgIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) =>
            item ? (
              <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="cover" />
            ) : (
              <View style={[styles.galleryImage, styles.imgPlaceholder]}>
                <Ionicons name="image-outline" size={40} color="#B7B0A6" />
              </View>
            )
          }
        />

        <View style={[styles.galleryTopBar, { paddingTop: Math.max(insets.top, 20) }]}>
          <TouchableOpacity style={styles.floatingIconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={BRAND.text} />
          </TouchableOpacity>

          
        </View>

        <View style={styles.galleryCounter}>
          <Text style={styles.galleryCounterText}>
            {imgIndex + 1}/{images.length}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 92, 108) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          <View style={styles.topTagRow}>
            <View style={[styles.tagPill, { backgroundColor: tag.bg }]}>
              <Text style={[styles.tagPillText, { color: tag.color }]}>{tag.label}</Text>
            </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>

            <TouchableOpacity
              style={styles.financeMiniBtn}
              onPress={() =>
                navigation.navigate('Simulator', {
                  initialPrice: String(price),
                  terrainId: terrain?.id ?? id ?? null,
                  terrainTitle: title,
                  source: 'terrain_detail',
                })
              }
              activeOpacity={0.9}
            >
              <Ionicons name="wallet-outline" size={14} color={BRAND.teal} />
              <Text style={styles.financeMiniBtnText}>Financer</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{location}</Text>

          <View style={styles.metaHeroRow}>
            <MetaHeroItem value={surfaceValue} label="Superficie" />
            <MetaHeroItem value={quartierValue || '—'} label="Quartier" />
            <MetaHeroItem value="Disponible" label="Titre foncier" />
          </View>

          <Separator />

          <SectionTitle title="À propos de ce terrain" />
          <Text style={styles.description}>
            {showFullDescription ? description : shortDescription || "Ce terrain est présenté avec une fiche claire pour vous permettre d'évaluer son emplacement, sa superficie et ses garanties avant votre visite."}
          </Text>

          {description.length > 220 ? (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={() => setShowFullDescription((v) => !v)}
              activeOpacity={0.9}
            >
              <Text style={styles.showMoreBtnText}>
                {showFullDescription ? 'Réduire' : 'Voir plus'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <Separator />

          <SectionTitle title="L’offre du terrain" />
          <View style={styles.offerList}>
            {offers.map((item, idx) => (
              <OfferRow
                key={`${item.title}_${idx}`}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
              />
            ))}
          </View>

          {environmentItems.length > 0 ? (
            <>
              <Separator />
              <SectionTitle title="Avantages du terrain" />
              <View style={styles.badgesGrid}>
                {environmentItems.map((item, idx) => (
                  <View key={`${item}_${idx}`} style={styles.environmentBadge}>
                    <Ionicons name="sparkles-outline" size={14} color={BRAND.orange} />
                    <Text style={styles.environmentBadgeText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {trustItems.length > 0 ? (
            <>
              <Separator />
              <SectionTitle title="Éléments de confiance" />
              <View style={styles.badgesGrid}>
                {trustItems.map((item, idx) => (
                  <View key={`${item}_${idx}`} style={styles.badge}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={BRAND.teal} />
                    <Text style={styles.badgeText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Separator />
          <SectionTitle title="Informations clés" />
          <View style={styles.infoCardList}>
            <InfoCardRow icon="business-outline" label="Agence" value={agencyName} />
            <InfoCardRow icon="document-text-outline" label="Notaire" value={notaryName} />
            <InfoCardRow icon="call-outline" label="Téléphone du notaire" value={notaryPhone} />
            <InfoCardRow icon="clipboard-outline" label="Numéro NINACAD" value={ninacad} />
          </View>

          {latitude != null && longitude != null ? (
            <>
              <Separator />
              <SectionTitle title="Où se trouve le terrain" />
              <Text style={styles.mapText}>
                La carte intégrée vous permet de voir la position du terrain sans sortir de l’application.
              </Text>

              <TouchableOpacity style={styles.mapCard} onPress={openInternalMap} activeOpacity={0.92}>
                <View style={styles.mapPreview}>
                  <Ionicons name="map-outline" size={24} color={BRAND.teal} />
                </View>

                <View style={styles.mapCardContent}>
                  <Text style={styles.mapCardTitle}>{location}</Text>
                  <Text style={styles.mapCardSubtitle}>Ouvrir dans la carte Ikadou</Text>
                </View>

                <Ionicons name="expand-outline" size={18} color={BRAND.textSoft} />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            bottom: Math.max(insets.bottom + 8, 10),
          },
        ]}
      >
        <View style={styles.footerPriceBlock}>
          <Text style={styles.footerPrice}>{formatPrice(price, currency)}</Text>
          <Text style={styles.footerSubPrice}>Prix du terrain</Text>
        </View>

        <TouchableOpacity
          style={styles.footerPrimaryBtn}
          onPress={() => navigation.navigate('BookVisit', { terrain, hideTabBar: true })}
          activeOpacity={0.9}
        >
          <Text style={styles.footerPrimaryBtnText}>Planifier une visite</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function SectionTitle({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function MetaHeroItem({ value, label }) {
  return (
    <View style={styles.metaHeroItem}>
      <Text style={styles.metaHeroValue} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.metaHeroLabel}>{label}</Text>
    </View>
  );
}

function OfferRow({ icon, title, subtitle }) {
  return (
    <View style={styles.offerRow}>
      <View style={styles.offerIconWrap}>
        <Ionicons name={icon} size={17} color={BRAND.text} />
      </View>

      <View style={styles.offerTextWrap}>
        <Text style={styles.offerTitle}>{title}</Text>
        <Text style={styles.offerSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function InfoCardRow({ icon, label, value }) {
  return (
    <View style={styles.infoCardRow}>
      <View style={styles.infoCardIcon}>
        <Ionicons name={icon} size={16} color={BRAND.teal} />
      </View>

      <View style={styles.infoCardTextWrap}>
        <Text style={styles.infoCardLabel}>{label}</Text>
        <Text style={styles.infoCardValue} numberOfLines={2}>
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

  centered: {
    flex: 1,
    backgroundColor: BRAND.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  loadingText: {
    color: BRAND.textSoft,
    fontSize: 13,
  },

  emptyText: {
    color: BRAND.textSoft,
    fontSize: 14,
  },

  gallery: {
    position: 'relative',
    backgroundColor: BRAND.white,
  },

  galleryImage: {
    width,
    height: 280,
  },

  imgPlaceholder: {
    backgroundColor: '#EDE7DE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  galleryTopBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  floatingIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  galleryCounter: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(17,17,17,0.56)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  galleryCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },

  mainCard: {
    backgroundColor: BRAND.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginTop: -24,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
  },

  topTagRow: {
    marginBottom: 10,
  },

  tagPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  tagPillText: {
    fontSize: 12,
    fontWeight: '800',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },

  title: {
    flex: 1,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    color: BRAND.text,
  },

  financeMiniBtn: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: BRAND.tealSoft,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  financeMiniBtnText: {
    color: BRAND.teal,
    fontWeight: '800',
    fontSize: 12,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: BRAND.textSoft,
    marginBottom: 16,
  },

  metaHeroRow: {
    flexDirection: 'row',
    gap: 10,
  },

  metaHeroItem: {
    flex: 1,
  },

  metaHeroValue: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 4,
  },

  metaHeroLabel: {
    fontSize: 12,
    color: BRAND.textSoft,
  },

  separator: {
    height: 1,
    backgroundColor: BRAND.border,
    marginVertical: 18,
  },

  sectionTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: BRAND.text,
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    color: BRAND.textSoft,
  },

  showMoreBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: '#F3EFE8',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  showMoreBtnText: {
    color: BRAND.text,
    fontWeight: '800',
    fontSize: 14,
  },

  offerList: {
    gap: 14,
  },

  offerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  offerIconWrap: {
    width: 24,
    marginTop: 2,
    alignItems: 'center',
  },

  offerTextWrap: {
    flex: 1,
  },

  offerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 3,
  },

  offerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.textSoft,
  },

  badgesGrid: {
    gap: 10,
  },

  badge: {
    backgroundColor: BRAND.tealSoft,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  badgeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.teal,
    fontWeight: '700',
  },

  environmentBadge: {
    backgroundColor: BRAND.orangeSoft,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  environmentBadgeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.orange,
    fontWeight: '700',
  },

  infoCardList: {
    gap: 10,
  },

  infoCardRow: {
    backgroundColor: '#FAF7F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 78,
  },

  infoCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoCardTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },

  infoCardLabel: {
    color: BRAND.textSoft,
    fontSize: 12,
    marginBottom: 4,
  },

  infoCardValue: {
    color: BRAND.text,
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 20,
  },

  mapText: {
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.textSoft,
    marginBottom: 12,
  },

  mapCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  mapPreview: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapCardContent: {
    flex: 1,
  },

  mapCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 3,
  },

  mapCardSubtitle: {
    fontSize: 12,
    color: BRAND.textSoft,
  },

  footer: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 22,
    backgroundColor: 'rgba(247,244,239,0.98)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  footerPriceBlock: {
    flex: 0.95,
    justifyContent: 'center',
  },

  footerPrice: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    color: BRAND.text,
  },

  footerSubPrice: {
    fontSize: 12,
    color: BRAND.textSoft,
    marginTop: 2,
  },

  footerPrimaryBtn: {
    flex: 1.25,
    minHeight: 46,
    borderRadius: 18,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  footerPrimaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});