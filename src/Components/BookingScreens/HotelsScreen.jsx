import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import PinIcon from 'react-native-vector-icons/FontAwesome5';

import BookingCalendar, { dateKeyToUTC, getTodayKey } from '../Booking/BookingCalendar';
import { RAZORPAY_KEY_ID, IS_RAZORPAY_KEY_CONFIGURED } from '../../Config/razorpay';
import { fetchHotelAmenities } from '../../Services/HotelsService';
import { geocodeAddress } from '../../Services/PlacesService';
import { fetchNearbyAttractions } from '../../Services/AttractionsService';
import { openNativeNavigation } from '../../Utils/mapNavigation';
import { GOOGLE_MAPS_API_KEY, IS_GOOGLE_MAPS_KEY_CONFIGURED } from '../../Config/googleMaps';
import MapArrowIcon from '../Icons/MapArrowIcon';

const BLUE = '#0057FF';
const AMBER = '#F59E0B';
const GREEN = '#16A34A';
const INK = '#111827';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// A small Google Static Maps snapshot (with a pin dropped on the hotel)
// used as the "open in Maps" button's face instead of a generic icon — a
// real map preview rather than a symbol standing in for one.
function buildStaticMapUrl({ latitude, longitude }) {
  const params = new URLSearchParams({
    center: `${latitude},${longitude}`,
    zoom: '15',
    size: '96x96',
    scale: '2', // renders at 192x192px so it stays sharp on retina screens
    maptype: 'roadmap',
    markers: `color:red|${latitude},${longitude}`,
    key: GOOGLE_MAPS_API_KEY,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

const HOTELS_BY_ID = {
  'nilgiri-retreat': {
    id: 'nilgiri-retreat',
    name: 'The Nilgiri Retreat',
    location: 'Ooty, Tamil Nadu',
    // Static test coordinates — neither the live hotels API nor this
    // hardcoded data carries real coordinates yet, so these stand in until
    // the backend returns lat/lng per hotel.
    latitude: 11.4064,
    longitude: 76.6932,
    distanceKm: 1.2,
    rating: 4.8,
    reviewCount: 248,
    images: [
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=900&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80',
    ],
    breakdown: [
      { id: 'cleanliness', label: 'Cleanliness', value: 0.96 },
      { id: 'location', label: 'Location', value: 0.9 },
      { id: 'service', label: 'Service', value: 0.86 },
      { id: 'value', label: 'Value', value: 0.8 },
    ],
    amenities: [
      { id: 'wifi', label: 'Free WiFi', icon: 'wifi-outline', set: 'ion' },
      { id: 'parking', label: 'Parking', icon: 'local-parking', set: 'material' },
      { id: 'pool', label: 'Pool', icon: 'pool', set: 'material' },
      { id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline', set: 'ion' },
      { id: 'breakfast', label: 'Breakfast', icon: 'cafe-outline', set: 'ion' },
      { id: 'ac', label: 'AC Rooms', icon: 'snow-outline', set: 'ion' },
      { id: 'elevator', label: 'Elevator', icon: 'elevator', set: 'material' },
      { id: 'gym', label: 'Gym', icon: 'fitness-center', set: 'material' },
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
    latitude: 10.0889,
    longitude: 77.0595,
    distanceKm: 2.5,
    rating: 4.6,
    reviewCount: 176,
    images: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=900&q=80',
    ],
    breakdown: [
      { id: 'cleanliness', label: 'Cleanliness', value: 0.92 },
      { id: 'location', label: 'Location', value: 0.88 },
      { id: 'service', label: 'Service', value: 0.84 },
      { id: 'value', label: 'Value', value: 0.9 },
    ],
    amenities: [
      { id: 'wifi', label: 'Free WiFi', icon: 'wifi-outline', set: 'ion' },
      { id: 'parking', label: 'Parking', icon: 'local-parking', set: 'material' },
      { id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline', set: 'ion' },
      { id: 'breakfast', label: 'Breakfast', icon: 'cafe-outline', set: 'ion' },
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
    latitude: 9.4981,
    longitude: 76.3388,
    distanceKm: 3.8,
    rating: 4.7,
    reviewCount: 132,
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&q=80',
    ],
    breakdown: [
      { id: 'cleanliness', label: 'Cleanliness', value: 0.94 },
      { id: 'location', label: 'Location', value: 0.97 },
      { id: 'service', label: 'Service', value: 0.88 },
      { id: 'value', label: 'Value', value: 0.85 },
    ],
    amenities: [
      { id: 'wifi', label: 'Free WiFi', icon: 'wifi-outline', set: 'ion' },
      { id: 'pool', label: 'Pool', icon: 'pool', set: 'material' },
      { id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline', set: 'ion' },
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

const HotelsScreen = ({ navigation, route }) => {
  const hotel = HOTELS_BY_ID[route?.params?.id] ?? HOTELS_BY_ID['nilgiri-retreat'];
  // route.params.id is the real hotel id when opened from the live hotels
  // list — HOTELS_BY_ID's slug keys ('nilgiri-retreat', ...) only cover the
  // handful of hardcoded demo hotels, so this can diverge from hotel.id.
  const hotelId = route?.params?.id ?? hotel.id;

  const [activeImage, setActiveImage] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(hotel.defaultRoomId);
  const [isPaying, setIsPaying] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [locatingOnMaps, setLocatingOnMaps] = useState(false);
  const imageListRef = useRef(null);

  // One-time "pop in" for the "open in Maps" badge — plays once when the
  // page is entered (a bounce from 0 up to full size) rather than pulsing
  // forever, so it draws the eye on arrival without being a distraction
  // that keeps animating the whole time the guest is reading the page.
  const mapBadgeScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(mapBadgeScale, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [mapBadgeScale]);

  // One-time "Welcome to <hotel>" greeting over the hero photo — pops in
  // as soon as the page opens, holds for a moment, then fades itself away
  // so it doesn't sit there blocking the photo/booking flow. A tap on it
  // dismisses it early and jumps straight to the booking calendar.
  const [showWelcome, setShowWelcome] = useState(true);
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const dismissWelcome = useCallback(() => {
    Animated.timing(welcomeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowWelcome(false));
  }, [welcomeAnim]);

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.spring(welcomeAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(welcomeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);
    sequence.start(() => setShowWelcome(false));
    return () => sequence.stop();
  }, [welcomeAnim]);

  // Resolved once per hotel and shared by the map-thumbnail button, the
  // native-Maps redirect, and the nearby-attractions lookup below — uses
  // the hotel's static lat/lng when present (the hardcoded test data
  // above), otherwise geocodes its free-text location (e.g. hotels coming
  // from the live API, which has no coordinates yet).
  const [hotelCoords, setHotelCoords] = useState(
    hotel.latitude != null && hotel.longitude != null
      ? { latitude: hotel.latitude, longitude: hotel.longitude }
      : null,
  );

  useEffect(() => {
    if (hotelCoords) return undefined;
    let cancelled = false;

    geocodeAddress(hotel.location ? `${hotel.name}, ${hotel.location}` : hotel.name).then(coords => {
      if (!cancelled && coords) setHotelCoords(coords);
    });

    return () => {
      cancelled = true;
    };
  }, [hotel, hotelCoords]);

  // Hands the hotel's coordinates straight to the device's own Google/Apple
  // Maps app for directions.
  const handleOpenInMaps = useCallback(async () => {
    if (locatingOnMaps) return;
    setLocatingOnMaps(true);
    try {
      const place =
        hotelCoords ??
        (await geocodeAddress(hotel.location ? `${hotel.name}, ${hotel.location}` : hotel.name));
      if (!place) {
        Alert.alert('Unavailable', "Couldn't locate this property on the map.");
        return;
      }
      await openNativeNavigation(place);
    } catch (err) {
      Alert.alert('Unavailable', err?.message || "Couldn't open Maps.");
    } finally {
      setLocatingOnMaps(false);
    }
  }, [hotel, hotelCoords, locatingOnMaps]);

  const [liveAmenities, setLiveAmenities] = useState(null);
  const [amenitiesLoading, setAmenitiesLoading] = useState(true);

  // Falls back to the hardcoded hotel.amenities whenever the live API has
  // nothing for this id (e.g. demo hotels not seeded in the backend yet).
  useEffect(() => {
    let cancelled = false;
    setAmenitiesLoading(true);

    fetchHotelAmenities(hotelId)
      .then(data => {
        if (cancelled) return;
        setLiveAmenities(data.length > 0 ? data : null);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('[HotelsScreen] Failed to load live amenities:', err.message);
        setLiveAmenities(null);
      })
      .finally(() => {
        if (cancelled) return;
        setAmenitiesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hotelId]);

  const amenities = liveAmenities ?? hotel.amenities;

  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [attractionsLoading, setAttractionsLoading] = useState(true);

  // Waits on the shared `hotelCoords` resolved above instead of geocoding
  // the hotel's location a second time.
  useEffect(() => {
    if (!hotelCoords) return undefined;
    let cancelled = false;
    setAttractionsLoading(true);

    fetchNearbyAttractions(hotelCoords.latitude, hotelCoords.longitude)
      .then(places => {
        if (!cancelled) setNearbyAttractions(places);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('[HotelsScreen] Failed to load nearby attractions:', err.message);
        setNearbyAttractions([]);
      })
      .finally(() => {
        if (!cancelled) setAttractionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hotelCoords]);
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
  const [selectedRange, setSelectedRange] = useState({ start: getTodayKey(), end: null });

  const nights = selectedRange.end
    ? Math.round(
      (dateKeyToUTC(selectedRange.end) - dateKeyToUTC(selectedRange.start)) / 86400000,
    )
    : 1;
  const totalPrice = selectedRoom.price * nights;

  const visibleAmenities = showAllAmenities ? amenities : amenities.slice(0, 4);

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
      theme: { color: BLUE },
    })
      .then(data => {
        setIsPaying(false);
        Alert.alert('Booking Confirmed', `Payment ID: ${data.razorpay_payment_id}`, [
          { text: 'OK', onPress: () => navigation?.goBack?.() },
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
    ({ item }) => <Image source={{ uri: item }} style={styles.heroImage} />,
    [],
  );

  const renderAmenity = useCallback(
    ({ item }) => (
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
    ({ item }) => (
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>{item.label}</Text>
        <View style={styles.breakdownTrack}>
          <View style={[styles.breakdownFill, { width: `${item.value * 100}%` }]} />
        </View>
      </View>
    ),
    [],
  );

  const renderAttraction = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.attractionCard}
        activeOpacity={0.85}
        onPress={() =>
          openNativeNavigation({ latitude: item.latitude, longitude: item.longitude })
        }>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.attractionImage} />
        ) : (
          <View style={[styles.attractionImage, styles.attractionImageFallback]}>
            <MaterialIcon name="photo-camera" size={22} color="#94A3B8" />
          </View>
        )}
        <Text style={styles.attractionName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.attractionMetaRow}>
          <Text style={styles.attractionCategory} numberOfLines={1}>
            {item.category}
          </Text>
          <Text style={styles.attractionDot}>·</Text>
          <Text style={styles.attractionDistance}>{item.distanceText}</Text>
        </View>
      </TouchableOpacity>
    ),
    [],
  );

  const renderRoomType = useCallback(
    ({ item }) => {
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

        <View style={[styles.heroHeaderRow, { paddingTop: insets.top + 8 }]}>
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

        {showWelcome && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={dismissWelcome}
            style={styles.welcomeBannerWrap}>
            <Animated.View
              style={[
                styles.welcomeBanner,
                {
                  opacity: welcomeAnim,
                  transform: [
                    {
                      translateX: welcomeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [SCREEN_WIDTH, 0],
                      }),
                    },
                  ],
                },
              ]}>
              <Text style={styles.welcomeTitle} numberOfLines={1}>
                Welcome to {hotel.name}
              </Text>
              <Text style={styles.welcomeSubtitle}>Book your room and start your stay</Text>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <View style={styles.titleActions}>
              <View style={styles.mapThumbWrap}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={locatingOnMaps}
                  onPress={handleOpenInMaps}>
                  <Animated.View
                    style={[styles.mapArrowBadge, { transform: [{ scale: mapBadgeScale }] }]}
                    pointerEvents="none">
                    <MapArrowIcon size={30} color="#FFFFFF" />
                  </Animated.View>
                  {/* {locatingOnMaps ? (
                    <ActivityIndicator size="small" color={BLUE} />
                  ) : hotelCoords && IS_GOOGLE_MAPS_KEY_CONFIGURED ? (
                    <Image source={{uri: buildStaticMapUrl(hotelCoords)}} style={styles.mapThumbImage} />
                  ) : (
                    <Icon name="navigate-circle-outline" size={22} color={BLUE} />
                  )} */}
                </TouchableOpacity>

              </View>
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
          </View>

          <View style={styles.locationRow}>
            {/* <PinIcon name="map-pin" size={15} color={"red"} /> */}
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
          <View style={styles.amenitiesTitleRow}>
            <Text style={[styles.sectionTitle, styles.amenitiesTitleText]}>Amenities</Text>
            {amenitiesLoading && <ActivityIndicator size="small" color={BLUE} />}
          </View>
          {amenities.length === 0 && !amenitiesLoading ? (
            <Text style={styles.amenitiesEmptyText}>No amenities listed for this property.</Text>
          ) : (
            <FlatList
              data={visibleAmenities}
              keyExtractor={keyExtractor}
              renderItem={renderAmenity}
              numColumns={4}
              scrollEnabled={false}
              columnWrapperStyle={styles.amenitiesRow}
              contentContainerStyle={styles.amenitiesGrid}
            />
          )}
          {amenities.length > 4 && (
            <TouchableOpacity
              style={styles.amenitiesToggle}
              activeOpacity={0.7}
              onPress={() => setShowAllAmenities(prev => !prev)}>
              <Text style={styles.amenitiesToggleText}>
                {showAllAmenities ? 'Show less' : `Show all ${amenities.length} amenities`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Nearby attractions */}
          <View style={styles.amenitiesTitleRow}>
            <Text style={[styles.sectionTitle, styles.amenitiesTitleText]}>Nearby Attractions</Text>
            {attractionsLoading && <ActivityIndicator size="small" color={BLUE} />}
          </View>
          {nearbyAttractions.length === 0 && !attractionsLoading ? (
            <Text style={styles.amenitiesEmptyText}>No nearby attractions found.</Text>
          ) : (
            <FlatList
              data={nearbyAttractions}
              keyExtractor={item => item.id}
              renderItem={renderAttraction}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.attractionsList}
            />
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
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
          <Text style={styles.bookButtonText}>
            {isPaying ? 'Processing…' : 'Book Now'}
          </Text>
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 2 },
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

  // One-time welcome greeting over the hero photo
  welcomeBannerWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '38%',
    alignItems: 'center',
  },
  welcomeBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.88)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
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
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapThumbWrap: {
    width: 32,
    height: 32,
  },
  mapThumbButton: {
    width: 30,
    height: 30,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  mapThumbImage: {
    width: '100%',
    height: '100%',
  },
  // Sits outside mapThumbButton (which clips its own content to a circle)
  // so this can peek past its edge like a normal notification badge.
  mapArrowBadge: {
   
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
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
  amenitiesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    marginBottom: 12,
  },
  amenitiesTitleText: {
    marginTop: 0,
    marginBottom: 0,
  },
  amenitiesEmptyText: {
    fontSize: 12,
    color: GRAY,
  },
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

  // Nearby attractions
  attractionsList: {
    gap: 12,
    paddingRight: 4,
  },
  attractionCard: {
    width: 140,
  },
  attractionImage: {
    width: 140,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  attractionImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  attractionName: {
    fontSize: 13,
    fontWeight: '700',
    color: INK,
    marginTop: 8,
  },
  attractionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  attractionCategory: {
    flex: 1,
    fontSize: 11,
    color: GRAY,
    fontWeight: '500',
  },
  attractionDot: {
    fontSize: 11,
    color: GRAY,
  },
  attractionDistance: {
    fontSize: 11,
    color: GRAY,
    fontWeight: '600',
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
