import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import ForgotPassword from './pages/auth/ForgotPassword';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';

import { ClientLayout } from './layouts/ClientLayout';
import ClientBook from './pages/client/Book';
import ClientBookings from './pages/client/Bookings';
import ClientDashboard from './pages/client/Dashboard';
import ClientFavourites from './pages/client/Favourites';
import ClientHome from './pages/client/Home';
import ClientNotifications from './pages/client/Notifications';
import PaymentReturn from './pages/client/PaymentReturn';
import ClientProfile from './pages/client/Profile';
import ClientProvider from './pages/client/Provider';

import { ProviderLayout } from './layouts/ProviderLayout';
import ProviderAvailability from './pages/provider/Availability';
import ProviderBookings from './pages/provider/Bookings';
import ProviderDashboard from './pages/provider/Dashboard';
import ProviderEarnings from './pages/provider/Earnings';
import ProviderOnboarding from './pages/provider/Onboarding';
import ProviderProfile from './pages/provider/Profile';
import ProviderServices from './pages/provider/Services';

import { AdminLayout } from './layouts/AdminLayout';
import AdminBookings from './pages/admin/Bookings';
import AdminDashboard from './pages/admin/Dashboard';
import AdminDisputes from './pages/admin/Disputes';
import AdminPayouts from './pages/admin/Payouts';
import AdminProviders from './pages/admin/Providers';
import AdminRefundRequests from './pages/admin/RefundRequests';
import AdminUsers from './pages/admin/Users';

import NotFound from './pages/NotFound';

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter basename={base} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<ClientLayout><ClientHome /></ClientLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/client" element={<RequireAuth role="client"><ClientLayout><ClientHome /></ClientLayout></RequireAuth>} />
            <Route path="/client/provider/:providerId" element={<ClientLayout><ClientProvider /></ClientLayout>} />
            <Route path="/client/book" element={<RequireAuth role="client"><ClientLayout><ClientBook /></ClientLayout></RequireAuth>} />
            <Route path="/client/bookings" element={<RequireAuth role="client"><ClientLayout><ClientBookings /></ClientLayout></RequireAuth>} />
            <Route path="/client/bookings/payment/return" element={<RequireAuth role="client"><ClientLayout><PaymentReturn /></ClientLayout></RequireAuth>} />
            <Route path="/client/dashboard" element={<RequireAuth role="client"><ClientLayout><ClientDashboard /></ClientLayout></RequireAuth>} />
            <Route path="/client/profile" element={<RequireAuth role="client"><ClientLayout><ClientProfile /></ClientLayout></RequireAuth>} />
            <Route path="/client/favourites" element={<RequireAuth role="client"><ClientLayout><ClientFavourites /></ClientLayout></RequireAuth>} />
            <Route path="/client/notifications" element={<RequireAuth role="client"><ClientLayout><ClientNotifications /></ClientLayout></RequireAuth>} />

            <Route path="/provider/onboarding" element={<RequireAuth role="provider"><ProviderOnboarding /></RequireAuth>} />
            <Route path="/provider" element={<RequireAuth role="provider"><ProviderLayout><ProviderDashboard /></ProviderLayout></RequireAuth>} />
            <Route path="/provider/bookings" element={<RequireAuth role="provider"><ProviderLayout><ProviderBookings /></ProviderLayout></RequireAuth>} />
            <Route path="/provider/services" element={<RequireAuth role="provider"><ProviderLayout><ProviderServices /></ProviderLayout></RequireAuth>} />
            <Route path="/provider/availability" element={<RequireAuth role="provider"><ProviderLayout><ProviderAvailability /></ProviderLayout></RequireAuth>} />
            <Route path="/provider/earnings" element={<RequireAuth role="provider"><ProviderLayout><ProviderEarnings /></ProviderLayout></RequireAuth>} />
            <Route path="/provider/profile" element={<RequireAuth role="provider"><ProviderLayout><ProviderProfile /></ProviderLayout></RequireAuth>} />

            <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout><AdminDashboard /></AdminLayout></RequireAuth>} />
            <Route path="/admin/providers" element={<RequireAuth role="admin"><AdminLayout><AdminProviders /></AdminLayout></RequireAuth>} />
            <Route path="/admin/users" element={<RequireAuth role="admin"><AdminLayout><AdminUsers /></AdminLayout></RequireAuth>} />
            <Route path="/admin/bookings" element={<RequireAuth role="admin"><AdminLayout><AdminBookings /></AdminLayout></RequireAuth>} />
            <Route path="/admin/disputes" element={<RequireAuth role="admin"><AdminLayout><AdminDisputes /></AdminLayout></RequireAuth>} />
            <Route path="/admin/payouts" element={<RequireAuth role="admin"><AdminLayout><AdminPayouts /></AdminLayout></RequireAuth>} />
            <Route path="/admin/refund-requests" element={<RequireAuth role="admin"><AdminLayout><AdminRefundRequests /></AdminLayout></RequireAuth>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}