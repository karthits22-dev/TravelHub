import React, {useCallback, useRef, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import PinIcon from 'react-native-vector-icons/FontAwesome5';

import BookingCalendar, {dateKeyToUTC, getTodayKey} from '../Booking/BookingCalendar';
import {RAZORPAY_KEY_ID, IS_RAZORPAY_KEY_CONFIGURED} from '../../Config/razorpay';

const BLUE = '#0057FF';
const AMBER = '#F59E0B';
const GREEN = '#16A34A';
const INK = '#111827';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const HOTELS_BY_ID = {
  'nilgiri-retreat': {
    id: 'nilgiri-retreat',
    name: 'The Nilgiri Retreat',
    location: 'Ooty, Tamil Nadu',
    distanceKm: 1.2,
    rating: 4.8,
    reviewCount: 248,
    images: [
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=900&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80',
    ],
    breakdown: [
      {id: 'cleanliness', label: 'Cleanliness', value: 0.96},
      {id: 'location', label: 'Location', value: 0.9},
      {id: 'service', label: 'Service', value: 0.86},
      {id: 'value', label: 'Value', value: 0.8},
    ],
    amenities: [
      {id: 'wifi', label: 'Free WiFi', icon: 'wifi-outline', set: 'ion'},
      {id: 'parking', label: 'Parking', icon: 'local-parking', set: 'material'},
      {id: 'pool', label: 'Pool', icon: 'pool', set: 'material'},
      {id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline', set: 'ion'},
      {id: 'breakfast', label: 'Breakfast', icon: 'cafe-outline', set: 'ion'},
      {id: 'ac', label: 'AC Rooms', icon: 'snow-outline', set: 'ion'},
      {id: 'elevator', label: 'Elevator', icon: 'elevator', set: 'material'},
      {id: 'gym', label: 'Gym', icon: 'fitness-center', set: 'material'},
    ],
    roomTypes: [
      {
        id: 'standard-double',
        name: 'Standard Double',
        meta: '22 sqm · Up to 2 guests',
        badge: 'Free breakfast',
        price: 2400,
      },
      {
        id: 'deluxe-king',
        name: 'Deluxe King',
        meta: '32 sqm · Up to 2 guests',
        badge: 'Free breakfast',
        price: 3200,
      },
      {
        id: 'family-suite',
        name: 'Family Suite',
        meta: '48 sqm · Up to 4 guests',
        badge: 'Free breakfast · Balcony',
        price: 4600,
      },
    ],
    defaultRoomId: 'deluxe-king',
  },
  'misty-hills': {
    id: 'misty-hills',
    name: 'Misty Hills Resort',
    location: 'Munnar, Kerala',
    distanceKm: 2.5,
    rating: 4.6,
    reviewCount: 176,
    images: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=900&q=80',
    ],
    breakdown: [
      {id: 'cleanliness', label: 'Cleanliness', value: 0.92},
      {id: 'location', label: 'Location', value: 0.88},
      {id: 'service', label: 'Service', value: 0.84},
      {id: 'value', label: 'Value', value: 0.9},
    ],
    amenities: [
      {id: 'wifi', label: 'Free WiFi', icon: 'wifi-outline', set: 'ion'},
      {id: 'parking', label: 'Parking', icon: 'local-parking', set: 'material'},
      {id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline', set: 'ion'},
      {id: 'breakfast', label: 'Breakfast', icon: 'cafe-outline', set: 'ion'},
    ],
    roomTypes: [
      {
        id: 'standard-double',
        name: 'Standard Double',
        meta: '20 sqm · Up to 2 guests',
        badge: '20% OFF',
        price: 3200,
      },
    ],
    defaultRoomId: 'standard-double',
  },
  'backwater-bliss': {
    id: 'backwater-bliss',
    name: 'Backwater Bliss',
    location: 'Alleppey, Kerala',
    distanceKm: 3.8,
    rating: 4.7,
    reviewCount: 132,
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&q=80',
    ],
    breakdown: [
      {id: 'cleanliness', label: 'Cleanliness', value: 0.94},
      {id: 'location', label: 'Location', value: 0.97},
      {id: 'service', label: 'Service', value: 0.88},
      {id: 'value', label: 'Value', value: 0.85},
    ],
    amenities: [
      {id: 'wifi', label: 'Free WiFi', icon: 'wifi-outline', set: 'ion'},
      {id: 'pool', label: 'Pool', icon: 'pool', set: 'material'},
      {id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline', set: 'ion'},
    ],
    roomTypes: [
      {
        id: 'houseboat-cabin',
        name: 'Houseboat Cabin',
        meta: '18 sqm · Up to 2 guests',
        badge: 'New',
        price: 2900,
      },
    ],
    defaultRoomId: 'houseboat-cabin',
  },
};

const HotelsScreen = ({navigation, route}) => {
  const hotel = HOTELS_BY_ID[route?.params?.id] ?? HOTELS_BY_ID['nilgiri-retreat'];

  const [activeImage, setActiveImage] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(hotel.defaultRoomId);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const imageListRef = useRef(null);
  // RN's built-in SafeAreaView only computes real insets on iOS — on
  // Android it's a no-op, so with a translucent status bar (needed here
  // for the hero photo to bleed edge-to-edge) the overlaid back button and
  // rating pill would collide with the status bar/camera cutout on many
  // Android phones. react-native-safe-area-context measures the actual
  // inset on both platforms, so this stays correct across devices.
  const insets = useSafeAreaInsets();

  const selectedRoom =
    hotel.roomTypes.find(r => r.id === selectedRoomId) ?? hotel.roomTypes[0];

  // A single selected day is a range of {start, end: null} — one night.
  // Picking a second day extends it into a multi-night range.
  const [selectedRange, setSelectedRange] = useState({start: getTodayKey(), end: null});

  const nights = selectedRange.end
    ? Math.round(
        (dateKeyToUTC(selectedRange.end) - dateKeyToUTC(selectedRange.start)) / 86400000,
      )
    : 1;
  const totalPrice = selectedRoom.price * nights;

  const visibleAmenities = showAllAmenities ? hotel.amenities : hotel.amenities.slice(0, 4);

  const handleBookNow = useCallback(() => {
    if (!IS_RAZORPAY_KEY_CONFIGURED) {
      Alert.alert(
        'Payments not configured',
        'Add RAZORPAY_KEY_ID to the .env file and rebuild the app (pod install / gradle sync) to enable checkout.',
      );
      return;
    }

    setIsPaying(true);
    // Client-only checkout: no backend order is created, so this payment
    // isn't verified server-side. Fine for testing with a Razorpay test
    // key — swap in an order_id from a real backend before going live.
    RazorpayCheckout.open({
      key: RAZORPAY_KEY_ID,
      name: 'TravelHub',
      description: `${hotel.name} · ${selectedRoom.name}`,
      image: hotel.images[0],
      currency: 'INR',
      amount: String(totalPrice * 100), // Razorpay expects the amount in paise
      theme: {color: BLUE},
    })
      .then(data => {
        setIsPaying(false);
        Alert.alert('Booking Confirmed', `Payment ID: ${data.razorpay_payment_id}`, [
          {text: 'OK', onPress: () => navigation?.goBack?.()},
        ]);
      })
      .catch(error => {
        setIsPaying(false);
        // User-cancelled checkout also lands here (error.code === 0) — no
        // need to alarm the user for that, just let them try again.
        if (error?.code === 0) return;
        Alert.alert('Payment Failed', error?.description || 'Something went wrong. Please try again.');
      });
  }, [hotel, selectedRoom, totalPrice, navigation]);

  const keyExtractor = useCallback(item => item.id, []);

  const onImageScrollEnd = useCallback(event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImage(index);
  }, []);

  const renderImage = useCallback(
    ({item}) => <Image source={{uri: item}} style={styles.heroImage} />,
    [],
  );

  const renderAmenity = useCallback(
    ({item}) => (
      <View style={styles.amenityItem}>
        <View style={styles.amenityIconWrap}>
          {item.set === 'material' ? (
            <MaterialIcon name={item.icon} size={20} color={BLUE} />
          ) : (
            <Icon name={item.icon} size={20} color={BLUE} />
          )}
        </View>
        <Text style={styles.amenityLabel} numberOfLines={1}>
          {item.label}
        </Text>
      </View>
    ),
    [],
  );

  const renderBreakdownRow = useCallback(
    ({item}) => (
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>{item.label}</Text>
        <View style={styles.breakdownTrack}>
          <View style={[styles.breakdownFill, {width: `${item.value * 100}%`}]} />
        </View>
      </View>
    ),
    [],
  );

  const renderRoomType = useCallback(
    ({item}) => {
      const selected = item.id === selectedRoomId;
      return (
        <TouchableOpacity
          style={[styles.roomCard, selected && styles.roomCardSelected]}
          activeOpacity={0.85}
          onPress={() => setSelectedRoomId(item.id)}>
          <View style={styles.roomInfo}>
            <Text style={styles.roomName}>{item.name}</Text>
            <Text style={styles.roomMeta}>{item.meta}</Text>
            <Text style={styles.roomBadge}>{item.badge}</Text>
          </View>
          <View style={styles.roomPriceWrap}>
            <Text style={styles.roomPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
            <Text style={styles.roomPriceUnit}>per night</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedRoomId],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fixed hero — sits outside the ScrollView below so only the content
          underneath it scrolls, not the whole page. */}
      <View style={styles.heroWrap}>
        <FlatList
          ref={imageListRef}
          data={hotel.images}
          keyExtractor={(_, index) => `${hotel.id}-image-${index}`}
          renderItem={renderImage}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onImageScrollEnd}
        />

        <LinearGradient
          colors={['rgba(0,0,0,0.45)', 'transparent']}
          style={styles.heroTopShade}
          pointerEvents="none"
        />

        <View style={[styles.heroHeaderRow, {paddingTop: insets.top + 8}]}>
          <TouchableOpacity
            style={styles.circleButton}
            activeOpacity={0.8}
            onPress={() => navigation?.goBack?.()}>
            <Icon name="chevron-back" size={20} color={INK} />
          </TouchableOpacity>
          <View style={styles.ratingPill}>
            <Icon name="star" size={12} color={AMBER} />
            <Text style={styles.ratingPillText}>{hotel.rating}</Text>
          </View>
        </View>

        {hotel.images.length > 1 && (
          <View style={styles.dotsRow}>
            {hotel.images.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[styles.dot, index === activeImage && styles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <TouchableOpacity
              style={styles.favoriteButton}
              activeOpacity={0.7}
              onPress={() => setFavorite(f => !f)}>
              <Icon
                name={favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={favorite ? '#DC2626' : GRAY}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <PinIcon name="map-pin" size={15} color={"red"} />
            <Text style={styles.locationText}>
              {hotel.location} · {hotel.distanceKm} km away
            </Text>
          </View>

          {/* Rating summary + breakdown */}
          {/* <View style={styles.ratingCard}>
            <View style={styles.ratingSummary}>
              <Text style={styles.ratingNumber}>{hotel.rating}</Text>
              <View style={styles.starsRow}>
                {[0, 1, 2, 3, 4].map(i => (
                  <Icon
                    key={i}
                    name={i < Math.round(hotel.rating) ? 'star' : 'star-outline'}
                    size={13}
                    color={AMBER}
                  />
                ))}
              </View>
              <Text style={styles.reviewCount}>{hotel.reviewCount} reviews</Text>
            </View>

            <FlatList
              data={hotel.breakdown}
              keyExtractor={keyExtractor}
              renderItem={renderBreakdownRow}
              scrollEnabled={false}
              style={styles.breakdownList}
            />
          </View> */}

          {/* Amenities */}
          <Text style={styles.sectionTitle}>Amenities</Text>
          <FlatList
            data={visibleAmenities}
            keyExtractor={keyExtractor}
            renderItem={renderAmenity}
            numColumns={4}
            scrollEnabled={false}
            columnWrapperStyle={styles.amenitiesRow}
            contentContainerStyle={styles.amenitiesGrid}
          />
          {hotel.amenities.length > 4 && (
            <TouchableOpacity
              style={styles.amenitiesToggle}
              activeOpacity={0.7}
              onPress={() => setShowAllAmenities(prev => !prev)}>
              <Text style={styles.amenitiesToggleText}>
                {showAllAmenities ? 'Show less' : `Show all ${hotel.amenities.length} amenities`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Room types */}
          <Text style={styles.sectionTitle}>Room Types</Text>
          <FlatList
            data={hotel.roomTypes}
            keyExtractor={keyExtractor}
            renderItem={renderRoomType}
            scrollEnabled={false}
            contentContainerStyle={styles.roomList}
          />

          {/* Availability */}
          <View style={styles.calendarSection}>
            <BookingCalendar selectedRange={selectedRange} onChangeRange={setSelectedRange} />
          </View>
        </View>
      </ScrollView>

      {/* Booking footer — bottom inset so it clears the home indicator / gesture bar */}
      <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 16)}]}>
        <View>
          <Text style={styles.footerPrice}>₹{totalPrice.toLocaleString('en-IN')}</Text>
          <Text style={styles.footerTaxes}>
            {nights} {nights === 1 ? 'night' : 'nights'} · taxes incl.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, isPaying && styles.bookButtonDisabled]}
          activeOpacity={0.85}
          disabled={isPaying}
          onPress={handleBookNow}>
          <Text style={styles.bookButtonText}>{isPaying ? 'Processing…' : 'Book Now'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const HERO_HEIGHT = 280;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Hero / carousel
  heroWrap: {
    height: HERO_HEIGHT,
    width: '100%',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroTopShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroHeaderRow: {
    // paddingTop is set inline from useSafeAreaInsets() — varies per device.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: INK,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  hotelName: {
    flex: 1,
    fontSize: 21,
    fontWeight: '800',
    color: INK,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: GRAY,
    fontWeight: '500',
  },

  // Rating card
  ratingCard: {
    flexDirection: 'row',
    marginTop: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 20,
  },
  ratingSummary: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
  },
  ratingNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: BLUE,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 2,
  },
  reviewCount: {
    fontSize: 11,
    color: GRAY,
    marginTop: 4,
  },
  breakdownList: {
    flex: 1,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    width: 78,
    fontSize: 11,
    color: GRAY,
    fontWeight: '500',
  },
  breakdownTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: BLUE,
  },

  // Sections
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
    marginTop: 22,
    marginBottom: 12,
  },

  // Availability
  calendarSection: {
    marginTop: 24,
  },

  // Amenities
  amenitiesGrid: {
    gap: 10,
  },
  amenitiesRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amenityItem: {
    width: '23%',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
  },
  amenityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: INK,
    marginTop: 6,
    textAlign: 'center',
  },
  amenitiesToggle: {
    alignSelf: 'center',
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  amenitiesToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: BLUE,
  },

  // Room types
  roomList: {
    gap: 12,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roomCardSelected: {
    borderColor: BLUE,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  roomMeta: {
    fontSize: 12,
    color: GRAY,
    marginTop: 2,
  },
  roomBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: GREEN,
    marginTop: 4,
  },
  roomPriceWrap: {
    alignItems: 'flex-end',
  },
  roomPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: INK,
  },
  roomPriceUnit: {
    fontSize: 10,
    color: GRAY,
    marginTop: 2,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: INK,
  },
  footerTaxes: {
    fontSize: 11,
    color: GRAY,
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: BLUE,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default HotelsScreen;
