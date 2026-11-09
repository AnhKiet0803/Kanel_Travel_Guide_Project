
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

function Footer() {
    return (
        <footer className="karnel-footer">
            <div className="container py-5">
                <div className="row g-4">
                    <div className="col-12 col-md-6 col-lg-4">
                        <h5 className="fw-bold">Karnel Travels</h5>
                        <p>
                            Discover amazing destinations, unforgettable tours
                            and exciting travel experiences.
                        </p>
                    </div>

                    <div className="col-6 col-md-3 col-lg-4">
                        <h6>Quick Links</h6>
                        <ul className="list-unstyled">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/destinations">Destinations</Link></li>
                            <li><Link to="/tours">Tours</Link></li>
                            <li><Link to="/transport">Transport</Link></li>
                        </ul>
                    </div>

                    <div className="col-6 col-md-3 col-lg-4">
                        <h6>Information</h6>
                        <ul className="list-unstyled">
                            <li><Link to="/information">About Us</Link></li>
                            <li><Link to="/promotions">Special Offers</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="karnel-footer-bottom text-center py-3">
                © {new Date().getFullYear()} Karnel Travels. All rights reserved.
            </div>
        </footer>
    );
}

export default Footer;
