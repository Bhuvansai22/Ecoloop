/**
 * Navbar — suspended floating glassmorphism dock navigation
 * Mobile: minimal top bar (logo + theme toggle)
 * Desktop: full navigation with dropdowns (unchanged)
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Leaf, ChevronDown, LayoutDashboard, LogOut, 
  User, MessageSquare, Compass, Sun, Moon
} from 'lucide-react';

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileDropOpen, setMobileDropOpen] = useState(false);
  const dropRef = useRef(null);
  const mobileDropRef = useRef(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
      if (mobileDropRef.current && !mobileDropRef.current.contains(e.target)) {
        setMobileDropOpen(false);
      }
    };
    if (dropOpen || mobileDropOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropOpen, mobileDropOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'Marketplace', to: '/marketplace' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-3 md:px-4 transition-all duration-300 pointer-events-none ${
      scrolled ? 'pt-1.5 md:pt-3' : 'pt-2 md:pt-4'
    }`}>
      <nav className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 md:h-16 rounded-2xl transition-all duration-300 pointer-events-auto border ${
        scrolled 
          ? 'bg-dark-300/95 backdrop-blur-xl border-dark-100/50 shadow-md hover:border-eco-500/20' 
          : 'bg-dark-300/80 backdrop-blur-md border-dark-100/20'
      }`}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 md:gap-2.5 font-display font-extrabold text-lg md:text-xl select-none group">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-eco-500/10 border border-eco-500/20 flex items-center justify-center group-hover:bg-eco-500/20 group-hover:rotate-12 transition-all">
            <Leaf className="text-eco-500 w-4 h-4" />
          </div>
          <span className="tracking-tight text-eco-100 group-hover:text-eco-500 transition-colors">
            Eco<span className="text-eco-500 font-medium">Loop</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1.5">
          {navLinks.map((l) => (
            <Link 
              key={l.to} 
              to={l.to} 
              className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 ${
                isActive(l.to)
                  ? 'text-eco-500 bg-eco-50'
                  : 'text-eco-200 hover:text-eco-500 hover:bg-dark-200'
              }`}
            >
              <span>{l.label}</span>
              {isActive(l.to) && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-eco-500 shadow-[0_0_8px_#2E7D32]" />
              )}
            </Link>
          ))}
          <a
            href="/#how-it-works"
            className="px-4 py-2 text-sm font-semibold text-eco-200 hover:text-eco-500 hover:bg-dark-200 rounded-xl transition-all"
          >
            How It Works
          </a>
        </div>

        {/* Right side: theme toggle + auth */}
        <div className="flex items-center gap-2 md:gap-4 min-w-[80px] md:min-w-[120px] justify-end">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-dark-400 border border-dark-100 flex items-center justify-center text-eco-200 hover:bg-dark-200 transition-all select-none cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-eco-200" />}
          </button>

          {/* Mobile Auth Button / Avatar Dropdown */}
          {!loading && user && (
            <div className="relative md:hidden" ref={mobileDropRef}>
              <button
                onClick={() => setMobileDropOpen(!mobileDropOpen)}
                className="w-8 h-8 rounded-xl bg-dark-400 border border-dark-100 flex items-center justify-center text-eco-200 hover:bg-dark-200 transition-all overflow-hidden select-none cursor-pointer"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-eco-500 flex items-center justify-center text-xs font-bold text-white">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </button>
              {mobileDropOpen && (
                <div className="absolute right-0 top-10 w-48 glass-card p-2 shadow-xl z-50 border-dark-100/60 animate-fade-in bg-dark-300">
                  <div className="px-3 py-1.5 border-b border-dark-100/40 mb-1">
                    <div className="text-xs text-eco-100 font-bold truncate">{user.name?.trim()}</div>
                    <div className="text-[9px] text-eco-300 truncate capitalize">{user.role} Partner</div>
                  </div>
                  <button
                    onClick={() => { setMobileDropOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-red-500/10 text-red-600 transition-all text-left font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" /> Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && !user && (
            <Link
              to="/login"
              className="md:hidden text-[10px] font-bold text-eco-500 border border-eco-500/20 bg-eco-500/5 px-2.5 py-1.5 rounded-xl hover:bg-eco-500/10 transition-all"
            >
              Login
            </Link>
          )}

          {/* Desktop auth section — hidden on mobile */}
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
  );
};

export default Navbar;
