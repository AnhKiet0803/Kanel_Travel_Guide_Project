import { Link, useParams } from 'react-router-dom'
import { getSpots, getLocations, getCategories, displayDate } from '../../data/adminTouristSpotsStore.js'
import '../../components/admin.css'
import '../../styles/admin/AdminTouristSpotForm.css'

export default function AdminTouristSpotDetailPage() {
  const { id } = useParams()
  const spot = getSpots().find((item) => String(item.SpotId) === String(id))
  const locations = getLocations()
  const categories = getCategories()

  if (!spot) {
    return <div className="ats-form-page"><h1>Tourist spot not found</h1><p>This destination does not exist in demo data.</p><Link className="ktg-button" to="/admin/spots">Back to list</Link></div>
  }
  const location = locations.find((item) => Number(item.LocationId) === Number(spot.LocationId))
  const category = categories.find((item) => Number(item.CategoryId) === Number(spot.CategoryId))
  return (
    <div className="ats-form-page">
      <div className="ats-form-header"><div><Link className="ats-back-link" to="/admin/spots">← Back to Tourist Spots</Link><p className="ats-eyebrow">ADMIN / DESTINATIONS / DETAILS</p><h1>{spot.SpotName}</h1><p>Tourist spot information</p></div><Link className="ktg-button" to={`/admin/spots/${spot.SpotId}/edit`}>Edit Tourist Spot</Link></div>
      <div className="ats-detail-card">
        {spot.ThumbnailUrl ? <img className="ats-detail-hero" src={spot.ThumbnailUrl} alt={spot.SpotName} /> : <div className="ats-detail-empty">No destination image</div>}
        <div className="ats-detail-body">
          <div className="ats-detail-grid">
            <div><span>Location</span><strong>{location ? `${location.LocationName} — ${location.Region}` : 'Unknown'}</strong></div>
            <div><span>Category</span><strong>{category?.CategoryName || 'Unknown'}</strong></div>
            <div><span>Created Date</span><strong>{displayDate(spot.CreatedAt ?? spot.createdAt)}</strong></div>
            <div><span>Featured</span><strong>{spot.IsFeatured ? 'Yes' : 'No'}</strong></div>
            <div><span>Spot ID</span><strong>{spot.SpotId}</strong></div>
          </div>
          <h2>Short Description</h2><p className="ats-detail-text">{spot.Description || 'No description provided.'}</p>
          <h2>Detailed Content</h2><p className="ats-detail-text">{spot.DetailedContent || 'No detailed content provided.'}</p>
          <div className="ats-form-actions"><Link className="ktg-button ktg-button-secondary" to="/admin/spots">Back to List</Link><Link className="ktg-button" to={`/admin/spots/${spot.SpotId}/edit`}>Edit Tourist Spot</Link></div>
        </div>
      </div>
    </div>
  )
}
