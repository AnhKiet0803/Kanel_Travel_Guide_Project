import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/home/SearchBar.css';

const services = [
  { id: 'destinations', label: 'Destinations', icon: 'geo-alt', placeholder: 'City or destination' },
  { id: 'tours', label: 'Tours', icon: 'compass', placeholder: 'Tour name or destination' },
  { id: 'hotels', label: 'Hotels', icon: 'building', placeholder: 'City or hotel name' },
  { id: 'restaurants', label: 'Restaurants', icon: 'cup-hot', placeholder: 'City or restaurant name' },
  { id: 'resorts', label: 'Resorts', icon: 'sun', placeholder: 'City or resort name' },
  { id: 'transport', label: 'Transportation', icon: 'bus-front', placeholder: 'Departure city' },
];

export default function SearchBar() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('destinations');
  const [keyword, setKeyword] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(2);
  const current = services.find((item) => item.id === category);
  const needsDate = ['tours', 'hotels', 'resorts', 'transport'].includes(category);
  const needsGuests = ['hotels', 'resorts'].includes(category);
  const needsArrival = category === 'transport';

  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('search', keyword.trim());
    if (needsArrival && destination.trim()) params.set('destination', destination.trim());
    if (needsDate && date) params.set('date', date);
    if (needsGuests) params.set('guests', String(guests));
    const query = params.toString();
    navigate(`/${category}${query ? `?${query}` : ''}`);
  }

  return (
    <section className="home-search-section" aria-label="Find travel services">
      <div className="container">
        <div className="home-search-panel">
          <div className="home-search-tabs" role="group" aria-label="Choose a service">
            {services.map((service) => (
              <button key={service.id} type="button"
                className={`home-search-tab ${category === service.id ? 'is-active' : ''}`}
                aria-pressed={category === service.id}
                onClick={() => { setCategory(service.id); setKeyword(''); setDestination(''); setDate(''); }}>
                <i className={`bi bi-${service.icon}`} aria-hidden="true" />
                <span>{service.label}</span>
              </button>
            ))}
          </div>
          <form className="home-search-form" onSubmit={handleSearch}>
            <div className="home-search-input-group home-search-primary">
              <label htmlFor="travel-keyword">{needsArrival ? 'From' : 'Where to?'}</label>
              <div className="home-search-control">
                <i className="bi bi-geo-alt" aria-hidden="true" />
                <input id="travel-keyword" type="search" value={keyword}
                  onChange={(event) => setKeyword(event.target.value)} placeholder={current.placeholder} />
              </div>
            </div>
            {needsArrival && (
              <div className="home-search-input-group home-search-secondary">
                <label htmlFor="travel-destination">To</label>
                <div className="home-search-control">
                  <i className="bi bi-geo" aria-hidden="true" />
                  <input id="travel-destination" value={destination}
                    onChange={(event) => setDestination(event.target.value)} placeholder="Arrival city" />
                </div>
              </div>
            )}
            {needsDate && (
              <div className="home-search-input-group home-search-secondary">
                <label htmlFor="travel-date">{category === 'transport' ? 'Departure date' : 'Travel / check-in date'}</label>
                <div className="home-search-control">
                  <i className="bi bi-calendar3" aria-hidden="true" />
                  <input id="travel-date" type="date" value={date}
                    onChange={(event) => setDate(event.target.value)} />
                </div>
              </div>
            )}
            {needsGuests && (
              <div className="home-search-input-group home-search-guests">
                <label htmlFor="travel-guests">Guests</label>
                <div className="home-search-control">
                  <i className="bi bi-people" aria-hidden="true" />
                  <select id="travel-guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}
                  </select>
                </div>
              </div>
            )}
            <button className="home-search-submit-new" type="submit">
              <i className="bi bi-search" aria-hidden="true" /><span>Search</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
