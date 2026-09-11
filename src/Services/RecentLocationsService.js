import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_KEY = '@travelhub/taxi_recent_locations';
const FAVORITES_KEY = '@travelhub/taxi_favorite_locations';
const MAX_RECENT = 6;

export async function getRecentLocations() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addRecentLocation(place) {
  try {
    const existing = await getRecentLocations();
    const deduped = existing.filter(p => p.placeId !== place.placeId);
    const updated = [place, ...deduped].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return getRecentLocations();
  }
}

export async function getFavoriteLocations() {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : {home: null, work: null};
  } catch {
    return {home: null, work: null};
  }
}

export async function setFavoriteLocation(kind, place) {
  const favorites = await getFavoriteLocations();
  const updated = {...favorites, [kind]: place};
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch {
    // best-effort persistence; keep the in-memory value either way
  }
  return updated;
}
