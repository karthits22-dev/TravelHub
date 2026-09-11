import React, {forwardRef} from 'react';
import {StyleSheet, View, Text, Image, Dimensions} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import Taxicon from 'react-native-vector-icons/MaterialIcons';

const BIKE_RIDER_IMAGE = require('../../assets/images/bike-rider-marker.png');

const SCREEN_WIDTH = Dimensions.get('window').width;
const DEFAULT_MAP_HEIGHT = 220; // matches TaxiScreen's collapsed route-map height

const BLUE = '#0057FF';
const GREEN = '#16A34A';
const RED = '#DC2626';

function Dot({color}) {
  return (
    <View style={styles.dotOuter}>
      <View style={[styles.dotInner, {backgroundColor: color}]} />
    </View>
  );
}

// The pickup point gets Rapido's treatment — a labeled "Pickup Point" pill
// above a real teardrop map pin, instead of the plain dot drop gets, so it
// reads as the anchor of the trip at a glance rather than just another marker.
function PickupMarker() {
  return (
    <View style={styles.pickupMarkerWrap}>
      <View style={styles.pickupPill}>
        <Text style={styles.pickupPillText}>Pickup Point</Text>
      </View>
      <View style={styles.pickupConnector} />
      <Taxicon name="place" size={30} color={GREEN} style={styles.pickupPinIcon} />
    </View>
  );
}

// The assigned captain's live (simulated) position, styled like the rider
// marker on Swiggy/Zomato/Zepto/Blinkit — a bike-with-driver glyph in a
// pill, with a soft ellipse "shadow" beneath it for a floating-over-the-map
// feel. react-native-maps smoothly animates a Marker between coordinate
// updates on its own, so periodically nudging `coordinate` (see TaxiScreen's
// tracking interval) is enough to read as continuous movement without us
// animating the marker's contents by hand — the shadow stays a static
// sibling rather than its own animation so tracksViewChanges can stay false.
function CaptainMarker() {
  return (
    <View style={styles.captainMarkerOuter}>
      <Taxicon name="delivery-dining" size={18} color="#FFFFFF" />
      <View style={styles.captainMarkerShadow} />
    </View>
  );
}

// Real Google Maps via react-native-maps, replacing the old WebView+Leaflet
// setup. Unlike that WebView (which had no declarative <Marker>/<Polyline>
// children and needed pickup/drop/route pushed in imperatively via
// injectJavaScript), this is a native map — pickup/drop/route are just
// props that render real Marker/Polyline children directly. Only camera
// moves (animateToRegion/fitToCoordinates) stay imperative via the ref,
// which is why TaxiScreen still queues those through its focusMap/onReady
// pattern; markers no longer need that queueing at all.
const AppMap = forwardRef(
  (
    {
      initialRegion,
      pickup,
      drop,
      captain, // {latitude, longitude} | null — the assigned captain's live position
      // Callers decide when the pickup marker should actually be drawn
      // (e.g. only once a pickup is confirmed, or only alongside a drop) —
      // kept explicit rather than inferred from `pickup` alone so a screen
      // can suppress it during its own pickup-selection UI if it has one.
      showPickupMarker,
      routePoints = [],
      onReady,
      onRegionChange,
      onRegionChangeComplete,
      onMapPress,
      // Lets the rider fine-tune the pickup point by pressing and dragging
      // the pin itself — a distinct, deliberate gesture from a scroll
      // swipe, so it works even while the map itself stays non-interactive
      // (scrollEnabled={false}) to keep it from capturing page scrolls.
      onPickupDragEnd,
      height = DEFAULT_MAP_HEIGHT,
      // The map pans/zooms like the real Google Maps app when you touch it
      // directly; touches anywhere else on the page still scroll normally,
      // since the ScrollView only ever sees touches that start outside the
      // map's own bounds. Off by default (e.g. a tiny thumbnail-style map
      // where dragging wouldn't make sense) — screens that embed this as
      // their main map, like the taxi booking flow, opt in explicitly.
      interactive = false,
      // Zoom is kept independent of `interactive` — pinch/tap-to-zoom
      // don't fight the outer ScrollView's vertical drag the way panning
      // does, so there's no reason to withhold it on a non-interactive map.
      zoomEnabled = true,
      zoomControlEnabled = false, // Android-only native +/- buttons
    },
    ref,
  ) => {
    const region = {
      latitude: initialRegion?.latitude ?? 12.9716,
      longitude: initialRegion?.longitude ?? 77.5946,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    return (
      <MapView
        ref={ref}
        provider={PROVIDER_GOOGLE}
        style={[styles.map, {width: SCREEN_WIDTH, height}]}
        initialRegion={region}
        // No customMapStyle — this is Google's own standard map rendering
        // (POIs, colors, labels, buildings) rather than a stripped-down
        // custom theme, so it looks and behaves like the real Google Maps
        // app instead of a minimal reskin.
        scrollEnabled={true}
        zoomEnabled={zoomEnabled}
        zoomControlEnabled={zoomControlEnabled}
        zoomTapEnabled={zoomEnabled}
        pitchEnabled={interactive}
        rotateEnabled={interactive}
        // The device's real-time blue dot — distinct from the pickup/drop
        // dots above, which mark chosen trip points, not "where you are
        // right now". Requires location permission, already requested
        // elsewhere in the booking flow; the SDK just omits the dot until
        // it's granted, no crash either way.
        showsUserLocation
        // We already have our own recenter button (TaxiScreen's
        // currentLocationPill) — the SDK's built-in one would be redundant.
        showsMyLocationButton={false}
        showsCompass={interactive}
        // On by default in the real Google Maps app too.
        showsBuildings
        showsIndoors
        showsIndoorLevelPicker={interactive}
        // Android only: tapping a marker/POI would otherwise offer to open
        // the native Google Maps app — not what we want mid-booking.
        toolbarEnabled={false}
        onPress={
          onMapPress
            ? event => onMapPress(event.nativeEvent.coordinate)
            : undefined
        }
        onMapReady={onReady}
        onRegionChangeStart={onRegionChange}
        onRegionChangeComplete={
          onRegionChangeComplete
            ? nextRegion =>
                onRegionChangeComplete({
                  latitude: nextRegion.latitude,
                  longitude: nextRegion.longitude,
                })
            : undefined
        }>
        {showPickupMarker && pickup && (
          <Marker
            coordinate={{latitude: pickup.latitude, longitude: pickup.longitude}}
            anchor={{x: 0.5, y: 1}}
            tracksViewChanges={false}
            draggable={!!onPickupDragEnd}
            onDragEnd={
              onPickupDragEnd
                ? event => onPickupDragEnd(event.nativeEvent.coordinate)
                : undefined
            }>
            <PickupMarker />
          </Marker>
        )}
        {drop && (
          <Marker
            coordinate={{latitude: drop.latitude, longitude: drop.longitude}}
            anchor={{x: 0.5, y: 0.5}}
            tracksViewChanges={false}>
            <Dot color={RED} />
          </Marker>
        )}
        {captain && (
          <Marker
            coordinate={captain}
            anchor={{x: 0.5, y: 0.5}}
            tracksViewChanges={false}>
            <CaptainMarker />
          </Marker>
        )}
        {routePoints.length > 1 && (
          <Polyline coordinates={routePoints} strokeColor={BLUE} strokeWidth={4} />
        )}
      </MapView>
    );
  },
);

const styles = StyleSheet.create({
  map: {
    backgroundColor: '#E5E7EB',
  },
  dotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  dotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickupMarkerWrap: {
    alignItems: 'center',
  },
  pickupPill: {
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  pickupPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickupConnector: {
    width: 2,
    height: 6,
    backgroundColor: GREEN,
  },
  // Nudges the icon glyph closer to the connector — vector-icon fonts carry
  // a little built-in padding around the glyph itself, and the anchor
  // ({x: 0.5, y: 1} on the Marker) expects the pin's tip to sit at the very
  // bottom of this stack.
  pickupPinIcon: {
    marginTop: -4,
  },
  captainMarkerOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  captainMarkerShadow: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 16,
    height: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
});

export default AppMap;
