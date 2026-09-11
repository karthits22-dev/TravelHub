import {Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {promptForEnableLocationIfNeeded} from 'react-native-android-location-enabler';

// Runs once, at import time, so every location-related screen starts from
// the same explicit config instead of relying on the library's defaults.
if (Platform.OS === 'android') {
  // Without this, @react-native-community/geolocation defaults to Android's
  // raw LocationManager, which throws "No location provider available"
  // whenever neither GPS_PROVIDER nor NETWORK_PROVIDER is individually
  // enabled — common on emulators and even real devices with battery-saver
  // location modes. Google Play Services' fused provider (what backs the
  // "Location Accuracy" system dialog, and what Rapido/Uber/Google Maps
  // actually use) resolves location from whichever signal is available
  // instead of failing outright.
  Geolocation.setRNConfiguration({
    skipPermissionRequests: true, // we request permission ourselves, below
    locationProvider: 'playServices',
  });
} else {
  // iOS has no PermissionsAndroid equivalent — the OS prompts automatically
  // on the first location request, driven by whichever `NSLocation*UsageDescription`
  // key is present in Info.plist. This app only ever needs foreground
  // ("when in use") location — there's no background tracking anywhere in
  // this codebase — so only NSLocationWhenInUseUsageDescription is declared
  // there, and skipPermissionRequests stays false so the library keeps
  // auto-prompting instead of requiring a manual iOS-side request call.
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
  });
}

// Requesting FINE and COARSE together (instead of FINE alone) is what makes
// Android show its combined "Precise / Approximate" location-accuracy sheet
// — the one Google Maps/Rapido show — instead of a single plain permission
// dialog. PermissionsAndroid no-ops (no dialog, instant resolve) if the user
// already granted it, so it's safe to call every time a location-related
// screen opens.
export async function requestLocationPermission() {
  if (Platform.OS !== 'android') return true;

  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);

  return (
    results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
    results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
  );
}

export async function hasLocationPermission() {
  if (Platform.OS !== 'android') return true;

  const fine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  const coarse = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
  return fine || coarse;
}

// This is the "Location Accuracy" system dialog itself — a Play Services
// Location Settings resolution prompt, not a permission request. Permission
// only covers whether the app is *allowed* to use location; it says nothing
// about whether the device's Location toggle or high-accuracy mode is
// actually on. requestLocationPermission() can't surface this — only
// Play Services' SettingsClient can, which is what this native module wraps.
// Best-effort: resolves either way, so a declined/unavailable prompt still
// falls through to getCurrentPosition()'s own friendly error instead of
// blocking the flow.
export async function ensureLocationEnabled() {
  if (Platform.OS !== 'android') return;

  try {
    // The native module silently never resolves or rejects if it's called
    // before the Android Activity is fully attached (its early-return guard
    // just does nothing) — without this race, that hang would block every
    // caller of ensureLocationEnabled() forever, which is what "sometimes
    // does nothing" looked like. The timeout guarantees this always settles.
    const result = await Promise.race([
      promptForEnableLocationIfNeeded({interval: 10000, waitForAccurate: true}),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timed out')), 15000)),
    ]);
    // Only wait out a radio warm-up when the user just flipped location on
    // via the dialog. When it was already enabled ("already-enabled" — the
    // common case on every repeat visit), there's nothing to wait for, and
    // a flat delay here would slow down that common case for no reason.
    if (result === 'enabled') {
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  } catch (err) {
    // User tapped "No thanks", the resolution flow itself is unavailable
    // (e.g. no Play Services on this device), or it timed out — nothing
    // more to do here either way.
  }
}

function friendlyLocationError(error) {
  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return 'Location permission was denied.';
    case 3: // TIMEOUT
      return 'Location request timed out. Please try again.';
    default: // POSITION_UNAVAILABLE, or anything else
      return "Couldn't detect your location. Make sure device location is turned on.";
  }
}

// Resolves the current position through three phases, each only run if the
// previous one fails:
//   1. Anything already cached by Play Services, however old — usually
//      near-instant, since the OS/other apps almost always have *some*
//      recent fix sitting around. This is what makes location "just
//      appear" immediately like Rapido, instead of visibly waiting on a
//      fresh GPS lock every time the screen opens.
//   2. A fresh high-accuracy (GPS) fix.
//   3. A relaxed network/Wi-Fi based fix — covers devices/emulators where
//      GPS has no signal (indoors, no mock location set) but coarse
//      location still works.
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      resolve,
      () => {
        Geolocation.getCurrentPosition(
          resolve,
          () => {
            Geolocation.getCurrentPosition(
              resolve,
              error => reject(new Error(friendlyLocationError(error))),
              {enableHighAccuracy: false, timeout: 15000, maximumAge: 60000},
            );
          },
          {enableHighAccuracy: true, timeout: 8000, maximumAge: 10000},
        );
      },
      {enableHighAccuracy: false, timeout: 2000, maximumAge: Infinity},
    );
  });
}

// The full "get me the user's location" flow, in the order that keeps the
// common case fast: permission (usually already granted, instant) → try to
// resolve a position outright → only pay for the Play Services "is location
// even on" round trip (and its dialog) if that first attempt actually
// failed. Checking settings *before* every attempt, unconditionally, was
// the main reason this used to feel slow — most opens already have
// location on, so that check was pure overhead nearly every time.
export async function resolveCurrentPosition() {
  const allowed = await requestLocationPermission();
  if (!allowed) throw new Error('Location permission was not granted.');

  try {
    return await getCurrentPosition();
  } catch (err) {
    await ensureLocationEnabled();
    return await getCurrentPosition();
  }
}
