import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminListBookings } from '../../api/bookingApi.js'
import { money } from '../../services/tourService.js'
import '../../styles/admin/AdminOverview.css'

const bookingDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short' })
const shortDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const serviceNames = new Map([['Tour', 'Guided tours'], ['Transport', 'Transportation'], ['Service', 'Stay & dining'], ['Combo', 'Combos']])

function BookingCharts({ bookings }) {
  const [days, setDays] = useState(7)
  const today = new Date(bookingDay.format(new Date()) + 'T00:00:00Z')
  const dates = Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setUTCDate(date.getUTCDate() - days + 1 + index)
    return { key: date.toISOString().slice(0, 10), label: shortDay.format(date), count: 0 }
  })
  const countsByDay = new Map(dates.map(date => [date.key, date]))
  const serviceCounts = new Map()
  let total = 0
  for (const booking of bookings) {
    if (!booking.bookingDate) continue
    const stamp = booking.bookingDate
    const instant = new Date(/(?:Z|[+-]\d\d:\d\d)$/i.test(stamp) ? stamp : stamp + 'Z')
    if (!Number.isFinite(instant.getTime())) continue
    const day = countsByDay.get(bookingDay.format(instant))
    if (!day) continue

    day.count += 1
    total += 1
    const label = serviceNames.get(booking.bookingType) ?? booking.bookingType ?? 'Other'
    serviceCounts.set(label, (serviceCounts.get(label) ?? 0) + 1)
  }
  const services = [...serviceCounts].sort((a, b) => b[1] - a[1])
  const peak = Math.max(1, ...dates.map(date => date.count))

  return (
    <section className="mb-4" aria-label="Booking charts">
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
        <h2 className="h5 fw-bold mb-0">Booking activity</h2>
        <select className="form-select form-select-sm w-auto" aria-label="Booking activity period" value={days}
          onChange={event => setDays(Number(event.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>
      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 h-100 p-3 p-sm-4">
            <h3 className="h6 fw-bold mb-1">Bookings by day</h3>
            <p className="text-muted small mb-3" role="status">{total} bookings in the last {days} days · Vietnam time</p>
            <ul className="overview-day-chart list-unstyled mb-0" style={{ '--overview-days': days }} aria-label="Daily booking counts">
              {dates.map((date, index) => (
                <li className="overview-day" key={date.key} title={date.label + ' · ' + date.count + ' bookings'}>
                  <span className="visually-hidden">{date.label}, {date.count} bookings</span>
                  <div className="overview-plot" aria-hidden="true">
                    {date.count > 0 && <div className="overview-bar" style={{ '--overview-size': date.count / peak * 100 + '%' }}>
                      <span className="overview-count">{date.count}</span>
                    </div>}
                  </div>
                  <span className="overview-date small text-muted" aria-hidden="true">
                    {(index === 0 || index === dates.length - 1 || index === Math.floor(dates.length / 2)) && date.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 h-100 p-3 p-sm-4">
            <h3 className="h6 fw-bold mb-3">Bookings by service</h3>
            {!services.length ? <p className="small text-muted mb-0">No bookings in this period.</p> : (
              <ul className="list-unstyled d-grid gap-3 mb-0">
                {services.map(([label, count]) => (
                  <li key={label}>
                    <div className="d-flex justify-content-between gap-2 small mb-1">
                      <span>{label}</span>
                      <strong>{count} <span className="fw-normal text-muted">({Math.round(count / total * 100)}%)</span></strong>
                    </div>
                    <div className="overview-service-track" aria-hidden="true">
                      <div style={{ width: count / total * 100 + '%' }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AdminOverviewPage() {
  const [result, setResult] = useState(null)

  useEffect(() => {
    let active = true
    adminListBookings()
      .then(bookings => { if (active) setResult({ bookings }) })
      .catch(error => { if (active) setResult({ error: error.message }) })
    return () => { active = false }
  }, [])

  const bookings = result?.bookings ?? []
  const paid = bookings.filter(booking => booking.paymentStatus === 'Paid')
  const stats = [
    { label: 'Total bookings', value: bookings.length },
    { label: 'Pending confirmation', value: bookings.filter(booking => booking.bookingStatus === 'Pending').length },
    { label: 'Paid bookings', value: paid.length },
    { label: 'Total amount marked paid', value: money(paid.reduce((total, booking) => total + booking.totalAmount, 0)) },
  ]
  const recent = bookings.slice(0, 5)

  return (
    <div className="ktg-admin-page">
      <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold h2 mb-1">Overview</h1>
          <p className="text-muted mb-0">Booking and payment activity across all services.</p>
        </div>
        <Link className="btn btn-primary" to="/admin/bookings">Manage bookings</Link>
      </header>

      {!result && <p role="status" className="text-muted">Loading booking activity…</p>}
      {result?.error && <p role="alert" className="alert alert-danger">{result.error}</p>}

      {result?.bookings && (
        <>
          <section aria-label="Booking totals" className="row g-3 mb-4">
            {stats.map(({ label, value }) => (
              <div className="col-sm-6 col-xl-3" key={label}>
                <div className="card shadow-sm h-100 border-0">
                  <dl className="card-body mb-0">
                    <dt className="small text-muted mb-2">{label}</dt>
                    <dd className="fs-4 fw-bold mb-0">{value}</dd>
                  </dl>
                </div>
              </div>
            ))}
          </section>

          <BookingCharts bookings={bookings} />

          <section className="card border-0 shadow-sm" aria-labelledby="recent-bookings">
            <h2 className="h5 fw-bold p-3 mb-0" id="recent-bookings">Recent bookings</h2>
            {recent.length === 0 ? <p className="text-muted px-3">No bookings yet.</p> : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Booking Code</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Type</th>
                      <th scope="col">Status</th>
                      <th scope="col">Payment</th>
                      <th scope="col" className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(booking => (
                      <tr key={booking.bookingId}>
                        <th scope="row">{booking.bookingCode}</th>
                        <td>{booking.customerName}</td>
                        <td>{booking.bookingType}</td>
                        <td>{booking.bookingStatus}</td>
                        <td>{booking.paymentStatus}</td>
                        <td className="text-end text-nowrap">{money(booking.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
