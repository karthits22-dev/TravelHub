import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import PinIcon from 'react-native-vector-icons/FontAwesome5';

import {CATEGORIES, LISTINGS_BY_CATEGORY} from '../../Data/listings';
import {fetchHotels} from '../../Services/HotelsService';

const BLUE = '#0057FF';
const AMBER = '#F59E0B';
const INK = '#111827';
const GRAY = '#6B7280';
const BG = '#F8FAFC';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';

// Falls back to a placeholder photo on load failure — the live hotels API
// currently returns image paths that don't resolve on its host yet.
const CardImage = ({uri}) => {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      source={{uri: failed || !uri ? FALLBACK_IMAGE : uri}}
      style={styles.cardImage}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
};

const AllHotelsCategories = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [activeCategoryId, setActiveCategoryId] = useState(CATEGORIES[0].id);

  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [hotelsError, setHotelsError] = useState(null);
  const [hotelsReloadKey, setHotelsReloadKey] = useState(0);

  // "Hotels" is the only category backed by a live API so far — the rest
  // still read from the hardcoded Data/listings.js dataset.
  useEffect(() => {
    let cancelled = false;

    setHotelsLoading(true);
    setHotelsError(null);

    fetchHotels()
      .then(data => {
        if (cancelled) return;
        setHotels(data);
      })
      .catch(err => {
        if (cancelled) return;
        setHotelsError(err.message || 'Failed to load hotels');
      })
      .finally(() => {
        if (cancelled) return;
        setHotelsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hotelsReloadKey]);

  const activeCategory =
    CATEGORIES.find(c => c.id === activeCategoryId) ?? CATEGORIES[0];
  const listings =
    activeCategoryId === 'hotels' ? hotels : LISTINGS_BY_CATEGORY[activeCategoryId] ?? [];

  const keyExtractor = useCallback(item => item.id, []);

  const renderListing = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation?.navigate?.(activeCategory.route, {id: item.id})}>
        <CardImage uri={item.image} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.cardLocationRow}>
            <Text style={styles.cardLocation} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          <View style={styles.cardFooterRow}>
            <View style={styles.cardRatingPill}>
              <Icon name="star" size={11} color={AMBER} />
              <Text style={styles.cardRatingText}>{item.rating}</Text>
            </View>
            <Text style={styles.cardPrice}>
              ₹{item.price.toLocaleString('en-IN')}
              <Text style={styles.cardPriceUnit}> /night</Text>
            </Text>
          </View>
        </View>
        {item.badge ? (
          <View style={[styles.cardBadge, {backgroundColor: item.badgeColor}]}>
            <Text style={styles.cardBadgeText}>{item.badge}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    ),
    [activeCategory, navigation],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}>
          <Icon name="chevron-back" size={22} color={INK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Bookings</Text>
        <View style={styles.backButton} />
      </View>

      {/* Chip-style tab layout for switching categories */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {CATEGORIES.map(category => {
            const active = category.id === activeCategoryId;
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
                onPress={() => setActiveCategoryId(category.id)}>
                <Icon
                  name={category.icon}
                  size={20}
                  color={active ? '#FFFFFF' : BLUE}
                />
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {activeCategoryId === 'hotels' && hotelsLoading && hotels.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : activeCategoryId === 'hotels' && hotelsError && hotels.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{hotelsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.8}
            onPress={() => setHotelsReloadKey(key => key + 1)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={keyExtractor}
          renderItem={renderListing}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No {activeCategory.label.toLowerCase()} available yet.
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: INK,
  },

  // Chip tabs
  chipsWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  chipsRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF2FF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#DCE8FF',
  },
  chipActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 3,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BLUE,
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },

  // Listings
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    gap: 14,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  cardImage: {
    width: 96,
    height: 96,
    borderRadius: 16,
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.2,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  cardLocation: {
    flex: 1,
    fontSize: 12,
    color: GRAY,
    fontWeight: '500',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cardRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7E6',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  cardRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: INK,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: BLUE,
  },
  cardPriceUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: GRAY,
  },
  cardBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Empty state
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 13,
    color: GRAY,
  },

  // Loading / error state
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 13,
    color: GRAY,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: BLUE,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default AllHotelsCategories;
