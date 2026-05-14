/**
 * Navbar — sticky navigation with auth state
 */
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Leaf, ChevronDown, LayoutDashboard, LogOut, User, MessageSquare } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { label: 'Marketplace', to: '/marketplace' },
    { label: 'How It Works', to: '/#how-it-works' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-dark-400/90 backdrop-blur-xl border-b border-white/[0.06]' : ''
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <Leaf className="text-eco-500 w-6 h-6" />
          <span>Eco<span className="text-eco-400">Loop</span></span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="nav-link">{l.label}</Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm hover:bg-white/10 transition-all"
              >
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  : <div className="w-6 h-6 rounded-full bg-eco-600 flex items-center justify-center text-xs font-bold">{user.name?.[0]}</div>
                }
                <span className="font-medium max-w-[100px] truncate">{user.name}</span>
                <ChevronDown className="w-4 h-4 text-eco-600" />
              </button>
              {dropOpen && (
                <div className="absolute right-0 top-12 w-52 glass-card p-1.5 shadow-xl z-50">
                  <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 transition-all" onClick={() => setDropOpen(false)}>
                    <LayoutDashboard className="w-4 h-4 text-eco-500" /> Dashboard
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 transition-all" onClick={() => setDropOpen(false)}>
                    <User className="w-4 h-4 text-eco-500" /> Profile
                  </Link>
                  <Link to="/carbon" className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 transition-all" onClick={() => setDropOpen(false)}>
                    <Leaf className="w-4 h-4 text-eco-500" /> Carbon Impact
                  </Link>
                  <Link to="/messages" className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 transition-all" onClick={() => setDropOpen(false)}>
                    <MessageSquare className="w-4 h-4 text-eco-500" /> Messages
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 transition-all" onClick={() => setDropOpen(false)}>
                      <LayoutDashboard className="w-4 h-4 text-amber-400" /> Admin
                    </Link>
                  )}
                  <hr className="border-white/10 my-1" />
                  <button
                    onClick={() => { setDropOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"    className="nav-link">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-5">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark-400/95 backdrop-blur-xl border-t border-white/[0.06] p-4 space-y-1">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="block nav-link">{l.label}</Link>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" className="block nav-link">Dashboard</Link>
              <Link to="/profile"   className="block nav-link">Profile</Link>
              <Link to="/carbon"    className="block nav-link">Carbon Impact</Link>
              <Link to="/messages"  className="block nav-link">Messages</Link>
              {user.role === 'admin' && <Link to="/admin" className="block nav-link">Admin</Link>}
              <button onClick={handleLogout} className="block w-full text-left nav-link text-red-400">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="block nav-link">Login</Link>
              <Link to="/register" className="block btn-primary text-center mt-2">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
