/**
 * App.jsx — Router and layout wrapper
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Navbar       from './components/Navbar';
import Footer       from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage            from './pages/HomePage';
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import DashboardPage       from './pages/DashboardPage';
import MarketplacePage     from './pages/MarketplacePage';
import MaterialDetailPage  from './pages/MaterialDetailPage';
import MaterialFormPage    from './pages/MaterialFormPage';
import ProfilePage         from './pages/ProfilePage';
import CarbonDashboardPage from './pages/CarbonDashboardPage';
import AdminPage           from './pages/AdminPage';
import MessagesPage        from './pages/MessagesPage';
import TransactionsPage    from './pages/TransactionsPage';

const App = () => (
  <AuthProvider>
    <SocketProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-mesh flex flex-col font-sans">
          <Navbar />
          <div className="flex-grow">
            <Routes>
              {/* Public */}
              <Route path="/"          element={<HomePage />} />
              <Route path="/login"     element={<LoginPage />} />
              <Route path="/register"  element={<RegisterPage />} />
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
          <Footer />
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#141914',
              color: '#e8f5e9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0f130f' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0f130f' } },
          }}
        />
      </BrowserRouter>
    </SocketProvider>
  </AuthProvider>
);

export default App;
