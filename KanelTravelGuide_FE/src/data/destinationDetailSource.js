import { ApiError } from '../api/http.js'
import { getSpot } from '../api/touristSpotsApi.js'

export async function getDestinationDetail(id) {
  try {
    const spot = await getSpot(id)
    return {
      name: spot.SpotName,
      location: spot.LocationName,
      locationId: spot.LocationId,
      featured: spot.IsFeatured,
      summary: spot.Description,
      type: spot.CategoryName,
      overview: spot.DetailedContent || spot.Description,
      image: spot.ThumbnailUrl,
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}
