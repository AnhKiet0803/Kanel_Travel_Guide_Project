// CN20: Admin Management for Routes & Vehicles
import { useEffect, useState } from 'react'
import {
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../../api/transportApi.js'
import { getLocations } from '../../api/servicesApi.js'
import '../../components/admin.css'

export default function AdminTransportPage() {
  const [activeTab, setActiveTab] = useState('routes') // 'routes' | 'vehicles' | 'schedules'
  const [locations, setLocations] = useState([])

  // Data lists
  const [routes, setRoutes] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  // Forms & Modals
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Route form
  const [routeForm, setRouteForm] = useState({
    departureLocationId: 1,
    destinationLocationId: 2,
    distanceKm: 100,
    estimatedDuration: '2 hours',
  })

  // Vehicle form
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleType: 'Bus',
    totalSeats: 29,
    driverName: '',
    driverPhone: '',
  })

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    routeId: 1,
    vehicleId: 1,
    departureTime: '08:00',
    arrivalTime: '11:00',
    ticketPrice: 200000,
    availableSeats: 29,
    status: 'Running',
  })

  useEffect(() => {
    getLocations()
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => {})
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    try {
      const [r, v, s] = await Promise.all([
        getRoutes().catch(() => []),
        getVehicles().catch(() => []),
        getSchedules().catch(() => []),
      ])
      setRoutes(Array.isArray(r) ? r : [])
      setVehicles(Array.isArray(v) ? v : [])
      setSchedules(Array.isArray(s) ? s : [])
    } finally {
      setLoading(false)
    }
  }

  // Route CRUD
  function openRouteModal(item = null) {
    setEditingId(item ? item.routeId : null)
    if (item) {
      setRouteForm({
        departureLocationId: item.departureLocationId,
        destinationLocationId: item.destinationLocationId,
        distanceKm: item.distanceKm || 0,
        estimatedDuration: item.estimatedDuration || '',
      })
    } else {
      setRouteForm({
        departureLocationId: locations[0]?.locationId || 1,
        destinationLocationId: locations[1]?.locationId || 2,
        distanceKm: 100,
        estimatedDuration: '2 hours',
      })
    }
    setShowModal(true)
  }

  async function handleSaveRoute(e) {
    e.preventDefault()
    try {
      const payload = {
        ...routeForm,
        departureLocationId: parseInt(routeForm.departureLocationId),
        destinationLocationId: parseInt(routeForm.destinationLocationId),
        distanceKm: parseFloat(routeForm.distanceKm) || null,
      }
      if (editingId) {
        await updateRoute(editingId, payload)
      } else {
        await createRoute(payload)
      }
      setShowModal(false)
      loadAllData()
    } catch (err) {
      alert(err.message || 'Error saving route.')
    }
  }

  async function handleDeleteRoute(id) {
    if (!window.confirm('Delete this transport route?')) return
    try {
      await deleteRoute(id)
      loadAllData()
    } catch (err) {
      alert(err.message || 'Failed to delete route.')
    }
  }

  // Vehicle CRUD
  function openVehicleModal(item = null) {
    setEditingId(item ? item.vehicleId : null)
    if (item) {
      setVehicleForm({
        vehicleNumber: item.vehicleNumber,
        vehicleType: item.vehicleType,
        totalSeats: item.totalSeats,
        driverName: item.driverName || '',
        driverPhone: item.driverPhone || '',
      })
    } else {
      setVehicleForm({
        vehicleNumber: '',
        vehicleType: 'Bus',
        totalSeats: 29,
        driverName: '',
        driverPhone: '',
      })
    }
    setShowModal(true)
  }

  async function handleSaveVehicle(e) {
    e.preventDefault()
    try {
      const payload = {
        ...vehicleForm,
        totalSeats: parseInt(vehicleForm.totalSeats) || 10,
      }
      if (editingId) {
        await updateVehicle(editingId, payload)
      } else {
        await createVehicle(payload)
      }
      setShowModal(false)
      loadAllData()
    } catch (err) {
      alert(err.message || 'Error saving vehicle.')
    }
  }

  async function handleDeleteVehicle(id) {
    if (!window.confirm('Delete this vehicle?')) return
    try {
      await deleteVehicle(id)
      loadAllData()
    } catch (err) {
      alert(err.message || 'Failed to delete vehicle.')
    }
  }

  // Schedule CRUD
  function openScheduleModal(item = null) {
    setEditingId(item ? item.scheduleId : null)
    if (item) {
      setScheduleForm({
        routeId: item.routeId,
        vehicleId: item.vehicleId,
        departureTime: item.departureTime || '',
        arrivalTime: item.arrivalTime || '',
        ticketPrice: item.ticketPrice || 0,
        availableSeats: item.availableSeats || 0,
        status: item.status || 'Running',
      })
    } else {
      setScheduleForm({
        routeId: routes[0]?.routeId || 1,
        vehicleId: vehicles[0]?.vehicleId || 1,
        departureTime: '08:00',
        arrivalTime: '11:00',
        ticketPrice: 200000,
        availableSeats: 29,
        status: 'Running',
      })
    }
    setShowModal(true)
  }

  async function handleSaveSchedule(e) {
    e.preventDefault()
    try {
      const payload = {
        ...scheduleForm,
        routeId: parseInt(scheduleForm.routeId),
        vehicleId: parseInt(scheduleForm.vehicleId),
        ticketPrice: parseFloat(scheduleForm.ticketPrice) || 0,
        availableSeats: parseInt(scheduleForm.availableSeats) || 0,
      }
      if (editingId) {
        await updateSchedule(editingId, payload)
      } else {
        await createSchedule(payload)
      }
      setShowModal(false)
      loadAllData()
    } catch (err) {
      alert(err.message || 'Error saving schedule.')
    }
  }

  async function handleDeleteSchedule(id) {
    if (!window.confirm('Delete this schedule?')) return
    try {
      await deleteSchedule(id)
      loadAllData()
    } catch (err) {
      alert(err.message || 'Failed to delete schedule.')
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
          <h2 className="fw-bold mb-1">Routes & Vehicles Management (CN20)</h2>
          <p className="text-muted mb-0">Manage Intercity Routes, Vehicles Fleet, and Departure Schedules</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (activeTab === 'routes') openRouteModal()
            else if (activeTab === 'vehicles') openVehicleModal()
            else openScheduleModal()
          }}
        >
          <i className="bi bi-plus-circle me-1"></i> Add New{' '}
          {activeTab === 'routes' ? 'Route' : activeTab === 'vehicles' ? 'Vehicle' : 'Schedule'}
        </button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'routes' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            <i className="bi bi-signpost-split me-1"></i> Routes ({routes.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'vehicles' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            <i className="bi bi-bus-front me-1"></i> Vehicles ({vehicles.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'schedules' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('schedules')}
          >
            <i className="bi bi-clock-history me-1"></i> Schedules ({schedules.length})
          </button>
        </li>
      </ul>

      {loading && <p className="text-muted">Loading data...</p>}

      {/* TAB 1: ROUTES */}
      {!loading && activeTab === 'routes' && (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Route ID</th>
                  <th>Departure</th>
                  <th>Destination</th>
                  <th>Distance</th>
                  <th>Est. Duration</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.routeId}>
                    <td>#{r.routeId}</td>
                    <td>
                      <strong>{r.departureLocationName}</strong>
                    </td>
                    <td>
                      <strong>{r.destinationLocationName}</strong>
                    </td>
                    <td>{r.distanceKm ? `${r.distanceKm} km` : 'N/A'}</td>
                    <td>{r.estimatedDuration || 'N/A'}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openRouteModal(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteRoute(r.routeId)}
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

      {/* TAB 2: VEHICLES */}
      {!loading && activeTab === 'vehicles' && (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Vehicle ID</th>
                  <th>Plate Number</th>
                  <th>Type</th>
                  <th>Total Seats</th>
                  <th>Driver Name</th>
                  <th>Driver Phone</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.vehicleId}>
                    <td>#{v.vehicleId}</td>
                    <td>
                      <span className="badge bg-dark fs-6">{v.vehicleNumber}</span>
                    </td>
                    <td>{v.vehicleType}</td>
                    <td>{v.totalSeats} seats</td>
                    <td>{v.driverName || 'N/A'}</td>
                    <td>{v.driverPhone || 'N/A'}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openVehicleModal(v)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteVehicle(v.vehicleId)}
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

      {/* TAB 3: SCHEDULES */}
      {!loading && activeTab === 'schedules' && (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Schedule ID</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Times</th>
                  <th>Ticket Price</th>
                  <th>Available Seats</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.scheduleId}>
                    <td>#{s.scheduleId}</td>
                    <td>
                      {s.departureLocationName} ➔ {s.destinationLocationName}
                    </td>
                    <td>
                      <span className="badge bg-secondary">{s.vehicleNumber}</span> ({s.vehicleType})
                    </td>
                    <td>
                      <i className="bi bi-clock me-1"></i>
                      {s.departureTime} - {s.arrivalTime}
                    </td>
                    <td className="fw-bold text-primary">{formatPrice(s.ticketPrice)}</td>
                    <td>{s.availableSeats}</td>
                    <td>
                      <span
                        className={`badge ${
                          s.status === 'Running' ? 'bg-success' : 'bg-warning text-dark'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openScheduleModal(s)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteSchedule(s.scheduleId)}
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

      {/* MODAL */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              {/* Route Form */}
              {activeTab === 'routes' && (
                <form onSubmit={handleSaveRoute}>
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">
                      {editingId ? 'Edit Route' : 'Add New Route'}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Departure Destination *</label>
                      <select
                        className="form-select"
                        value={routeForm.departureLocationId}
                        onChange={(e) => setRouteForm({ ...routeForm, departureLocationId: e.target.value })}
                      >
                        {locations.map((loc) => (
                          <option key={loc.locationId} value={loc.locationId}>
                            {loc.locationName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Destination *</label>
                      <select
                        className="form-select"
                        value={routeForm.destinationLocationId}
                        onChange={(e) => setRouteForm({ ...routeForm, destinationLocationId: e.target.value })}
                      >
                        {locations.map((loc) => (
                          <option key={loc.locationId} value={loc.locationId}>
                            {loc.locationName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="row g-2">
                      <div className="col-md-6 mb-3">
                        <label className="form-label small fw-semibold">Distance (km)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={routeForm.distanceKm}
                          onChange={(e) => setRouteForm({ ...routeForm, distanceKm: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small fw-semibold">Estimated Duration</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 2 hours 30 mins"
                          value={routeForm.estimatedDuration}
                          onChange={(e) => setRouteForm({ ...routeForm, estimatedDuration: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Route
                    </button>
                  </div>
                </form>
              )}

              {/* Vehicle Form */}
              {activeTab === 'vehicles' && (
                <form onSubmit={handleSaveVehicle}>
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">
                      {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Plate Number *</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        placeholder="e.g. 29B-123.45"
                        value={vehicleForm.vehicleNumber}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                      />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Vehicle Type</label>
                        <select
                          className="form-select"
                          value={vehicleForm.vehicleType}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                        >
                          <option value="Bus">Bus</option>
                          <option value="Limousine">Limousine</option>
                          <option value="Tourist Coach">Tourist Coach</option>
                          <option value="Minivan">Minivan</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Total Seats</label>
                        <input
                          type="number"
                          className="form-control"
                          value={vehicleForm.totalSeats}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, totalSeats: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="row g-2">
                      <div className="col-md-6 mb-3">
                        <label className="form-label small fw-semibold">Driver Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={vehicleForm.driverName}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small fw-semibold">Driver Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={vehicleForm.driverPhone}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Vehicle
                    </button>
                  </div>
                </form>
              )}

              {/* Schedule Form */}
              {activeTab === 'schedules' && (
                <form onSubmit={handleSaveSchedule}>
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">
                      {editingId ? 'Edit Schedule' : 'Add New Schedule'}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Route *</label>
                      <select
                        className="form-select"
                        value={scheduleForm.routeId}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, routeId: e.target.value })}
                      >
                        {routes.map((r) => (
                          <option key={r.routeId} value={r.routeId}>
                            {r.departureLocationName} ➔ {r.destinationLocationName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Vehicle *</label>
                      <select
                        className="form-select"
                        value={scheduleForm.vehicleId}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, vehicleId: e.target.value })}
                      >
                        {vehicles.map((v) => (
                          <option key={v.vehicleId} value={v.vehicleId}>
                            {v.vehicleNumber} ({v.vehicleType} - {v.totalSeats} seats)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Departure Time</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 08:00"
                          value={scheduleForm.departureTime}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, departureTime: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Arrival Time</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 11:30"
                          value={scheduleForm.arrivalTime}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, arrivalTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Ticket Price (VND)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={scheduleForm.ticketPrice}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, ticketPrice: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Available Seats</label>
                        <input
                          type="number"
                          className="form-control"
                          value={scheduleForm.availableSeats}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, availableSeats: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Status</label>
                      <select
                        className="form-select"
                        value={scheduleForm.status}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.value })}
                      >
                        <option value="Running">Running</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Schedule
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
