import { useState } from 'react';

export default function TourPhoto({ src, name }) {
    const [failed, setFailed] = useState(false);
    return src && !failed
        ? <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} />
        : <div className="kt-tour-no-image" aria-hidden="true"><i className="bi bi-compass" /></div>;
}
