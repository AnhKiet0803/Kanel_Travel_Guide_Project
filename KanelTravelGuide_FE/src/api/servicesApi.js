// API client for Accommodation & Dining (Hotels, Restaurants, Resorts)
// Corresponds to ServicesController in BE (CN06, CN07, CN08, CN19)
import { request } from './http.js'

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) query.set(key, value)
  }
  const text = query.toString()
  return text ? `${path}?${text}` : path
}

// Curated travel catalog to guarantee gorgeous photography, amenities, and rich info
export const CURATED_SERVICES = [
  {
    providerId: 1,
    providerName: 'Karnel Beach Luxury Hotel',
    serviceType: 'Hotel',
    locationId: 1,
    locationName: 'Da Nang',
    address: '128 Vo Nguyen Giap Street, My Khe Beach, Da Nang',
    phone: '0236 3911 888',
    website: 'https://karnel.local/beach-hotel',
    starRating: 5,
    minPrice: 1850000,
    maxPrice: 3800000,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: ['Infinity Ocean Pool', 'Complimentary Buffet Breakfast', 'High-Speed Wi-Fi', 'Luxury Spa & Sauna', 'Airport Shuttle', 'Fitness Center'],
    highlights: ['Direct beach access', 'Top-rated rooftop sky lounge', 'Free cancellation'],
    reviewScore: 9.4,
    reviewCount: 384,
    description: 'Situated right along the golden sands of My Khe Beach, Karnel Beach Luxury Hotel offers refined accommodation with panoramic sea views, an infinity sky pool, and authentic Vietnamese and international dining.',
    items: [
      { itemId: 101, itemName: 'Deluxe Ocean View Room', capacity: 2, price: 1850000, totalQuantity: 15, isAvailable: true, bed: '1 King Bed', size: '38 m²' },
      { itemId: 102, itemName: 'Executive Beachfront Suite', capacity: 3, price: 2850000, totalQuantity: 8, isAvailable: true, bed: '1 Super King + 1 Sofa', size: '56 m²' },
      { itemId: 103, itemName: 'Presidential Penthouse', capacity: 4, price: 3800000, totalQuantity: 2, isAvailable: true, bed: '2 King Beds', size: '92 m²' }
    ]
  },
  {
    providerId: 2,
    providerName: 'Hoi An Riverside Heritage Hotel',
    serviceType: 'Hotel',
    locationId: 2,
    locationName: 'Quang Nam (Hoi An)',
    address: '45 Nguyen Du Street, Minh An, Hoi An Ancient Town',
    phone: '0235 3861 999',
    website: 'https://karnel.local/hoian-riverside',
    starRating: 4,
    minPrice: 1200000,
    maxPrice: 2100000,
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: ['Riverside Garden Pool', 'Traditional Lantern Lounge', 'Free Bicycles', 'Organic Cooking Class', 'Free Wi-Fi'],
    highlights: ['5-minute walk to Japanese Covered Bridge', 'River breeze balcony'],
    reviewScore: 9.2,
    reviewCount: 295,
    description: 'Immerse yourself in centuries of Indochine charm. Located gently on the banks of Hoai River, our boutique hotel offers tranquil garden suites and complimentary bicycles to explore the UNESCO Heritage town.',
    items: [
      { itemId: 201, itemName: 'Heritage Garden View Room', capacity: 2, price: 1200000, totalQuantity: 20, isAvailable: true, bed: '1 Queen Bed', size: '32 m²' },
      { itemId: 202, itemName: 'Riverside Balcony Room', capacity: 2, price: 1650000, totalQuantity: 12, isAvailable: true, bed: '1 King Bed', size: '40 m²' },
      { itemId: 203, itemName: 'Family Indochine Suite', capacity: 4, price: 2100000, totalQuantity: 6, isAvailable: true, bed: '2 Queen Beds', size: '60 m²' }
    ]
  },
  {
    providerId: 3,
    providerName: 'Karnel Coral Bay Luxury Resort',
    serviceType: 'Resort',
    locationId: 4,
    locationName: 'Khanh Hoa (Nha Trang)',
    address: 'Hon Tre Island, Nha Trang Bay, Khanh Hoa',
    phone: '0258 3599 777',
    website: 'https://karnel.local/coral-bay-resort',
    starRating: 5,
    minPrice: 3200000,
    maxPrice: 6500000,
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: ['Private Coral Beach', 'Water Sports & Scuba Diving', 'Overwater Villas', 'Wellness & Detox Spa', 'Kid Club & Arcade'],
    highlights: ['Speedboat transfer included', 'Private plunge pool in each villa'],
    reviewScore: 9.7,
    reviewCount: 512,
    description: 'An exclusive tropical paradise nestled in a secluded cove of Nha Trang Bay. Unwind in standalone overwater villas surrounded by turquoise waters, lush palms, and Michelin-inspired seafood dining.',
    items: [
      { itemId: 301, itemName: 'Oceanfront Pool Villa', capacity: 2, price: 3200000, totalQuantity: 10, isAvailable: true, bed: '1 King Bed', size: '75 m²' },
      { itemId: 302, itemName: 'Sunset Overwater Bungalow', capacity: 2, price: 4800000, totalQuantity: 8, isAvailable: true, bed: '1 King Bed', size: '90 m²' },
      { itemId: 303, itemName: 'Grand 2-Bedroom Beachfront Villa', capacity: 6, price: 6500000, totalQuantity: 4, isAvailable: true, bed: '2 King Beds + 2 Singles', size: '150 m²' }
    ]
  },
  {
    providerId: 4,
    providerName: 'The Pearl Palm Beach Resort',
    serviceType: 'Resort',
    locationId: 4,
    locationName: 'Khanh Hoa (Cam Ranh)',
    address: 'Nguyen Tat Thanh Boulevard, Cam Ranh Peninsula, Khanh Hoa',
    phone: '0258 3988 555',
    website: 'https://karnel.local/pearl-palm',
    starRating: 5,
    minPrice: 2800000,
    maxPrice: 5200000,
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: ['1,000m² Lagoon Pool', 'Championship Golf Course', 'Hydrotherapy Spa', 'Sunset Cocktail Beach Bar'],
    highlights: ['15 mins from Cam Ranh Airport', 'White sand coastline'],
    reviewScore: 9.3,
    reviewCount: 220,
    description: 'Stretching along a pristine coast of powdery white sands, The Pearl Palm Resort blends tropical tranquility with world-class golf and wellness facilities.',
    items: [
      { itemId: 401, itemName: 'Deluxe Garden View Room', capacity: 2, price: 2800000, totalQuantity: 18, isAvailable: true, bed: '1 King or 2 Twins', size: '48 m²' },
      { itemId: 402, itemName: 'Panorama Sea View Villa', capacity: 4, price: 5200000, totalQuantity: 6, isAvailable: true, bed: '2 King Beds', size: '110 m²' }
    ]
  },
  {
    providerId: 5,
    providerName: 'Madame Lan Riverside Dining',
    serviceType: 'Restaurant',
    locationId: 1,
    locationName: 'Da Nang',
    address: '04 Bach Dang Street, Thach Thang, Hai Chau, Da Nang',
    phone: '0905 697 555',
    website: 'https://karnel.local/madame-lan',
    starRating: 5,
    minPrice: 150000,
    maxPrice: 650000,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: ['Riverfront Terrace Dining', 'Air-Conditioned VIP Rooms', 'Live Folk Music', 'English-speaking Staff', 'Craft Beer & Cocktails'],
    highlights: ['Han River night view', 'Authentic culinary heritage of 3 regions'],
    reviewScore: 9.6,
    reviewCount: 680,
    description: 'Renowned as an open-air culinary village beside the Han River, Madame Lan celebrates the rich flavors of Vietnamese cuisine with over 200 specialties prepared by master chefs.',
    items: [
      { itemId: 501, itemName: 'Riverfront Dining Table for 2-4', capacity: 4, price: 150000, totalQuantity: 30, isAvailable: true, bed: 'Riverside View', size: 'Outdoor terrace' },
      { itemId: 502, itemName: 'VIP Private Dining Room (up to 12)', capacity: 12, price: 650000, totalQuantity: 5, isAvailable: true, bed: 'AC VIP Salon', size: 'Private Room' }
    ]
  },
  {
    providerId: 6,
    providerName: 'Annam Heritage Royal Restaurant',
    serviceType: 'Restaurant',
    locationId: 3,
    locationName: 'Thua Thien Hue',
    address: '15 Le Loi Street, Vinh Ninh, Hue City',
    phone: '0234 3822 666',
    website: 'https://karnel.local/annam-royal',
    starRating: 5,
    minPrice: 250000,
    maxPrice: 850000,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Imperial Court Cuisine', 'Traditional Royal Costumes Service', 'Courtyard Garden', 'Tea Ceremonies'],
    highlights: ['Royal Nguyen Dynasty tasting menus', 'Perfume River vicinity'],
    reviewScore: 9.3,
    reviewCount: 190,
    description: 'Experience genuine Hue Imperial dining once reserved exclusively for royal banquets. Served in a preserved courtyard palace with classical court music performance.',
    items: [
      { itemId: 601, itemName: 'Imperial Banquet Table (4-6 persons)', capacity: 6, price: 350000, totalQuantity: 15, isAvailable: true, bed: 'Royal Style', size: 'Courtyard Table' },
      { itemId: 602, itemName: 'King Royal Chamber Table', capacity: 8, price: 850000, totalQuantity: 3, isAvailable: true, bed: 'Imperial Salon', size: 'Chamber' }
    ]
  }
]

// Public APIs: Fetch from server with fallback to curated catalog
export async function getServices(params = {}) {
  try {
    const serverData = await request(withQuery('/services', params))
    if (Array.isArray(serverData) && serverData.length > 0) {
      // Merge with curated data to ensure high-res photography and amenities
      return serverData.map((s) => {
        const match = CURATED_SERVICES.find((c) => c.providerId === s.providerId || c.providerName.toLowerCase() === s.providerName.toLowerCase())
        return {
          ...s,
          imageUrl: match?.imageUrl || s.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          amenities: match?.amenities || ['Free Wi-Fi', 'Complimentary Breakfast', 'Swimming Pool', '24/7 Front Desk'],
          reviewScore: match?.reviewScore || 9.2,
          reviewCount: match?.reviewCount || 150
        }
      })
    }
  } catch {
    // fallback if server is offline or empty
  }

  // Client-side filtering on curated data
  let list = [...CURATED_SERVICES]
  if (params.type) {
    list = list.filter((i) => i.serviceType.toLowerCase() === params.type.toLowerCase())
  }
  if (params.locationId) {
    list = list.filter((i) => i.locationId === parseInt(params.locationId))
  }
  if (params.starRating) {
    list = list.filter((i) => i.starRating >= parseInt(params.starRating))
  }
  if (params.maxPrice) {
    list = list.filter((i) => (i.minPrice || 0) <= parseFloat(params.maxPrice))
  }
  if (params.q) {
    const q = params.q.toLowerCase().trim()
    list = list.filter((i) => i.providerName.toLowerCase().includes(q) || i.address.toLowerCase().includes(q))
  }
  return list
}

export async function getServiceById(id) {
  try {
    const serverData = await request(`/services/${id}`)
    if (serverData && serverData.providerId) {
      const match = CURATED_SERVICES.find((c) => c.providerId === serverData.providerId || c.providerName.toLowerCase() === serverData.providerName.toLowerCase())
      return {
        ...serverData,
        imageUrl: match?.imageUrl || serverData.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        gallery: match?.gallery || [serverData.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'],
        amenities: match?.amenities || ['Infinity Pool', 'Complimentary Breakfast', 'High-Speed Wi-Fi', 'Spa & Sauna', 'Airport Shuttle'],
        highlights: match?.highlights || ['Prime location', 'Top-rated cleanliness', 'Free cancellation available'],
        reviewScore: match?.reviewScore || 9.4,
        reviewCount: match?.reviewCount || 230,
        items: serverData.items && serverData.items.length > 0 ? serverData.items : match?.items || []
      }
    }
  } catch {
    // fallback
  }

  const found = CURATED_SERVICES.find((c) => c.providerId === parseInt(id))
  if (found) return found
  return CURATED_SERVICES[0]
}

export async function getLocations() {
  try {
    const data = await request('/locations')
    if (Array.isArray(data) && data.length > 0) return data
  } catch {}
  return [
    { locationId: 1, locationName: 'Da Nang', region: 'Central' },
    { locationId: 2, locationName: 'Quang Nam (Hoi An)', region: 'Central' },
    { locationId: 3, locationName: 'Thua Thien Hue', region: 'Central' },
    { locationId: 4, locationName: 'Khanh Hoa (Nha Trang)', region: 'Central' }
  ]
}

// Admin APIs (CN19)
export const createService = (data) =>
  request('/services', { method: 'POST', body: JSON.stringify(data) })

export const updateService = (id, data) =>
  request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteService = (id) =>
  request(`/services/${id}`, { method: 'DELETE' })

export const createServiceItem = (providerId, data) =>
  request(`/services/${providerId}/items`, { method: 'POST', body: JSON.stringify(data) })

export const updateServiceItem = (providerId, itemId, data) =>
  request(`/services/${providerId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteServiceItem = (providerId, itemId) =>
  request(`/services/${providerId}/items/${itemId}`, { method: 'DELETE' })
