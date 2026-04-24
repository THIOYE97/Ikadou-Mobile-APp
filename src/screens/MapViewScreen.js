import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
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
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function normalizeMarkerPin(marker, routeParams = {}) {
  if (!marker) return null;

  const latitude =
    toNumber(marker.latitude) ??
    toNumber(routeParams?.initialCoordinates?.latitude);

  const longitude =
    toNumber(marker.longitude) ??
    toNumber(routeParams?.initialCoordinates?.longitude);

  if (!isValidCoordinate(latitude, longitude)) return null;

  const rawPrice = Number(
    marker.price ??
      routeParams?.price ??
      marker.amount ??
      0
  );

  return {
    id: marker.id ?? routeParams?.terrainId ?? 'terrain',
    title: marker.title ?? routeParams?.terrainTitle ?? 'Terrain',
    location:
      marker.description ??
      marker.location ??
      routeParams?.terrainLocation ??
      'Localisation indisponible',
    latitude,
    longitude,
    price: Number.isFinite(rawPrice) ? rawPrice : 0,
    
    surface:
      marker.surface ??
      routeParams?.terrainSurface ??
      '—',
  };
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

  const initialRegion = useMemo(() => {
    const coords = routeParams?.initialCoordinates;

    if (coords) {
      const lat = toNumber(coords.latitude);
      const lng = toNumber(coords.longitude);

      if (isValidCoordinate(lat, lng)) {
        return {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
      }
    }

    if (markerPin) {
      return {
        latitude: markerPin.latitude,
        longitude: markerPin.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }

    if (pins.length) {
      return {
        latitude: pins[0].latitude,
        longitude: pins[0].longitude,
        latitudeDelta: 0.9,
        longitudeDelta: 0.9,
      };
    }

    return DEFAULT_REGION;
  }, [markerPin, pins, routeParams?.initialCoordinates]);

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
      const normalized = normalizeMapTerrains(res.data);

      const validPins = (Array.isArray(normalized) ? normalized : []).filter((pin) =>
        isValidCoordinate(toNumber(pin.latitude), toNumber(pin.longitude))
      );

      setPins(validPins);
      setSelected(null);
    } catch {
      setPins([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [markerPin, routeParams?.filters]);

  useEffect(() => {
    loadPins();
  }, [loadPins]);

  useEffect(() => {
    if (!mapRef.current || !pins.length) return;

    const validCoords = pins
      .map((p) => ({
        latitude: toNumber(p.latitude),
        longitude: toNumber(p.longitude),
      }))
      .filter((c) => isValidCoordinate(c.latitude, c.longitude));

    if (!validCoords.length) return;

    const timeout = setTimeout(() => {
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
    }, 350);

    return () => clearTimeout(timeout);
  }, [pins]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.9}
        >
          <Ionicons name="arrow-back" size={16} color={BRAND.text} />
          <Text style={styles.backText}>Liste</Text>
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
          style={styles.map}
          initialRegion={initialRegion}
          onPress={() => setSelected(null)}
        >
          {pins.map((pin) => {
            const latitude = toNumber(pin.latitude);
            const longitude = toNumber(pin.longitude);

            if (!isValidCoordinate(latitude, longitude)) return null;

            return (
              <Marker
                key={String(pin.id)}
                coordinate={{ latitude, longitude }}
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
    fontWeight: '700',
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
    fontWeight: '800',
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
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.text,
    marginBottom: 2,
  },
  previewLocation: {
    fontSize: 12,
    color: BRAND.textSoft,
  },
  previewPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.teal,
    marginTop: 6,
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
    fontWeight: '800',
    fontSize: 14,
  },
});