import {
  GOOGLE_MAPS_API_KEY,
  IS_GOOGLE_MAPS_KEY_CONFIGURED,
  PLACES_NEW_BASE_URL,
  DIRECTIONS_URL,
  GEOCODE_URL,
} from '../Config/googleMaps';
import {
  PHOTON_SEARCH_URL,
  NOMINATIM_SEARCH_URL,
  NOMINATIM_REVERSE_URL,
  OSRM_ROUTE_URL,
  NOMINATIM_USER_AGENT,
} from '../Config/freeMapProviders';
import {formatDistance, formatDuration} from '../Utils/distance';

// Google's Places Autocomplete is what Rapido/Uber/Ola actually search
// against — its index of businesses, apartments, and landmarks in India is
// far denser than OSM's, which is what was causing real places to go
// "missing" from results. The free OSM stack (Photon/Nominatim) is kept as
// an automatic fallback for anyone running this without a configured key,
// not as the primary path anymore.
export function newSessionToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Cache the last search results by place_id so getPlaceDetails's OSM
// fallback path can resolve them without an extra network round-trip
// (Google's own Place Details call doesn't need this — it re-fetches by id).
let lastSearchCache = {};

function fetchNominatim(url) {
  return fetch(url, {headers: {'User-Agent': NOMINATIM_USER_AGENT}});
}

async function searchPlacesGoogle(query, sessionToken, biasLocation) {
  const body = {
    input: query,
    includedRegionCodes: ['in'],
    languageCode: 'en',
    sessionToken: sessionToken || 'default',
  };
  if (biasLocation) {
    body.locationBias = {
      circle: {
        center: {latitude: biasLocation.latitude, longitude: biasLocation.longitude},
        radius: 50000,
      },
    };
  }

  try {
    const res = await fetch(`${PLACES_NEW_BASE_URL}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      console.warn(`[PlacesService] Google autocomplete failed: ${json?.error?.message ?? res.status}`);
      return null; // signals a real failure so the caller falls back to OSM
    }

    return (json.suggestions || [])
      .map(s => s.placePrediction)
      .filter(Boolean)
      .map(p => ({
        placeId: p.placeId,
        primaryText: p.structuredFormat?.mainText?.text ?? p.text?.text,
        secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
        description: p.text?.text,
        source: 'google',
      }));
  } catch (err) {
    console.warn('[PlacesService] Google autocomplete failed:', err.message);
    return null;
  }
}

function formatPhotonFeature(feature) {
  const props = feature?.properties;
  const coords = feature?.geometry?.coordinates;
  if (!props || !coords) return null;

  const [longitude, latitude] = coords;
  const primaryText = props.name || props.street || props.city || props.state || 'Unnamed location';

  const parts = [];
  if (props.housenumber && props.street) {
    parts.push(`${props.housenumber} ${props.street}`);
  } else if (props.street && props.street !== primaryText) {
    parts.push(props.street);
  }
  [props.district, props.city, props.state, props.country].forEach(part => {
    if (part && part !== primaryText) parts.push(part);
  });
  const secondaryText = [...new Set(parts)].join(', ');
  const description = secondaryText ? `${primaryText}, ${secondaryText}` : primaryText;

  return {
    placeId: `photon-${props.osm_type ?? 'x'}-${props.osm_id ?? `${latitude},${longitude}`}`,
    primaryText,
    secondaryText,
    description,
    latitude,
    longitude,
    address: description,
    source: 'osm',
  };
}

// Photon does prefix/typeahead matching (partial words like "Coim" match
// "Coimbatore" as you type). Nominatim only matches whole tokens well, so
// it's kept as a fallback rather than the primary source.
async function searchPlacesPhoton(query, biasLocation) {
  const params = new URLSearchParams({q: query, limit: '8', lang: 'en'});
  if (biasLocation) {
    params.set('lat', String(biasLocation.latitude));
    params.set('lon', String(biasLocation.longitude));
    params.set('location_bias_scale', '0.5');
  }

  try {
    const res = await fetch(`${PHOTON_SEARCH_URL}?${params.toString()}`);
    const json = await res.json();
    if (!Array.isArray(json?.features)) return [];
    return json.features.map(formatPhotonFeature).filter(Boolean);
  } catch (err) {
    console.warn('[PlacesService] Photon search failed:', err.message);
    return [];
  }
}

async function searchPlacesNominatim(query, biasLocation) {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '8',
    countrycodes: 'in',
  });
  if (biasLocation) {
    const {latitude, longitude} = biasLocation;
    const span = 0.5; // degrees, soft bias box — not a hard filter
    params.set('viewbox', `${longitude - span},${latitude + span},${longitude + span},${latitude - span}`);
    params.set('bounded', '0');
  }

  try {
    const res = await fetchNominatim(`${NOMINATIM_SEARCH_URL}?${params.toString()}`);
    const results = await res.json();
    if (!Array.isArray(results)) {
      console.warn('[PlacesService] Nominatim search returned an unexpected response.');
      return [];
    }

    return results.map(r => {
      const [primaryText, ...rest] = r.display_name.split(',');
      return {
        placeId: String(r.place_id),
        primaryText: primaryText.trim(),
        secondaryText: rest.join(',').trim(),
        description: r.display_name,
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
        address: r.display_name,
        source: 'osm',
      };
    });
  } catch (err) {
    console.warn('[PlacesService] Nominatim search failed:', err.message);
    return [];
  }
}

async function searchPlacesOsm(query, biasLocation) {
  let results = await searchPlacesPhoton(query, biasLocation);
  if (!results.length) {
    // Photon down or genuinely no match under prefix search — try
    // Nominatim's whole-token matching before giving up.
    results = await searchPlacesNominatim(query, biasLocation);
  }
  return results;
}

export async function searchPlaces(query, sessionToken, biasLocation) {
  if (!query || query.trim().length < 2) return [];

  let results = null;
  if (IS_GOOGLE_MAPS_KEY_CONFIGURED) {
    results = await searchPlacesGoogle(query, sessionToken, biasLocation);
  }
  // null means Google errored/is unavailable — fall back to OSM rather than
  // showing nothing. An empty array (ZERO_RESULTS) is a real "no matches"
  // and is left as-is.
  if (results === null) {
    results = await searchPlacesOsm(query, biasLocation);
  }

  lastSearchCache = {};
  results.forEach(place => {
    lastSearchCache[place.placeId] = place;
  });
  return results;
}

async function getPlaceDetailsGoogle(placeId, sessionToken) {
  const params = new URLSearchParams({sessionToken: sessionToken || 'default'});

  try {
    const res = await fetch(`${PLACES_NEW_BASE_URL}/places/${placeId}?${params.toString()}`, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'location,formattedAddress',
      },
    });
    const json = await res.json();
    if (!res.ok || !json.location) {
      console.warn(`[PlacesService] Google place details failed: ${json?.error?.message ?? res.status}`);
      return null;
    }
    return {
      latitude: json.location.latitude,
      longitude: json.location.longitude,
      address: json.formattedAddress ?? '',
    };
  } catch (err) {
    console.warn('[PlacesService] Google place details failed:', err.message);
    return null;
  }
}

export async function getPlaceDetails(placeId, sessionToken) {
  // Google predictions carry no coordinates until this Details call is
  // made; OSM predictions already have them from the search step itself.
  if (IS_GOOGLE_MAPS_KEY_CONFIGURED && !String(placeId).startsWith('photon-')) {
    const details = await getPlaceDetailsGoogle(placeId, sessionToken);
    if (details) return details;
  }

  const cached = lastSearchCache[placeId];
  if (!cached) return null;
  return {latitude: cached.latitude, longitude: cached.longitude, address: cached.address};
}

async function reverseGeocodeGoogle(latitude, longitude) {
  const params = new URLSearchParams({
    latlng: `${latitude},${longitude}`,
    key: GOOGLE_MAPS_API_KEY,
    language: 'en',
  });

  try {
    const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
    const json = await res.json();
    const address = json?.results?.[0]?.formatted_address;
    if (json.status !== 'OK' || !address) return null;
    return {latitude, longitude, address};
  } catch (err) {
    console.warn('[PlacesService] Google reverse geocode failed:', err.message);
    return null;
  }
}

async function geocodeAddressGoogle(query) {
  const params = new URLSearchParams({
    address: query,
    key: GOOGLE_MAPS_API_KEY,
    language: 'en',
    region: 'in',
  });

  try {
    const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
    const json = await res.json();
    const result = json?.results?.[0];
    if (json.status !== 'OK' || !result) return null;
    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      address: result.formatted_address,
    };
  } catch (err) {
    console.warn('[PlacesService] Google geocode failed:', err.message);
    return null;
  }
}

// Forward geocoding — resolves a free-text address/name (e.g. a hotel's
// "city, country" listing, which is all the hotels API/hardcoded data give
// us, no coordinates) into lat/lng. Same Google-first-then-OSM-fallback
// shape as reverseGeocode/getDirections above.
export async function geocodeAddress(query) {
  if (!query) return null;

  if (IS_GOOGLE_MAPS_KEY_CONFIGURED) {
    const result = await geocodeAddressGoogle(query);
    if (result) return result;
  }

  const params = new URLSearchParams({q: query, format: 'jsonv2', limit: '1'});
  try {
    const res = await fetchNominatim(`${NOMINATIM_SEARCH_URL}?${params.toString()}`);
    const results = await res.json();
    const result = results?.[0];
    if (!result) return null;
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name,
    };
  } catch (err) {
    console.warn('[PlacesService] Nominatim geocode failed:', err.message);
    return null;
  }
}

export async function reverseGeocode(latitude, longitude) {
  if (IS_GOOGLE_MAPS_KEY_CONFIGURED) {
    const result = await reverseGeocodeGoogle(latitude, longitude);
    if (result) return result;
  }

  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
  });

  try {
    const res = await fetchNominatim(`${NOMINATIM_REVERSE_URL}?${params.toString()}`);
    const json = await res.json();
    if (!json || json.error || !json.display_name) {
      return {latitude, longitude, address: 'Current location'};
    }
    return {latitude, longitude, address: json.display_name};
  } catch (err) {
    console.warn('[PlacesService] Nominatim reverse geocode failed:', err.message);
    return {latitude, longitude, address: 'Current location'};
  }
}

async function getDirectionsGoogle(origin, destination) {
  const params = new URLSearchParams({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    key: GOOGLE_MAPS_API_KEY,
    mode: 'driving',
  });

  try {
    const res = await fetch(`${DIRECTIONS_URL}?${params.toString()}`);
    const json = await res.json();
    const route = json?.routes?.[0];
    const leg = route?.legs?.[0];
    if (json.status !== 'OK' || !route || !leg) {
      console.warn(`[PlacesService] Google directions status: ${json.status}`);
      return null;
    }
    return {
      polyline: route.overview_polyline?.points,
      distanceMeters: leg.distance?.value,
      distanceText: leg.distance?.text ?? formatDistance(leg.distance?.value ?? 0),
      durationSeconds: leg.duration?.value,
      durationText: leg.duration?.text ?? formatDuration(leg.duration?.value ?? 0),
    };
  } catch (err) {
    console.warn('[PlacesService] Google directions failed:', err.message);
    return null;
  }
}

export async function getDirections(origin, destination) {
  if (IS_GOOGLE_MAPS_KEY_CONFIGURED) {
    const result = await getDirectionsGoogle(origin, destination);
    if (result) return result;
  }

  const url =
    `${OSRM_ROUTE_URL}/${origin.longitude},${origin.latitude};` +
    `${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=polyline`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.code !== 'Ok' || !json.routes?.length) {
      console.warn(`[PlacesService] OSRM route failed — code: ${json.code}`);
      return null;
    }

    const route = json.routes[0];
    return {
      polyline: route.geometry,
      distanceMeters: route.distance,
      distanceText: formatDistance(route.distance),
      durationSeconds: route.duration,
      durationText: formatDuration(route.duration),
    };
  } catch (err) {
    console.warn('[PlacesService] OSRM route failed:', err.message);
    return null;
  }
}
