import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BRAND = {
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#6F6B64',
  border: '#E9E2D8',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.10)',
  orange: '#F28C28',
  orangeSoft: 'rgba(242,140,40,0.12)',
  purple: '#7B4BB7',
  purpleSoft: 'rgba(123,75,183,0.12)',
  green: '#6B9A2F',
  greenSoft: 'rgba(107,154,47,0.14)',
};

function formatPrice(price, currency = 'FCFA') {
  return `${Number(price || 0).toLocaleString('fr-FR')} ${currency}`;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [];
}

function getTerrainImage(terrain) {
  const mainImage =
    terrain?.mainImage?.url ||
    terrain?.mainImage?.secure_url ||
    terrain?.mainImage ||
    null;

  if (mainImage && typeof mainImage === 'string') {
    return { uri: mainImage };
  }

  if (Array.isArray(terrain?.images) && terrain.images.length > 0) {
    const first = terrain.images[0];
    if (typeof first === 'string') return { uri: first };
    if (first?.url) return { uri: first.url };
    if (first?.secure_url) return { uri: first.secure_url };
  }

  if (terrain?.photo_url) return { uri: terrain.photo_url };

  return {
    uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  };
}

function getSurfaceLabel(terrain) {
  return `${terrain?.surface_m2 || terrain?.surfaceM2 || terrain?.surface || 400} m²`;
}

function getCatalogTags(terrain) {
  return normalizeArray(terrain?.catalogTags || terrain?.catalog_tags || terrain?.badges);
}

function getTagMeta(terrain) {
  const tags = getCatalogTags(terrain);

  if (tags.includes('premium')) {
    return {
      label: 'Premium',
      bg: BRAND.purpleSoft,
      color: BRAND.purple,
    };
  }

  if (tags.includes('agricole') || terrain?.terrainUse === 'agricole') {
    return {
      label: 'Agricole',
      bg: BRAND.greenSoft,
      color: BRAND.green,
    };
  }

  if (tags.includes('echelonne')) {
    return {
      label: 'Échelonné',
      bg: BRAND.orangeSoft,
      color: BRAND.orange,
    };
  }

  if (tags.includes('nouveau')) {
    return {
      label: 'Nouveau',
      bg: BRAND.tealSoft,
      color: BRAND.teal,
    };
  }

  if (terrain?.catalogBucket === 'opportunite') {
    return {
      label: 'Opportunité',
      bg: BRAND.orangeSoft,
      color: BRAND.orange,
    };
  }

  return {
    label: null,
    bg: BRAND.tealSoft,
    color: BRAND.teal,
  };
}

function getTitle(terrain) {
  if (terrain?.title) return terrain.title;
  if (terrain?.ref) return `Terrain ${terrain.ref}`;
  return 'Terrain disponible';
}

export default function TerrainCard({ terrain, onPress }) {
  const imageSource = useMemo(() => getTerrainImage(terrain), [terrain]);
  const tag = useMemo(() => getTagMeta(terrain), [terrain]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.imageWrap}>
        <Image source={imageSource} style={styles.image} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {getTitle(terrain)}
          </Text>

          <View style={styles.titleRight}>
            <Ionicons name="shield-checkmark-outline" size={14} color={BRAND.teal} />
            <Text style={styles.titleRightText} numberOfLines={1}>
              Titre foncier
            </Text>
          </View>
        </View>

        <View style={styles.priceSurfaceRow}>
          <View style={styles.surfaceWrap}>
            <Ionicons name="resize-outline" size={15} color={BRAND.textSoft} />
            <Text style={styles.surfaceText} numberOfLines={1}>
              {getSurfaceLabel(terrain)}
            </Text>
          </View>

          <Text style={styles.price} numberOfLines={1}>
            {formatPrice(
              terrain?.price,
              terrain?.currency === 'XOF' ? 'FCFA' : terrain?.currency || 'FCFA'
            )}
          </Text>
        </View>

        {tag.label ? (
          <View style={[styles.tagPill, { backgroundColor: tag.bg }]}>
            <Text style={[styles.tagPillText, { color: tag.color }]}>{tag.label}</Text>
          </View>
        ) : null}

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color={BRAND.textSoft} />
          <Text style={styles.locationText} numberOfLines={1}>
            {terrain?.location || 'Mali'}
          </Text>
        </View>
      </View>

      <View style={styles.chevronWrap}>
        <Ionicons name="chevron-forward" size={22} color="#8A8A8A" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BRAND.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.border,
    overflow: 'hidden',
  },

  imageWrap: {
    height: 165,
    position: 'relative',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  content: {
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },

  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    color: BRAND.text,
  },

  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 120,
    marginTop: 2,
  },

  titleRightText: {
    fontSize: 13,
    color: BRAND.teal,
    fontWeight: '700',
  },

  priceSurfaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  surfaceWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  surfaceText: {
    flexShrink: 1,
    fontSize: 14,
    color: BRAND.textSoft,
  },

  price: {
    flexShrink: 1,
    maxWidth: '52%',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: BRAND.teal,
    textAlign: 'right',
  },

  tagPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  tagPillText: {
    fontSize: 13,
    fontWeight: '800',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  locationText: {
    flex: 1,
    fontSize: 14,
    color: BRAND.textSoft,
  },

  chevronWrap: {
    alignItems: 'flex-end',
    paddingRight: 14,
    paddingBottom: 14,
  },
});