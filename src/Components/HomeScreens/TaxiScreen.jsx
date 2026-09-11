import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
// RN's built-in SafeAreaView is a no-op on Android — on Android 15+, which
// enforces edge-to-edge for every screen, that would leave the header
// jammed under the status bar/camera cutout. react-native-safe-area-context
// measures the actual inset on both platforms.
import {SafeAreaView} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import Taxicon from 'react-native-vector-icons/MaterialIcons';

import PlaceSearchModal from '../Taxi/PlaceSearchModal';
import AppMap from '../Taxi/AppMap';
import {getDirections, reverseGeocode} from '../../Services/PlacesService';
import {getLastKnownPlace, setLastKnownPlace} from '../../Services/LastLocationCache';
import {decodePolyline} from '../../Utils/polyline';
import {
  haversineDistanceMeters,
  formatDistance,
  formatDuration,
  offsetCoordinate,
  lerpCoordinate,
} from '../../Utils/distance';
import {resolveCurrentPosition} from '../../Utils/locationPermission';

const BLUE = '#0057FF';
const GREEN = '#16A34A';
const RED = '#DC2626';
const INK = '#111827';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';

const BANGALORE_FALLBACK = {latitude: 12.9716, longitude: 77.5946};
const MAP_HEIGHT = 260;

const VEHICLES = [
  {
    id: 'mini',
    label: 'Mini',
    description: 'Compact, affordable',
    arrivalMinutes: 3,
    icon: 'directions-car',
    base: 30,
    perKm: 9,
    perMin: 1.5,
    defaultFare: 128,
  },
  {
    id: 'sedan',
    label: 'Sedan',
    description: 'Comfortable ride',
    arrivalMinutes: 5,
    icon: 'directions-car',
    base: 45,
    perKm: 13,
    perMin: 2,
    defaultFare: 192,
  },
  {
    id: 'suv',
    label: 'SUV',
    description: 'Spacious, 6 seats',
    arrivalMinutes: 7,
    icon: 'airport-shuttle',
    base: 70,
    perKm: 19,
    perMin: 2.5,
    defaultFare: 288,
  },
  {
    id: 'luxury',
    label: 'Luxury',
    description: 'Premium experience',
    arrivalMinutes: 8,
    icon: 'directions-car',
    base: 120,
    perKm: 32,
    perMin: 4,
    defaultFare: 480,
  },
];

const PROMO_CODES = {
  SAVE10: {percent: 10, label: '10% off'},
  WELCOME20: {percent: 20, maxDiscount: 100, label: '20% off, up to ₹100'},
};

function computeFare(vehicle, route) {
  if (!route) return vehicle.defaultFare;
  const km = route.distanceMeters / 1000;
  const mins = route.durationSeconds / 60;
  return Math.round(vehicle.base + vehicle.perKm * km + vehicle.perMin * mins);
}

function applyDiscount(fare, promo) {
  if (!promo) return fare;
  const raw = (fare * promo.percent) / 100;
  const discount = promo.maxDiscount ? Math.min(raw, promo.maxDiscount) : raw;
  return Math.max(0, Math.round(fare - discount));
}

// ---------------------------------------------------------------------------
// Live captain tracking — there's no real driver-matching backend, so this
// simulates one: a captain "spawns" at a plausible distance away (based on
// the selected vehicle's own arrivalMinutes, so it lines up with the ETA
// already shown during vehicle selection) and is animated toward pickup.
// ---------------------------------------------------------------------------

const CAPTAIN_NAMES = ['Ramesh Kumar', 'Suresh Babu', 'Arjun Singh', 'Vinod Nair', 'Karthik Iyer'];
const PLATE_PREFIXES = ['KA05', 'KA51', 'TN09', 'TN22'];
const CAPTAIN_SPEED_KMPH = 25; // assumed average city speed for the simulated approach

function generateCaptain(vehicle, pickup) {
  const arrivalSeconds = vehicle.arrivalMinutes * 60;
  const distanceMeters = (vehicle.arrivalMinutes / 60) * CAPTAIN_SPEED_KMPH * 1000;
  const bearing = Math.random() * 360;
  return {
    name: CAPTAIN_NAMES[Math.floor(Math.random() * CAPTAIN_NAMES.length)],
    plate: `${PLATE_PREFIXES[Math.floor(Math.random() * PLATE_PREFIXES.length)]} ${Math.floor(
      1000 + Math.random() * 9000,
    )}`,
    rating: (4.5 + Math.random() * 0.5).toFixed(1),
    vehicleLabel: vehicle.label,
    startCoordinate: offsetCoordinate(pickup, distanceMeters, bearing),
    arrivalSeconds,
  };
}

function formatCountdown(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const TaxiScreen = ({navigation, route: navRoute}) => {
  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);
  const pendingMapActionsRef = useRef([]);

  // AppMap's native ref isn't guaranteed usable the instant it mounts —
  // camera moves (animateToRegion/fitToCoordinates) queue here until
  // onMapReady fires, instead of silently no-op-ing against a map that
  // isn't ready to accept commands yet.
  const focusMap = useCallback(action => {
    if (mapReadyRef.current) action();
    else pendingMapActionsRef.current.push(action);
  }, []);

  const handleMapReady = useCallback(() => {
    mapReadyRef.current = true;
    const pending = pendingMapActionsRef.current;
    pendingMapActionsRef.current = [];
    pending.forEach(action => action());
  }, []);

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [locating, setLocating] = useState(true);
  const [mapPickLoading, setMapPickLoading] = useState(false);

  const [searchField, setSearchField] = useState(null); // 'pickup' | 'drop' | null

  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const requestedVehicle = navRoute?.params?.vehicleType;
  const [selectedVehicle, setSelectedVehicle] = useState(
    VEHICLES.some(v => v.id === requestedVehicle) ? requestedVehicle : 'sedan',
  );

  const [scheduleMode, setScheduleMode] = useState('now'); // 'now' | 'later'
  const [scheduledAt, setScheduledAt] = useState(new Date());
  const [pickerMode, setPickerMode] = useState(null); // 'date' | 'time' | null

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const [booking, setBooking] = useState(false);

  // Live captain tracking, once a ride is booked. `captainInfo` is set once
  // (name/plate/rating/start position/total ETA) and never mutated —
  // `elapsedSeconds` ticks independently so the tracking interval below
  // doesn't need to re-subscribe every second.
  const [captainInfo, setCaptainInfo] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!captainInfo) return undefined;

    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        if (next >= captainInfo.arrivalSeconds) {
          clearInterval(interval);
          return captainInfo.arrivalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [captainInfo]);

  const captainProgress = captainInfo
    ? Math.min(elapsedSeconds / captainInfo.arrivalSeconds, 1)
    : 0;
  const captainCoordinate =
    captainInfo && pickup ? lerpCoordinate(captainInfo.startCoordinate, pickup, captainProgress) : null;
  const captainArrived = !!captainInfo && captainProgress >= 1;
  const captainEtaSeconds = captainInfo
    ? Math.max(captainInfo.arrivalSeconds - elapsedSeconds, 0)
    : 0;

  const handleCancelRide = useCallback(() => {
    Alert.alert('Cancel ride?', 'Your captain will be notified.', [
      {text: 'Keep ride', style: 'cancel'},
      {
        text: 'Cancel ride',
        style: 'destructive',
        onPress: () => {
          setCaptainInfo(null);
          setElapsedSeconds(0);
        },
      },
    ]);
  }, []);

  // Auto-detect the rider's current location on mount so pickup starts
  // prefilled. A cached pickup (if any) paints instantly so the screen
  // never sits on a blank "detecting location…" state, then
  // resolveCurrentPosition() refines it in the background.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = await getLastKnownPlace();
      if (cancelled) return;
      if (cached) {
        setPickup(cached);
        setLocating(false);
        focusMap(() =>
          mapRef.current?.animateToRegion(
            {
              latitude: cached.latitude,
              longitude: cached.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            },
            0,
          ),
        );
      }

      try {
        const position = await resolveCurrentPosition();
        if (cancelled) return;
        const {latitude, longitude} = position.coords;
        const place = await reverseGeocode(latitude, longitude);
        if (cancelled) return;
        const resolved = {
          placeId: 'current-location',
          description: place.address,
          address: place.address,
          latitude,
          longitude,
        };
        setPickup(resolved);
        setLastKnownPlace(resolved); // fire-and-forget, for next open
        focusMap(() =>
          mapRef.current?.animateToRegion(
            {latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02},
            cached ? 400 : 600,
          ),
        );
      } catch (err) {
        // Silent — background auto-detect, not a user-initiated action. If
        // a cached pickup already painted it stays put; otherwise the map
        // falls back to BANGALORE_FALLBACK and the field's placeholder
        // invites a manual pick.
      } finally {
        if (!cancelled) setLocating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [focusMap]);

  // Fetch the driving route whenever both ends of the trip are known.
  useEffect(() => {
    if (!pickup || !drop) {
      setRoute(null);
      return;
    }

    let cancelled = false;
    setRouteLoading(true);

    (async () => {
      const directions = await getDirections(pickup, drop);
      if (cancelled) return;

      if (directions) {
        setRoute(directions);
      } else {
        // Falls back to a straight-line estimate (e.g. API key not configured yet)
        // so fare/ETA still populate instead of leaving the screen blank.
        const meters = haversineDistanceMeters(pickup, drop);
        setRoute({
          polyline: null,
          distanceMeters: meters,
          distanceText: formatDistance(meters),
          durationSeconds: (meters / 1000 / 30) * 3600, // assume ~30 km/h
          durationText: formatDuration((meters / 1000 / 30) * 3600),
        });
      }
      setRouteLoading(false);

      const coords = [pickup, drop].map(p => ({latitude: p.latitude, longitude: p.longitude}));
      focusMap(() =>
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: {top: 60, right: 50, bottom: 60, left: 50},
          animated: true,
        }),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [pickup, drop, focusMap]);

  const routePoints = useMemo(
    () => (route?.polyline ? decodePolyline(route.polyline) : []),
    [route],
  );

  const handleUseCurrentLocation = useCallback(async () => {
    const position = await resolveCurrentPosition();
    const {latitude, longitude} = position.coords;
    const place = await reverseGeocode(latitude, longitude);
    const resolved = {
      placeId: 'current-location',
      description: place.address,
      address: place.address,
      latitude,
      longitude,
    };
    setLastKnownPlace(resolved); // fire-and-forget, for next open
    return resolved;
  }, []);

  const handleSelectPlace = useCallback(
    place => {
      if (searchField === 'pickup') setPickup(place);
      else if (searchField === 'drop') setDrop(place);
      setSearchField(null);
    },
    [searchField],
  );

  const handleSwap = useCallback(() => {
    setPickup(drop);
    setDrop(pickup);
  }, [pickup, drop]);

  const handleRecenter = useCallback(async () => {
    try {
      const place = await handleUseCurrentLocation();
      setPickup(place);
      focusMap(() =>
        mapRef.current?.animateToRegion(
          {
            latitude: place.latitude,
            longitude: place.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          600,
        ),
      );
    } catch (err) {
      Alert.alert('Location unavailable', err.message);
    }
  }, [handleUseCurrentLocation, focusMap]);

  const resolveMapPoint = useCallback(async ({latitude, longitude}) => {
    const place = await reverseGeocode(latitude, longitude);
    return {
      placeId: 'map-pin',
      description: place.address,
      address: place.address,
      latitude,
      longitude,
    };
  }, []);

  // Tap the map to set a point directly — sets pickup until one exists,
  // then fills drop. Superseded at any time by using the search fields
  // instead. The map itself stays non-interactive (no pan/scroll capture,
  // so the page scrolls normally over it) — this still works because a
  // single tap is a distinct gesture from a scroll swipe.
  const handleMapPress = useCallback(
    async ({latitude, longitude}) => {
      const target = !pickup ? 'pickup' : !drop ? 'drop' : null;
      if (!target) return; // both already set — tap the fields to change either

      setMapPickLoading(true);
      try {
        const resolved = await resolveMapPoint({latitude, longitude});
        if (target === 'pickup') setPickup(resolved);
        else setDrop(resolved);
      } finally {
        setMapPickLoading(false);
      }
    },
    [pickup, drop, resolveMapPoint],
  );

  // Once a pickup exists, its pin can be dragged directly to fine-tune the
  // exact spot — dragging a marker is its own gesture (press, hold, then
  // move), so it doesn't fight the page's scroll the way panning the whole
  // map would.
  const handlePickupDragEnd = useCallback(
    async coordinate => {
      setMapPickLoading(true);
      try {
        setPickup(await resolveMapPoint(coordinate));
      } finally {
        setMapPickLoading(false);
      }
    },
    [resolveMapPoint],
  );

  const handleApplyPromo = useCallback(() => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const promo = PROMO_CODES[code];
    if (!promo) {
      setPromoError('Invalid or expired code.');
      setAppliedPromo(null);
      return;
    }
    setAppliedPromo({code, ...promo});
    setPromoError('');
  }, [promoInput]);

  const handleRemovePromo = useCallback(() => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
  }, []);

  const onChangeDateTime = useCallback(
    (event, selected) => {
      const wasDate = pickerMode === 'date';
      setPickerMode(null);
      if (event.type === 'dismissed' || !selected) return;

      setScheduledAt(prev => {
        const next = new Date(prev);
        if (wasDate) {
          next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        } else {
          next.setHours(selected.getHours(), selected.getMinutes());
        }
        return next;
      });
    },
    [pickerMode],
  );

  const selectedVehicleData = VEHICLES.find(v => v.id === selectedVehicle);
  const rawFare = computeFare(selectedVehicleData, route);
  const finalFare = applyDiscount(rawFare, appliedPromo);

  const canBook = !!pickup && !!drop && !booking;

  const handleBookRide = useCallback(() => {
    if (!pickup || !drop) return;
    setBooking(true);

    setTimeout(() => {
      setBooking(false);

      // A "later" booking has no captain to dispatch yet — just confirm
      // and leave, same as before. "Now" starts live tracking instead.
      if (scheduleMode === 'later') {
        Alert.alert(
          'Ride scheduled',
          `${selectedVehicleData.label} from ${pickup.description ?? pickup.address} to ${
            drop.description ?? drop.address
          }.\nScheduled: ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString(
            [],
            {hour: '2-digit', minute: '2-digit'},
          )}\nFare: ₹${finalFare.toLocaleString('en-IN')}`,
          [{text: 'OK', onPress: () => navigation?.goBack?.()}],
        );
        return;
      }

      const info = generateCaptain(selectedVehicleData, pickup);
      setCaptainInfo(info);
      focusMap(() =>
        mapRef.current?.fitToCoordinates([info.startCoordinate, pickup], {
          edgePadding: {top: 60, right: 60, bottom: 60, left: 60},
          animated: true,
        }),
      );
    }, 800);
  }, [pickup, drop, scheduleMode, scheduledAt, selectedVehicleData, finalFare, focusMap, navigation]);

  const dateLabel =
    scheduleMode === 'now'
      ? 'Today'
      : scheduledAt.toLocaleDateString(undefined, {day: 'numeric', month: 'short'});
  const timeLabel =
    scheduleMode === 'now'
      ? 'Now'
      : scheduledAt.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation?.goBack?.()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Icon name="close" size={22} color={INK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {captainInfo
            ? captainArrived
              ? 'Captain has arrived'
              : 'Your captain is on the way'
            : 'Book Your Ride'}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {/* Fixed map — sits outside the ScrollView below so it stays put and
          only the content underneath it scrolls, not the map itself. */}
      <View style={styles.mapWrap}>
        <AppMap
          ref={mapRef}
          onReady={handleMapReady}
          onMapPress={handleMapPress}
          onPickupDragEnd={handlePickupDragEnd}
          height={MAP_HEIGHT}
          pickup={pickup}
          drop={drop}
          showPickupMarker={!!pickup}
          captain={captainCoordinate}
          routePoints={routePoints}
          initialRegion={{
            latitude: pickup?.latitude ?? BANGALORE_FALLBACK.latitude,
            longitude: pickup?.longitude ?? BANGALORE_FALLBACK.longitude,
          }}
        />

        <View style={styles.liveBadge}>
          <View style={styles.liveDotHalo}>
            <View style={styles.liveDot} />
          </View>
          <Text style={styles.liveBadgeText}>Live Map</Text>
        </View>

        {mapPickLoading && (
          <View style={styles.mapPickBadge}>
            <ActivityIndicator size="small" color={BLUE} />
            <Text style={styles.mapPickBadgeText}>Setting location…</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.recenterButton}
          activeOpacity={0.8}
          onPress={handleRecenter}
          disabled={locating}
          hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
          {locating ? (
            <ActivityIndicator size="small" color={BLUE} />
          ) : (
            <Icon name="locate" size={18} color={BLUE} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {captainInfo ? (
          <View style={styles.trackingCard}>
            <View style={styles.trackingEtaBadge}>
              <Icon name="time-outline" size={14} color={BLUE} />
              <Text style={styles.trackingEtaText}>
                {captainArrived ? 'Arrived' : formatCountdown(captainEtaSeconds)}
              </Text>
            </View>

            <View style={styles.captainRow}>
              <View style={styles.captainAvatar}>
                <Taxicon name="local-taxi" size={22} color={BLUE} />
              </View>
              <View style={styles.captainInfo}>
                <Text style={styles.captainName}>{captainInfo.name}</Text>
                <Text style={styles.captainMeta}>
                  {captainInfo.vehicleLabel} · {captainInfo.plate}
                </Text>
                <View style={styles.captainRatingRow}>
                  <Icon name="star" size={12} color="#F59E0B" />
                  <Text style={styles.captainRatingText}>{captainInfo.rating}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.captainActionButton} activeOpacity={0.8}>
                <Icon name="call" size={16} color={BLUE} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.captainActionButton} activeOpacity={0.8}>
                <Icon name="chatbubble-ellipses" size={16} color={BLUE} />
              </TouchableOpacity>
            </View>

            <View style={styles.tripSummaryDivider} />

            <View style={styles.locationRow}>
              <View style={styles.locationMarkers}>
                <View style={[styles.dot, {backgroundColor: GREEN}]} />
                <View style={styles.dotConnector} />
              </View>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationLabel}>PICKUP</Text>
                <Text style={styles.locationValue} numberOfLines={1}>
                  {pickup.description ?? pickup.address}
                </Text>
              </View>
            </View>
            <View style={styles.locationRow}>
              <View style={styles.locationMarkers}>
                <View style={[styles.dot, {backgroundColor: RED}]} />
              </View>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationLabel}>DROP</Text>
                <Text style={styles.locationValue} numberOfLines={1}>
                  {drop.description ?? drop.address}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <>
        {/* Pickup / Drop card */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.locationRow}
            activeOpacity={0.7}
            onPress={() => setSearchField('pickup')}>
            <View style={styles.locationMarkers}>
              <View style={[styles.dot, {backgroundColor: GREEN}]} />
              <View style={styles.dotConnector} />
            </View>
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationLabel}>PICKUP</Text>
              <Text
                style={pickup ? styles.locationValue : styles.locationPlaceholder}
                numberOfLines={1}>
                {pickup ? pickup.description ?? pickup.address : 'Where from?'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.swapButton}
            activeOpacity={0.7}
            onPress={handleSwap}
            disabled={!pickup && !drop}>
            <Icon name="swap-vertical" size={16} color={pickup || drop ? BLUE : '#C7CDD6'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.locationRow}
            activeOpacity={0.7}
            onPress={() => setSearchField('drop')}>
            <View style={styles.locationMarkers}>
              <View style={[styles.dot, {backgroundColor: RED}]} />
            </View>
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationLabel}>DROP</Text>
              <Text
                style={drop ? styles.locationValue : styles.locationPlaceholder}
                numberOfLines={1}>
                {drop ? drop.description ?? drop.address : 'Where to?'}
              </Text>
            </View>
          </TouchableOpacity>

          {(routeLoading || route) && (
            <View style={styles.routeInfoRow}>
              <Icon name="navigate-outline" size={13} color={GRAY} />
              <Text style={styles.routeInfoText}>
                {routeLoading
                  ? 'Calculating route…'
                  : `${route.distanceText} · ${route.durationText}`}
              </Text>
            </View>
          )}
        </View>

        {/* Schedule toggle */}
        {/* <View style={styles.scheduleToggle}>
          <TouchableOpacity
            style={[styles.scheduleOption, scheduleMode === 'now' && styles.scheduleOptionActive]}
            onPress={() => setScheduleMode('now')}>
            <Text
              style={[
                styles.scheduleOptionText,
                scheduleMode === 'now' && styles.scheduleOptionTextActive,
              ]}>
              Ride Now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scheduleOption, scheduleMode === 'later' && styles.scheduleOptionActive]}
            onPress={() => setScheduleMode('later')}>
            <Text
              style={[
                styles.scheduleOptionText,
                scheduleMode === 'later' && styles.scheduleOptionTextActive,
              ]}>
              Schedule for Later
            </Text>
          </TouchableOpacity>
        </View> */}

        {/* Date / Time pills */}
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.dateTimeCard}
            activeOpacity={scheduleMode === 'later' ? 0.7 : 1}
            onPress={() => scheduleMode === 'later' && setPickerMode('date')}>
            <Icon name="calendar-outline" size={16} color={GRAY} />
            <View>
              <Text style={styles.dateTimeLabel}>Date</Text>
              <Text style={styles.dateTimeValue}>{dateLabel}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateTimeCard}
            activeOpacity={scheduleMode === 'later' ? 0.7 : 1}
            onPress={() => scheduleMode === 'later' && setPickerMode('time')}>
            <Icon name="time-outline" size={16} color={GRAY} />
            <View>
              <Text style={styles.dateTimeLabel}>Time</Text>
              <Text style={styles.dateTimeValue}>{timeLabel}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {pickerMode && (
          <DateTimePicker
            value={scheduledAt}
            mode={pickerMode}
            minimumDate={new Date()}
            onChange={onChangeDateTime}
          />
        )}

        {/* Vehicles */}
        <Text style={styles.sectionTitle}>Choose Vehicle</Text>
        <View style={styles.vehicleList}>
          {VEHICLES.map(vehicle => {
            const selected = vehicle.id === selectedVehicle;
            const fare = applyDiscount(computeFare(vehicle, route), appliedPromo);
            return (
              <TouchableOpacity
                key={vehicle.id}
                style={[styles.vehicleCard, selected && styles.vehicleCardSelected]}
                activeOpacity={0.8}
                onPress={() => setSelectedVehicle(vehicle.id)}>
                <Taxicon name={vehicle.icon} size={26} color={selected ? BLUE : '#94A3B8'} />
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleLabel}>{vehicle.label}</Text>
                  <Text style={styles.vehicleDescription}>
                    {vehicle.description} · {vehicle.arrivalMinutes} min
                  </Text>
                </View>
                <View style={styles.vehiclePriceWrap}>
                  <Text style={styles.vehiclePrice}>₹{fare.toLocaleString('en-IN')}</Text>
                  {selected && <Text style={styles.vehicleSelectedText}>Selected</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Promo code */}
        <View style={styles.promoCard}>
          {appliedPromo ? (
            <View style={styles.promoAppliedRow}>
              <Icon name="pricetag" size={16} color={GREEN} />
              <Text style={styles.promoAppliedText}>
                {appliedPromo.code} applied — {appliedPromo.label}
              </Text>
              <TouchableOpacity onPress={handleRemovePromo} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Icon name="close-circle" size={18} color={GRAY} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.promoInputRow}>
                <Icon name="pricetag-outline" size={16} color={GRAY} />
                <TextInput
                  value={promoInput}
                  onChangeText={text => {
                    setPromoInput(text);
                    setPromoError('');
                  }}
                  placeholder="Have a promo code?"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  style={styles.promoInput}
                />
                <TouchableOpacity
                  style={styles.promoApplyButton}
                  onPress={handleApplyPromo}
                  disabled={!promoInput.trim()}>
                  <Text style={styles.promoApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
              {!!promoError && <Text style={styles.promoError}>{promoError}</Text>}
            </>
          )}
        </View>
          </>
        )}
      </ScrollView>

      {/* Footer — fare/Book while choosing, fare/Cancel once a captain is assigned */}
      {captainInfo ? (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerFareLabel}>Trip fare</Text>
            <Text style={styles.footerFareValue}>₹{finalFare.toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity
            style={styles.cancelRideButton}
            activeOpacity={0.85}
            onPress={handleCancelRide}>
            <Text style={styles.cancelRideButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerFareLabel}>Estimated fare</Text>
            <View style={styles.footerFareRow}>
              {appliedPromo && rawFare !== finalFare && (
                <Text style={styles.footerFareStrike}>₹{rawFare.toLocaleString('en-IN')}</Text>
              )}
              <Text style={styles.footerFareValue}>₹{finalFare.toLocaleString('en-IN')}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.bookButton, !canBook && styles.bookButtonDisabled]}
            activeOpacity={0.85}
            disabled={!canBook}
            onPress={handleBookRide}>
            {booking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.bookButtonText}>
                {scheduleMode === 'now' ? 'Book Ride' : 'Schedule Ride'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <PlaceSearchModal
        visible={!!searchField}
        title={searchField === 'pickup' ? 'Set pickup location' : 'Set drop location'}
        fieldColor={searchField === 'pickup' ? GREEN : RED}
        biasLocation={pickup ?? undefined}
        onClose={() => setSearchField(null)}
        onSelect={handleSelectPlace}
        onUseCurrentLocation={handleUseCurrentLocation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Map
  mapWrap: {
    height: MAP_HEIGHT,
    width: '100%',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  liveDotHalo: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(22,163,74,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: INK,
    letterSpacing: 0.2,
  },
  mapPickBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mapPickBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BLUE,
  },
  // Compact icon-only FAB, matching the standard "recenter" button pattern
  // native map apps use — a text pill felt cramped on a 220px map card.
  recenterButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },

  // Pickup / drop card
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  locationMarkers: {
    width: 16,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotConnector: {
    width: 1,
    flex: 1,
    minHeight: 18,
    backgroundColor: BORDER,
    marginTop: 4,
  },
  locationTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: GRAY,
    letterSpacing: 0.5,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: INK,
    marginTop: 2,
  },
  locationPlaceholder: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },
  swapButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    paddingVertical: 10,
  },
  routeInfoText: {
    fontSize: 12,
    color: GRAY,
    fontWeight: '500',
  },

  // Schedule toggle
  scheduleToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#EEF2F7',
    borderRadius: 12,
    padding: 4,
  },
  scheduleOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  scheduleOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  scheduleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY,
  },
  scheduleOptionTextActive: {
    color: BLUE,
  },

  // Date / time
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  dateTimeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  dateTimeLabel: {
    fontSize: 10,
    color: GRAY,
    fontWeight: '600',
  },
  dateTimeValue: {
    fontSize: 13,
    color: INK,
    fontWeight: '700',
    marginTop: 1,
  },

  // Vehicles
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  vehicleList: {
    marginHorizontal: 16,
    gap: 10,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  vehicleCardSelected: {
    borderColor: BLUE,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  vehicleDescription: {
    fontSize: 11,
    color: GRAY,
    marginTop: 2,
  },
  vehiclePriceWrap: {
    alignItems: 'flex-end',
  },
  vehiclePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  vehicleSelectedText: {
    fontSize: 10,
    fontWeight: '700',
    color: GREEN,
    marginTop: 2,
  },

  // Promo
  promoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    fontSize: 13,
    color: INK,
    padding: 0,
  },
  promoApplyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2F7',
  },
  promoApplyText: {
    fontSize: 12,
    fontWeight: '700',
    color: BLUE,
  },
  promoError: {
    fontSize: 11,
    color: RED,
    marginTop: 6,
  },
  promoAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoAppliedText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
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
  footerFareLabel: {
    fontSize: 11,
    color: GRAY,
    fontWeight: '600',
  },
  footerFareRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  footerFareStrike: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  footerFareValue: {
    fontSize: 22,
    fontWeight: '800',
    color: INK,
  },
  bookButton: {
    backgroundColor: BLUE,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    minWidth: 140,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#C7CDD6',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelRideButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: RED,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 13,
    minWidth: 140,
    alignItems: 'center',
  },
  cancelRideButtonText: {
    color: RED,
    fontWeight: '700',
    fontSize: 14,
  },

  // Live captain tracking card
  trackingCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  trackingEtaBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF2FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  trackingEtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: BLUE,
  },
  captainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  captainAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captainInfo: {
    flex: 1,
  },
  captainName: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  captainMeta: {
    fontSize: 11,
    color: GRAY,
    marginTop: 2,
  },
  captainRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  captainRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: INK,
  },
  captainActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripSummaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginVertical: 14,
  },
});

export default TaxiScreen;
