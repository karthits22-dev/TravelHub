import React, {useState, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
// RN's built-in SafeAreaView is a no-op on Android; this one actually
// measures real insets on both platforms (required now that Android 15+
// enforces edge-to-edge for all screens, not just ones that opt in).
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Taxicon from 'react-native-vector-icons/MaterialIcons';

import {ALL_LISTINGS} from '../Data/listings';

// npm install react-native-linear-gradient react-native-vector-icons
// then follow each package's iOS (pod install) / Android linking steps.

// ---------------------------------------------------------------------------
// Data — plain arrays, each with a stable `id`. FlatList needs this shape,
// keyExtractor pulls `id` off each item below.
// ---------------------------------------------------------------------------

const SERVICES = [
  {id: 'taxi', label: 'Taxi', icon: 'local-taxi', tint: '#EAF2FF', iconColor: '#3B82F6'},
  {id: 'hotels', label: 'Hotels/Resorts', icon: 'business-outline', tint: '#FCEAF3', iconColor: '#EC4899'},
  // {id: 'homestays', label: 'Homestays', icon: 'home-outline', tint: '#E9FBEF', iconColor: '#22C55E'},
  {id: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline', tint: '#ECEBFE', iconColor: '#6366F1'},
  // {id: 'tp-pass', label: 'TP Pass', icon: 'document-text-outline', tint: '#F3EEFF', iconColor: '#8B5CF6'},
  {id: 'drive', label: 'Drive with Us', icon: 'car', tint: '#E5FBFE', iconColor: '#06B6D4'},
  // {id: 'rewards', label: 'Rewards', icon: 'gift-outline', tint: '#FFF1E4', iconColor: '#F97316'},
  // {id: 'wallet', label: 'Wallet', icon: 'wallet-outline', tint: '#E7F5FE', iconColor: '#0EA5E9'},
];

const OFFERS = [
  {
    id: 'offer-taxi',
    eyebrow: 'LIMITED OFFER',
    title: '20% OFF',
    subtitle: 'On your first taxi ride',
    cta: 'Book Now',
    colors: ['#3E7BFA', '#2563EB'],
  },
  {
    id: 'offer-stay',
    eyebrow: 'STAY DEAL',
    title: 'Stay & Save',
    subtitle: 'Book your next stay',
    cta: 'Explore',
    colors: ['#FDBA5C', '#F97316'],
  },
];

const HOTELS = [
  {
    id: 'nilgiri-retreat',
    name: 'The Nilgiri Retreat',
    rating: 4.8,
    distanceKm: 1.2,
    price: 2400,
    badge: 'Best Seller',
    badgeColor: '#16A34A',
    image:
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80',
  },
  {
    id: 'misty-hills',
    name: 'Misty Hills Resort',
    rating: 4.6,
    distanceKm: 2.5,
    price: 3200,
    badge: '20% OFF',
    badgeColor: '#DC2626',
    image:
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80',
  },
  {
    id: 'backwater-bliss',
    name: 'Backwater Bliss',
    rating: 4.7,
    distanceKm: 3.8,
    price: 2900,
    badge: 'New',
    badgeColor: '#7C3AED',
    image:
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80',
  },
];

// Book a Taxi
const TAXI_TYPES = [
  {id: 'mini', label: 'Mini', icon: 'directions-car', rate: '₹8/km'},
  {id: 'sedan', label: 'Sedan', icon: 'directions-car', rate: '₹12/km'},
  {id: 'suv', label: 'SUV', icon: 'airport-shuttle', rate: '₹18/km'},
  {id: 'luxury', label: 'Luxury', icon: 'directions-car', rate: '₹30/km'},
];

// Popular Destinations
const DESTINATIONS = [
  {
    id: 'ooty',
    name: 'Ooty',
    image:
      'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=400&q=80',
  },
  {
    id: 'kodaikanal',
    name: 'Kodaikanal',
    image:
      'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=400&q=80',
  },
  {
    id: 'coorg',
    name: 'Coorg',
    image:
      'https://images.unsplash.com/photo-1600100397608-f909cbb0aa8c?w=400&q=80',
  },
  {
    id: 'munnar',
    name: 'Munnar',
    image:
      'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=400&q=80',
  },
];

// Nearby Homestays
const HOMESTAYS = [
  {
    id: 'coorg-cottage',
    name: 'Coorg Cottage',
    host: 'Priya Nair',
    price: 1800,
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=400&q=80',
  },
  {
    id: 'bamboo-villa',
    name: 'Bamboo Villa',
    host: 'Arjun Reddy',
    price: 2100,
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=400&q=80',
  },
];

const HomeScreen = ({navigation}) => {
  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim().toLowerCase();
  const searchResults = trimmedQuery
    ? ALL_LISTINGS.filter(
        item =>
          item.name.toLowerCase().includes(trimmedQuery) ||
          item.location.toLowerCase().includes(trimmedQuery) ||
          item.categoryLabel.toLowerCase().includes(trimmedQuery),
      )
    : [];

  // Bottom-tab screens stay mounted after their first visit, so a plain
  // <StatusBar> here would keep winning even after the user switches to
  // another tab (leaving white icons stranded on e.g. Wallet's white
  // background). useFocusEffect applies this only while Home is the
  // active tab and restores a sane default when it isn't.
  useFocusEffect(
    useCallback(() => {
     // StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('#3B82F6');
      return () => {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#FFFFFF');
        // Clear the search so returning to Home (e.g. after tapping a
        // result) shows the normal feed again, not stale search results.
        setQuery('');
      };
    }, []),
  );

  // -- renderItem functions, one per FlatList -------------------------------

  const renderService = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.serviceItem}
        activeOpacity={0.7}
        onPress={() => {
          const routeNames = {
            taxi: 'Taxi',
            hotels: 'AllHotels',
            homestays: 'HomeStays',
            insurance: 'Insurance',
          };
          navigation?.navigate?.(routeNames[item.id] ?? item.id);
        }}>
        <View style={[styles.serviceIconWrap, {backgroundColor: item.tint}]}>
          {item.id === 'taxi' ? (
            <Taxicon name={item.icon} size={24} color={item.iconColor} />
          ) : (
            <Icon name={item.icon} size={24} color={item.iconColor} />
          )}
        </View>
        <Text style={styles.serviceLabel} numberOfLines={1}>
          {item.label}
        </Text>
      </TouchableOpacity>
    ),
    [navigation],
  );

  const renderOffer = useCallback(
    ({item}) => (
      <LinearGradient
        colors={item.colors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.offerCard}>
        <View style={styles.offerEyebrowPill}>
          <Text style={styles.offerEyebrow}>{item.eyebrow}</Text>
        </View>
        <Text style={styles.offerTitle}>{item.title}</Text>
        <Text style={styles.offerSubtitle}>{item.subtitle}</Text>
        <TouchableOpacity style={styles.offerButton} activeOpacity={0.8}>
          <Text style={[styles.offerButtonText, {color: item.colors[1]}]}>
            {item.cta}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    ),
    [],
  );

  const renderHotel = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.hotelCard}
        activeOpacity={0.85}
        onPress={() => navigation?.navigate?.('Hotels', {id: item.id})}>
        <View style={styles.hotelPhotoWrap}>
          <Image source={{uri: item.image}} style={styles.hotelPhoto} />
          <View style={[styles.hotelBadge, {backgroundColor: item.badgeColor}]}>
            <Text style={styles.hotelBadgeText}>{item.badge}</Text>
          </View>
        </View>
        <View style={styles.hotelInfo}>
          <Text style={styles.hotelName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.hotelMetaRow}>
            <Icon name="star" size={11} color="#F59E0B" />
            <Text style={styles.hotelMeta}>
              {item.rating} · {item.distanceKm} km
            </Text>
          </View>
          <Text style={styles.hotelPrice}>
            ₹{item.price.toLocaleString('en-IN')}
            <Text style={styles.hotelPriceUnit}> /night</Text>
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  // -- Book a Taxi --
  const renderTaxiType = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.taxiCard}
        activeOpacity={0.8}
        onPress={() => navigation?.navigate?.('Taxi', {vehicleType: item.id})}>
        <Taxicon name={item.icon} size={26} color="#3B82F6" />
        <Text style={styles.taxiLabel}>{item.label}</Text>
        <Text style={styles.taxiRate}>{item.rate}</Text>
      </TouchableOpacity>
    ),
    [navigation],
  );

  // -- Popular Destinations --
  const renderDestination = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.destinationCard}
        activeOpacity={0.85}
        onPress={() => navigation?.navigate?.('Destination', {id: item.id})}>
        <Image source={{uri: item.image}} style={styles.destinationImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={styles.destinationOverlay}>
          <Text style={styles.destinationName}>{item.name}</Text>
        </LinearGradient>
      </TouchableOpacity>
    ),
    [navigation],
  );

  // -- Nearby Homestays --
  const renderHomestay = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.homestayCard}
        activeOpacity={0.85}
        onPress={() => navigation?.navigate?.('HomeStays', {id: item.id})}>
        <Image source={{uri: item.image}} style={styles.homestayPhoto} />
        <View style={styles.homestayInfo}>
          <Text style={styles.homestayName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.homestayHost} numberOfLines={1}>
            Host: {item.host}
          </Text>
          <View style={styles.homestayFooterRow}>
            <Text style={styles.homestayPrice}>
              ₹{item.price.toLocaleString('en-IN')}
              <Text style={styles.homestayPriceUnit}>/night</Text>
            </Text>
            <View style={styles.homestayRatingRow}>
              <Icon name="star" size={12} color="#F59E0B" />
              <Text style={styles.homestayRating}>{item.rating}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  const keyExtractor = useCallback(item => item.id, []);
  const searchKeyExtractor = useCallback(
    item => `${item.categoryId}-${item.id}`,
    [],
  );

  const renderSearchResult = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.searchResultCard}
        activeOpacity={0.85}
        onPress={() => navigation?.navigate?.(item.route, {id: item.id})}>
        <Image source={{uri: item.image}} style={styles.searchResultImage} />
        <View style={styles.searchResultInfo}>
          <View style={styles.searchCategoryPill}>
            <Text style={styles.searchCategoryPillText}>{item.categoryLabel}</Text>
          </View>
          <Text style={styles.searchResultName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.searchResultMetaRow}>
            <Icon name="location-outline" size={12} color="#64748B" />
            <Text style={styles.searchResultLocation} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        </View>
        <View style={styles.searchResultRatingRow}>
          <Icon name="star" size={12} color="#F59E0B" />
          <Text style={styles.searchResultRating}>{item.rating}</Text>
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  return (
    // The bottom edge is intentionally excluded: this screen sits above the
    // bottom tab bar, which already reserves the device's bottom safe-area
    // inset for itself. Reserving it here too left a blank gap under the list.
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <LinearGradient
        colors={['#2F6FED', '#3B82F6']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Good Morning 👋</Text>
            <Text style={styles.name}>Rahul Sharma</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.bellButton}>
              <Icon name="notifications-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <Image
              source={{
                uri: 'https://randomuser.me/api/portraits/men/32.jpg',
              }}
              style={styles.avatar}
            />
          </View>
        </View>

        <View style={styles.searchBar}>
          <Icon name="search" size={16} color="#94A3B8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Where would you like to travel today?"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {trimmedQuery ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {trimmedQuery ? (
        <View style={styles.body}>
          <FlatList
            data={searchResults}
            keyExtractor={searchKeyExtractor}
            renderItem={renderSearchResult}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.searchResultsContent}
            ListEmptyComponent={
              <Text style={styles.searchEmptyText}>
                No results for "{query.trim()}"
              </Text>
            }
          />
        </View>
      ) : (
      /* Page scrolls so every section below the fold is reachable */
      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bodyContent}>
        {/* Services — non-scrolling 4-column grid */}
        <Text style={styles.sectionTitle}>Services</Text>
        <FlatList
          data={SERVICES}
          keyExtractor={keyExtractor}
          renderItem={renderService}
          numColumns={4}
          scrollEnabled={false}
          columnWrapperStyle={styles.servicesRow}
          contentContainerStyle={styles.servicesGrid}
        />

        {/* Offers — still horizontally swipeable */}
        <FlatList
          data={OFFERS}
          keyExtractor={keyExtractor}
          renderItem={renderOffer}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offerListContent}
        />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Nearby Hotels</Text>
          <TouchableOpacity onPress={() => navigation?.navigate?.('AllHotels')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Hotels — still horizontally swipeable */}
        <FlatList
          data={HOTELS}
          keyExtractor={keyExtractor}
          renderItem={renderHotel}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hotelListContent}
        />

        {/* Book a Taxi */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Book a Taxi</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Book Now</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={TAXI_TYPES}
          keyExtractor={keyExtractor}
          renderItem={renderTaxiType}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.taxiListContent}
        />

        {/* Popular Destinations — still horizontally swipeable */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={DESTINATIONS}
          keyExtractor={keyExtractor}
          renderItem={renderDestination}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destinationListContent}
        />

        {/* Nearby Homestays — still horizontally swipeable */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Nearby Homestays</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={HOMESTAYS}
          keyExtractor={keyExtractor}
          renderItem={renderHomestay}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.homestayListContent}
        />
      </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: '#DBEAFE',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  searchBar: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    padding: 0,
  },

  // Body — ScrollView so all sections match the full design
  body: {
    flex: 1,
    marginTop: -16,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  // Search results
  searchResultsContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  searchResultImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    flexShrink: 0,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF2FF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  searchCategoryPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563EB',
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  searchResultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  searchResultLocation: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
  },
  searchResultRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchResultRating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  searchEmptyText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 13,
    color: '#64748B',
  },

  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },

  // Services grid
  servicesGrid: {
    marginBottom: 8,
  },
  servicesRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  serviceItem: {
    alignItems: 'center',
    width: '23%',
  },
  serviceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    marginTop: 6,
    textAlign: 'center',
  },

  // Offers
  offerListContent: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 20,
  },
  offerCard: {
    width: 240,
    borderRadius: 18,
    padding: 16,
  },
  offerEyebrowPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  offerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  offerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  offerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  offerButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  offerButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Hotels
  hotelListContent: {
    paddingBottom: 4,
    gap: 12,
    marginBottom: 20,
  },
  hotelCard: {
    width: 160,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  hotelPhotoWrap: {
    height: 96,
    width: '100%',
  },
  hotelPhoto: {
    height: '100%',
    width: '100%',
  },
  hotelBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  hotelBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hotelInfo: {
    padding: 10,
  },
  hotelName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  hotelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  hotelMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  hotelPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  hotelPriceUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94A3B8',
  },

  // Book a Taxi
  taxiListContent: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 20,
  },
  taxiCard: {
    width: 84,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  taxiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  taxiRate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 2,
  },

  // Popular Destinations
  destinationListContent: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 20,
  },
  destinationCard: {
    width: 110,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  destinationImage: {
    width: '100%',
    height: '100%',
  },
  destinationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  destinationName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Nearby Homestays
  homestayListContent: {
    gap: 12,
    paddingBottom: 4,
  },
  homestayCard: {
    width: 180,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  homestayPhoto: {
    width: '100%',
    height: 110,
  },
  homestayInfo: {
    padding: 10,
  },
  homestayName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  homestayHost: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  homestayFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  homestayPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  homestayPriceUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94A3B8',
  },
  homestayRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  homestayRating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
});

export default HomeScreen;