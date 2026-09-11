import React, { useCallback, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import PinIcon from 'react-native-vector-icons/FontAwesome5';

import BookingCalendar, { dateKeyToUTC, getTodayKey } from '../Booking/BookingCalendar';
import { RAZORPAY_KEY_ID, IS_RAZORPAY_KEY_CONFIGURED } from '../../Config/razorpay';

const BLUE = '#0057FF';
const AMBER = '#F59E0B';
const GREEN = '#16A34A';
const INK = '#111827';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HOMESTAYS_BY_ID = {
  'coorg-cottage': {
    id: 'coorg-cottage',
    name: 'Coorg Cottage Escape',
    location: 'Madikeri, Coorg, Karnataka',
    verified: true,
    images: [
      'https://images.unsplash.com/photo-1600100397608-f909cbb0aa8c?w=900&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=900&q=80',
    ],
    host: {
      name: 'Priya Nair',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      superhost: true,
      years: 4,
      rating: 4.9,
      reviews: 186,
    },
    amenities: [
      { id: 'garden', label: 'Garden', icon: 'leaf-outline', set: 'ion' },
      { id: 'bonfire', label: 'Bonfire', icon: 'flame-outline', set: 'ion' },
      { id: 'breakfast', label: 'Breakfast', icon: 'cafe-outline', set: 'ion' },
      { id: 'cottages', label: 'Cottages', icon: 'home-outline', set: 'ion' },
      { id: 'parking', label: 'Parking', icon: 'local-parking', set: 'material' },
      { id: 'wifi', label: 'WiFi', icon: 'wifi-outline', set: 'ion' },
      { id: 'valley-view', label: 'Valley View', icon: 'image-outline', set: 'ion' },
      { id: 'organic', label: 'Organic', icon: 'nutrition-outline', set: 'ion' },
    ],
    price: 1800,
    maxGuests: 4,
  },
  'bamboo-villa': {
    id: 'bamboo-villa',
    name: 'Bamboo Villa Retreat',
    location: 'Wayanad, Kerala',
    verified: true,
    images: [
      'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=900&q=80',
      'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=900&q=80',
    ],
    host: {
      name: 'Arjun Reddy',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      superhost: true,
      years: 2,
      rating: 4.8,
      reviews: 94,
    },
    amenities: [
      { id: 'garden', label: 'Garden', icon: 'leaf-outline', set: 'ion' },
      { id: 'breakfast', label: 'Breakfast', icon: 'cafe-outline', set: 'ion' },
      { id: 'parking', label: 'Parking', icon: 'local-parking', set: 'material' },
      { id: 'wifi', label: 'WiFi', icon: 'wifi-outline', set: 'ion' },
      { id: 'forest-view', label: 'Forest View', icon: 'image-outline', set: 'ion' },
    ],
    price: 2100,
    maxGuests: 3,
  },
};

const HomeStaysScreen = ({ navigation, route }) => {
  const homestay =
    HOMESTAYS_BY_ID[route?.params?.id] ?? HOMESTAYS_BY_ID['coorg-cottage'];

  const [activeImage, setActiveImage] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const imageListRef = useRef(null);
  // RN's built-in SafeAreaView only computes real insets on iOS — on
  // Android it's a no-op, so with a translucent status bar (needed here
  // for the hero photo to bleed edge-to-edge) the overlaid back button
  // would collide with the status bar/camera cutout on many Android
  // phones. react-native-safe-area-context measures the actual inset on
  // both platforms, so this stays correct across devices.
  const insets = useSafeAreaInsets();

  // A single selected day is a range of {start, end: null} — one night.
  // Picking a second day extends it into a multi-night range.
  const [selectedRange, setSelectedRange] = useState({ start: getTodayKey(), end: null });

  const nights = selectedRange.end
    ? Math.round(
      (dateKeyToUTC(selectedRange.end) - dateKeyToUTC(selectedRange.start)) / 86400000,
    )
    : 1;
  const totalPrice = homestay.price * nights;

  const visibleAmenities = showAllAmenities
    ? homestay.amenities
    : homestay.amenities.slice(0, 4);

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
      description: homestay.name,
      image: homestay.images[0],
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
  }, [homestay, totalPrice, navigation]);

  const onImageScrollEnd = useCallback(event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImage(index);
  }, []);

  const renderImage = useCallback(
    ({ item }) => <Image source={{ uri: item }} style={styles.heroImage} />,
    [],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fixed hero — sits outside the ScrollView below so only the content
          underneath it scrolls, not the whole page. */}
      <View style={styles.heroWrap}>
        <FlatList
          ref={imageListRef}
          data={homestay.images}
          keyExtractor={(_, index) => `${homestay.id}-image-${index}`}
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
        </View>

        {homestay.verified && (
          <View style={styles.verifiedBadge}>
            <Icon name="checkmark-circle" size={13} color="#FFFFFF" />
            <Text style={styles.verifiedBadgeText}>Verified Host</Text>
          </View>
        )}

        {homestay.images.length > 1 && (
          <View style={styles.dotsRow}>
            {homestay.images.map((_, index) => (
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
          <Text style={styles.homestayName}>{homestay.name}</Text>

          <View style={styles.locationRow}>
            <Text style={styles.locationText}>{homestay.location}</Text>
          </View>

          {/* Host */}
          <View style={styles.hostCard}>
            <Image source={{ uri: homestay.host.avatar }} style={styles.hostAvatar} />
            <View style={styles.hostInfo}>
              <Text style={styles.hostName}>{homestay.host.name}</Text>
              <Text style={styles.hostMeta}>
                {homestay.host.superhost ? 'Superhost · ' : ''}
                {homestay.host.years} years hosting
              </Text>
              <View style={styles.hostRatingRow}>
                <Icon name="star" size={12} color={AMBER} />
                <Text style={styles.hostRatingText}>
                  {homestay.host.rating} · {homestay.host.reviews} reviews
                </Text>
              </View>
            </View>
            {/* <TouchableOpacity onPress={() => navigation?.navigate?.("ChatScreen")}

              style={styles.messageButton} activeOpacity={0.8}>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity> */}
          </View>

          {/* Amenities */}
          <View style={styles.amenitiesWrap}>
            {visibleAmenities.map(item => (
              <View key={item.id} style={styles.amenityPill}>
                {item.set === 'material' ? (
                  <MaterialIcon name={item.icon} size={15} color={BLUE} />
                ) : (
                  <Icon name={item.icon} size={15} color={BLUE} />
                )}
                <Text style={styles.amenityPillLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
          {homestay.amenities.length > 4 && (
            <TouchableOpacity
              style={styles.amenitiesToggle}
              activeOpacity={0.7}
              onPress={() => setShowAllAmenities(prev => !prev)}>
              <Text style={styles.amenitiesToggleText}>
                {showAllAmenities ? 'Show less' : `Show all ${homestay.amenities.length} amenities`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Availability */}
          <View style={styles.calendarSection}>
            <BookingCalendar selectedRange={selectedRange} onChangeRange={setSelectedRange} />
          </View>
        </View>
      </ScrollView>

      {/* Booking footer — bottom inset so it clears the home indicator / gesture bar */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View>
          <Text style={styles.footerPrice}>
            ₹{totalPrice.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.footerSub}>
            {nights} {nights === 1 ? 'night' : 'nights'} · {homestay.maxGuests} guests max
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

const HERO_HEIGHT = 260;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFF',
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
  verifiedBadge: {
    position: 'absolute',
    left: 16,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
  homestayName: {
    fontSize: 21,
    fontWeight: '800',
    color: INK,
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

  // Host card
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  hostMeta: {
    fontSize: 11,
    color: GRAY,
    marginTop: 2,
  },
  hostRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  hostRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: INK,
  },
  messageButton: {
    backgroundColor: '#EAF2FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  messageButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: BLUE,
  },

  // Amenities
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  amenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  amenityPillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: INK,
  },
  amenitiesToggle: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  amenitiesToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: BLUE,
  },

  // Availability
  calendarSection: {
    marginTop: 24,
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
  footerSub: {
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

export default HomeStaysScreen;
