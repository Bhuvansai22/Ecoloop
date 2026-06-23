/**
 * BottomNav — iOS/Android-style bottom tab bar (mobile only)
 */
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, ShoppingBag, LayoutDashboard,
  MessageSquare, User
} from 'lucide-react';

const TABS = [
  { to: '/',            icon: Home,            label: 'Home' },
  { to: '/marketplace', icon: ShoppingBag,     label: 'Market' },
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/messages',    icon: MessageSquare,   label: 'Messages' },
  { to: '/profile',     icon: User,            label: 'Profile' },
];

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Don't show if not logged in
  if (!user) return null;

  // Don't show on auth pages
  const hiddenPaths = ['/login', '/register', '/forgot-password'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;
  if (location.pathname.startsWith('/reset-password')) return null;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-dark-100/60"
      style={{
        backgroundColor: 'rgba(var(--bg-card), 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.to);
          const needsAuth = ['/dashboard', '/messages', '/profile'].includes(tab.to);

          // If user is not logged in, redirect auth-required tabs to login
          const href = needsAuth && !user ? '/login' : tab.to;

          return (
            <Link
              key={tab.to}
              to={href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-eco-500'
                  : 'text-eco-300 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-all duration-200 ${active ? 'scale-110' : ''}`} strokeWidth={active ? 2.5 : 1.8} />
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-eco-500 shadow-[0_0_6px_rgba(46,125,50,0.6)]" />
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none mt-0.5 ${active ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
