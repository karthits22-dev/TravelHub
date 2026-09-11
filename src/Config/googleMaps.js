import Config from 'react-native-config';

export const GOOGLE_MAPS_API_KEY = Config.GOOGLE_MAPS_API_KEY || '';

export const IS_GOOGLE_MAPS_KEY_CONFIGURED =
  !!GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

// Legacy Places Autocomplete/Details are blocked outright on newer Google
// Cloud projects ("switch to Places API (New)") — this project is one of
// them, so search goes through the New API's REST surface instead.
export const PLACES_NEW_BASE_URL = 'https://places.googleapis.com/v1';
export const DIRECTIONS_URL =
  'https://maps.googleapis.com/maps/api/directions/json';
export const GEOCODE_URL =
  'https://maps.googleapis.com/maps/api/geocode/json';
