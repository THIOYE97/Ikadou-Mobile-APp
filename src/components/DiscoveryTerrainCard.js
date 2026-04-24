import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
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
  purpleSoft: 'rgba(123,75,183,0.14)',
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

function getCatalogTags(terrain) {
  return normalizeArray(terrain?.catalogTags || terrain?.catalog_tags || terrain?.badges);
}

function getVisibleTag(terrain) {
  const tags = getCatalogTags(terrain);

  if (tags.includes('premium')) {
    return {
      label: 'PREMIUM',
      bg: BRAND.purple,
      soft: BRAND.purpleSoft,
      color: BRAND.purple,
    };
  }

  if (tags.includes('agricole') || terrain?.terrainUse === 'agricole') {
    return {
      label: 'AGRICOLE',
      bg: BRAND.green,
      soft: BRAND.greenSoft,
      color: BRAND.green,
    };
  }

  if (tags.includes('echelonne')) {
    return {
      label: 'ÉCHELONNÉ',
      bg: BRAND.orange,
      soft: BRAND.orangeSoft,
      color: BRAND.orange,
    };
  }

  if (tags.includes('nouveau')) {
    return {
      label: 'NOUVEAU',
      bg: BRAND.teal,
      soft: BRAND.tealSoft,
      color: BRAND.teal,
    };
  }

  return {
    label: null,
    bg: BRAND.teal,
    soft: BRAND.tealSoft,
    color: BRAND.teal,
  };
}

function getCategoryLabel(terrain) {
  if (terrain?.terrainUse === 'agricole' || getCatalogTags(terrain).includes('agricole')) {
    return 'Terrain agricole';
  }

  if (getCatalogTags(terrain).includes('premium')) {
    return 'Terrain premium';
  }

  if (terrain?.catalogBucket === 'opportunite') {
    return 'Opportunité terrain';
  }

  return 'Terrain disponible';
}

export default function DiscoveryTerrainCard({ terrain, onPress }) {
  const badge = useMemo(() => getVisibleTag(terrain), [terrain]);
  const imageSource = useMemo(() => getTerrainImage(terrain), [terrain]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <ImageBackground source={imageSource} style={styles.image} imageStyle={styles.imageRadius}>
        <View style={styles.imageTopRow}>
          {badge.label ? (
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={styles.badgeText}>{badge.label}</Text>
            </View>
          ) : (
            <View />
          )}
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <Text style={styles.kindText}>{getCategoryLabel(terrain)}</Text>

        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {terrain?.title || terrain?.ref || 'Terrain disponible'}
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
              {terrain?.surface_m2 || terrain?.surfaceM2 || terrain?.surface || 400} m²
            </Text>
          </View>

          <Text style={styles.priceText} numberOfLines={1}>
            {formatPrice(
              terrain?.price,
              terrain?.currency === 'XOF' ? 'FCFA' : terrain?.currency || 'FCFA'
            )}
          </Text>
        </View>

        {badge.label ? (
          <View style={[styles.tagPill, { backgroundColor: badge.soft }]}>
            <Text style={[styles.tagPillText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        ) : null}

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color={BRAND.textSoft} />
          <Text style={styles.locationText} numberOfLines={1}>
            {terrain?.location || 'Mali'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 258,
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
    overflow: 'hidden',
  },

  image: {
    height: 190,
    justifyContent: 'space-between',
    padding: 14,
  },

  imageRadius: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  imageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  badge: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },

  content: {
    padding: 14,
  },

  kindText: {
    fontSize: 13,
    color: BRAND.textSoft,
    marginBottom: 8,
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
    maxWidth: 118,
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

  priceText: {
    flexShrink: 1,
    maxWidth: '52%',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: BRAND.text,
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
    gap: 4,
  },

  locationText: {
    flex: 1,
    color: BRAND.textSoft,
    fontSize: 14,
    fontWeight: '600',
  },
});