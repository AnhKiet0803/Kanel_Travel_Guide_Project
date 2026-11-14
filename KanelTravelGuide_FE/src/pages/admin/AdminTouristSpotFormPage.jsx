import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  SPOTS_KEY, LOCATIONS_KEY, CATEGORIES_KEY,
  getSpots, getLocations, getCategories, nextId, writeCollection,
} from '../../data/adminTouristSpotsStore.js'
import '../../components/admin.css'
import '../../styles/admin/AdminTouristSpotForm.css'

const EMPTY_SPOT = {
  SpotName: '', LocationId: '', CategoryId: '', ThumbnailUrl: '',
  Description: '', DetailedContent: '', IsFeatured: false,
}

// Browser storage is only for the frontend demo; no backend upload happens here.
const MAX_IMAGE_SIZE = 1.5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function AdminTouristSpotFormPage() {
  const { id } = useParams()
  const editing = id !== undefined
  const navigate = useNavigate()
  const [spots, setSpots] = useState(getSpots)
  const [locations, setLocations] = useState(getLocations)
  const [categories, setCategories] = useState(getCategories)
  const [form, setForm] = useState(EMPTY_SPOT)
  const [showLocation, setShowLocation] = useState(false)
  const [showCategory, setShowCategory] = useState(false)
  const [locationDraft, setLocationDraft] = useState({ LocationName: '', Region: '', Description: '' })
  const [categoryDraft, setCategoryDraft] = useState('')
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState('')
  const [imageLoading, setImageLoading] = useState(false)

  const original = editing ? spots.find((spot) => String(spot.SpotId) === String(id)) : null
  useEffect(() => {
    if (editing && original) {
      setForm({
        SpotName: original.SpotName || '',
        LocationId: String(original.LocationId ?? ''),
        CategoryId: String(original.CategoryId ?? ''),
        ThumbnailUrl: original.ThumbnailUrl || '',
        Description: original.Description || '',
        DetailedContent: original.DetailedContent || '',
        IsFeatured: Boolean(original.IsFeatured),
      })
    }
  }, [editing, id]) // Load the saved record when switching between routes.

  function setField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  function addLocation(event) {
    event.preventDefault()
    const name = locationDraft.LocationName.trim()
    const region = locationDraft.Region.trim()
    if (!name || !region) return
    const existing = locations.find((item) => item.LocationName.toLowerCase() === name.toLowerCase() && item.Region.toLowerCase() === region.toLowerCase())
    if (existing) {
      setField('LocationId', String(existing.LocationId))
      setShowLocation(false)
      return
    }
    const location = {
      LocationId: nextId(locations, 'LocationId'), LocationName: name,
      Region: region, Description: locationDraft.Description.trim(),
    }
    const updated = [...locations, location]
    try {
      writeCollection(LOCATIONS_KEY, updated)
      setLocations(updated)
      setField('LocationId', String(location.LocationId))
      setLocationDraft({ LocationName: '', Region: '', Description: '' })
      setShowLocation(false)
      setError('')
    } catch {
      setError('Unable to save the new location. Browser storage may be full.')
    }
  }

  function addCategory(event) {
    event.preventDefault()
    const name = categoryDraft.trim()
    if (!name) return
    const existing = categories.find((item) => item.CategoryName.toLowerCase() === name.toLowerCase())
    if (existing) {
      setField('CategoryId', String(existing.CategoryId))
      setShowCategory(false)
      return
    }
    const category = { CategoryId: nextId(categories, 'CategoryId'), CategoryName: name }
    const updated = [...categories, category]
    try {
      writeCollection(CATEGORIES_KEY, updated)
      setCategories(updated)
      setField('CategoryId', String(category.CategoryId))
      setCategoryDraft('')
      setShowCategory(false)
      setError('')
    } catch {
      setError('Unable to save the new category. Browser storage may be full.')
    }
  }

  function chooseImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImageError('')
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Please choose a JPG, PNG or WebP image.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('For this local demo, choose an image smaller than 1.5 MB.')
      return
    }
    setImageLoading(true)
    const reader = new FileReader()
    reader.onload = () => {
      setField('ThumbnailUrl', String(reader.result))
      setImageLoading(false)
    }
    reader.onerror = () => {
      setImageError('Could not read this image. Please try again.')
      setImageLoading(false)
    }
    reader.readAsDataURL(file)
  }

  function saveSpot(event) {
    event.preventDefault()
    setError('')
    if (!form.SpotName.trim() || !form.LocationId || !form.CategoryId) {
      setError('Please enter a name and select both Location and Category.')
      return
    }
    const latest = getSpots()
    const duplicate = latest.some((spot) => spot.SpotName.trim().toLowerCase() === form.SpotName.trim().toLowerCase() && String(spot.SpotId) !== String(id))
    if (duplicate) {
      setError('A tourist spot with this name already exists.')
      return
    }
    const saved = {
      SpotName: form.SpotName.trim(), LocationId: Number(form.LocationId),
      CategoryId: Number(form.CategoryId), ThumbnailUrl: form.ThumbnailUrl,
      Description: form.Description.trim(), DetailedContent: form.DetailedContent.trim(),
      IsFeatured: Boolean(form.IsFeatured),
    }
    let updated
    if (editing) {
      const found = latest.find((spot) => String(spot.SpotId) === String(id))
      if (!found) { setError('This tourist spot no longer exists.'); return }
      updated = latest.map((spot) => String(spot.SpotId) === String(id) ? { ...spot, ...saved } : spot)
    } else {
      updated = [...latest, { ...saved, SpotId: nextId(latest, 'SpotId'), CreatedAt: new Date().toISOString() }]
    }
    try {
      writeCollection(SPOTS_KEY, updated)
      setSpots(updated)
      navigate('/admin/spots')
    } catch {
      setError('Unable to save. Browser storage may be full, especially with uploaded images. Try a smaller image.')
    }
  }

  if (editing && !original) {
    return <div className="ats-form-page"><h1>Tourist spot not found</h1><p>This destination does not exist in demo data.</p><Link className="ktg-button" to="/admin/spots">Back to list</Link></div>
  }

  return (
    <div className="ats-form-page">
      <div className="ats-form-header">
        <div><Link className="ats-back-link" to="/admin/spots">← Back to Tourist Spots</Link><p className="ats-eyebrow">ADMIN / DESTINATIONS</p><h1>{editing ? 'Edit Tourist Spot' : 'Add New Tourist Spot'}</h1><p>Manage destination information and photos.</p></div>
      </div>
      {error && <p className="ats-form-error" role="alert">{error}</p>}
      <form id="ats-spot-form" onSubmit={saveSpot} className="ats-form-card">
        <h2>Basic Information</h2>
        <div className="ats-form-field"><label htmlFor="spot-name">Tourist Spot Name *</label><input id="spot-name" required value={form.SpotName} onChange={(event) => setField('SpotName', event.target.value)} placeholder="e.g. Ba Na Hills" /></div>
        <div className="ats-form-grid">
          <div className="ats-form-field"><label htmlFor="spot-location">Location *</label><select id="spot-location" required value={form.LocationId} onChange={(event) => setField('LocationId', event.target.value)}><option value="">Select location</option>{locations.map((item) => <option key={item.LocationId} value={item.LocationId}>{item.LocationName} — {item.Region}</option>)}</select><button type="button" className="ats-inline-add" onClick={() => setShowLocation((value) => !value)}>{showLocation ? '− Close location form' : '+ Add New Location'}</button></div>
          <div className="ats-form-field"><label htmlFor="spot-category">Category *</label><select id="spot-category" required value={form.CategoryId} onChange={(event) => setField('CategoryId', event.target.value)}><option value="">Select category</option>{categories.map((item) => <option key={item.CategoryId} value={item.CategoryId}>{item.CategoryName}</option>)}</select><button type="button" className="ats-inline-add" onClick={() => setShowCategory((value) => !value)}>{showCategory ? '− Close category form' : '+ Add New Category'}</button></div>
        </div>
        {showLocation && <div className="ats-inline-panel"><h3>Add New Location</h3><div className="ats-form-grid"><div className="ats-form-field"><label htmlFor="location-name">Location Name *</label><input id="location-name" value={locationDraft.LocationName} onChange={(event) => setLocationDraft((old) => ({ ...old, LocationName: event.target.value }))} placeholder="e.g. Da Nang" /></div><div className="ats-form-field"><label htmlFor="location-region">Region *</label><input id="location-region" value={locationDraft.Region} onChange={(event) => setLocationDraft((old) => ({ ...old, Region: event.target.value }))} placeholder="e.g. Central Vietnam" /></div></div><div className="ats-form-field"><label htmlFor="location-description">Description</label><textarea id="location-description" rows={2} value={locationDraft.Description} onChange={(event) => setLocationDraft((old) => ({ ...old, Description: event.target.value }))} /></div><div className="ats-inline-actions"><button type="button" className="ktg-button ktg-button-secondary" onClick={() => setShowLocation(false)}>Cancel</button><button type="button" className="ktg-button" onClick={addLocation} disabled={!locationDraft.LocationName.trim() || !locationDraft.Region.trim()}>Save Location</button></div></div>}
        {showCategory && <div className="ats-inline-panel"><h3>Add New Category</h3><div className="ats-form-field"><label htmlFor="category-name">Category Name *</label><input id="category-name" value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="e.g. Adventure" /></div><div className="ats-inline-actions"><button type="button" className="ktg-button ktg-button-secondary" onClick={() => setShowCategory(false)}>Cancel</button><button type="button" className="ktg-button" onClick={addCategory} disabled={!categoryDraft.trim()}>Save Category</button></div></div>}
        <h2>Destination Image</h2>
        <div className="ats-upload-box">
          {form.ThumbnailUrl ? <img className="ats-upload-preview" src={form.ThumbnailUrl} alt="Destination preview" /> : <div className="ats-upload-empty">No image selected</div>}
          <div className="ats-upload-controls"><label className="ktg-button ktg-button-secondary" htmlFor="spot-image">Choose Image</label><input id="spot-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} />{form.ThumbnailUrl && <button type="button" className="ktg-button ktg-button-secondary" onClick={() => setField('ThumbnailUrl', '')}>Remove Image</button>}</div>
          <small>JPG, PNG or WebP, under 1.5 MB. Demo images are stored in this browser, not on the server.</small>
          {imageLoading && <p>Loading image...</p>}{imageError && <p className="ats-form-error" role="alert">{imageError}</p>}
        </div>
        <h2>Description & Details</h2>
        <div className="ats-form-field"><label htmlFor="spot-description">Short Description</label><textarea id="spot-description" rows={3} value={form.Description} onChange={(event) => setField('Description', event.target.value)} placeholder="Brief introduction..." /></div>
        <div className="ats-form-field"><label htmlFor="spot-details">Detailed Content</label><textarea id="spot-details" rows={7} value={form.DetailedContent} onChange={(event) => setField('DetailedContent', event.target.value)} placeholder="Detailed information about the destination..." /></div>
        <label className="ats-checkbox"><input type="checkbox" checked={form.IsFeatured} onChange={(event) => setField('IsFeatured', event.target.checked)} /> Mark as Featured Destination</label>
        <div className="ats-form-actions"><Link to="/admin/spots" className="ktg-button ktg-button-secondary">Cancel</Link><button className="ktg-button" type="submit" disabled={imageLoading}>{editing ? 'Save Changes' : 'Save Tourist Spot'}</button></div>
      </form>
    </div>
  )
}
