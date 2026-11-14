export const SPOTS_KEY = 'karnel-admin-tourist-spots-demo'
export const LOCATIONS_KEY = 'karnel-admin-locations-demo'
export const CATEGORIES_KEY = 'karnel-admin-categories-demo'

export const DEFAULT_LOCATIONS = [
  { LocationId: 1, LocationName: 'Ha Long Bay', Region: 'Northern Vietnam', Description: '' },
  { LocationId: 2, LocationName: 'Hoi An', Region: 'Central Vietnam', Description: '' },
  { LocationId: 3, LocationName: 'Bali', Region: 'Indonesia', Description: '' },
]
export const DEFAULT_CATEGORIES = [
  { CategoryId: 1, CategoryName: 'Nature' },
  { CategoryId: 2, CategoryName: 'Culture & Heritage' },
  { CategoryId: 3, CategoryName: 'Beaches & Islands' },
  { CategoryId: 4, CategoryName: 'Historical Sites' },
]
export const DEFAULT_SPOTS = [
  { SpotId: 1, SpotName: 'Ha Long Bay', LocationId: 1, CategoryId: 1, ThumbnailUrl: '', Description: 'Limestone islands and emerald waters.', DetailedContent: 'Explore the islands and caves of Ha Long Bay.', IsFeatured: true, CreatedAt: '2026-11-12T09:00:00' },
  { SpotId: 2, SpotName: 'Hoi An Ancient Town', LocationId: 2, CategoryId: 2, ThumbnailUrl: '', Description: 'Historic streets and traditional architecture.', DetailedContent: 'Discover the lantern-lit streets of Hoi An.', IsFeatured: true, CreatedAt: '2026-11-10T14:30:00' },
  { SpotId: 3, SpotName: 'Bali', LocationId: 3, CategoryId: 3, ThumbnailUrl: '', Description: 'Beautiful beaches and tropical landscapes.', DetailedContent: 'Enjoy beaches, temples and rice terraces.', IsFeatured: false, CreatedAt: '2026-11-08T10:15:00' },
]

export function readCollection(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      const data = JSON.parse(raw)
      if (Array.isArray(data)) return data
    }
  } catch (error) {
    console.warn('Unable to read demo data', error)
  }
  return fallback
}

export function writeCollection(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getSpots() { return readCollection(SPOTS_KEY, DEFAULT_SPOTS) }
export function getLocations() { return readCollection(LOCATIONS_KEY, DEFAULT_LOCATIONS) }
export function getCategories() { return readCollection(CATEGORIES_KEY, DEFAULT_CATEGORIES) }

export function nextId(items, key) {
  return Math.max(0, ...items.map((item) => Number(item[key]) || 0)) + 1
}

export function displayDate(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
