import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import PlaceholderPage from './pages/PlaceholderPage';
import Home from './pages/Home';
import AuthProvider from './auth/AuthProvider';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FeedbackPage from './pages/FeedbackPage';
import { UserLogin, AdminLogin, Register, ResetPassword, AdminPage } from './routes/AccountPages';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import NotificationsPage from './pages/NotificationsPage';

// Admin pages
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBackupPage from './pages/admin/AdminBackupPage';
import AdminProvidersPage from './pages/admin/AdminProvidersPage';
import AdminTransportPage from './pages/admin/AdminTransportPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';

// Customer pages for Tien's modules
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import SearchPage from './pages/SearchPage';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route
                        path="/"
                        element={<Home />}
                    />

                    {/* Search (CN10, CN11) */}
                    <Route
                        path="/search"
                        element={<SearchPage />}
                    />

                    {/* Stay & Dining Services (CN06, CN07, CN08) */}
                    <Route
                        path="/hotels"
                        element={<ServicesPage defaultType="Hotel" />}
                    />
                    <Route
                        path="/restaurants"
                        element={<ServicesPage defaultType="Restaurant" />}
                    />
                    <Route
                        path="/resorts"
                        element={<ServicesPage defaultType="Resort" />}
                    />
                    <Route
                        path="/services"
                        element={<ServicesPage />}
                    />
                    <Route
                        path="/services/:id"
                        element={<ServiceDetailPage />}
                    />

                    {/* Booking & Order placement (CN13) */}
                    <Route
                        path="/booking"
                        element={<BookingPage />}
                    />
                    <Route
                        path="/tours/booking"
                        element={<BookingPage />}
                    />
                    <Route
                        path="/transport/booking"
                        element={<BookingPage />}
                    />

                    {/* User Booking History & Cancellation */}
                    <Route
                        path="/my-bookings"
                        element={<MyBookingsPage />}
                    />

                    {/* Other team modules */}
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

                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/login" element={<UserLogin />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/change-password" element={<ChangePasswordPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />

                    <Route
                        path="*"
                        element={<PlaceholderPage title="404 - Page Not Found" />}
                    />
                </Route>

                {/* Admin Area */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/feedbacks" element={<AdminPage><AdminFeedbackPage /></AdminPage>} />
                <Route path="/admin/users" element={<AdminPage><AdminUsersPage /></AdminPage>} />
                <Route path="/admin/backup" element={<AdminPage><AdminBackupPage /></AdminPage>} />
                <Route path="/admin/providers" element={<AdminPage><AdminProvidersPage /></AdminPage>} />
                <Route path="/admin/transport" element={<AdminPage><AdminTransportPage /></AdminPage>} />
                <Route path="/admin/bookings" element={<AdminPage><AdminBookingsPage /></AdminPage>} />
            </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
