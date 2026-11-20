import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import SearchBar from '../components/home/SearchBar';
import ServicesSection from '../components/home/ServicesSection';
import DestinationsSection from '../components/home/DestinationsSection';
import FeaturedTours from '../components/home/FeaturedTours';
import OffersSection from '../components/home/OffersSection';
import WhyChooseUs from '../components/home/WhyChooseUs';
import HomeCTA from '../components/home/HomeCTA';
import { listSpots } from '../api/touristSpotsApi.js';
import { tourService } from '../services/tourService.js';
import '../styles/home/Home.css';
import '../styles/home/SearchBar.css';

export default function Home() {
  const { hash } = useLocation();
  const [spots, setSpots] = useState(null);
  const [tours, setTours] = useState(null);

  useEffect(() => {
    let active = true;
    const loadSpots = listSpots();
    loadSpots.then(items => { if (active) setSpots({ items }); })
      .catch(error => { if (active) setSpots({ error: error.message }); });
    tourService.list({ isFeatured: true }, loadSpots)
      .then(items => { if (active) setTours({ items }); })
      .catch(error => { if (active) setTours({ error: error.message }); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (hash === '#home-search') {
      document.getElementById('home-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [hash]);

  return (
    <div className="karnel-home">
      <HeroSection />
      <SearchBar />
      <ServicesSection />
      <DestinationsSection result={spots} />
      <FeaturedTours result={tours} />
      <OffersSection />
      <WhyChooseUs />
      <HomeCTA />
    </div>
  );
}
