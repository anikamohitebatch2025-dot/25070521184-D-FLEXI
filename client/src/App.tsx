import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Error Boundary to catch render-time crashes and show a useful error instead of black screen
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[DashboardErrorBoundary] Render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0b0c] flex flex-col items-center justify-center text-white gap-4 px-4">
          <div className="text-[#ff6a00] text-5xl">⚠️</div>
          <h2 className="text-2xl font-bold text-[#ff6a00]">Dashboard Error</h2>
          <p className="text-neutral-400 text-sm max-w-md text-center">
            Something went wrong loading the dashboard. Please try refreshing the page.
          </p>
          <pre className="text-xs text-red-400 bg-neutral-900 rounded p-3 max-w-lg overflow-auto">
            {this.state.error}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-2.5 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white font-bold text-sm transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { CartDrawer } from './components/CartDrawer';

// Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AdminLayout } from './components/AdminLayout';

// Public & Member Pages
import { Home } from './pages/Home';
import { AboutUs } from './pages/AboutUs';
import { Plans } from './pages/Plans';
import { Trainers } from './pages/Trainers';
import { Workouts } from './pages/Workouts';
import { Diet } from './pages/Diet';
import { ContactUs } from './pages/ContactUs';
import { BookAppointment } from './pages/BookAppointment';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MemberDashboard } from './pages/MemberDashboard';

// Admin Pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminAppointments } from './pages/admin/AdminAppointments';
import { AdminMembers } from './pages/admin/AdminMembers';
import { AdminPlans } from './pages/admin/AdminPlans';
import { AdminTrainers } from './pages/admin/AdminTrainers';
import { AdminSchedules } from './pages/admin/AdminSchedules';
import { AdminEnquiries } from './pages/admin/AdminEnquiries';
import { AdminCompass } from './pages/admin/AdminCompass';
import { AdminPowerShellGuide } from './pages/admin/AdminPowerShellGuide';
import { AdminAttendance } from './pages/admin/AdminAttendance';
import { AdminEquipment } from './pages/admin/AdminEquipment';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminReports } from './pages/admin/AdminReports';

// Trainer Pages
import { TrainerDashboard } from './pages/trainer/TrainerDashboard';

// Public Layout Wrapper
const PublicLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0b0b0c] text-white">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

// Protected Member Route Guard
const ProtectedMemberRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0c] text-[#ff6a00] font-bold">
        Validating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Protected Admin Route Guard
const ProtectedAdminRoute: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0c] text-[#ff6a00] font-bold">
        Checking administrator privileges...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  return <Outlet />;
};

// Protected Trainer Route Guard
const ProtectedTrainerRoute: React.FC = () => {
  const { user, isTrainer, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0c] text-[#ff6a00] font-bold">
        Validating coach credentials...
      </div>
    );
  }

  if (!user || (!isTrainer && !isAdmin)) {
    return <Navigate to="/login?redirect=/trainer" replace />;
  }

  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <CartDrawer />
            <Routes>
              {/* Public Layout Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/trainers" element={<Trainers />} />
                <Route path="/workouts" element={<Workouts />} />
                <Route path="/diet" element={<Diet />} />
                <Route path="/nutrition" element={<Navigate to="/diet" replace />} />
                <Route path="/book" element={<BookAppointment />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Member Dashboard Guard */}
                <Route element={<ProtectedMemberRoute />}>
                  <Route path="/dashboard" element={<DashboardErrorBoundary><MemberDashboard /></DashboardErrorBoundary>} />
                </Route>

                {/* Trainer Portal Guard */}
                <Route element={<ProtectedTrainerRoute />}>
                  <Route path="/trainer" element={<TrainerDashboard />} />
                </Route>
              </Route>

              {/* Admin Dashboard Protected Routes */}
              <Route element={<ProtectedAdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminOverview />} />
                  <Route path="appointments" element={<AdminAppointments />} />
                  <Route path="members" element={<AdminMembers />} />
                  <Route path="attendance" element={<AdminAttendance />} />
                  <Route path="equipment" element={<AdminEquipment />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="plans" element={<AdminPlans />} />
                  <Route path="trainers" element={<AdminTrainers />} />
                  <Route path="schedules" element={<AdminSchedules />} />
                  <Route path="enquiries" element={<AdminEnquiries />} />
                  <Route path="compass" element={<AdminCompass />} />
                  <Route path="powershell" element={<AdminPowerShellGuide />} />
                </Route>
              </Route>

              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
