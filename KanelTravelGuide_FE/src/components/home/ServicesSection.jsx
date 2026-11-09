import { Link } from 'react-router-dom';
import { services } from './HomeData';

export default function ServicesSection() {
  return (
    <section className="home-section home-services" aria-labelledby="home-services-title">
      <div className="container">
        <div className="home-section-heading home-centered">
          <span className="home-eyebrow">EVERYTHING IN ONE PLACE</span>
          <h2 id="home-services-title">Travel your way</h2>
          <p>Explore the services that make every journey easier and more memorable.</p>
        </div>

        <div className="home-services-grid">
          {services.map((service) => (
            <Link key={service.name} to={service.to} className="home-service-card"
                  aria-label={`Explore ${service.name}`}>
              <img src={service.image} alt="" loading="lazy"
                   onError={(event) => {
                     event.currentTarget.onerror = null;
                     event.currentTarget.src = '/images/services/fallback.jpg';
                   }} />
              <span className="home-service-shade" aria-hidden="true" />
              <span className="home-service-arrow" aria-hidden="true">
                <i className="bi bi-arrow-up-right" />
              </span>
              <div className="home-service-info">
                <h3>{service.name}</h3>
                <p>{service.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
