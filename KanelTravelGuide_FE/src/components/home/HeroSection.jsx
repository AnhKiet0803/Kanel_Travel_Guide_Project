import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-overlay" />
      <div className="container home-hero-content">
        <span className="home-eyebrow home-eyebrow-light">YOUR NEXT JOURNEY STARTS HERE</span>
        <h1 id="home-hero-title">Discover places.<br /><em>Create memories.</em></h1>
        <p>From remarkable destinations to unforgettable experiences, find everything you need for your next adventure.</p>
        <div className="home-hero-actions">
          <Link className="home-btn home-btn-primary" to="/destinations">Explore destinations <i className="bi bi-arrow-up-right" /></Link>
          <Link className="home-btn home-btn-outline" to="/tours">Browse tours <i className="bi bi-arrow-right" /></Link>
        </div>
      </div>
    </section>
  );
}
