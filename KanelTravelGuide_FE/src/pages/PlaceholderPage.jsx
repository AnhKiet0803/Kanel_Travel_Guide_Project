import { Link } from 'react-router-dom';
import './pages.css';

function PlaceholderPage({ title }) {
    return (
        <section className="ktg-page ktg-narrow text-center">
            <div className="ktg-form text-center">
                <span className="ktg-eyebrow mx-auto">Coming Soon</span>
                <h1 className="mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: '#123b5d', fontSize: '2rem' }}>
                    {title}
                </h1>
                <p className="text-muted mb-3">
                    This page is currently under development.
                </p>
                <div className="d-flex justify-content-center">
                    <Link to="/" className="ktg-button ktg-button-primary">
                        Back to Home
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default PlaceholderPage;
