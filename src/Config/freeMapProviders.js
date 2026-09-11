// Zero-cost stand-ins for Google's Places/Directions/Geocoding APIs — no API
// key, no billing account, ever. These are public community-run services
// meant for light/demo traffic, not production-scale load:
//   - Photon (komoot, built on OSM data): typeahead/autocomplete search —
//     unlike Nominatim it does prefix matching, so partial words like "Coim"
//     match "Coimbatore" while still typing, which is what makes a search
//     box feel like Google Places/Rapido instead of listing nothing.
//   - Nominatim (OpenStreetMap): reverse geocoding + a fallback search path
//     if Photon is ever unreachable.
//   - OSRM demo server: driving directions
//   - Overpass API (OSM): nearby-tourist-attraction lookups
// Nominatim's usage policy requires identifying the app via User-Agent and
// staying under ~1 request/second, which this screen's debounced search
// comfortably does.
//
// The map *rendering* itself is no longer part of this — AppMap.jsx uses
// the real Google Maps SDK (react-native-maps + a Google Maps API key) —
// but search/reverse-geocode/directions still run through these free
// providers, unrelated to which map tiles are drawn underneath.
export const PHOTON_SEARCH_URL = 'https://photon.komoot.io/api';
export const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
export const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
export const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving';
export const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export const NOMINATIM_USER_AGENT = 'TravelHubDemoApp/1.0 (student project, no billing account)';
