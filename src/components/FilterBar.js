import React, { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPublicFilters } from '../api/filters';

const BRAND = {
  bg: '#F3F3F3',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#666666',
  border: '#E8E8E8',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.08)',
  orange: '#F28C28',
};

const DEFAULT_FILTERS = {
  minPrice: '',
  maxPrice: '',
  minSurface: '',
  maxSurface: '',
  city: 'Toutes',
  zone_id: '',
  sort: 'created_at',
  order: 'desc',
};

const FALLBACK_SORTS = [
  { label: 'Plus récents', value: 'created_at', order: 'desc' },
  { label: 'Prix croissant', value: 'price', order: 'asc' },
  { label: 'Prix décroissant', value: 'price', order: 'desc' },
  { label: 'Surface croissante', value: 'surface_m2', order: 'asc' },
  { label: 'Surface décroissante', value: 'surface_m2', order: 'desc' },
  { label: 'Titre A-Z', value: 'title', order: 'asc' },
];

export default function FilterBar({ filters, onFiltersChange }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);

  const [loadingMeta, setLoadingMeta] = useState(false);
  const [filterMeta, setFilterMeta] = useState({
    zones: [],
    locations: [],
    ranges: {},
    sorts: FALLBACK_SORTS,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingMeta(true);
      try {
        const res = await getPublicFilters();
        const data = res.data?.data ?? {};

        if (!mounted) return;

        setFilterMeta({
          zones: Array.isArray(data.zones) ? data.zones : [],
          locations: Array.isArray(data.locations) ? data.locations : [],
          ranges: data.ranges ?? {},
          sorts: Array.isArray(data.sorts) && data.sorts.length ? data.sorts : FALLBACK_SORTS,
        });
      } catch (_) {
        if (!mounted) return;
        setFilterMeta((prev) => ({
          ...prev,
          sorts: FALLBACK_SORTS,
        }));
      } finally {
        if (mounted) setLoadingMeta(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const cityOptions = useMemo(
    () => ['Toutes', ...(filterMeta.locations ?? [])],
    [filterMeta.locations]
  );

  const activeCount = Object.entries(filters).filter(([key, v]) => {
    if (key === 'sort' || key === 'order') return false;
    return v && v !== 'Toutes';
  }).length;

  const selectedSort = (filterMeta.sorts ?? FALLBACK_SORTS).find(
    (s) => s.value === draft.sort && s.order === draft.order
  );

  const selectedZone = (filterMeta.zones ?? []).find((z) => z.id === filters.zone_id);

  function applyFilters() {
    onFiltersChange(draft);
    setOpen(false);
  }

  function resetFilters() {
    setDraft(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
    setOpen(false);
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.rowContent}
      >
        <TouchableOpacity
          style={[styles.triggerChip, activeCount > 0 && styles.triggerChipActive]}
          onPress={() => {
            setDraft(filters);
            setOpen(true);
          }}
          activeOpacity={0.88}
        >
          <Text style={[styles.triggerText, activeCount > 0 && styles.triggerTextActive]}>
            Filtres{activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
        </TouchableOpacity>

        {filters.city && filters.city !== 'Toutes' ? (
          <MiniChip
            label={filters.city}
            onPress={() => onFiltersChange({ ...filters, city: 'Toutes' })}
          />
        ) : null}

        {selectedZone ? (
          <MiniChip
            label={selectedZone.name}
            onPress={() => onFiltersChange({ ...filters, zone_id: '' })}
          />
        ) : null}

        {(filters.minPrice || filters.maxPrice) ? (
          <MiniChip
            label="Prix"
            onPress={() => onFiltersChange({ ...filters, minPrice: '', maxPrice: '' })}
          />
        ) : null}

        {(filters.minSurface || filters.maxSurface) ? (
          <MiniChip
            label="Surface"
            onPress={() => onFiltersChange({ ...filters, minSurface: '', maxSurface: '' })}
          />
        ) : null}
      </ScrollView>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filtres</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.resetBtn}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {loadingMeta ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={BRAND.teal} />
                <Text style={styles.loadingText}>Chargement des filtres…</Text>
              </View>
            ) : null}

            <FilterSection title="Localisation">
              <View style={styles.chipGrid}>
                {cityOptions.map((c) => (
                  <SelectChip
                    key={c}
                    label={c}
                    active={draft.city === c}
                    onPress={() => setDraft((d) => ({ ...d, city: c }))}
                  />
                ))}
              </View>
            </FilterSection>

            {(filterMeta.zones ?? []).length > 0 ? (
              <FilterSection title="Zone">
                <View style={styles.chipGrid}>
                  <SelectChip
                    label="Toutes"
                    active={!draft.zone_id}
                    onPress={() => setDraft((d) => ({ ...d, zone_id: '' }))}
                  />
                  {filterMeta.zones.map((z) => (
                    <SelectChip
                      key={z.id}
                      label={z.name}
                      active={draft.zone_id === z.id}
                      onPress={() => setDraft((d) => ({ ...d, zone_id: z.id }))}
                    />
                  ))}
                </View>
              </FilterSection>
            ) : null}

            <FilterSection title="Budget (FCFA)">
              <View style={styles.rangeRow}>
                <Field
                  label="Min"
                  value={draft.minPrice}
                  placeholder={filterMeta.ranges?.min_price != null ? String(filterMeta.ranges.min_price) : '0'}
                  onChangeText={(v) => setDraft((d) => ({ ...d, minPrice: v }))}
                />
                <Field
                  label="Max"
                  value={draft.maxPrice}
                  placeholder={filterMeta.ranges?.max_price != null ? String(filterMeta.ranges.max_price) : '∞'}
                  onChangeText={(v) => setDraft((d) => ({ ...d, maxPrice: v }))}
                />
              </View>
            </FilterSection>

            <FilterSection title="Superficie (m²)">
              <View style={styles.rangeRow}>
                <Field
                  label="Min"
                  value={draft.minSurface}
                  placeholder={filterMeta.ranges?.min_surface != null ? String(filterMeta.ranges.min_surface) : '0'}
                  onChangeText={(v) => setDraft((d) => ({ ...d, minSurface: v }))}
                />
                <Field
                  label="Max"
                  value={draft.maxSurface}
                  placeholder={filterMeta.ranges?.max_surface != null ? String(filterMeta.ranges.max_surface) : '∞'}
                  onChangeText={(v) => setDraft((d) => ({ ...d, maxSurface: v }))}
                />
              </View>
            </FilterSection>

            <FilterSection title="Tri">
              <View style={styles.chipGrid}>
                {(filterMeta.sorts ?? FALLBACK_SORTS).map((s) => (
                  <SelectChip
                    key={`${s.value}_${s.order}`}
                    label={s.label}
                    active={draft.sort === s.value && draft.order === s.order}
                    onPress={() => setDraft((d) => ({ ...d, sort: s.value, order: s.order }))}
                  />
                ))}
              </View>
            </FilterSection>
          </ScrollView>

          <View style={[styles.sheetFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters} activeOpacity={0.9}>
              <Text style={styles.applyBtnText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function MiniChip({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.miniChip} onPress={onPress} activeOpacity={0.88}>
      <Text style={styles.miniChipText}>{label} ✕</Text>
    </TouchableOpacity>
  );
}

function SelectChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.selectChip, active && styles.selectChipActive]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Field({ label, value, placeholder, onChangeText }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.rangeLabel}>{label}</Text>
      <TextInput
        style={styles.rangeInput}
        placeholder={placeholder}
        placeholderTextColor="#9A9A9A"
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function FilterSection({ title, children }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 10 },
  rowContent: { gap: 8, paddingHorizontal: 2, paddingBottom: 4 },

  triggerChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerChipActive: {
    backgroundColor: BRAND.tealSoft,
    borderColor: 'rgba(0,140,140,.25)',
  },
  triggerText: {
    fontSize: 12,
    color: BRAND.textSoft,
    fontWeight: '700',
  },
  triggerTextActive: {
    color: BRAND.teal,
  },

  miniChip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniChipText: {
    fontSize: 12,
    color: BRAND.teal,
    fontWeight: '700',
  },

  sheet: {
    flex: 1,
    backgroundColor: BRAND.bg,
    paddingTop: 8,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.text,
  },
  resetBtn: {
    fontSize: 13,
    color: BRAND.orange,
    fontWeight: '700',
  },

  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    color: BRAND.textSoft,
    fontSize: 14,
  },

  filterSection: {
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectChip: {
    minHeight: 36,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    justifyContent: 'center',
  },
  selectChipActive: {
    backgroundColor: BRAND.tealSoft,
    borderColor: BRAND.teal,
  },
  selectChipText: {
    fontSize: 13,
    color: BRAND.textSoft,
    fontWeight: '600',
  },
  selectChipTextActive: {
    color: BRAND.teal,
    fontWeight: '800',
  },

  rangeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rangeLabel: {
    fontSize: 11,
    color: BRAND.textSoft,
    marginBottom: 4,
  },
  rangeInput: {
    height: 44,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    color: BRAND.text,
    fontSize: 14,
  },

  sheetFooter: {
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    backgroundColor: BRAND.bg,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  applyBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});