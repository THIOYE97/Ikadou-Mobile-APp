import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TerrainCard from '../components/TerrainCard';
import DiscoveryTerrainCard from '../components/DiscoveryTerrainCard';
import FilterBar from '../components/FilterBar';
import { EmptyState, ErrorState } from '../components/UI';
import { getTerrains } from '../api/terrains';
import { normalizeTerrainsResponse } from '../api/mappers';

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

const BRAND = {
  bg: '#F7F4EF',
  bgSoft: '#FCFAF7',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#6F6B64',
  border: '#E9E2D8',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.10)',
  orange: '#F28C28',
  orangeSoft: 'rgba(242,140,40,0.12)',
};

const CATEGORIES = [
  { key: 'all', label: 'Tous', icon: 'apps-outline' },
  { key: 'a_decouvrir', label: 'À découvrir', icon: 'sparkles-outline' },
  { key: 'opportunite', label: 'Opportunités', icon: 'flash-outline' },
  { key: 'agricole', label: 'Agricole', icon: 'leaf-outline' },
];

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [];
}

function getCatalogTags(terrain) {
  return normalizeArray(terrain?.catalogTags || terrain?.catalog_tags || terrain?.badges);
}

function hasTag(terrain, tag) {
  return getCatalogTags(terrain).includes(tag);
}

function filterByCategory(items, selectedCategory) {
  if (selectedCategory === 'all') return items;

  if (selectedCategory === 'a_decouvrir') {
    return items.filter(
      (t) => t.displayInDiscovery || t.catalogBucket === 'a_decouvrir'
    );
  }

  if (selectedCategory === 'opportunite') {
    return items.filter((t) => t.catalogBucket === 'opportunite');
  }

  if (selectedCategory === 'agricole') {
    return items.filter(
      (t) =>
        t.terrainUse === 'agricole' ||
        t.catalogBucket === 'agricole' ||
        hasTag(t, 'agricole')
    );
  }



  return items;
}

export default function CatalogueScreen({ navigation }) {
  const [terrains, setTerrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const fetchingMore = useRef(false);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'sort' || key === 'order') return false;
      return value && value !== 'Toutes';
    }).length;
  }, [filters]);

  const load = useCallback(
    async (reset = false) => {
      if (!reset && !hasMore) return;
      if (fetchingMore.current && !reset) return;

      fetchingMore.current = true;
      if (reset) setLoading(true);

      try {
        const currentPage = reset ? 1 : page;

        const res = await getTerrains({
          page: currentPage,
          limit: 12,
          ...filters,
          q: search,
        });

        const normalized = normalizeTerrainsResponse(res.data);
        const incoming = filterByCategory(normalized.items || [], selectedCategory);

        setTerrains((prev) => (reset ? incoming : [...prev, ...incoming]));
        setPage(currentPage + 1);
        setHasMore((normalized.page ?? 1) < (normalized.pages ?? 1));
        setError(false);
      } catch (e) {
        console.log('CATALOGUE LOAD ERROR MESSAGE =', e?.message);
        console.log('CATALOGUE LOAD ERROR STATUS =', e?.response?.status);
        console.log('CATALOGUE LOAD ERROR DATA =', e?.response?.data);

        if (reset) setTerrains([]);
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
        fetchingMore.current = false;
      }
    },
    [filters, search, page, hasMore, selectedCategory]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    load(true);
  }, [filters, search, selectedCategory]);

  function onRefresh() {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    load(true);
  }

  function applyFilters(nextFilters) {
    setFilters(nextFilters);
  }

  function clearAllFilters() {
    applyFilters(DEFAULT_FILTERS);
  }

  const discoveryTerrains = useMemo(
    () =>
      terrains.filter((t) => t.displayInDiscovery || t.catalogBucket === 'a_decouvrir').slice(0, 6),
    [terrains]
  );

  const opportunityTerrains = useMemo(
    () => terrains.filter((t) => t.catalogBucket === 'opportunite').slice(0, 6),
    [terrains]
  );

  const agricoleTerrains = useMemo(
    () =>
      terrains.filter(
        (t) =>
          t.terrainUse === 'agricole' ||
          t.catalogBucket === 'agricole' ||
          hasTag(t, 'agricole')
      ).slice(0, 6),
    [terrains]
  );

  if (loading && terrains.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={BRAND.teal} size="large" />
        <Text style={styles.loadingText}>Chargement des terrains…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={terrains}
        keyExtractor={(t) => String(t.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BRAND.teal}
          />
        }
        onEndReached={() => load()}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <>
            <View style={styles.topBarSpace} />

            <View style={styles.searchRow}>
              <View style={styles.searchHero}>
                <Ionicons name="search-outline" size={22} color={BRAND.textSoft} />
                <TextInput
                  style={styles.searchHeroInput}
                  placeholder="Ville, quartier, zone…"
                  placeholderTextColor="#8E877D"
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
                {search.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.8}>
                    <Ionicons name="close-circle" size={20} color="#A19A90" />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.filterFabWrap}>
                <TouchableOpacity
                  style={styles.filterFab}
                  activeOpacity={0.9}
                  onPress={() => setShowFilters((v) => !v)}
                >
                  <Ionicons name="options-outline" size={22} color={BRAND.text} />
                </TouchableOpacity>
                <Text style={styles.filterFabText}>Filtres</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {CATEGORIES.map((item) => {
                const active = selectedCategory === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.categoryItem}
                    onPress={() => setSelectedCategory(item.key)}
                    activeOpacity={0.88}
                  >
                    <View
                      style={[
                        styles.categoryIconWrap,
                        active && styles.categoryIconWrapActive,
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={active ? BRAND.teal : BRAND.textSoft}
                      />
                    </View>

                    <Text
                      style={[
                        styles.categoryLabel,
                        active && styles.categoryLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>

                    {active ? <View style={styles.categoryUnderline} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {showFilters ? (
              <View style={styles.filterWrap}>
                <FilterBar filters={filters} onFiltersChange={applyFilters} />
              </View>
            ) : null}

            {activeFiltersCount > 0 ? (
              <TouchableOpacity
                style={styles.clearFiltersInline}
                onPress={clearAllFilters}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh-outline" size={15} color={BRAND.teal} />
                <Text style={styles.clearFiltersInlineText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            ) : null}

            {!error && discoveryTerrains.length > 0 ? (
              <>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>À découvrir</Text>
                  </View>
                </View>

                <FlatList
                  horizontal
                  data={discoveryTerrains}
                  keyExtractor={(item) => `discovery-${item.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
                  renderItem={({ item }) => (
                    <DiscoveryTerrainCard
                      terrain={item}
                      onPress={() =>
                        navigation.navigate('TerrainDetail', {
                          id: item.id,
                          terrain: item,
                          hideSupportFab: true,
                          source: 'catalogue',
                        })
                      }
                    />
                  )}
                />
              </>
            ) : null}

            {!error && opportunityTerrains.length > 0 ? (
              <>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Opportunités</Text>
                  </View>
                </View>

                <FlatList
                  horizontal
                  data={opportunityTerrains}
                  keyExtractor={(item) => `opportunity-${item.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
                  renderItem={({ item }) => (
                    <DiscoveryTerrainCard
                      terrain={item}
                      onPress={() =>
                        navigation.navigate('TerrainDetail', {
                          id: item.id,
                          terrain: item,
                          hideSupportFab: true,
                          source: 'catalogue',
                        })
                      }
                    />
                  )}
                />
              </>
            ) : null}

            {!error && agricoleTerrains.length > 0 ? (
              <>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Agricole</Text>
                  </View>
                </View>

                <FlatList
                  horizontal
                  data={agricoleTerrains}
                  keyExtractor={(item) => `agricole-${item.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
                  renderItem={({ item }) => (
                    <DiscoveryTerrainCard
                      terrain={item}
                      onPress={() =>
                        navigation.navigate('TerrainDetail', {
                          id: item.id,
                          terrain: item,
                          hideSupportFab: true,
                          source: 'catalogue',
                        })
                      }
                    />
                  )}
                />
              </>
            ) : null}

            {!error && terrains.length > 0 ? (
              <View style={styles.sectionHeaderMain}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionMainTitle}>Tous les terrains</Text>
                  <View style={styles.countPill}>
                    <Text style={styles.countPillText}>{terrains.length}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.sortBtn} activeOpacity={0.85}>
                  <Text style={styles.sortBtnText}>Plus récents</Text>
                  <Ionicons name="chevron-down" size={16} color={BRAND.textSoft} />
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          error ? (
            <ErrorState onRetry={() => load(true)} />
          ) : (
            <EmptyState
              icon="🏡"
              title="Aucun terrain trouvé"
              subtitle="Essayez de modifier vos filtres ou votre recherche."
              action={
                activeFiltersCount > 0 ? (
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={clearAllFilters}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.emptyActionText}>Réinitialiser les filtres</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          )
        }
        ListFooterComponent={
          !loading && hasMore && terrains.length > 0 ? (
            <ActivityIndicator color={BRAND.teal} style={{ marginVertical: 24 }} />
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <TerrainCard
            terrain={item}
            onPress={() =>
              navigation.navigate('TerrainDetail', {
                id: item.id,
                terrain: item,
                hideSupportFab: true,
                source: 'catalogue',
              })
            }
          />
        )}
      />
    </SafeAreaView>
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
    gap: 12,
  },

  loadingText: {
    color: BRAND.textSoft,
    fontSize: 14,
  },

  list: {
    paddingBottom: 110,
    paddingHorizontal: 16,
  },

  topBarSpace: {
    height: 6,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
    marginBottom: 18,
  },

  searchHero: {
    flex: 1,
    minHeight: 58,
    borderRadius: 30,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  searchHeroInput: {
    flex: 1,
    color: BRAND.text,
    fontSize: 17,
    fontWeight: '600',
    paddingVertical: 0,
  },

  filterFabWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 64,
  },

  filterFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterFabText: {
    marginTop: 6,
    fontSize: 11,
    color: BRAND.textSoft,
    fontWeight: '700',
  },

  categoriesRow: {
    paddingBottom: 12,
    gap: 16,
  },

  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 82,
    position: 'relative',
  },

  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  categoryIconWrapActive: {
    backgroundColor: BRAND.tealSoft,
    borderColor: 'rgba(0,140,140,0.18)',
  },

  categoryLabel: {
    fontSize: 13,
    color: BRAND.textSoft,
    fontWeight: '600',
  },

  categoryLabelActive: {
    color: BRAND.text,
    fontWeight: '800',
  },

  categoryUnderline: {
    marginTop: 7,
    width: 30,
    height: 4,
    borderRadius: 4,
    backgroundColor: BRAND.text,
  },

  filterWrap: {
    marginTop: 2,
    marginBottom: 10,
  },

  clearFiltersInline: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 2,
  },

  clearFiltersInlineText: {
    color: BRAND.teal,
    fontWeight: '800',
    fontSize: 12,
  },

  sectionHeaderRow: {
    marginTop: 8,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: BRAND.text,
  },

  horizontalList: {
    paddingBottom: 14,
    paddingRight: 8,
  },

  sectionHeaderMain: {
    marginTop: 8,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionMainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: BRAND.text,
  },

  countPill: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  countPillText: {
    color: BRAND.teal,
    fontWeight: '900',
    fontSize: 13,
  },

  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  sortBtnText: {
    color: BRAND.textSoft,
    fontSize: 15,
    fontWeight: '600',
  },

  emptyActionBtn: {
    marginTop: 16,
    backgroundColor: BRAND.teal,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },

  emptyActionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});