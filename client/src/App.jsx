/**
 * App.jsx — Router, layout wrapper, and responsive Toaster
 */
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth, AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Navbar       from './components/Navbar';

import Footer       from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage            from './pages/HomePage';
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import ForgotPasswordPage  from './pages/ForgotPasswordPage';
import ResetPasswordPage   from './pages/ResetPasswordPage';
import DashboardPage       from './pages/DashboardPage';
import MarketplacePage     from './pages/MarketplacePage';
import MaterialDetailPage  from './pages/MaterialDetailPage';
import MaterialFormPage    from './pages/MaterialFormPage';
import ProfilePage         from './pages/ProfilePage';
import CarbonDashboardPage from './pages/CarbonDashboardPage';
import AdminPage           from './pages/AdminPage';
import MessagesPage        from './pages/MessagesPage';
import TransactionsPage    from './pages/TransactionsPage';

/** Inner layout that has access to useLocation */
const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const authPaths = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPaths.some(p => location.pathname.startsWith(p)) || location.pathname.startsWith('/reset-password');

  const publicPaths = ['/', '/marketplace'];
  const isPublicPage = publicPaths.includes(location.pathname) || (location.pathname.startsWith('/materials/') && !location.pathname.endsWith('/new') && !location.pathname.endsWith('/edit'));

  return (
    <div className="min-h-screen bg-mesh flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          {/* Public */}
          <Route path="/"          element={<HomePage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/marketplace"       element={<MarketplacePage />} />
          <Route path="/materials/:id"     element={<MaterialDetailPage />} />

          {/* Protected — any authenticated user */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/carbon"    element={<ProtectedRoute><CarbonDashboardPage /></ProtectedRoute>} />
          <Route path="/messages"      element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/transactions"  element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />

          {/* Protected — sellers only */}
          <Route path="/materials/new"      element={<ProtectedRoute role="seller"><MaterialFormPage /></ProtectedRoute>} />
          <Route path="/materials/:id/edit" element={<ProtectedRoute role="seller"><MaterialFormPage /></ProtectedRoute>} />

          {/* Protected — admin only */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
              <div className="font-display text-6xl font-bold gradient-text">404</div>
              <p className="text-eco-700">Page not found</p>
              <a href="/" className="btn-primary">Back to Home</a>
            </div>
          } />
        </Routes>
      </div>
      {isPublicPage && <Footer />}

    </div>
  );
};

const App = () => (
  <AuthProvider>
    <SocketProvider>
      <BrowserRouter>
        <AppLayout />

        {/* Responsive Toaster: bottom-center on mobile, top-right on desktop */}
        <Toaster
          position="top-right"
          containerStyle={{ bottom: 80 }}
          toastOptions={{
            className: 'md:!top-auto',
            style: {
              background: 'rgba(var(--bg-card), 0.95)',
              backdropFilter: 'blur(16px)',
              color: 'rgb(var(--text-body))',
              border: '1px solid rgba(var(--border-color), 0.4)',
              borderRadius: '14px',
              fontSize: '14px',
              padding: '12px 16px',
              maxWidth: '380px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: 'rgb(var(--bg-card))' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: 'rgb(var(--bg-card))' } },
          }}
        />
      </BrowserRouter>
    </SocketProvider>
  </AuthProvider>
);

export default App;
