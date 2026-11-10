
import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';

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
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBackupPage from './pages/admin/AdminBackupPage';

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

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/feedbacks" element={<AdminPage><AdminFeedbackPage /></AdminPage>} />
                <Route path="/admin/users" element={<AdminPage><AdminUsersPage /></AdminPage>} />
                <Route path="/admin/backup" element={<AdminPage><AdminBackupPage /></AdminPage>} />
            </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
