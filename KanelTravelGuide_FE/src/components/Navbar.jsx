
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

const services = [
    {
        label: 'Destinations',
        description: 'Explore amazing places',
        icon: 'bi-geo-alt',
        path: '/destinations',
        category: 'experiences',
    },
    {
        label: 'Tours',
        description: 'Discover guided experiences',
        icon: 'bi-airplane',
        path: '/tours',
        category: 'experiences',
    },
    {
        label: 'Hotels',
        description: 'Find your perfect stay',
        icon: 'bi-building',
        path: '/hotels',
        category: 'accommodation',
    },
    {
        label: 'Restaurants',
        description: 'Explore local dining',
        icon: 'bi-cup-hot',
        path: '/restaurants',
        category: 'accommodation',
    },
    {
        label: 'Resorts',
        description: 'Relax in beautiful resorts',
        icon: 'bi-tree',
        path: '/resorts',
        category: 'accommodation',
    },
    {
        label: 'Transportation',
        description: 'Routes and schedules',
        icon: 'bi-bus-front',
        path: '/transport',
        category: 'transport',
    },
];

const bookings = [
    {
        label: 'Book a Tour',
        description: 'Plan your next adventure',
        icon: 'bi-calendar2-check',
        path: '/tours/booking',
        category: 'new',
    },
    {
        label: 'Book Transport',
        description: 'Reserve your transportation',
        icon: 'bi-bus-front',
        path: '/transport/booking',
        category: 'new',
    },
    {
        label: 'My Bookings',
        description: 'Manage your reservations',
        icon: 'bi-ticket-perforated',
        path: '/my-bookings',
        category: 'manage',
    },
    {
        label: 'Booking History',
        description: 'View your past journeys',
        icon: 'bi-clock-history',
        path: '/booking-history',
        category: 'manage',
    },
];

const menuGroups = {
    Services: {
        title: 'Explore Our Services',
        subtitle: 'Everything you need for your perfect journey',
        items: services,
        categories: [
            { id: 'all', label: 'All Services' },
            { id: 'experiences', label: 'Travel Experiences' },
            { id: 'accommodation', label: 'Accommodation' },
            { id: 'transport', label: 'Transportation' },
        ],
    },
    Bookings: {
        title: 'Manage Your Journey',
        subtitle: 'Plan, book and manage your travel experiences',
        items: bookings,
        categories: [
            { id: 'all', label: 'All Bookings' },
            { id: 'new', label: 'New Booking' },
            { id: 'manage', label: 'My Trips' },
        ],
    },
};

const mainLinks = [
    //{ label: 'Home', path: '/' },
    { label: 'About Us', path: '/about' },
    { label: 'Services', menu: true },
    { label: 'Offers', path: '/promotions' },
    { label: 'Bookings', menu: true },
    { label: 'Contact Us', path: '/contact' },
];

function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');

    const navbarRef = useRef(null);
    const location = useLocation();

    const closeAll = () => {
        setActiveMenu(null);
        setActiveCategory('all');
        setMobileOpen(false);
    };

    const toggleMegaMenu = (name) => {
        if (activeMenu === name) {
            setActiveMenu(null);
            setActiveCategory('all');
        } else {
            setActiveMenu(name);
            setActiveCategory('all');
        }
    };

    useEffect(() => {
        setActiveMenu(null);
        setActiveCategory('all');
        setMobileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                navbarRef.current &&
                !navbarRef.current.contains(event.target)
            ) {
                setActiveMenu(null);
                setMobileOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setActiveMenu(null);
                setMobileOpen(false);
            }
        };

        document.addEventListener('pointerdown', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handleOutsideClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const currentMenu = activeMenu
        ? menuGroups[activeMenu]
        : null;

    const visibleItems = currentMenu
        ? currentMenu.items.filter(
            (item) =>
                activeCategory === 'all' ||
                item.category === activeCategory
        )
        : [];

    const isMenuActive = (name) =>
        menuGroups[name].items.some(
            (item) =>
                location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`)
        );

    return (
        <header className="karnel-header" ref={navbarRef}>

            {/* FULL WIDTH NAVBAR */}
            <nav
                className="karnel-navbar"
                aria-label="Main navigation"
            >
                <div className="karnel-nav-inner">

                    {/* LOGO */}
                    <Link
                        to="/"
                        className="karnel-brand"
                        onClick={closeAll}
                    >
                        <span className="karnel-brand-icon">
                            <i className="bi bi-airplane-engines-fill"></i>
                        </span>

                        <span>Karnel Travels</span>
                    </Link>

                    {/* MOBILE TOGGLE */}
                    <button
                        type="button"
                        className="karnel-menu-toggle"
                        aria-label="Toggle navigation"
                        aria-expanded={mobileOpen}
                        aria-controls="karnel-main-menu"
                        onClick={() => {
                            setMobileOpen((previous) => !previous);
                            setActiveMenu(null);
                            setActiveCategory('all');
                        }}
                    >
                        <i
                            className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'
                                }`}
                        ></i>
                    </button>

                    {/* MAIN MENU */}
                    <div
                        id="karnel-main-menu"
                        className={`karnel-menu ${mobileOpen ? 'is-open' : ''
                            }`}
                    >
                        <ul className="karnel-menu-list">
                            {mainLinks.map((item) => (
                                <li
                                    key={item.label}
                                    className="karnel-menu-item"
                                >
                                    {item.menu ? (
                                        <button
                                            type="button"
                                            className={`karnel-menu-link ${activeMenu === item.label ||
                                                    isMenuActive(item.label)
                                                    ? 'active'
                                                    : ''
                                                }`}
                                            aria-expanded={
                                                activeMenu === item.label
                                            }
                                            aria-controls="karnel-mega-panel"
                                            onClick={() =>
                                                toggleMegaMenu(item.label)
                                            }
                                        >
                                            <span>{item.label}</span>

                                            <i
                                                className={`bi bi-chevron-${activeMenu === item.label
                                                        ? 'up'
                                                        : 'down'
                                                    }`}
                                            ></i>
                                        </button>
                                    ) : (
                                        <NavLink
                                            to={item.path}
                                            end={item.path === '/'}
                                            onClick={closeAll}
                                            className={({ isActive }) =>
                                                `karnel-menu-link ${isActive ? 'active' : ''
                                                }`
                                            }
                                        >
                                            {item.label}
                                        </NavLink>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {/* ACTION BUTTONS */}
                        <div className="karnel-nav-actions">

                            <Link
                                to="/search"
                                className="karnel-search-btn"
                                aria-label="Search"
                                onClick={closeAll}
                            >
                                <i className="bi bi-search"></i>
                            </Link>

                            <Link
                                to="/login"
                                className="karnel-signin-btn"
                                onClick={closeAll}
                            >
                                <i className="bi bi-person-circle"></i>
                                <span>Sign In</span>
                            </Link>

                        </div>
                    </div>
                </div>
            </nav>

            {/* FULL WIDTH MEGA MENU */}
            {currentMenu && (
                <div
                    id="karnel-mega-panel"
                    className="karnel-mega-panel"
                >
                    <div className="karnel-mega-container">

                        {/* MEGA HEADER */}
                        <div className="karnel-mega-heading">
                            <div>
                                <h2>{currentMenu.title}</h2>
                                <p>{currentMenu.subtitle}</p>
                            </div>

                            <button
                                type="button"
                                className="karnel-mega-close"
                                aria-label="Close menu"
                                onClick={() => setActiveMenu(null)}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        {/* MEGA BODY */}
                        <div className="karnel-mega-body">

                            {/* LEFT CATEGORIES */}
                            <aside className="karnel-mega-sidebar">
                                {currentMenu.categories.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        className={`karnel-mega-category ${activeCategory === category.id
                                                ? 'active'
                                                : ''
                                            }`}
                                        onClick={() =>
                                            setActiveCategory(category.id)
                                        }
                                    >
                                        <span>{category.label}</span>
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                ))}
                            </aside>

                            {/* RIGHT SERVICES */}
                            <div className="karnel-mega-content">

                                <div className="karnel-mega-content-title">
                                    <span>
                                        {currentMenu.categories.find(
                                            (category) =>
                                                category.id === activeCategory
                                        )?.label}
                                    </span>

                                    <small>
                                        {visibleItems.length} options
                                    </small>
                                </div>

                                <div className="karnel-mega-grid">
                                    {visibleItems.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={closeAll}
                                            className={({ isActive }) =>
                                                `karnel-mega-card ${isActive ? 'active' : ''
                                                }`
                                            }
                                        >
                                            <span className="karnel-mega-card-icon">
                                                <i
                                                    className={`bi ${item.icon}`}
                                                ></i>
                                            </span>

                                            <span className="karnel-mega-card-text">
                                                <strong>{item.label}</strong>
                                                <small>{item.description}</small>
                                            </span>

                                            <i className="bi bi-arrow-up-right karnel-mega-card-arrow"></i>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* MEGA FOOTER */}
                        <div className="karnel-mega-footer">

                            <span>
                                <i className="bi bi-stars"></i>
                                Discover more with Karnel Travels
                            </span>

                            <Link
                                to="/contact"
                                onClick={closeAll}
                            >
                                Need help?
                                <i className="bi bi-arrow-right"></i>
                            </Link>

                        </div>

                    </div>
                </div>
            )}
        </header>
    );
}

export default Navbar;
