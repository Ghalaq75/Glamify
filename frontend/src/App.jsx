import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import { ClientLayout } from './layouts/ClientLayout';
import ClientHome from './pages/client/Home';
import ClientProvider from './pages/client/Provider';
import ClientBook from './pages/client/Book';
import ClientBookings from './pages/client/Bookings';
import PaymentReturn from './pages/client/PaymentReturn';
import ClientDashboard from './pages/client/Dashboard';
import ClientProfile from './pages/client/Profile';
import ClientFavourites from './pages/client/Favourites';
import ClientNotifications from './pages/client/Notifications';

import { ProviderLayout } from './layouts/ProviderLayout';
import ProviderDashboard from './pages/provider/Dashboard';
import ProviderBookings from './pages/provider/Bookings';
import ProviderServices from './pages/provider/Services';
import ProviderAvailability from './pages/provider/Availability';
import ProviderEarnings from './pages/provider/Earnings';
import ProviderOnboarding from './pages/provider/Onboarding';
import ProviderProfile from './pages/provider/Profile';

import { AdminLayout } from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProviders from './pages/admin/Providers';
import AdminUsers from './pages/admin/Users';
import AdminBookings from './pages/admin/Bookings';
import AdminDisputes from './pages/admin/Disputes';
import AdminPayouts from './pages/admin/Payouts';
import AdminRefundRequests from './pages/admin/RefundRequests';

import NotFound from './pages/NotFound';

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export default function App() {
  return (
    <BrowserRouter basename={base} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/client" element={<ClientLayout><ClientHome /></ClientLayout>} />
            <Route path="/client/provider/:providerId" element={<ClientLayout><ClientProvider /></ClientLayout>} />
            <Route path="/client/book" element={<ClientLayout><ClientBook /></ClientLayout>} />
            <Route path="/client/bookings" element={<ClientLayout><ClientBookings /></ClientLayout>} />
            <Route path="/client/bookings/payment/return" element={<ClientLayout><PaymentReturn /></ClientLayout>} />
            <Route path="/client/dashboard" element={<ClientLayout><ClientDashboard /></ClientLayout>} />
            <Route path="/client/profile" element={<ClientLayout><ClientProfile /></ClientLayout>} />
            <Route path="/client/favourites" element={<ClientLayout><ClientFavourites /></ClientLayout>} />
            <Route path="/client/notifications" element={<ClientLayout><ClientNotifications /></ClientLayout>} />

            <Route path="/provider/onboarding" element={<ProviderOnboarding />} />
            <Route path="/provider" element={<ProviderLayout><ProviderDashboard /></ProviderLayout>} />
            <Route path="/provider/bookings" element={<ProviderLayout><ProviderBookings /></ProviderLayout>} />
            <Route path="/provider/services" element={<ProviderLayout><ProviderServices /></ProviderLayout>} />
            <Route path="/provider/availability" element={<ProviderLayout><ProviderAvailability /></ProviderLayout>} />
            <Route path="/provider/earnings" element={<ProviderLayout><ProviderEarnings /></ProviderLayout>} />
            <Route path="/provider/profile" element={<ProviderLayout><ProviderProfile /></ProviderLayout>} />

            <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
            <Route path="/admin/providers" element={<AdminLayout><AdminProviders /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
            <Route path="/admin/bookings" element={<AdminLayout><AdminBookings /></AdminLayout>} />
            <Route path="/admin/disputes" element={<AdminLayout><AdminDisputes /></AdminLayout>} />
            <Route path="/admin/payouts" element={<AdminLayout><AdminPayouts /></AdminLayout>} />
            <Route path="/admin/refund-requests" element={<AdminLayout><AdminRefundRequests /></AdminLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
