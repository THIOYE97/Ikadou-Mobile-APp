import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { getTerrainsForMap } from '../api/terrains';
import { normalizeMapTerrains } from '../api/mappers';

const BRAND = {
  bg: '#F7F4EF',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#6F6B64',
  border: '#E9E2D8',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.10)',
  orange: '#F28C28',
  danger: '#D64545',
  dangerSoft: 'rgba(214,69,69,0.08)',
};

const DEFAULT_REGION = {
  latitude: 12.6392,
  longitude: -8.0029,
  latitudeDelta: 2.5,
  longitudeDelta: 2.5,
};

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

  const rawPrice = Number(
    marker?.price ??
      routeParams?.price ??
      marker?.amount ??
      0
  );

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
    price: Number.isFinite(rawPrice) ? rawPrice : 0,
    surface: marker?.surface ?? routeParams?.terrainSurface ?? '—',
  };
}

function EmptyMapState({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="location-outline" size={34} color={BRAND.teal} />
        </View>

        <Text style={styles.emptyTitle}>Localisation indisponible</Text>
        <Text style={styles.emptyText}>
          Les coordonnées de ce terrain ne sont pas disponibles ou sont invalides.
        </Text>

        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.9}
        >
          <Text style={styles.emptyBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function MapViewScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const routeParams = route?.params ?? {};

  const markerPin = useMemo(
    () => normalizeMarkerPin(routeParams.marker, routeParams),
    [routeParams]
  );

  const [pins, setPins] = useState(markerPin ? [markerPin] : []);
  const [loading, setLoading] = useState(!markerPin);
  const [selected, setSelected] = useState(markerPin ?? null);
  const [mapReady, setMapReady] = useState(false);

  const initialRegion = useMemo(() => {
    if (markerPin) {
      return {
        latitude: markerPin.latitude,
        longitude: markerPin.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }

    const firstPin = pins.find((pin) =>
      isValidCoordinate(toNumber(pin.latitude), toNumber(pin.longitude))
    );

    if (firstPin) {
      return {
        latitude: toNumber(firstPin.latitude),
        longitude: toNumber(firstPin.longitude),
        latitudeDelta: 0.9,
        longitudeDelta: 0.9,
      };
    }

    return DEFAULT_REGION;
  }, [markerPin, pins]);

  const loadPins = useCallback(async () => {
    if (markerPin) {
      setPins([markerPin]);
      setSelected(markerPin);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await getTerrainsForMap(routeParams?.filters ?? {});
      const normalized = normalizeMapTerrains(res?.data);

      const validPins = (Array.isArray(normalized) ? normalized : [])
        .map((pin) => normalizeMarkerPin(pin, routeParams))
        .filter(Boolean);

      setPins(validPins);
      setSelected(validPins[0] ?? null);
    } catch {
      setPins([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [markerPin, routeParams]);

  useEffect(() => {
    loadPins();
  }, [loadPins]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !pins.length) return;

    const validCoords = pins
      .map((p) => ({
        latitude: toNumber(p.latitude),
        longitude: toNumber(p.longitude),
      }))
      .filter((c) => isValidCoordinate(c.latitude, c.longitude));

    if (!validCoords.length) return;

    const timeout = setTimeout(() => {
      try {
        if (validCoords.length === 1) {
          mapRef.current?.animateToRegion(
            {
              latitude: validCoords[0].latitude,
              longitude: validCoords[0].longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            },
            350
          );
        } else {
          mapRef.current?.fitToCoordinates(validCoords, {
            edgePadding: { top: 120, right: 60, bottom: 180, left: 60 },
            animated: true,
          });
        }
      } catch {}
    }, 550);

    return () => clearTimeout(timeout);
  }, [mapReady, pins]);

  if (!loading && !pins.length) {
    return <EmptyMapState navigation={navigation} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.9}
        >
          <Ionicons name="arrow-back" size={16} color={BRAND.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.countBadge}>
          <Ionicons name="location-outline" size={14} color={BRAND.teal} />
          <Text style={styles.countText}>
            {pins.length} terrain{pins.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={BRAND.teal} size="large" />
          <Text style={styles.loadingText}>Chargement de la carte…</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          onMapReady={() => setMapReady(true)}
          onPress={() => setSelected(null)}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          moveOnMarkerPress={false}
        >
          {pins.map((pin) => {
            const latitude = toNumber(pin.latitude);
            const longitude = toNumber(pin.longitude);

            if (!isValidCoordinate(latitude, longitude)) return null;

            return (
              <Marker
                key={String(pin.id)}
                coordinate={{ latitude, longitude }}
                title={pin.title}
                description={pin.location}
                tracksViewChanges={false}
                onPress={() => setSelected(pin)}
              >
                <View style={[styles.pin, selected?.id === pin.id && styles.pinActive]}>
                  <Text
                    style={[
                      styles.pinLabel,
                      selected?.id === pin.id && styles.pinLabelActive,
                    ]}
                  >
                    {pin.price > 0 ? `${Math.round(Number(pin.price) / 1000)}k` : 'Voir'}
                  </Text>
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {selected ? (
        <View style={[styles.previewWrap, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
          <View style={styles.previewCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {selected.title}
              </Text>
              <Text style={styles.previewLocation} numberOfLines={1}>
                {selected.location}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.previewCta}
              onPress={() =>
                navigation.navigate('TerrainDetail', {
                  id: selected.id,
                  terrain: selected,
                })
              }
              activeOpacity={0.9}
            >
              <Text style={styles.previewCtaText}>Voir</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.bg },

  map: { flex: 1 },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: BRAND.bg,
  },

  loadingText: {
    color: BRAND.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  backBtn: {
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

  countBadge: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: BRAND.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(0,140,140,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  countText: {
    color: BRAND.teal,
    fontWeight: '800',
    fontSize: 13,
  },

  pin: {
    backgroundColor: BRAND.white,
    borderWidth: 1.5,
    borderColor: BRAND.teal,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  pinActive: {
    backgroundColor: BRAND.teal,
  },

  pinLabel: {
    color: BRAND.teal,
    fontSize: 11,
    fontWeight: '900',
  },

  pinLabelActive: {
    color: '#fff',
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
    shadowColor: '#111111',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
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

  previewCta: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: BRAND.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewCtaText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: BRAND.text,
    textAlign: 'center',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textSoft,
    textAlign: 'center',
  },

  emptyBtn: {
    marginTop: 18,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: BRAND.teal,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
});