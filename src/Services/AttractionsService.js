import {GOOGLE_MAPS_API_KEY, IS_GOOGLE_MAPS_KEY_CONFIGURED, PLACES_NEW_BASE_URL} from '../Config/googleMaps';
import {OVERPASS_API_URL} from '../Config/freeMapProviders';
import {haversineDistanceMeters, formatDistance} from '../Utils/distance';

const NEARBY_RADIUS_METERS = 5000;
const MAX_RESULTS = 10;

function titleCase(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function fetchNearbyAttractionsGoogle(latitude, longitude) {
  try {
    const res = await fetch(`${PLACES_NEW_BASE_URL}/places:searchNearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.location,places.primaryType,places.rating,places.photos',
      },
      body: JSON.stringify({
        includedTypes: ['tourist_attraction'],
        maxResultCount: MAX_RESULTS,
        locationRestriction: {
          circle: {center: {latitude, longitude}, radius: NEARBY_RADIUS_METERS},
        },
      }),
    });
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.places)) {
      console.warn(
        `[AttractionsService] Google nearby search failed: ${json?.error?.message ?? res.status}`,
      );
      return null; // signals a real failure so the caller falls back to OSM
    }

    return json.places
      .map(place => {
        const loc = place.location ?? {};
        const distanceMeters = haversineDistanceMeters(
          {latitude, longitude},
          {latitude: loc.latitude, longitude: loc.longitude},
        );
        const photoName = place.photos?.[0]?.name;
        return {
          id: place.id,
          name: place.displayName?.text ?? 'Unnamed place',
          category: place.primaryType ? titleCase(place.primaryType) : 'Attraction',
          rating: place.rating ?? null,
          latitude: loc.latitude,
          longitude: loc.longitude,
          distanceMeters,
          distanceText: formatDistance(distanceMeters),
          photoUrl: photoName
            ? `${PLACES_NEW_BASE_URL}/${photoName}/media?maxWidthPx=400&key=${GOOGLE_MAPS_API_KEY}`
            : null,
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  } catch (err) {
    console.warn('[AttractionsService] Google nearby search failed:', err.message);
    return null;
  }
}

const OVERPASS_TOURISM_TAGS = 'attraction|museum|viewpoint|gallery|zoo|theme_park|artwork';

async function fetchNearbyAttractionsOverpass(latitude, longitude) {
  const query = `
    [out:json][timeout:25];
    (
      node["tourism"~"${OVERPASS_TOURISM_TAGS}"](around:${NEARBY_RADIUS_METERS},${latitude},${longitude});
      way["tourism"~"${OVERPASS_TOURISM_TAGS}"](around:${NEARBY_RADIUS_METERS},${latitude},${longitude});
    );
    out center ${MAX_RESULTS * 2};
  `;

  try {
    const res = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    });
    const json = await res.json();
    if (!Array.isArray(json?.elements)) return [];

    return json.elements
      .map(el => {
        const name = el.tags?.name;
        if (!name) return null; // unnamed OSM nodes aren't useful to show a guest
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (lat == null || lon == null) return null;

        const distanceMeters = haversineDistanceMeters(
          {latitude, longitude},
          {latitude: lat, longitude: lon},
        );
        return {
          id: `${el.type}-${el.id}`,
          name,
          category: el.tags?.tourism ? titleCase(el.tags.tourism) : 'Attraction',
          rating: null,
          latitude: lat,
          longitude: lon,
          distanceMeters,
          distanceText: formatDistance(distanceMeters),
          photoUrl: null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, MAX_RESULTS);
  } catch (err) {
    console.warn('[AttractionsService] Overpass nearby search failed:', err.message);
    return [];
  }
}

// Nearby tourist attractions around a hotel — Google Places (New) "Nearby
// Search" when a Maps API key is configured (richer data: photos, ratings,
// real place types); falls back to OSM's Overpass API (tourism=attraction/
// museum/viewpoint/... nodes/ways) otherwise, same Google-first-then-OSM-
// fallback shape as the rest of this app's map services (PlacesService.js).
export async function fetchNearbyAttractions(latitude, longitude) {
  if (latitude == null || longitude == null) return [];

  if (IS_GOOGLE_MAPS_KEY_CONFIGURED) {
    const results = await fetchNearbyAttractionsGoogle(latitude, longitude);
    if (results !== null) return results;
  }

  return fetchNearbyAttractionsOverpass(latitude, longitude);
}
