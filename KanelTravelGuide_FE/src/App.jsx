
import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import PlaceholderPage from './pages/PlaceholderPage';
import Home from './pages/Home';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route
                        path="/"
                        element={<Home />}
                    />

                    <Route
                        path="/destinations"
                        element={<PlaceholderPage title="Destinations" />}
                    />

                    <Route
                        path="/destinations/:id"
                        element={<PlaceholderPage title="Destination Details" />}
                    />

                    <Route
                        path="/tours"
                        element={<PlaceholderPage title="Tours" />}
                    />

                    <Route
                        path="/transport"
                        element={<PlaceholderPage title="Transport" />}
                    />

                    <Route
                        path="/promotions"
                        element={<PlaceholderPage title="Special Offers" />}
                    />

                    <Route
                        path="/information"
                        element={<PlaceholderPage title="Information" />}
                    />

                    <Route
                        path="/contact"
                        element={<PlaceholderPage title="Contact Us" />}
                    />

                    <Route
                        path="/login"
                        element={<PlaceholderPage title="Sign In" />}
                    />

                    <Route
                        path="*"
                        element={<PlaceholderPage title="404 - Page Not Found" />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
