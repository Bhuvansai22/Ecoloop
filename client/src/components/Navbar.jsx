/**
 * Navbar — floating glassmorphism navigation
 * Mobile: hamburger menu with full slide-out navigation panel
 * Desktop: full navigation with dropdowns
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Leaf, ChevronDown, LayoutDashboard, LogOut, 
  User, MessageSquare, Compass, Sun, Moon,
  Menu, X, ShoppingBag, Home, BarChart3,
  ArrowRightLeft, PlusCircle
} from 'lucide-react';

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropRef = useRef(null);

  // Theme support
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    if (dropOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropOpen]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Mobile menu nav items
  const mobileNavItems = [
    { to: '/',            icon: Home,            label: 'Home' },
    { to: '/marketplace', icon: ShoppingBag,     label: 'Marketplace' },
  ];

  const mobileAuthItems = [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/messages',     icon: MessageSquare,   label: 'Messages' },
    { to: '/transactions', icon: ArrowRightLeft,  label: 'Transactions' },
    { to: '/carbon',       icon: BarChart3,       label: 'Carbon Report' },
    { to: '/profile',      icon: User,            label: 'Profile & Journey' },
  ];

  const mobileSellerItems = [
    { to: '/materials/new', icon: PlusCircle,     label: 'List New Material' },
  ];

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-50 px-3 md:px-4 transition-all duration-300 pointer-events-none ${
        scrolled ? 'pt-1.5 md:pt-3' : 'pt-2 md:pt-4'
      }`}>
        <nav className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 md:h-16 rounded-2xl transition-all duration-300 pointer-events-auto border ${
          scrolled 
            ? 'bg-dark-300/95 backdrop-blur-xl border-dark-100/50 shadow-md hover:border-eco-500/20' 
            : 'bg-dark-300/80 backdrop-blur-md border-dark-100/20'
        }`}>
          {/* Logo */}
          <Link to="/" className="flex items-center font-display font-extrabold text-lg md:text-xl select-none group">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg overflow-hidden flex items-center justify-center group-hover:rotate-12 transition-all shrink-0">
              <img src="/ecoloop-logo-abstract.png" alt="Ecoloop" className="w-full h-full object-cover" />
            </div>
            <span className="tracking-tight text-eco-100 group-hover:text-eco-500 transition-colors">
              Eco<span className="text-eco-500 font-medium">Loop</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1.5">
            <Link 
              to="/marketplace" 
              className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 ${
                isActive('/marketplace')
                  ? 'text-eco-500 bg-eco-50'
                  : 'text-eco-200 hover:text-eco-500 hover:bg-dark-200'
              }`}
            >
              <span>Marketplace</span>
            </Link>
            <a
              href="/#how-it-works"
              className="px-4 py-2 text-sm font-semibold text-eco-200 hover:text-eco-500 hover:bg-dark-200 rounded-xl transition-all"
            >
              How It Works
            </a>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-4 justify-end">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-dark-400 border border-dark-100 flex items-center justify-center text-eco-200 hover:bg-dark-200 transition-all select-none cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-eco-200" />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 rounded-xl bg-dark-400 border border-dark-100 flex items-center justify-center text-eco-200 hover:bg-dark-200 transition-all select-none cursor-pointer"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>

            {/* Desktop auth section */}
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-eco-500/30 border-t-eco-500 rounded-full animate-spin" />
              ) : user ? (
                <div className="flex items-center gap-3">
                  {/* EcoPoints pill */}
                  <Link to="/profile" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-eco-50 border border-eco-200 hover:bg-eco-500/10 text-xs font-semibold text-eco-500 select-none transition-all">
                    <span>🌱</span>
                    <span>{user.ecoPoints ?? 50} pts</span>
                  </Link>

                  <div className="relative" ref={dropRef}>
                    <button
                      onClick={() => setDropOpen(!dropOpen)}
                      className="flex items-center gap-2 bg-dark-400 border border-dark-100 rounded-xl px-3 py-2 text-sm hover:bg-dark-200 transition-all select-none"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-dark-100" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-eco-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {user.name?.[0]}
                        </div>
                      )}
                      <span className="font-semibold max-w-[100px] truncate text-eco-100">{user.name}</span>
                      <ChevronDown className={`w-4 h-4 text-eco-500 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropOpen && (
                      <div className="absolute right-0 top-13 w-56 glass-card p-2 shadow-xl z-50 border-dark-100/60 animate-fade-in bg-dark-300">
                        <div className="px-3 py-2 border-b border-dark-100/40 mb-1">
                          <div className="text-xs text-eco-300 font-semibold truncate">{user.companyName || 'Personal Workspace'}</div>
                          <div className="text-[10px] text-eco-800 capitalize mt-0.5">{user.role} Partner</div>
                        </div>
                        <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-dark-200 transition-all text-eco-100" onClick={() => setDropOpen(false)}>
                          <LayoutDashboard className="w-4 h-4 text-eco-500" /> Dashboard
                        </Link>
                        <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-dark-200 transition-all text-eco-100" onClick={() => setDropOpen(false)}>
                          <User className="w-4 h-4 text-eco-500" /> Profile & Journey
                        </Link>
                        <Link to="/carbon" className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-dark-200 transition-all text-eco-100" onClick={() => setDropOpen(false)}>
                          <Leaf className="w-4 h-4 text-eco-500" /> Carbon Report
                        </Link>
                        <Link to="/messages" className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-dark-200 transition-all text-eco-100" onClick={() => setDropOpen(false)}>
                          <MessageSquare className="w-4 h-4 text-eco-500" /> Inbox
                        </Link>
                        {user.role === 'admin' && (
                          <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-dark-200 transition-all text-eco-100" onClick={() => setDropOpen(false)}>
                            <Compass className="w-4 h-4 text-amber-500" /> Admin Panel
                          </Link>
                        )}
                        <hr className="border-dark-100/40 my-1" />
                        <button
                          onClick={() => { setDropOpen(false); handleLogout(); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-600 transition-all text-left font-semibold"
                        >
                          <LogOut className="w-4 h-4 text-red-500" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-4 py-2 text-sm font-semibold text-eco-200 hover:text-eco-500 hover:bg-dark-200 rounded-xl transition-all">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-xs py-2.5 px-4 rounded-xl shadow-md">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Mobile Slide-Out Menu                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      
      {/* Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          style={{ animation: 'fadeIn 0.2s ease' }}
        />
      )}

      {/* Slide-out panel */}
      <div 
        className={`md:hidden fixed top-0 right-0 bottom-0 z-[70] w-[min(85vw,320px)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] border-l border-dark-100/40 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: 'rgba(var(--bg-card), 0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-dark-100/30">
          <Link to="/" className="flex items-center font-display font-extrabold text-lg select-none" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              <img src="/ecoloop-logo-abstract.png" alt="Ecoloop" className="w-full h-full object-cover" />
            </div>
            <span className="text-eco-100">
              Eco<span className="text-eco-500 font-medium">Loop</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 rounded-xl bg-dark-400 border border-dark-100 flex items-center justify-center text-eco-200 hover:bg-dark-200 transition-all"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info (if logged in) */}
        {!loading && user && (
          <div className="px-5 py-4 border-b border-dark-100/30">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-dark-100" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-eco-500 flex items-center justify-center text-sm font-bold text-white">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-eco-100 truncate">{user.name}</div>
                <div className="text-[11px] text-eco-300 capitalize">{user.companyName || user.role + ' Partner'}</div>
              </div>
            </div>
            {/* Eco Points */}
            <div className="mt-3 flex items-center gap-2 bg-eco-50 border border-eco-500/20 rounded-xl px-3 py-2">
              <span className="text-sm">🌱</span>
              <span className="text-xs font-bold text-eco-500">{user.ecoPoints ?? 0} Eco Points</span>
              <span className="text-[10px] text-eco-300 ml-auto capitalize">{user.role}</span>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {/* Public links */}
          <div className="mb-2">
            <div className="px-2 mb-1.5 text-[10px] uppercase tracking-widest text-eco-300 font-bold">Navigate</div>
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                    active
                      ? 'bg-eco-500/10 text-eco-500 border border-eco-500/20'
                      : 'text-eco-200 hover:bg-dark-200 border border-transparent'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] ${active ? 'text-eco-500' : 'text-eco-300'}`} strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Auth-required links */}
          {!loading && user && (
            <>
              <div className="mb-2">
                <div className="px-2 mb-1.5 mt-3 text-[10px] uppercase tracking-widest text-eco-300 font-bold">Your Space</div>
                {mobileAuthItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                        active
                          ? 'bg-eco-500/10 text-eco-500 border border-eco-500/20'
                          : 'text-eco-200 hover:bg-dark-200 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-[18px] h-[18px] ${active ? 'text-eco-500' : 'text-eco-300'}`} strokeWidth={active ? 2.2 : 1.8} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Seller-only items */}
              {user.role === 'seller' && (
                <div className="mb-2">
                  <div className="px-2 mb-1.5 mt-3 text-[10px] uppercase tracking-widest text-eco-300 font-bold">Seller Tools</div>
                  {mobileSellerItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                          active
                            ? 'bg-eco-500/10 text-eco-500 border border-eco-500/20'
                            : 'text-eco-200 hover:bg-dark-200 border border-transparent'
                        }`}
                      >
                        <Icon className={`w-[18px] h-[18px] ${active ? 'text-eco-500' : 'text-eco-300'}`} strokeWidth={active ? 2.2 : 1.8} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Admin link */}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                    isActive('/admin')
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-eco-200 hover:bg-dark-200 border border-transparent'
                  }`}
                >
                  <Compass className={`w-[18px] h-[18px] ${isActive('/admin') ? 'text-amber-400' : 'text-amber-500/60'}`} />
                  Admin Panel
                </Link>
              )}
            </>
          )}
        </div>

        {/* Bottom actions */}
        <div className="px-4 py-4 border-t border-dark-100/30">
          {!loading && user ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-red-500/5 border border-red-500/15 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-eco-200 border border-dark-100 hover:bg-dark-200 transition-all"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center btn-primary text-sm py-2.5 px-4 rounded-xl"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
