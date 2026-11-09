
function PlaceholderPage({ title }) {
    return (
        <section className="container py-5">
            <div className="text-center py-5">
                <h1 className="fw-bold mb-3">{title}</h1>
                <p className="text-muted">
                    This page is under development.
                </p>
            </div>
        </section>
    );
}

export default PlaceholderPage;
