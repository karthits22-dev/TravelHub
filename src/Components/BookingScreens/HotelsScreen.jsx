import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import {STAY_ITEMS, RESORT_ITEMS, HOMESTAY_ITEMS} from '../../Data/listings';
import {fetchHotels, fetchHotelAmenities} from '../../Services/HotelsService';
import {defaultStayRange, nightsBetween} from '../../Utils/stayDates';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';

const FALLBACK_AMENITIES = [
  {id: 'wifi', label: 'Free Wi-Fi', icon: 'wifi-outline', set: 'ion'},
  {id: 'parking', label: 'Free parking', icon: 'local-parking', set: 'material'},
];

const StayDetailScreen = ({navigation, route}) => {
  const {
    id,
    categoryId,
    checkIn: checkInParam,
    checkOut: checkOutParam,
    guests: guestsParam,
  } = route?.params ?? {};

  const defaultRange = useMemo(defaultStayRange, []);
  const checkIn = checkInParam ?? defaultRange.checkIn;
  const checkOut = checkOutParam ?? defaultRange.checkOut;
  const guests = guestsParam ?? 2;
  const nights = nightsBetween(checkIn, checkOut);

  const insets = useSafeAreaInsets();

  const hardcodedStay = useMemo(() => {
    if (categoryId === 'resorts') return RESORT_ITEMS.find(item => item.id === id);
    if (categoryId === 'homestays') return HOMESTAY_ITEMS.find(item => item.id === id);
    return STAY_ITEMS.find(item => item.id === id);
  }, [categoryId, id]);

  const [liveStay, setLiveStay] = useState(null);
  const [loading, setLoading] = useState(!hardcodedStay);
  const [error, setError] = useState(null);

  // Live hotels (anything not in the hardcoded demo set) have no
  // amenities/room-type breakdown of their own yet, so this synthesizes a
  // single "Standard Room" from the API's per-night price and pulls
  // amenities from the separate live amenities endpoint.
  useEffect(() => {
    if (hardcodedStay) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchHotels(), fetchHotelAmenities(id).catch(() => [])])
      .then(([hotels, amenities]) => {
        if (cancelled) return;
        const hotel = hotels.find(h => h.id === id);
        if (!hotel) {
          setError("Couldn't find this stay.");
          return;
        }
        setLiveStay({
          ...hotel,
          shortLocation: hotel.location.split(',')[0].trim() || hotel.location,
          distanceKm: null,
          reviewCount: null,
          photosCount: 4,
          description: `${hotel.badge ? `${hotel.badge} · ` : ''}A comfortable stay in ${hotel.location}.`,
          amenities: amenities.length > 0 ? amenities : FALLBACK_AMENITIES,
          roomTypes: [
            {
              id: 'standard-room',
              name: 'Standard Room',
              meta: `Up to ${guests} guests · Free cancellation`,
              price: hotel.price,
            },
          ],
          defaultRoomId: 'standard-room',
        });
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Failed to load this stay.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hardcodedStay, id, guests]);

  const stay = hardcodedStay ?? liveStay;
  const [selectedRoomId, setSelectedRoomId] = useState(stay?.defaultRoomId);

  useEffect(() => {
    if (stay && !selectedRoomId) setSelectedRoomId(stay.defaultRoomId);
  }, [stay, selectedRoomId]);

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <StatusBar barStyle="dark-content" backgroundColor={CREAM} />
        <ActivityIndicator size="large" color={DEEP_GREEN} />
      </View>
    );
  }

  if (error || !stay) {
    return (
      <View style={styles.centerScreen}>
        <StatusBar barStyle="dark-content" backgroundColor={CREAM} />
        <Text style={styles.errorText}>{error || "Couldn't find this stay."}</Text>
        <TouchableOpacity
          style={styles.backLinkButton}
          activeOpacity={0.8}
          onPress={() => navigation?.goBack?.()}>
          <Text style={styles.backLinkButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedRoom =
    stay.roomTypes.find(r => r.id === selectedRoomId) ?? stay.roomTypes[0];
  const totalPrice = selectedRoom.price * nights;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.hero, {paddingTop: insets.top + 12}]}>
          <TouchableOpacity
            style={[styles.backButton, {top: insets.top + 12}]}
            activeOpacity={0.8}
            onPress={() => navigation?.goBack?.()}>
            <Icon name="chevron-back" size={18} color={TEXT_DARK} />
          </TouchableOpacity>
          <Icon name="home-outline" size={56} color={ICON_MINT} style={styles.heroIcon} />
          <View style={styles.photoBadge}>
            <Text style={styles.photoBadgeText}>1 / {stay.photosCount ?? 6} photos</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.stayName}>{stay.name}</Text>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingPillText}>{stay.rating}</Text>
              <Icon name="star" size={12} color={ICON_MINT} />
            </View>
          </View>

          <Text style={styles.metaText}>
            {stay.location}
            {stay.distanceKm != null ? ` · ${stay.distanceKm} km from centre` : ''}
            {stay.reviewCount != null ? ` · ${stay.reviewCount} reviews` : ''}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.amenitiesRow}>
            {stay.amenities.map(amenity => (
              <View key={amenity.id} style={styles.amenityPill}>
                {amenity.set === 'material' ? (
                  <MaterialIcon name={amenity.icon} size={14} color={ICON_MINT} />
                ) : (
                  <Icon name={amenity.icon} size={14} color={ICON_MINT} />
                )}
                <Text style={styles.amenityPillText}>{amenity.label}</Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.description}>{stay.description}</Text>

          <Text style={styles.sectionTitle}>Choose a room</Text>
          <View style={styles.roomList}>
            {stay.roomTypes.map(room => {
              const selected = room.id === selectedRoomId;
              return (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomCard, selected && styles.roomCardSelected]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedRoomId(room.id)}>
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomMeta}>{room.meta}</Text>
                  </View>
                  <View style={styles.roomPriceWrap}>
                    <Text style={styles.roomPrice}>₹{room.price.toLocaleString('en-IN')}</Text>
                    <Text style={styles.roomPriceUnit}>per night</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 16)}]}>
        <View>
          <Text style={styles.footerPrice}>₹{totalPrice.toLocaleString('en-IN')}</Text>
          <Text style={styles.footerMeta}>
            {nights} {nights === 1 ? 'night' : 'nights'}, {selectedRoom.name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          activeOpacity={0.85}
          onPress={() =>
            navigation?.navigate?.('ConfirmPay', {
              stayId: stay.id,
              stayName: stay.name,
              roomName: selectedRoom.name,
              pricePerNight: selectedRoom.price,
              checkIn,
              checkOut,
              guests,
              nights,
            })
          }>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const HERO_HEIGHT = 240;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 16,
  },
  backLinkButton: {
    backgroundColor: DEEP_GREEN,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backLinkButtonText: {
    color: CREAM,
    fontWeight: '700',
    fontSize: 13,
  },

  hero: {
    height: HERO_HEIGHT,
    backgroundColor: TINT_MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    opacity: 0.9,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(15,61,52,0.85)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoBadgeText: {
    color: CREAM,
    fontSize: 11,
    fontWeight: '700',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  stayName: {
    flex: 1,
    fontSize: 21,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: TINT_MINT,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  ratingPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ICON_MINT,
  },
  metaText: {
    marginTop: 6,
    fontSize: 12.5,
    color: TEXT_MUTED,
  },

  amenitiesRow: {
    gap: 8,
    marginTop: 16,
    paddingRight: 4,
  },
  amenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  amenityPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_DARK,
  },

  description: {
    marginTop: 18,
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT_MUTED,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
    marginTop: 26,
    marginBottom: 12,
  },
  roomList: {
    gap: 12,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roomCardSelected: {
    borderColor: DEEP_GREEN,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  roomMeta: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 3,
  },
  roomPriceWrap: {
    alignItems: 'flex-end',
  },
  roomPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  roomPriceUnit: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginTop: 2,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: WHITE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  footerPrice: {
    fontSize: 19,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  footerMeta: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: DEEP_GREEN,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  bookButtonText: {
    color: CREAM,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default StayDetailScreen;
