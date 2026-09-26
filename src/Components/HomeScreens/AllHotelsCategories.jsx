import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {STAY_CATEGORIES, RESORT_ITEMS, HOMESTAY_ITEMS} from '../../Data/listings';
import {fetchHotels} from '../../Services/HotelsService';
import BookingCalendar from '../Booking/BookingCalendar';
import {formatShortDate, defaultStayRange} from '../../Utils/stayDates';

const DEEP_GREEN = '#0F3D34';
const CREAM = '#F5F0E4';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1B2E2A';
const TEXT_MUTED = '#6E7D77';
const BORDER = '#E4DFD2';
const TINT_MINT = '#E1EEE8';
const ICON_MINT = '#1F6F5C';
const TINT_PEACH = '#FBEAE0';
const ICON_PEACH = '#C2703D';

const FILTERS = [{id: 'all', label: 'All Stays'}, ...STAY_CATEGORIES];

// Alternates the icon-placeholder tint per card, matching the two-tone look
// of the reference design (no real photos on this flow — see cardImage).
const TILE_TINTS = [
  {bg: TINT_MINT, icon: ICON_MINT},
  {bg: TINT_PEACH, icon: ICON_PEACH},
];

function formatDistanceLabel(item) {
  const shortLocation = item.shortLocation || item.location;
  if (item.distanceKm == null) return shortLocation;
  const isCentre = /centre|center/i.test(shortLocation);
  return isCentre
    ? `${shortLocation} · ${item.distanceKm} km`
    : `${shortLocation} · ${item.distanceKm} km from centre`;
}

const AllHotelsCategories = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const initialRange = useMemo(defaultStayRange, []);
  const [checkIn, setCheckIn] = useState(initialRange.checkIn);
  const [checkOut, setCheckOut] = useState(initialRange.checkOut);
  const [guests, setGuests] = useState(2);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [draftRange, setDraftRange] = useState({start: checkIn, end: checkOut});
  const [guestsPickerVisible, setGuestsPickerVisible] = useState(false);
  const [draftGuests, setDraftGuests] = useState(guests);

  const [liveHotels, setLiveHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [hotelsError, setHotelsError] = useState(null);
  const [hotelsReloadKey, setHotelsReloadKey] = useState(0);

  // "Hotels" is the only category backed by a live API so far — Resorts and
  // Homestays still read from the hardcoded Data/listings.js dataset.
  console.log("LIVE HOTELS",liveHotels)
  useEffect(() => {
    let cancelled = false;
    setHotelsLoading(true);
    setHotelsError(null);

    fetchHotels()
      .then(data => {
        if (!cancelled) setLiveHotels(data);
      })
      .catch(err => {
        if (!cancelled) setHotelsError(err.message || 'Failed to load hotels');
      })
      .finally(() => {
        if (!cancelled) setHotelsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hotelsReloadKey]);

  const allStays = useMemo(
    () => [
      ...liveHotels.map(item => ({...item, categoryId: 'hotels'})),
      ...RESORT_ITEMS.map(item => ({...item, categoryId: 'resorts'})),
      ...HOMESTAY_ITEMS.map(item => ({...item, categoryId: 'homestays'})),
    ],
    [liveHotels],
  );

  const trimmedQuery = searchText.trim().toLowerCase();
  const results = useMemo(() => {
    const filtered = allStays.filter(item => {
      const matchesFilter = activeFilter === 'all' || item.categoryId === activeFilter;
      const matchesQuery =
        !trimmedQuery ||
        item.name.toLowerCase().includes(trimmedQuery) ||
        item.location.toLowerCase().includes(trimmedQuery);
      return matchesFilter && matchesQuery;
    });
    return [...filtered].sort((a, b) => b.rating - a.rating);
  }, [allStays, activeFilter, trimmedQuery]);

  const openDatePicker = () => {
    setDraftRange({start: checkIn, end: checkOut});
    setDatePickerVisible(true);
  };

  const confirmDatePicker = () => {
    setCheckIn(draftRange.start);
    setCheckOut(draftRange.end ?? draftRange.start);
    setDatePickerVisible(false);
  };

  const openGuestsPicker = () => {
    setDraftGuests(guests);
    setGuestsPickerVisible(true);
  };

  const confirmGuestsPicker = () => {
    setGuests(draftGuests);
    setGuestsPickerVisible(false);
  };

  const keyExtractor = useCallback(item => `${item.categoryId}-${item.id}`, []);

  const renderStay = useCallback(
    ({item, index}) => {
      const tint = TILE_TINTS[index % TILE_TINTS.length];
      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() =>
            navigation?.navigate?.('Hotels', {
              id: item.id,
              categoryId: item.categoryId,
              checkIn,
              checkOut,
              guests,
            })
          }>
          <View style={[styles.cardImageWrap, {backgroundColor: tint.bg}]}>
            <Icon name="home-outline" size={30} color={tint.icon} />
            {item.badge ? (
              <View style={[styles.cardBadge, {backgroundColor: item.badgeColor}]}>
                <Text style={styles.cardBadgeText}>{item.badge}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardTextArea}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardLocation} numberOfLines={1}>
                {formatDistanceLabel(item)}
              </Text>
            </View>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingPillText}>{item.rating}</Text>
              <Icon name="star" size={10} color={ICON_MINT} />
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, checkIn, checkOut, guests],
  );

  const showHotelsGate = activeFilter === 'hotels' && liveHotels.length === 0;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}>
          <Icon name="chevron-back" size={17} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hotels & Stays</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.searchCard}>
          <Icon name="search" size={15} color={TEXT_MUTED} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search destination"
            placeholderTextColor={TEXT_MUTED}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.pickerRow}>
          <TouchableOpacity style={styles.pickerBox} activeOpacity={0.8} onPress={openDatePicker}>
            <Text style={styles.pickerLabel}>Check-in — Check-out</Text>
            <Text style={styles.pickerValue}>
              {formatShortDate(checkIn)} — {formatShortDate(checkOut)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerBox} activeOpacity={0.8} onPress={openGuestsPicker}>
            <Text style={styles.pickerLabel}>Guests</Text>
            <Text style={styles.pickerValue}>
              {guests} {guests === 1 ? 'Adult' : 'Adults'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersRow}>
          {FILTERS.map(filter => {
            const active = filter.id === activeFilter;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(filter.id)}>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {showHotelsGate && hotelsLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={DEEP_GREEN} />
          </View>
        ) : showHotelsGate && hotelsError ? (
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
          <>
            <Text style={styles.resultsCount}>
              {results.length} {results.length === 1 ? 'stay' : 'stays'} found · sorted by rating
            </Text>
            <FlatList
              data={results}
              keyExtractor={keyExtractor}
              renderItem={renderStay}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                {paddingBottom: 24 + insets.bottom},
              ]}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No stays match your search.</Text>
              }
            />
          </>
        )}
      </View>

      {/* Date picker sheet */}
      <Modal visible={datePickerVisible} animationType="slide" transparent onRequestClose={() => setDatePickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, {paddingBottom: Math.max(insets.bottom, 16)}]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select dates</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)} activeOpacity={0.7}>
                <Icon name="close" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            <BookingCalendar
              selectedRange={draftRange}
              onChangeRange={setDraftRange}
              accentColor={DEEP_GREEN}
              accentTint={TINT_MINT}
              rangeTrackColor={TINT_MINT}
            />
            <TouchableOpacity style={styles.modalDoneButton} activeOpacity={0.85} onPress={confirmDatePicker}>
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Guests picker sheet */}
      <Modal visible={guestsPickerVisible} animationType="slide" transparent onRequestClose={() => setGuestsPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, {paddingBottom: Math.max(insets.bottom, 16)}]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Guests</Text>
              <TouchableOpacity onPress={() => setGuestsPickerVisible(false)} activeOpacity={0.7}>
                <Icon name="close" size={22} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>Adults</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  activeOpacity={0.8}
                  disabled={draftGuests <= 1}
                  onPress={() => setDraftGuests(g => Math.max(1, g - 1))}>
                  <Icon name="remove" size={18} color={draftGuests <= 1 ? TEXT_MUTED : DEEP_GREEN} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{draftGuests}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  activeOpacity={0.8}
                  disabled={draftGuests >= 8}
                  onPress={() => setDraftGuests(g => Math.min(8, g + 1))}>
                  <Icon name="add" size={18} color={draftGuests >= 8 ? TEXT_MUTED : DEEP_GREEN} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.modalDoneButton} activeOpacity={0.85} onPress={confirmGuestsPicker}>
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
  },

  body: {
    flex: 1,
    paddingHorizontal: 20,
  },

  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: TEXT_DARK,
    padding: 0,
  },

  pickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  pickerBox: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerLabel: {
    fontSize: 10,
    color: TEXT_MUTED,
  },
  pickerValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_DARK,
    marginTop: 3,
  },

  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 14,
  },
  filterChip: {
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterChipActive: {
    backgroundColor: DEEP_GREEN,
    borderColor: DEEP_GREEN,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  filterChipTextActive: {
    color: CREAM,
  },

  resultsCount: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginTop: 14,
    marginBottom: 10,
  },

  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImageWrap: {
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    gap: 8,
  },
  cardTextArea: {
    flex: 1,
  },
  cardName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  cardLocation: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 3,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: TINT_MINT,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: ICON_MINT,
  },

  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 13,
    color: TEXT_MUTED,
  },
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
    color: TEXT_MUTED,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: DEEP_GREEN,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: CREAM,
    fontWeight: '700',
    fontSize: 13,
  },

  // Bottom-sheet modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,61,52,0.35)',
  },
  modalSheet: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  modalDoneButton: {
    backgroundColor: DEEP_GREEN,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  modalDoneButtonText: {
    color: CREAM,
    fontWeight: '700',
    fontSize: 15,
  },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TINT_MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    minWidth: 18,
    textAlign: 'center',
  },
});

export default AllHotelsCategories;
