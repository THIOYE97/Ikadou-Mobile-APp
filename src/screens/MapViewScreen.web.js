// src/screens/MapViewScreen.web.js
// Metro charge ce fichier automatiquement sur le web.
// react-native-maps n'est JAMAIS importé ici.

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { getTerrainsForMap } from '../api/terrains';

const MOCK_PINS = [
  { id: '1', price: 850000, title: 'Terrain Sébenikoro', surface: '500 m²', location: 'Bamako, Sébenikoro' },
  { id: '2', price: 620000, title: 'Terrain Diago', surface: '320 m²', location: 'Kati, Diago' },
  { id: '3', price: 1200000, title: 'Cité du Niger', surface: '800 m²', location: 'Bamako, Cité du Niger' },
  { id: '4', price: 420000, title: 'Terrain Sébougou', surface: '5 000 m²', location: 'Ségou, Sébougou' },
  { id: '5', price: 2100000, title: 'Grand Marché', surface: '1 200 m²', location: 'Bamako, Grand Marché' },
  { id: '6', price: 780000, title: 'Terrain Diatoula', surface: '450 m²', location: 'Kati, Diatoula' },
];

function normalizeMarkerToPin(marker, routeParams) {
  if (!marker) return null;

  const latitude = Number(marker.latitude);
  const longitude = Number(marker.longitude);

  return {
    id: marker.id ?? routeParams?.terrainId ?? 'terrain',
    title: marker.title ?? routeParams?.terrainTitle ?? 'Terrain',
    surface: marker.surface ?? routeParams?.terrainSurface ?? '—',
    location: marker.description ?? routeParams?.terrainLocation ?? 'Localisation indisponible',
    price: Number(marker.price ?? routeParams?.price ?? 0),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

export default function MapViewScreen({ navigation, route }) {
  const routeParams = route?.params ?? {};
  const markerPin = useMemo(
    () => normalizeMarkerToPin(routeParams.marker, routeParams),
    [routeParams]
  );

  const [pins, setPins] = useState(markerPin ? [markerPin] : []);
  const [loading, setLoading] = useState(!markerPin);

  useEffect(() => {
    let mounted = true;

    async function loadPins() {
      if (markerPin) {
        setPins([markerPin]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const res = await getTerrainsForMap(routeParams.filters ?? {});
        const data = res?.data?.items ?? res?.data ?? [];

        if (!mounted) return;

        if (Array.isArray(data) && data.length > 0) {
          setPins(data);
        } else {
          setPins(MOCK_PINS);
        }
      } catch {
        if (!mounted) return;
        setPins(MOCK_PINS);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPins();

    return () => {
      mounted = false;
    };
  }, [markerPin, routeParams.filters]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {pins.length} terrain{pins.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>🗺️</Text>
        <Text style={styles.bannerText}>
          {markerPin
            ? 'Voici la localisation enregistrée pour ce terrain dans l’application.'
            : "La vue carte interactive complète est disponible sur l'app mobile iOS / Android."}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {(loading ? Array(4).fill(null) : pins).map((pin, i) =>
          pin === null ? (
            <View key={i} style={[styles.row, styles.skeleton]} />
          ) : (
            <TouchableOpacity
              key={pin.id ?? i}
              style={styles.row}
              onPress={() =>
                navigation.navigate('TerrainDetail', {
                  id: pin.id,
                  terrain: pin,
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.pinMarker}>
                <Text style={styles.pinEmoji}>📍</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {pin.title ?? 'Terrain'}
                </Text>

                <Text style={styles.rowLoc} numberOfLines={1}>
                  {pin.location ?? pin.loc ?? 'Localisation indisponible'}
                </Text>

                <Text style={styles.rowSurface}>
                  {pin.surface ?? '—'}
                </Text>

                {pin.latitude != null && pin.longitude != null ? (
                  <Text style={styles.rowCoords} numberOfLines={1}>
                    {pin.latitude}, {pin.longitude}
                  </Text>
                ) : null}
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.rowPrice}>
                  {Number(pin.price ?? 0).toLocaleString('fr-FR')}
                </Text>
                <Text style={styles.rowCurrency}>FCFA</Text>
              </View>
            </TouchableOpacity>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderFaint,
  },

  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countBadge: {
    backgroundColor: Colors.tealAlpha,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,168,181,.3)',
  },

  countText: {
    color: Colors.teal,
    fontWeight: '700',
    fontSize: Typography.body2,
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    margin: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  bannerIcon: {
    fontSize: 20,
  },

  bannerText: {
    flex: 1,
    fontSize: Typography.caption,
    color: Colors.textMuted,
    lineHeight: 18,
  },

  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 40,
    gap: Spacing.sm,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  skeleton: {
    height: 72,
    backgroundColor: Colors.mid,
    opacity: 0.4,
  },

  pinMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.orangeAlpha,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  pinEmoji: {
    fontSize: 16,
  },

  rowTitle: {
    fontSize: Typography.body2,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },

  rowLoc: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginBottom: 2,
  },

  rowSurface: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },

  rowCoords: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },

  rowRight: {
    alignItems: 'flex-end',
  },

  rowPrice: {
    fontSize: Typography.body1,
    fontWeight: '800',
    color: Colors.teal,
  },

  rowCurrency: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
});