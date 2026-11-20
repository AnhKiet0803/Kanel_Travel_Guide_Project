import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createCategory, createLocation, getSpot, listCategories, listLocations, saveSpotRecord,
} from '../../api/touristSpotsApi.js'
import '../../components/admin.css'
import '../../styles/admin/AdminTouristSpotForm.css'

const EMPTY_SPOT = {
  SpotName: '', LocationId: '', CategoryId: '', ThumbnailUrl: '',
  Description: '', DetailedContent: '', IsFeatured: false,
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('Could not read the selected image.'))
    reader.readAsDataURL(file)
  })
}

export default function AdminTouristSpotFormPage() {
  const { id } = useParams()
  const editing = id !== undefined
  const navigate = useNavigate()
  const [locations, setLocations] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY_SPOT)
  const [showLocation, setShowLocation] = useState(false)
  const [showCategory, setShowCategory] = useState(false)
  const [locationDraft, setLocationDraft] = useState({ LocationName: '', Region: '', Description: '' })
  const [categoryDraft, setCategoryDraft] = useState('')
  const [error, setError] = useState('')
  const [loadResult, setLoadResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savingLookup, setSavingLookup] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [removeThumbnail, setRemoveThumbnail] = useState(false)

  useEffect(() => {
    if (imagePreview) return () => URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  useEffect(() => {
    let active = true
    Promise.all([listLocations(), listCategories(), editing ? getSpot(id) : null])
      .then(([places, types, original]) => {
        if (!active) return
        setLocations(places)
        setCategories(types)
        setForm(original ? {
          SpotName: original.SpotName,
          LocationId: String(original.LocationId),
          CategoryId: String(original.CategoryId),
          ThumbnailUrl: original.ThumbnailUrl ?? '',
          Description: original.Description ?? '',
          DetailedContent: original.DetailedContent ?? '',
          IsFeatured: original.IsFeatured,
        } : EMPTY_SPOT)
        setImageFile(null)
        setImagePreview('')
        setRemoveThumbnail(false)
        setError('')
        setLoadResult({ id })
      })
      .catch((err) => { if (active) setLoadResult({ id, error: err.message }) })
    return () => { active = false }
  }, [editing, id])

  function setField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  async function addLocation(event) {
    event.preventDefault()
    const name = locationDraft.LocationName.trim()
    const region = locationDraft.Region.trim()
    if (saving || savingLookup || !name || !region) return
    const existing = locations.find((item) => item.LocationName.toLowerCase() === name.toLowerCase() && item.Region.toLowerCase() === region.toLowerCase())
    if (existing) {
      setField('LocationId', String(existing.LocationId))
      setShowLocation(false)
      return
    }
    setSavingLookup(true)
    try {
      const location = await createLocation({ locationName: name, region, description: locationDraft.Description.trim() })
      setLocations((items) => [...items, location])
      setField('LocationId', String(location.LocationId))
      setLocationDraft({ LocationName: '', Region: '', Description: '' })
      setShowLocation(false)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingLookup(false)
    }
  }

  async function addCategory(event) {
    event.preventDefault()
    const name = categoryDraft.trim()
    if (saving || savingLookup || !name) return
    const existing = categories.find((item) => item.CategoryName.toLowerCase() === name.toLowerCase())
    if (existing) {
      setField('CategoryId', String(existing.CategoryId))
      setShowCategory(false)
      return
    }
    setSavingLookup(true)
    try {
      const category = await createCategory({ categoryName: name })
      setCategories((items) => [...items, category])
      setField('CategoryId', String(category.CategoryId))
      setCategoryDraft('')
      setShowCategory(false)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingLookup(false)
    }
  }

  function chooseImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type) || file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      setError('Choose a JPG, PNG or WebP image up to 2 MB.')
      return
    }
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setRemoveThumbnail(false)
  }

  async function saveSpot(event) {
    event.preventDefault()
    if (saving || savingLookup) return
    setError('')
    if (!form.SpotName.trim() || !form.LocationId || !form.CategoryId) {
      setError('Please enter a name and select both Location and Category.')
      return
    }
    const saved = {
      SpotName: form.SpotName.trim(), LocationId: Number(form.LocationId),
      CategoryId: Number(form.CategoryId), RemoveThumbnail: removeThumbnail,
      Description: form.Description.trim(), DetailedContent: form.DetailedContent.trim(),
      IsFeatured: Boolean(form.IsFeatured),
    }
    setSaving(true)
    try {
      if (imageFile) saved.ThumbnailImage = await readImage(imageFile)
      const record = await saveSpotRecord(saved, id)
      navigate(`/admin/spots/${record.spotId ?? record.SpotId ?? id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!loadResult || loadResult.id !== id) return <p role="status">Loading form…</p>
  if (loadResult.error) {
    return <div className="ats-form-page"><p role="alert">{loadResult.error}</p><Link to="/admin/spots">Back to list</Link></div>
  }

  const thumbnail = imageFile ? imagePreview : removeThumbnail ? '' : form.ThumbnailUrl

  return (
    <div className="ats-form-page">
      <div className="ats-form-header">
        <div><Link className="ats-back-link" to="/admin/spots">← Back to Tourist Spots</Link><p className="ats-eyebrow">ADMIN / DESTINATIONS</p><h1>{editing ? 'Edit Tourist Spot' : 'Add New Tourist Spot'}</h1><p>Manage destination information and photos.</p></div>
      </div>
      {error && <p className="ats-form-error" role="alert">{error}</p>}
      <form id="ats-spot-form" onSubmit={saveSpot} className="ats-form-card">
        <h2>Basic Information</h2>
        <div className="ats-form-field"><label htmlFor="spot-name">Tourist Spot Name *</label><input id="spot-name" required maxLength={200} value={form.SpotName} onChange={(event) => setField('SpotName', event.target.value)} placeholder="e.g. Ba Na Hills" /></div>
        <div className="ats-form-grid">
          <div className="ats-form-field"><label htmlFor="spot-location">Location *</label><select id="spot-location" required value={form.LocationId} onChange={(event) => setField('LocationId', event.target.value)}><option value="">Select location</option>{locations.map((item) => <option key={item.LocationId} value={item.LocationId}>{item.LocationName} — {item.Region}</option>)}</select><button type="button" className="ats-inline-add" onClick={() => setShowLocation((value) => !value)}>{showLocation ? '− Close location form' : '+ Add New Location'}</button></div>
          <div className="ats-form-field"><label htmlFor="spot-category">Category *</label><select id="spot-category" required value={form.CategoryId} onChange={(event) => setField('CategoryId', event.target.value)}><option value="">Select category</option>{categories.map((item) => <option key={item.CategoryId} value={item.CategoryId}>{item.CategoryName}</option>)}</select><button type="button" className="ats-inline-add" onClick={() => setShowCategory((value) => !value)}>{showCategory ? '− Close category form' : '+ Add New Category'}</button></div>
        </div>
        {showLocation && <div className="ats-inline-panel"><h3>Add New Location</h3><div className="ats-form-grid"><div className="ats-form-field"><label htmlFor="location-name">Location Name *</label><input id="location-name" value={locationDraft.LocationName} onChange={(event) => setLocationDraft((old) => ({ ...old, LocationName: event.target.value }))} placeholder="e.g. Da Nang" /></div><div className="ats-form-field"><label htmlFor="location-region">Region *</label><input id="location-region" value={locationDraft.Region} onChange={(event) => setLocationDraft((old) => ({ ...old, Region: event.target.value }))} placeholder="e.g. Central Vietnam" /></div></div><div className="ats-form-field"><label htmlFor="location-description">Description</label><textarea id="location-description" rows={2} value={locationDraft.Description} onChange={(event) => setLocationDraft((old) => ({ ...old, Description: event.target.value }))} /></div><div className="ats-inline-actions"><button type="button" className="ktg-button ktg-button-secondary" onClick={() => setShowLocation(false)}>Cancel</button><button type="button" className="ktg-button" onClick={addLocation} disabled={saving || savingLookup || !locationDraft.LocationName.trim() || !locationDraft.Region.trim()}>Save Location</button></div></div>}
        {showCategory && <div className="ats-inline-panel"><h3>Add New Category</h3><div className="ats-form-field"><label htmlFor="category-name">Category Name *</label><input id="category-name" value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="e.g. Adventure" /></div><div className="ats-inline-actions"><button type="button" className="ktg-button ktg-button-secondary" onClick={() => setShowCategory(false)}>Cancel</button><button type="button" className="ktg-button" onClick={addCategory} disabled={saving || savingLookup || !categoryDraft.trim()}>Save Category</button></div></div>}
        <h2>Destination Image</h2>
        <div className="ats-upload-box">
          {thumbnail ? <img className="ats-upload-preview" src={thumbnail} alt="Destination preview" /> : <div className="ats-upload-empty">No image selected</div>}
          <div className="ats-form-field">
            <label htmlFor="spot-image">Choose image file</label>
            <input id="spot-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} disabled={saving} />
            {thumbnail && <button type="button" className="ktg-button ktg-button-secondary" disabled={saving} onClick={() => {
              setImageFile(null)
              setImagePreview('')
              setRemoveThumbnail(true)
            }}>Remove Image</button>}
            <small>JPG, PNG or WebP, up to 2 MB.</small>
          </div>
        </div>
        <h2>Description & Details</h2>
        <div className="ats-form-field"><label htmlFor="spot-description">Short Description</label><textarea id="spot-description" rows={3} value={form.Description} onChange={(event) => setField('Description', event.target.value)} placeholder="A brief introduction for the destination card" /></div>
        <div className="ats-form-field"><label htmlFor="spot-details">Detailed Content</label><textarea id="spot-details" rows={7} value={form.DetailedContent} onChange={(event) => setField('DetailedContent', event.target.value)} placeholder="What to see, things to do, and practical visiting tips" /></div>
        <label className="ats-checkbox"><input type="checkbox" checked={form.IsFeatured} onChange={(event) => setField('IsFeatured', event.target.checked)} /> Mark as Featured Destination</label>
        <div className="ats-form-actions"><Link to="/admin/spots" className="ktg-button ktg-button-secondary">Cancel</Link><button className="ktg-button" type="submit" disabled={saving || savingLookup}>{editing ? 'Save Changes' : 'Save Tourist Spot'}</button></div>
      </form>
    </div>
  )
}
