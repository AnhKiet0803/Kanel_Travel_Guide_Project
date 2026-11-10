// CN03: About Us page.
// Content follows the project brief: company information and the services offered
// (transport, tour packages, accommodation, dining, resorts).
import './pages.css'

const SERVICES = [
  {
    title: 'Tours & combos',
    text: 'All-inclusive tour packages and combos to popular destinations, with clear itineraries and special prices.',
  },
  {
    title: 'Intercity transport',
    text: 'Limousine, sleeper and tourist coach routes connecting cities and provinces, with transparent schedules and fares.',
  },
  {
    title: 'Hotels',
    text: 'A hotel directory by area, star rating and price range, so you can compare and choose with ease.',
  },
  {
    title: 'Restaurants',
    text: 'Restaurant and local specialty recommendations, with addresses and indicative prices.',
  },
  {
    title: 'Resorts',
    text: 'Resorts and retreats with room types, capacity and availability.',
  },
]

const REASONS = [
  'All travel, transport and accommodation information in one place.',
  'Search and filter by location, price, quality and availability.',
  'Send tour and transport booking requests online and track your orders.',
  'Our advisory team is ready to help through the Contact Us page.',
]

export default function AboutPage() {
  return (
    <main className="ktg-page">
      <header className="ktg-page-header">
        <h1>About Karnel Travel Guide</h1>
        <p>
          Karnel Travels is a travel company offering sightseeing tours, intercity transport,
          hotels, restaurants and resorts. The Karnel Travel Guide website helps you find
          information and send service booking requests conveniently.
        </p>
      </header>

      <section aria-labelledby="about-services">
        <h2 id="about-services">Our Services</h2>
        <div className="ktg-grid">
          {SERVICES.map((service) => (
            <article key={service.title} className="ktg-card">
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="about-reasons">
        <h2 id="about-reasons">Why Choose Karnel Travel Guide</h2>
        <ul className="ktg-list">
          {REASONS.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}
