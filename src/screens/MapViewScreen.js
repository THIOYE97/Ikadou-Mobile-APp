import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapLibreGL from '@maplibre/maplibre-react-native';

MapLibreGL.setAccessToken(null);

const BRAND = {
  bg: '#F7F4EF',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#6F6B64',
  border: '#E9E2D8',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.10)',
  orange: '#F28C28',
};

const STYLE_URL = 'https://demotiles.maplibre.org/style.json';

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isValidCoordinate(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function normalizeMarkerPin(marker, routeParams = {}) {
  const latitude =
    toNumber(marker?.latitude) ??
    toNumber(routeParams?.initialCoordinates?.latitude);

  const longitude =
    toNumber(marker?.longitude) ??
    toNumber(routeParams?.initialCoordinates?.longitude);

  if (!isValidCoordinate(latitude, longitude)) return null;

  return {
    id: marker?.id ?? routeParams?.terrainId ?? 'terrain',
    title: marker?.title ?? routeParams?.terrainTitle ?? 'Terrain',
    location:
      marker?.description ??
      marker?.location ??
      routeParams?.terrainLocation ??
      'Localisation indisponible',
    latitude,
    longitude,
  };
}

export default function MapViewScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const routeParams = route?.params ?? {};

  const pin = useMemo(
    () => normalizeMarkerPin(routeParams.marker, routeParams),
    [routeParams]
  );

  if (!pin) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyWrap}>
          <Ionicons name="location-outline" size={34} color={BRAND.teal} />
          <Text style={styles.emptyTitle}>Localisation indisponible</Text>
          <Text style={styles.emptyText}>
            Les coordonnées de ce terrain ne sont pas encore disponibles.
          </Text>
          <TouchableOpacity style={styles.backPrimary} onPress={() => navigation.goBack()}>
            <Text style={styles.backPrimaryText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const center = [pin.longitude, pin.latitude];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <MapLibreGL.MapView style={styles.map} mapStyle={STYLE_URL}>
        <MapLibreGL.Camera zoomLevel={15} centerCoordinate={center} />

        <MapLibreGL.PointAnnotation id={String(pin.id)} coordinate={center}>
          <View style={styles.marker}>
            <Ionicons name="home" size={16} color="#fff" />
          </View>
        </MapLibreGL.PointAnnotation>
      </MapLibreGL.MapView>

      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={16} color={BRAND.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.previewWrap, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
        <View style={styles.previewCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewTitle} numberOfLines={1}>{pin.title}</Text>
            <Text style={styles.previewLocation} numberOfLines={1}>{pin.location}</Text>
          </View>

          <View style={styles.coordsPill}>
            <Ionicons name="navigate-outline" size={14} color={BRAND.teal} />
            <Text style={styles.coordsText}>Position</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },
  map: { flex: 1 },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },

  backBtn: {
    alignSelf: 'flex-start',
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  backText: {
    color: BRAND.text,
    fontWeight: '800',
    fontSize: 14,
  },

  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.teal,
    borderWidth: 3,
    borderColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },

  previewCard: {
    backgroundColor: BRAND.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },

  previewTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: BRAND.text,
    marginBottom: 2,
  },

  previewLocation: {
    fontSize: 12,
    color: BRAND.textSoft,
  },

  coordsPill: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  coordsText: {
    color: BRAND.teal,
    fontWeight: '800',
    fontSize: 12,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '900',
    color: BRAND.text,
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
    textAlign: 'center',
  },

  backPrimary: {
    marginTop: 18,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backPrimaryText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
});