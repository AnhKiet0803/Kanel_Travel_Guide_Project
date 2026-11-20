import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSpot } from '../../api/touristSpotsApi.js'
import { displayDate } from '../../data/adminTouristSpotsStore.js'
import '../../components/admin.css'
import '../../styles/admin/AdminTouristSpotForm.css'

export default function AdminTouristSpotDetailPage() {
  const { id } = useParams()
  const [result, setResult] = useState(null)
  useEffect(() => {
    let active = true
    getSpot(id)
      .then((spot) => { if (active) setResult({ id, spot }) })
      .catch((err) => { if (active) setResult({ id, error: err.message }) })
    return () => { active = false }
  }, [id])

  if (result?.id !== id) return <p role="status">Loading tourist spot…</p>
  if (result.error) {
    return <div className="ats-form-page"><p role="alert">{result.error}</p><Link to="/admin/spots">Back to list</Link></div>
  }
  const { spot } = result
  return (
    <div className="ats-form-page">
      <div className="ats-form-header"><div><Link className="ats-back-link" to="/admin/spots">← Back to Tourist Spots</Link><p className="ats-eyebrow">ADMIN / DESTINATIONS / DETAILS</p><h1>{spot.SpotName}</h1><p>Tourist spot information</p></div><Link className="ktg-button" to={`/admin/spots/${spot.SpotId}/edit`}>Edit Tourist Spot</Link></div>
      <div className="ats-detail-card">
        {spot.ThumbnailUrl ? <img className="ats-detail-hero" src={spot.ThumbnailUrl} alt={spot.SpotName} /> : <div className="ats-detail-empty">No destination image</div>}
        <div className="ats-detail-body">
          <div className="ats-detail-grid">
            <div><span>Location</span><strong>{spot.LocationName || 'Unknown'}</strong></div>
            <div><span>Category</span><strong>{spot.CategoryName || 'Unknown'}</strong></div>
            <div><span>Created Date</span><strong>{displayDate(spot.CreatedAt ?? spot.createdAt)}</strong></div>
            <div><span>Featured</span><strong>{spot.IsFeatured ? 'Yes' : 'No'}</strong></div>
            <div><span>Spot ID</span><strong>{spot.SpotId}</strong></div>
          </div>
          <h2>Short Description</h2><p className="ats-detail-text">{spot.Description || 'No description provided.'}</p>
          <h2>Detailed Content</h2><p className="ats-detail-text">{spot.DetailedContent || 'No detailed content provided.'}</p>
          <div className="ats-form-actions"><Link className="ktg-button ktg-button-secondary" to="/admin/spots">Back to List</Link><Link className="ktg-button ktg-button-secondary" to={`/destinations/${spot.SpotId}`}>View on Website</Link><Link className="ktg-button" to={`/admin/spots/${spot.SpotId}/edit`}>Edit Tourist Spot</Link></div>
        </div>
      </div>
    </div>
  )
}
