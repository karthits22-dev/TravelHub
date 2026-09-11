const HOTELS_API_URL = 'https://aarvi.advinexa.com/api/get_hotels';
const HOTEL_AMENITIES_API_URL = 'https://aarvi.advinexa.com/api/get_hotel_amenities';
const HOTELS_API_ORIGIN = 'https://aarvi.advinexa.com';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';

const BADGE_COLOR = '#0057FF';

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${HOTELS_API_ORIGIN}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

function normalizeHotel(raw) {
  return {
    id: String(raw.id),
    name: raw.name,
    location: [raw.city, raw.country].filter(Boolean).join(', '),
    rating: Number(raw.rating) || 0,
    price: Number(raw.price_per_night) || 0,
    badge: raw.hotel_type || null,
    badgeColor: BADGE_COLOR,
    image: resolveImageUrl(raw.image_url),
  };
}

// Live catalog for the "Hotels" category — every other category on this
// screen still reads from the hardcoded Data/listings.js dataset until it
// gets its own backend endpoint.
export async function fetchHotels() {
  const res = await fetch(HOTELS_API_URL);
  if (!res.ok) {
    throw new Error(`Hotels API request failed with status ${res.status}`);
  }

  const json = await res.json();
  if (!json?.success || !Array.isArray(json.hotels)) {
    throw new Error('Unexpected response from hotels API');
  }

  return json.hotels
    .filter(hotel => hotel.status === 'active')
    .map(normalizeHotel);
}

// The API's `icon` field is currently always null, so amenity icons are
// resolved client-side from the amenity name — keyed against the icon sets
// already used elsewhere on the hotel details screen (Ionicons/MaterialIcons).
const AMENITY_ICON_RULES = [
  [/wifi/i, {icon: 'wifi-outline', set: 'ion'}],
  [/parking/i, {icon: 'local-parking', set: 'material'}],
  [/pool/i, {icon: 'pool', set: 'material'}],
  [/spa/i, {icon: 'spa', set: 'material'}],
  [/gym|fitness/i, {icon: 'fitness-center', set: 'material'}],
  [/restaurant|dining/i, {icon: 'restaurant-outline', set: 'ion'}],
  [/breakfast|cafe/i, {icon: 'cafe-outline', set: 'ion'}],
  [/(^|\s)ac(\s|$)|air.?condition/i, {icon: 'snow-outline', set: 'ion'}],
  [/elevator|lift/i, {icon: 'elevator', set: 'material'}],
  [/boat/i, {icon: 'boat-outline', set: 'ion'}],
  [/bar|lounge/i, {icon: 'wine-outline', set: 'ion'}],
  [/laundry/i, {icon: 'local-laundry-service', set: 'material'}],
];
const DEFAULT_AMENITY_ICON = {icon: 'checkmark-circle-outline', set: 'ion'};

function resolveAmenityIcon(name) {
  const rule = AMENITY_ICON_RULES.find(([pattern]) => pattern.test(name || ''));
  return rule ? rule[1] : DEFAULT_AMENITY_ICON;
}

function normalizeAmenity(raw) {
  const {icon, set} = resolveAmenityIcon(raw.name);
  return {id: String(raw.id), label: raw.name, icon, set};
}

export async function fetchHotelAmenities(hotelId) {
  const params = new URLSearchParams({hotel_id: String(hotelId)});
  const res = await fetch(`${HOTEL_AMENITIES_API_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Hotel amenities API request failed with status ${res.status}`);
  }

  const json = await res.json();
  if (!json?.success || !Array.isArray(json.amenities)) {
    throw new Error('Unexpected response from hotel amenities API');
  }

  return json.amenities.map(normalizeAmenity);
}
