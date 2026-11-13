// CN19: Admin Management for Stay & Dining (Hotels, Restaurants, Resorts)
import { useEffect, useState } from 'react'
import {
  getServices,
  getLocations,
  createService,
  updateService,
  deleteService,
  createServiceItem,
  updateServiceItem,
  deleteServiceItem,
  getServiceById,
} from '../../api/servicesApi.js'
import '../../components/admin.css'

const EMPTY_PROVIDER = {
  providerName: '',
  serviceType: 'Hotel',
  locationId: 1,
  starRating: 4,
  address: '',
  phone: '',
  website: '',
  minPrice: 500000,
  maxPrice: 2000000,
  description: '',
  imageUrl: '',
  isActive: true,
}

const EMPTY_ITEM = {
  itemName: '',
  capacity: 2,
  price: 500000,
  totalQuantity: 10,
  isAvailable: true,
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState([])
  const [locations, setLocations] = useState([])
  const [filterType, setFilterType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit / Add Provider Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState(null)
  const [providerForm, setProviderForm] = useState(EMPTY_PROVIDER)
  const [savingProvider, setSavingProvider] = useState(false)

  // Manage Items Modal
  const [managingProvider, setManagingProvider] = useState(null)
  const [itemForm, setItemForm] = useState(EMPTY_ITEM)
  const [editingItemId, setEditingItemId] = useState(null)
  const [savingItem, setSavingItem] = useState(false)

  useEffect(() => {
    getLocations()
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setLocations(list)
        if (list.length > 0) {
          EMPTY_PROVIDER.locationId = list[0].locationId
        }
      })
      .catch(() => {})
    loadProviders()
  }, [filterType])

  async function loadProviders() {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filterType) params.type = filterType
      const data = await getServices(params)
      setProviders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load providers.')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenCreate() {
    setEditingProvider(null)
    setProviderForm({
      ...EMPTY_PROVIDER,
      locationId: locations[0]?.locationId || 1,
    })
    setShowEditModal(true)
  }

  async function handleOpenEdit(p) {
    setEditingProvider(p)
    try {
      const full = await getServiceById(p.providerId)
      setProviderForm({
        providerName: full.providerName,
        serviceType: full.serviceType,
        locationId: full.locationId,
        starRating: full.starRating || 3,
        address: full.address || '',
        phone: full.phone || '',
        website: full.website || '',
        minPrice: full.minPrice || 0,
        maxPrice: full.maxPrice || 0,
        description: full.description || '',
        imageUrl: full.imageUrl || '',
        isActive: full.isActive !== false,
      })
      setShowEditModal(true)
    } catch {
      alert('Failed to load provider details.')
    }
  }

  async function handleSaveProvider(e) {
    e.preventDefault()
    setSavingProvider(true)
    try {
      const payload = {
        ...providerForm,
        locationId: parseInt(providerForm.locationId),
        starRating: parseInt(providerForm.starRating),
        minPrice: parseFloat(providerForm.minPrice) || null,
        maxPrice: parseFloat(providerForm.maxPrice) || null,
      }

      if (editingProvider) {
        await updateService(editingProvider.providerId, payload)
      } else {
        await createService(payload)
      }
      setShowEditModal(false)
      loadProviders()
    } catch (err) {
      alert(err.message || 'Error saving provider.')
    } finally {
      setSavingProvider(false)
    }
  }

  async function handleDeleteProvider(id) {
    if (!window.confirm('Are you sure you want to delete this provider?')) return
    try {
      await deleteService(id)
      loadProviders()
    } catch (err) {
      alert(err.message || 'Failed to delete provider.')
    }
  }

  // Manage Items
  async function handleOpenManageItems(p) {
    try {
      const full = await getServiceById(p.providerId)
      setManagingProvider(full)
      setItemForm(EMPTY_ITEM)
      setEditingItemId(null)
    } catch {
      alert('Could not fetch items.')
    }
  }

  async function handleSaveItem(e) {
    e.preventDefault()
    if (!managingProvider) return
    setSavingItem(true)
    try {
      const payload = {
        ...itemForm,
        capacity: parseInt(itemForm.capacity) || 1,
        price: parseFloat(itemForm.price) || 0,
        totalQuantity: parseInt(itemForm.totalQuantity) || 1,
      }

      if (editingItemId) {
        await updateServiceItem(managingProvider.providerId, editingItemId, payload)
      } else {
        await createServiceItem(managingProvider.providerId, payload)
      }

      // Reload provider details
      const updated = await getServiceById(managingProvider.providerId)
      setManagingProvider(updated)
      setItemForm(EMPTY_ITEM)
      setEditingItemId(null)
    } catch (err) {
      alert(err.message || 'Error saving item.')
    } finally {
      setSavingItem(false)
    }
  }

  async function handleDeleteItem(itemId) {
    if (!window.confirm('Delete this room/table item?')) return
    try {
      await deleteServiceItem(managingProvider.providerId, itemId)
      const updated = await getServiceById(managingProvider.providerId)
      setManagingProvider(updated)
    } catch (err) {
      alert(err.message || 'Failed to delete item.')
    }
  }

  function formatPrice(num) {
    if (num == null) return '0 VND'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  return (
    <div className="ktg-admin-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Stay & Dining Management (CN19)</h2>
          <p className="text-muted mb-0">Manage Hotels, Restaurants, Resorts and their Rooms/Tables</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <i className="bi bi-plus-circle me-1"></i> Add New Provider
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-3 d-flex gap-2">
        <button
          className={`btn btn-sm ${!filterType ? 'btn-dark' : 'btn-outline-dark'}`}
          onClick={() => setFilterType('')}
        >
          All
        </button>
        <button
          className={`btn btn-sm ${filterType === 'Hotel' ? 'btn-dark' : 'btn-outline-dark'}`}
          onClick={() => setFilterType('Hotel')}
        >
          Hotels
        </button>
        <button
          className={`btn btn-sm ${filterType === 'Restaurant' ? 'btn-dark' : 'btn-outline-dark'}`}
          onClick={() => setFilterType('Restaurant')}
        >
          Restaurants
        </button>
        <button
          className={`btn btn-sm ${filterType === 'Resort' ? 'btn-dark' : 'btn-outline-dark'}`}
          onClick={() => setFilterType('Resort')}
        >
          Resorts
        </button>
      </div>

      {loading && <p className="text-muted">Loading providers...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Name & Type</th>
                  <th>Destination</th>
                  <th>Rating</th>
                  <th>Price Range</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.providerId}>
                    <td>#{p.providerId}</td>
                    <td>
                      <strong>{p.providerName}</strong>
                      <span className="badge bg-secondary ms-2 text-uppercase">{p.serviceType}</span>
                      <span className="d-block small text-muted">{p.address}</span>
                    </td>
                    <td>{p.locationName}</td>
                    <td>
                      <span className="text-warning">★</span> {p.starRating} / 5
                    </td>
                    <td className="small">
                      {formatPrice(p.minPrice)} - {formatPrice(p.maxPrice)}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-info me-1"
                        onClick={() => handleOpenManageItems(p)}
                        title="Manage Rooms/Tables"
                      >
                        <i className="bi bi-list-check me-1"></i> Rooms/Tables
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => handleOpenEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteProvider(p.providerId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Add Provider Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleSaveProvider}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {editingProvider ? `Edit: ${editingProvider.providerName}` : 'Add Service Provider'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Provider Name *</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        value={providerForm.providerName}
                        onChange={(e) => setProviderForm({ ...providerForm, providerName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Service Type *</label>
                      <select
                        className="form-select"
                        value={providerForm.serviceType}
                        onChange={(e) => setProviderForm({ ...providerForm, serviceType: e.target.value })}
                      >
                        <option value="Hotel">Hotel</option>
                        <option value="Restaurant">Restaurant</option>
                        <option value="Resort">Resort</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Destination *</label>
                      <select
                        className="form-select"
                        value={providerForm.locationId}
                        onChange={(e) => setProviderForm({ ...providerForm, locationId: e.target.value })}
                      >
                        {locations.map((loc) => (
                          <option key={loc.locationId} value={loc.locationId}>
                            {loc.locationName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-8">
                      <label className="form-label small fw-semibold">Address *</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        value={providerForm.address}
                        onChange={(e) => setProviderForm({ ...providerForm, address: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Star Rating (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        className="form-control"
                        value={providerForm.starRating}
                        onChange={(e) => setProviderForm({ ...providerForm, starRating: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={providerForm.phone}
                        onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Website</label>
                      <input
                        type="url"
                        className="form-control"
                        value={providerForm.website}
                        onChange={(e) => setProviderForm({ ...providerForm, website: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Min Price (VND)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={providerForm.minPrice}
                        onChange={(e) => setProviderForm({ ...providerForm, minPrice: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Max Price (VND)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={providerForm.maxPrice}
                        onChange={(e) => setProviderForm({ ...providerForm, maxPrice: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://..."
                        value={providerForm.imageUrl}
                        onChange={(e) => setProviderForm({ ...providerForm, imageUrl: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={providerForm.description}
                        onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="activeCheck"
                          checked={providerForm.isActive}
                          onChange={(e) => setProviderForm({ ...providerForm, isActive: e.target.checked })}
                        />
                        <label className="form-check-label small" htmlFor="activeCheck">
                          Active & Visible on Website
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={savingProvider} className="btn btn-primary">
                    {savingProvider ? 'Saving...' : 'Save Provider'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Items Modal */}
      {managingProvider && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  Manage Rooms / Tables: {managingProvider.providerName}
                </h5>
                <button type="button" className="btn-close" onClick={() => setManagingProvider(null)}></button>
              </div>
              <div className="modal-body">
                {/* Form to Add / Edit item */}
                <form onSubmit={handleSaveItem} className="bg-light p-3 rounded mb-4">
                  <h6 className="fw-bold mb-2">{editingItemId ? 'Edit Item' : 'Add New Room / Table'}</h6>
                  <div className="row g-2 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Item / Room Name *</label>
                      <input
                        type="text"
                        required
                        className="form-control form-control-sm"
                        placeholder="e.g. Deluxe Suite"
                        value={itemForm.itemName}
                        onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small fw-semibold">Capacity</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control form-control-sm"
                        value={itemForm.capacity}
                        onChange={(e) => setItemForm({ ...itemForm, capacity: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Price (VND) *</label>
                      <input
                        type="number"
                        required
                        className="form-control form-control-sm"
                        value={itemForm.price}
                        onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3 d-flex gap-2">
                      <button type="submit" disabled={savingItem} className="btn btn-sm btn-primary w-100">
                        {savingItem ? 'Saving...' : editingItemId ? 'Update' : 'Add Item'}
                      </button>
                      {editingItemId && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setEditingItemId(null)
                            setItemForm(EMPTY_ITEM)
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                {/* Items List */}
                <h6 className="fw-bold mb-2">Current Items List</h6>
                {!managingProvider.items || managingProvider.items.length === 0 ? (
                  <p className="text-muted small">No items added yet.</p>
                ) : (
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Item Name</th>
                        <th>Capacity</th>
                        <th>Price</th>
                        <th>Available</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {managingProvider.items.map((it) => (
                        <tr key={it.itemId}>
                          <td>{it.itemName}</td>
                          <td>{it.capacity} persons</td>
                          <td>{formatPrice(it.price)}</td>
                          <td>
                            <span className={`badge ${it.isAvailable ? 'bg-success' : 'bg-secondary'}`}>
                              {it.isAvailable ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary py-0 px-2 me-1"
                              onClick={() => {
                                setEditingItemId(it.itemId)
                                setItemForm({
                                  itemName: it.itemName,
                                  capacity: it.capacity,
                                  price: it.price,
                                  totalQuantity: it.totalQuantity || 1,
                                  isAvailable: it.isAvailable !== false,
                                })
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger py-0 px-2"
                              onClick={() => handleDeleteItem(it.itemId)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setManagingProvider(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
