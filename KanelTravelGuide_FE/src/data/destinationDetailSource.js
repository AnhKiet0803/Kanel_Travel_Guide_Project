// Single switch for this page. Set false when the backend GET endpoints are ready.
// For Vite, optional .env.local: VITE_USE_DEMO_DESTINATIONS=false
export const USE_DEMO_DESTINATIONS =
  import.meta.env.VITE_USE_DEMO_DESTINATIONS !== 'false'

import { getSpots, getLocations, getCategories } from './adminTouristSpotsStore'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5011/api').replace(/\/$/, '')

const SAMPLE_DETAILS = {
  1: { name: 'Ha Long Bay', location: 'Quang Ninh, Vietnam',
    images: ['/images/destinations/halong/main.jpg','/images/destinations/halong/photo-1.jpg','/images/destinations/halong/photo-2.jpg','/images/destinations/halong/photo-3.jpg','/images/destinations/halong/photo-4.jpg'],
    duration: '2 days', languages: 'EN, VI',
    highlights: ['Explore limestone islands','Enjoy a scenic cruise on the bay','Visit stunning caves','Experience local fishing villages'] },
  2: { name: 'Hoi An Ancient Town', location: 'Quang Nam, Vietnam',
    images: ['/images/destinations/hoian/main.jpg','/images/destinations/hoian/photo-1.jpg','/images/destinations/hoian/photo-2.jpg','/images/destinations/hoian/photo-3.jpg','/images/destinations/hoian/photo-4.jpg'],
    duration: '1 day', languages: 'EN, VI',
    highlights: ['Explore the Ancient Town','Admire lantern-lit streets','Discover local cuisine','Visit traditional craft workshops'] },
  3: { name: 'Bali', location: 'Bali, Indonesia',
    images: ['/images/destinations/bali/main.jpg','/images/destinations/bali/photo-1.jpg','/images/destinations/bali/photo-2.jpg','/images/destinations/bali/photo-3.jpg','/images/destinations/bali/photo-4.jpg'],
    duration: '3 days', languages: 'EN',
    highlights: ['Visit beautiful temples','Discover lush rice terraces','Relax on tropical beaches','Experience Balinese culture'] },
}
const EMPTY_IMAGE = '/images/destinations/halong/main.jpg'
const pick = (obj, ...keys) => keys.map(k => obj?.[k]).find(v => v !== undefined && v !== null)

function toViewModel(raw, location, category, demo = false) {
  const id = Number(pick(raw, 'spotId', 'SpotId'))
  const sample = demo ? SAMPLE_DETAILS[id] : null
  const name = pick(raw, 'spotName', 'SpotName') || 'Untitled destination'
  const thumbnail = pick(raw, 'thumbnailUrl', 'ThumbnailUrl')
  // The current TouristSpot model exposes only one image URL, not a photo gallery.
  // Keep the sample gallery only if this is the same original sample destination.
  const useSampleGallery = sample && name.trim().toLowerCase() === sample.name.toLowerCase()
  const images = thumbnail
    ? [thumbnail, ...(useSampleGallery ? sample.images.filter(x => x !== thumbnail) : [])]
    : useSampleGallery ? sample.images : [EMPTY_IMAGE]
  const detailed = String(pick(raw, 'detailedContent', 'DetailedContent') || '')
  const description = String(pick(raw, 'description', 'Description') || '')
  const locationName = pick(location, 'locationName', 'LocationName') || pick(raw, 'locationName', 'LocationName') || 'Location not specified'
  const region = pick(location, 'region', 'Region') || ''
  const categoryName = pick(category, 'categoryName', 'CategoryName') || pick(raw, 'categoryName', 'CategoryName') || 'Other'
  return {
    id, name,
    location: region ? `${locationName}, ${region}` : locationName,
    type: categoryName,
    overview: detailed || description || 'No description available yet.',
    highlights: useSampleGallery ? sample.highlights : [],
    images,
    duration: useSampleGallery ? sample.duration : null,
    languages: useSampleGallery ? sample.languages : null,
  }
}

function fromDemo(id) {
  const raw = getSpots().find(x => Number(x.SpotId) === Number(id))
  if (!raw) return null
  const location = getLocations().find(x => Number(x.LocationId) === Number(raw.LocationId))
  const category = getCategories().find(x => Number(x.CategoryId) === Number(raw.CategoryId))
  return toViewModel(raw, location, category, true)
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Backend request failed (${response.status}): ${path}`)
  return response.json()
}

async function fromBackend(id) {
  const raw = await getJson(`/tourist-spots/${encodeURIComponent(id)}`)
  if (!raw) return null
  const locationId = pick(raw, 'locationId', 'LocationId')
  const categoryId = pick(raw, 'categoryId', 'CategoryId')
  const [location, category] = await Promise.all([
    locationId ? getJson(`/locations/${encodeURIComponent(locationId)}`) : null,
    categoryId ? getJson(`/category-types/${encodeURIComponent(categoryId)}`) : null,
  ])
  return toViewModel(raw, location, category)
}

export async function getDestinationDetail(id) {
  return USE_DEMO_DESTINATIONS ? fromDemo(id) : fromBackend(id)
}
