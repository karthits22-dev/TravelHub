const GREEN = '#16A34A';

// Hotels, Resorts and Homestays share one list → detail → confirm & pay
// flow ("Hotels & Stays"); Restaurants/Coffee Corner/Home Food keep their
// own separate screens, so their `route` still points there.
export const CATEGORIES = [
  {id: 'hotels', label: 'Hotels', icon: 'business-outline', route: 'Hotels'},
  {id: 'resorts', label: 'Resorts', icon: 'sunny-outline', route: 'Hotels'},
  {id: 'homestays', label: 'Homestays', icon: 'home-outline', route: 'Hotels'},
  {id: 'restaurants', label: 'Restaurants', icon: 'restaurant-outline', route: 'Restaurants'},
  {id: 'cafes', label: 'Coffee Corner', icon: 'cafe-outline', route: 'CoffeCorner'},
  {id: 'homefood', label: 'Home Food', icon: 'home', route: 'CoffeCorner'},
];

// Only Hotels/Resorts/Homestays feed the "Hotels & Stays" list screen's
// category pills (All Stays / Hotels / Resorts / Homestays).
export const STAY_CATEGORIES = CATEGORIES.filter(c =>
  ['hotels', 'resorts', 'homestays'].includes(c.id),
);

const WIFI = {id: 'wifi', label: 'Free Wi-Fi', icon: 'wifi-outline', set: 'ion'};
const PARKING = {id: 'parking', label: 'Free parking', icon: 'local-parking', set: 'material'};
const POOL = {id: 'pool', label: 'Pool', icon: 'pool', set: 'material'};
const BREAKFAST = {id: 'breakfast', label: 'Breakfast included', icon: 'cafe-outline', set: 'ion'};
const AC = {id: 'ac', label: 'AC Rooms', icon: 'snow-outline', set: 'ion'};
const RESTAURANT = {id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline', set: 'ion'};
const KITCHEN = {id: 'kitchen', label: 'Kitchen', icon: 'restaurant-outline', set: 'ion'};
const VIEW = {id: 'view', label: 'Garden view', icon: 'leaf-outline', set: 'ion'};

// "Hotels" is otherwise backed by the live API (Services/HotelsService.js) —
// these are only the demo/fallback entries used for Home search results and
// whenever the API has nothing for a given id.
export const STAY_ITEMS = [
  {
    id: 'cauvery-grand-hotel',
    name: 'Cauvery Grand Hotel',
    location: 'City centre, Coorg',
    shortLocation: 'City centre',
    distanceKm: 0.5,
    rating: 4.3,
    reviewCount: 96,
    price: 2800,
    badge: null,
    badgeColor: GREEN,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
    description:
      'A modern business hotel right in the city centre, close to shopping and dining, with quick access to Coorg’s main sights.',
    amenities: [WIFI, PARKING, AC, RESTAURANT],
    roomTypes: [
      {id: 'standard-room', name: 'Standard Room', meta: '2 guests · Free cancellation', price: 2800},
      {id: 'executive-room', name: 'Executive Room', meta: '2 guests · Free cancellation', price: 3600},
    ],
    defaultRoomId: 'standard-room',
  },
  {
    id: 'nilgiri-retreat',
    name: 'The Nilgiri Retreat',
    location: 'Ooty, Tamil Nadu',
    shortLocation: 'Ooty',
    distanceKm: 1.2,
    rating: 4.8,
    reviewCount: 248,
    price: 2400,
    badge: 'Best Seller',
    badgeColor: GREEN,
    image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80',
    description:
      'A hillside retreat with terrace views over the Nilgiris, an in-house restaurant, and cosy rooms built for a slow, quiet stay.',
    amenities: [WIFI, PARKING, RESTAURANT, BREAKFAST, AC],
    roomTypes: [
      {id: 'standard-double', name: 'Standard Double', meta: '2 guests · Free breakfast', price: 2400},
      {id: 'deluxe-king', name: 'Deluxe King', meta: '2 guests · Free breakfast', price: 3200},
      {id: 'family-suite-nilgiri', name: 'Family Suite', meta: '4 guests · Free breakfast · Balcony', price: 4600},
    ],
    defaultRoomId: 'deluxe-king',
  },
  {
    id: 'backwater-bliss',
    name: 'Backwater Bliss',
    location: 'Alleppey, Kerala',
    shortLocation: 'Alleppey',
    distanceKm: 3.8,
    rating: 4.7,
    reviewCount: 132,
    price: 2900,
    badge: 'New',
    badgeColor: '#7C3AED',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80',
    description:
      'A houseboat-style stay on Alleppey’s backwaters, with a private deck, home-style meals, and calm water views all day.',
    amenities: [WIFI, POOL, RESTAURANT],
    roomTypes: [
      {id: 'houseboat-cabin', name: 'Houseboat Cabin', meta: '2 guests · New', price: 2900},
    ],
    defaultRoomId: 'houseboat-cabin',
  },
];

// Resorts don't have a backend yet — this is the full dataset for that
// category, matching the "Hotels & Stays" list/detail/confirm flow.
export const RESORT_ITEMS = [
  {
    id: 'lake-view-resort',
    name: 'The Lake View Resort',
    location: 'Coorg, Karnataka',
    shortLocation: 'Coorg',
    distanceKm: 2.1,
    rating: 4.6,
    reviewCount: 214,
    photosCount: 8,
    price: 4200,
    badge: null,
    badgeColor: GREEN,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
    description:
      'A lakeside retreat set among coffee estates, with terrace views, an outdoor pool, and an in-house restaurant serving Coorgi cuisine.',
    amenities: [WIFI, POOL, BREAKFAST, PARKING],
    roomTypes: [
      {id: 'deluxe-lake-view', name: 'Deluxe Lake View Room', meta: '2 guests · Free cancellation', price: 4200},
      {id: 'garden-cottage', name: 'Garden Cottage', meta: '2 guests · Non-refundable', price: 3400},
      {id: 'family-suite', name: 'Family Suite', meta: '4 guests · Free cancellation', price: 6800},
    ],
    defaultRoomId: 'deluxe-lake-view',
  },
  {
    id: 'whispering-pines-resort',
    name: 'Whispering Pines Resort',
    location: 'Madikeri, Coorg, Karnataka',
    shortLocation: 'Madikeri',
    distanceKm: 5.4,
    rating: 4.5,
    reviewCount: 158,
    price: 3600,
    badge: '15% OFF',
    badgeColor: '#DC2626',
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80',
    description:
      'A pine-forest resort with bonfire evenings, a spa, and misty morning views over the Western Ghats.',
    amenities: [WIFI, POOL, PARKING, RESTAURANT],
    roomTypes: [
      {id: 'forest-view-room', name: 'Forest View Room', meta: '2 guests · Free cancellation', price: 3600},
      {id: 'pine-cottage', name: 'Pine Cottage', meta: '3 guests · Non-refundable', price: 4800},
    ],
    defaultRoomId: 'forest-view-room',
  },
];

export const HOMESTAY_ITEMS = [
  {
    id: 'misty-hills-homestay',
    name: 'Misty Hills Homestay',
    location: 'Madikeri, Coorg, Karnataka',
    shortLocation: 'Madikeri',
    distanceKm: 6.4,
    rating: 4.8,
    reviewCount: 121,
    price: 1900,
    badge: 'Superhost',
    badgeColor: GREEN,
    image: 'https://images.unsplash.com/photo-1600100397608-f909cbb0aa8c?w=400&q=80',
    description:
      'A family-run homestay on a working coffee estate, with home-cooked meals and guided plantation walks.',
    amenities: [WIFI, KITCHEN, VIEW, BREAKFAST],
    roomTypes: [
      {id: 'estate-view-room', name: 'Estate View Room', meta: '2 guests · Free cancellation', price: 1900},
    ],
    defaultRoomId: 'estate-view-room',
  },
  {
    id: 'coorg-cottage',
    name: 'Coorg Cottage Escape',
    location: 'Madikeri, Coorg, Karnataka',
    shortLocation: 'Madikeri',
    distanceKm: 7.1,
    rating: 4.9,
    reviewCount: 89,
    price: 1800,
    badge: 'Superhost',
    badgeColor: GREEN,
    image: 'https://images.unsplash.com/photo-1600100397608-f909cbb0aa8c?w=400&q=80',
    description:
      'A private cottage tucked into a coffee plantation, with a fireplace, hammock deck, and total quiet.',
    amenities: [WIFI, KITCHEN, VIEW],
    roomTypes: [
      {id: 'private-cottage', name: 'Private Cottage', meta: '2 guests · Free cancellation', price: 1800},
    ],
    defaultRoomId: 'private-cottage',
  },
  {
    id: 'bamboo-villa',
    name: 'Bamboo Villa Retreat',
    location: 'Wayanad, Kerala',
    shortLocation: 'Wayanad',
    distanceKm: 4.6,
    rating: 4.8,
    reviewCount: 74,
    price: 2100,
    badge: 'Superhost',
    badgeColor: GREEN,
    image: 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=400&q=80',
    description:
      'A bamboo-built villa on a spice farm, with an open-air bath and views over the valley.',
    amenities: [WIFI, KITCHEN, VIEW, PARKING],
    roomTypes: [
      {id: 'bamboo-villa-room', name: 'Villa Room', meta: '3 guests · Non-refundable', price: 2100},
    ],
    defaultRoomId: 'bamboo-villa-room',
  },
];

// Resort/Restaurants/Coffee Corner/Home Food screens outside the stays flow
// are still stubs built off the hotel dataset, so they're routed through
// the same items until each one gets its own catalog.
export const LISTINGS_BY_CATEGORY = {
  hotels: STAY_ITEMS,
  resorts: RESORT_ITEMS,
  homestays: HOMESTAY_ITEMS,
  restaurants: STAY_ITEMS,
  cafes: STAY_ITEMS,
  homefood: STAY_ITEMS,
};

// Flattened, search-friendly view — one row per (category, item) pair,
// tagged with that category's label/route so a single search across every
// registered hotel/resort/homestay/etc. can still navigate and label
// results correctly.
export const ALL_LISTINGS = CATEGORIES.flatMap(category =>
  (LISTINGS_BY_CATEGORY[category.id] ?? []).map(item => ({
    ...item,
    categoryId: category.id,
    categoryLabel: category.label,
    route: category.route,
  })),
);
