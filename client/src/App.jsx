import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import OwnerRoute from './routes/OwnerRoute';

// Layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import OwnerLayout from './components/OwnerLayout';

// Public pages
import Home from './pages/public/Home';
import Services from './pages/public/Services';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import OwnerLogin from './pages/public/OwnerLogin';
import OwnerRegister from './pages/public/OwnerRegister';

// Customer pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import FindTractorOwners from './pages/customer/FindTractorOwners';
import NewBooking from './pages/customer/NewBooking';
import MyBookings from './pages/customer/MyBookings';
import BookingDetail from './pages/customer/BookingDetail';
import Profile from './pages/customer/Profile';

// Tractor Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerServices from './pages/owner/OwnerServices';
import OwnerTractors from './pages/owner/OwnerTractors';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerWorkRecords from './pages/owner/OwnerWorkRecords';
import OwnerPayments from './pages/owner/OwnerPayments';
import OwnerExpenses from './pages/owner/OwnerExpenses';
import OwnerReports from './pages/owner/OwnerReports';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOwners from './pages/admin/AdminOwners';
import ServicesManagement from './pages/admin/ServicesManagement';
import BookingsManagement from './pages/admin/BookingsManagement';
import TractorManagement from './pages/admin/TractorManagement';
import WorkRecordsList from './pages/admin/WorkRecordsList';
import PaymentsManagement from './pages/admin/PaymentsManagement';
import ExpensesManagement from './pages/admin/ExpensesManagement';
import CustomersManagement from './pages/admin/CustomersManagement';
import Reports from './pages/admin/Reports';

// Public layout wrapper (includes Navbar & Footer)
const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col justify-between bg-slate-50 selection:bg-brand-500 selection:text-white">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

// Customer layout wrapper (includes Navbar & Footer)
const CustomerLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col justify-between bg-slate-50 selection:bg-brand-500 selection:text-white">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/find-tractors" element={<PublicLayout><FindTractorOwners /></PublicLayout>} />

          {/* Farmer & Owner Auth Options */}
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
          <Route path="/farmer/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/farmer/register" element={<PublicLayout><Register /></PublicLayout>} />
          <Route path="/owner/login" element={<PublicLayout><OwnerLogin /></PublicLayout>} />
          <Route path="/owner/register" element={<PublicLayout><OwnerRegister /></PublicLayout>} />

          {/* Customer / Farmer Protected Routes */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute>
                <CustomerLayout><CustomerDashboard /></CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/find-tractors"
            element={
              <ProtectedRoute>
                <CustomerLayout><FindTractorOwners /></CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/book"
            element={
              <ProtectedRoute>
                <CustomerLayout><NewBooking /></CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/my-bookings"
            element={
              <ProtectedRoute>
                <CustomerLayout><MyBookings /></CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bookings/:id"
            element={
              <ProtectedRoute>
                <CustomerLayout><BookingDetail /></CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute>
                <CustomerLayout><Profile /></CustomerLayout>
              </ProtectedRoute>
            }
          />

          {/* Independent Tractor Owner Protected Portal with OwnerLayout */}
          <Route
            path="/owner"
            element={
              <OwnerRoute>
                <OwnerLayout />
              </OwnerRoute>
            }
          >
            <Route index element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="services" element={<OwnerServices />} />
            <Route path="tractors" element={<OwnerTractors />} />
            <Route path="bookings" element={<OwnerBookings />} />
            <Route path="work-records" element={<OwnerWorkRecords />} />
            <Route path="payments" element={<OwnerPayments />} />
            <Route path="expenses" element={<OwnerExpenses />} />
            <Route path="reports" element={<OwnerReports />} />
          </Route>

          {/* Platform Admin Protected Routes with AdminLayout */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="owners" element={<AdminOwners />} />
            <Route path="services" element={<ServicesManagement />} />
            <Route path="bookings" element={<BookingsManagement />} />
            <Route path="tractors" element={<TractorManagement />} />
            <Route path="work-records" element={<WorkRecordsList />} />
            <Route path="payments" element={<PaymentsManagement />} />
            <Route path="expenses" element={<ExpensesManagement />} />
            <Route path="customers" element={<CustomersManagement />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* 404 Catch-All */}
          <Route
            path="*"
            element={
              <PublicLayout>
                <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
                  <span className="text-5xl">🚜</span>
                  <h1 className="text-3xl font-extrabold text-slate-900">404 - Page Not Found</h1>
                  <p className="text-xs text-slate-500">
                    The farm path you are looking for does not exist or has been moved.
                  </p>
                  <a
                    href="/"
                    className="inline-block px-4 py-2 bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Return to Homepage
                  </a>
                </div>
              </PublicLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
