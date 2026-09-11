const GREEN = '#16A34A';

export const CATEGORIES = [
  {id: 'hotels', label: 'Hotels', icon: 'business-outline', route: 'Hotels'},
  {id: 'resorts', label: 'Resorts', icon: 'sunny-outline', route: 'Resort'},
  {id: 'homestays', label: 'Homestays', icon: 'home-outline', route: 'HomeStays'},
  {id: 'restaurants', label: 'Restaurants', icon: 'restaurant-outline', route: 'Restaurants'},
  {id: 'cafes', label: 'Coffee Corner', icon: 'cafe-outline', route: 'CoffeCorner'},
  {id: 'homefood', label: 'Home Food', icon: 'home', route: 'CoffeCorner'},
];

export const STAY_ITEMS = [
  {
    id: 'nilgiri-retreat',
    name: 'The Nilgiri Retreat',
    location: 'Ooty, Tamil Nadu',
    rating: 4.8,
    price: 2400,
    badge: 'Best Seller',
    badgeColor: GREEN,
    image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80',
  },
  {
    id: 'misty-hills',
    name: 'Misty Hills Resort',
    location: 'Munnar, Kerala',
    rating: 4.6,
    price: 3200,
    badge: '20% OFF',
    badgeColor: '#DC2626',
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80',
  },
  {
    id: 'backwater-bliss',
    name: 'Backwater Bliss',
    location: 'Alleppey, Kerala',
    rating: 4.7,
    price: 2900,
    badge: 'New',
    badgeColor: '#7C3AED',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80',
  },
];

export const HOMESTAY_ITEMS = [
  {
    id: 'coorg-cottage',
    name: 'Coorg Cottage Escape',
    location: 'Madikeri, Coorg, Karnataka',
    rating: 4.9,
    price: 1800,
    badge: 'Superhost',
    badgeColor: GREEN,
    image: 'https://images.unsplash.com/photo-1600100397608-f909cbb0aa8c?w=400&q=80',
  },
  {
    id: 'bamboo-villa',
    name: 'Bamboo Villa Retreat',
    location: 'Wayanad, Kerala',
    rating: 4.8,
    price: 2100,
    badge: 'Superhost',
    badgeColor: GREEN,
    image: 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=400&q=80',
  },
];

// Resort/Restaurants/Coffee Corner/Home Food screens are still stubs built
// off HotelsScreen's dataset, so they're routed through the same stay ids
// until each one gets its own catalog.
export const LISTINGS_BY_CATEGORY = {
  hotels: STAY_ITEMS,
  resorts: STAY_ITEMS,
  homestays: HOMESTAY_ITEMS,
  restaurants: STAY_ITEMS,
  cafes: STAY_ITEMS,
  homefood: STAY_ITEMS,
};

// Flattened, search-friendly view — one row per (category, item) pair,
// tagged with that category's label/route so a single search across every
// registered hotel/homestay/etc. can still navigate and label results
// correctly.
export const ALL_LISTINGS = CATEGORIES.flatMap(category =>
  (LISTINGS_BY_CATEGORY[category.id] ?? []).map(item => ({
    ...item,
    categoryId: category.id,
    categoryLabel: category.label,
    route: category.route,
  })),
);
