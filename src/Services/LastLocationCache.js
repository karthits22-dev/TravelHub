import AsyncStorage from '@react-native-async-storage/async-storage';

// Apps like Blinkit/Swiggy/Zomato/BookMyShow never show a blank "detecting
// location…" state on repeat opens — they paint last time's location
// instantly, then quietly refine it once a fresh GPS/network fix lands.
// This is that cache: read synchronously-fast on mount so pickup has
// *something* to show on frame one, while the real resolveCurrentPosition()
// flow still runs in the background to correct it.
const LAST_LOCATION_KEY = '@travelhub/taxi_last_known_location';

export async function getLastKnownPlace() {
  try {
    const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setLastKnownPlace(place) {
  try {
    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(place));
  } catch {
    // best-effort persistence; nothing to fall back to here
  }
}
