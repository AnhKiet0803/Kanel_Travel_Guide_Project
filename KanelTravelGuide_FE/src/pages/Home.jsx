import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import SearchBar from '../components/home/SearchBar';
import ServicesSection from '../components/home/ServicesSection';
import DestinationsSection from '../components/home/DestinationsSection';
import FeaturedTours from '../components/home/FeaturedTours';
import OffersSection from '../components/home/OffersSection';
import WhyChooseUs from '../components/home/WhyChooseUs';
import HomeCTA from '../components/home/HomeCTA';
import '../styles/home/Home.css';
import '../styles/home/SearchBar.css';

export default function Home() {
  const { hash } = useLocation();

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
      <DestinationsSection />
      <FeaturedTours />
      <OffersSection />
      <WhyChooseUs />
      <HomeCTA />
    </div>
  );
}
