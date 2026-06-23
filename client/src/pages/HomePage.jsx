/**
 * HomePage — Redesigned landing page with search, categories, and live feed
 * Mobile-optimized: stacked hero, compact categories, responsive grids
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { materialService } from '../services';
import MaterialCard from '../components/MaterialCard';
import {
  ArrowRight, Leaf, Zap, Globe, BarChart3,
  ShieldCheck, RefreshCw, Search, Package,
  ChevronRight, Sparkles, Building2, Flame
} from 'lucide-react';

const STATS = [
  { label: 'Tonnes Diverted',    value: '520K+' },
  { label: 'Industries Joined',  value: '1,450+' },
  { label: 'CO₂ Saved (kg)',     value: '950M+' },
  { label: 'Active Listings',    value: '8,800+' },
];

const FEATURES = [
  { icon: <Zap className="w-6 h-6" />,          title: 'Smart Matching',     desc: 'AI-powered algorithm connects waste generators with the right buyers instantly.' },
  { icon: <Globe className="w-6 h-6" />,         title: 'Geo Discovery',      desc: 'Find materials near you using radius-based geospatial search on an interactive map.' },
  { icon: <Leaf className="w-6 h-6" />,          title: 'Carbon Tracking',    desc: 'Every transaction automatically calculates and logs your CO₂ savings.' },
  { icon: <ShieldCheck className="w-6 h-6" />,   title: 'Verified Businesses',desc: 'Trust badges and verification for all listed industries on the platform.' },
  { icon: <BarChart3 className="w-6 h-6" />,     title: 'ESG Dashboard',      desc: 'Visual dashboards for environmental impact reporting and green portfolio building.' },
  { icon: <RefreshCw className="w-6 h-6" />,     title: 'Circular Economy',   desc: 'Close the loop — one company\'s waste becomes another\'s raw material.' },
];

const CATEGORIES = [
  { name: 'Metal Scrap', emoji: '⚙️', color: 'from-blue-500/20 to-blue-600/5', border: 'hover:border-blue-500/30' },
  { name: 'Plastics', emoji: '🥤', color: 'from-green-500/20 to-green-600/5', border: 'hover:border-green-500/30' },
  { name: 'Paper & Cardboard', emoji: '📦', color: 'from-amber-500/20 to-amber-600/5', border: 'hover:border-amber-500/30' },
  { name: 'Chemical Waste', emoji: '🧪', color: 'from-red-500/20 to-red-600/5', border: 'hover:border-red-500/30' },
  { name: 'Electronic Waste', emoji: '💻', color: 'from-purple-500/20 to-purple-600/5', border: 'hover:border-purple-500/30' },
  { name: 'Organic Waste', emoji: '🍂', color: 'from-emerald-500/20 to-emerald-600/5', border: 'hover:border-emerald-500/30' },
];

const STEPS = [
  { n: '01', title: 'Register & List',    desc: 'Sellers post waste materials with quantity, photos, and location.' },
  { n: '02', title: 'Get Matched',        desc: 'Buyers discover relevant listings via smart filters and geo-search.' },
  { n: '03', title: 'Negotiate & Deal',   desc: 'Built-in messaging to finalize terms and request transactions.' },
  { n: '04', title: 'Track Your Impact',  desc: 'CO₂ savings are calculated and credited to your green dashboard.' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [liveListings, setLiveListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    materialService.getAll({ limit: 3 })
      .then(({ data }) => {
        setLiveListings(data.materials || []);
      })
      .catch((err) => console.error('Failed to load live feed:', err))
      .finally(() => setLoadingListings(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative min-h-0 md:min-h-screen flex items-center pt-20 pb-8 md:pt-28 md:pb-16 overflow-hidden bg-mesh">
        {/* Decorative background lights */}
        <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-eco-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-8 md:gap-12 items-center relative z-10 w-full">
          <div className="lg:col-span-7 animate-fade-up">
            <div className="section-tag">
              <Sparkles className="w-3.5 h-3.5 text-eco-400 animate-pulse" /> Next-Gen B2B Circular Marketplace
            </div>
            
            <h1 className="font-display text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight mb-4 md:mb-6">
              Industrial Waste <br />
              <span className="gradient-text">Re-imagined.</span>
            </h1>
            
            <p className="text-base md:text-lg text-eco-700 mb-6 md:mb-8 max-w-xl leading-relaxed">
              Connect directly with verified businesses. Turn your manufacturing byproduct, scrap metal, 
              and plastics into a new revenue stream while offsetting corporate carbon footprints.
            </p>

            {/* Search block */}
            <form onSubmit={handleSearch} className="glass-card p-1.5 md:p-2 flex items-center max-w-2xl border-white/10 hover:border-eco-500/30 transition-all duration-300 mb-6 md:mb-8 shadow-2xl">
              <div className="relative flex-1 flex items-center pl-2 md:pl-3">
                <Search className="w-4 h-4 md:w-5 md:h-5 text-eco-700 shrink-0" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-eco-100 placeholder-eco-800 px-2 md:px-3 py-2.5 md:py-3 text-sm md:text-base"
                />
              </div>
              <button type="submit" className="btn-primary py-2.5 md:py-3 px-4 md:px-6 flex items-center gap-1.5 md:gap-2 text-sm md:text-base shrink-0">
                Explore <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm text-eco-700">
              <span className="flex items-center gap-1.5 md:gap-2"><Building2 className="w-4 h-4 text-eco-500" /> 100% Verified Businesses</span>
              <span className="flex items-center gap-1.5 md:gap-2"><Flame className="w-4 h-4 text-eco-500" /> Live bidding enabled</span>
            </div>
          </div>

          {/* Circular visual — hidden on mobile, shown on desktop */}
          <div className="hidden lg:flex lg:col-span-5 relative justify-center items-center h-[450px]">
            <div className="absolute w-80 h-80 rounded-full border border-eco-500/20 animate-spin-slow" />
            <div className="absolute w-60 h-60 rounded-full border border-cyan-500/10" style={{ animationDuration: '16s' }} />
            <div className="relative w-40 h-40 rounded-full bg-eco-500/10 border border-eco-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.15)]">
              <Leaf className="w-16 h-16 text-eco-400" />
            </div>
            {['⚙️', '🧪', '📦', '💻', '♻️'].map((emoji, i) => (
              <div
                key={i}
                className="absolute flex flex-col items-center"
                style={{
                  top: `${50 - 43 * Math.cos((2 * Math.PI * i) / 5)}%`,
                  left: `${50 + 43 * Math.sin((2 * Math.PI * i) / 5)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-xl hover:scale-125 hover:border-eco-500 transition-all duration-300 cursor-pointer shadow-md">
                  {emoji}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES NAV ── */}
      <section className="py-8 md:py-12 border-t border-white/[0.06] bg-dark-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h2 className="font-display text-xl md:text-2xl font-bold">Featured Categories</h2>
              <p className="text-xs md:text-sm text-eco-700">Quickly filter waste materials by category</p>
            </div>
            <Link to="/marketplace" className="text-xs md:text-sm text-eco-400 hover:text-eco-200 flex items-center gap-1">
              All categories <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/marketplace?category=${encodeURIComponent(cat.name)}`}
                className={`glass-card p-3 md:p-5 text-center bg-gradient-to-b ${cat.color} border border-white/[0.06] ${cat.border} transition-all duration-300 hover:-translate-y-1 block`}
              >
                <span className="text-2xl md:text-3xl block mb-2 md:mb-3">{cat.emoji}</span>
                <span className="text-[10px] md:text-sm font-semibold text-eco-200 block truncate">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE MARKETPLACE FEED ── */}
      <section className="py-8 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="text-center mb-10 md:mb-16">
          <div className="section-tag"><Package className="w-3.5 h-3.5" /> Real-world Listings</div>
          <h2 className="font-display text-2xl md:text-4xl font-bold mt-2">Recently Listed Materials</h2>
          <p className="text-eco-700 mt-2 md:mt-3 max-w-xl mx-auto text-sm md:text-base">Explore actual corporate listings available for active trade and transaction bidding.</p>
        </div>

        {loadingListings ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card h-72 md:h-80 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : liveListings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {liveListings.map((listing) => (
              <MaterialCard key={listing._id} material={listing} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 md:p-12 text-center text-eco-700">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No materials currently listed. Be the first to list!</p>
          </div>
        )}

        <div className="text-center mt-8 md:mt-12">
          <Link to="/marketplace" className="btn-ghost inline-flex items-center gap-2">
            Explore All Listings <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-white/[0.06] py-8 md:py-12 bg-dark-400/40">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl md:text-4xl font-extrabold gradient-text mb-1">{s.value}</div>
              <div className="text-xs md:text-sm text-eco-700 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-8 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <div className="section-tag"><Zap className="w-3.5 h-3.5" /> Platform Features</div>
          <h2 className="font-display text-2xl md:text-4xl font-bold mt-2">Built for Industrial Commerce</h2>
          <p className="text-eco-700 mt-2 md:mt-3 max-w-xl mx-auto text-sm md:text-base">Six powerful modules working in sync to power circular supply chains at scale.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card p-4 md:p-6 hover:border-eco-500/30 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-eco-500/10 border border-eco-500/20 flex items-center justify-center text-eco-400 mb-3 md:mb-4 group-hover:bg-eco-500/20 transition-all">
                {f.icon}
              </div>
              <h3 className="font-display font-semibold mb-1 md:mb-2 text-eco-200 text-sm md:text-base">{f.title}</h3>
              <p className="text-xs md:text-sm text-eco-700 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-8 md:py-24 bg-dark-400/40 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <div className="section-tag"><RefreshCw className="w-3.5 h-3.5" /> Process Flow</div>
            <h2 className="font-display text-2xl md:text-4xl font-bold mt-2">How EcoLoop Connects Businesses</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="glass-card p-4 md:p-6 relative">
                <div className="font-display text-3xl md:text-5xl font-extrabold text-eco-500/20 mb-2 md:mb-4">{s.n}</div>
                <h3 className="font-display font-semibold mb-1 md:mb-2 text-eco-200 text-sm md:text-base">{s.title}</h3>
                <p className="text-xs md:text-sm text-eco-700 leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-eco-700 w-5 h-5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-8 md:py-24 max-w-7xl mx-auto px-4 text-center">
        <div className="glass-card max-w-3xl mx-auto p-8 md:p-12 border-eco-500/20 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-eco-500/5 to-transparent pointer-events-none" />
          <Leaf className="w-10 h-10 md:w-12 md:h-12 text-eco-400 mx-auto mb-4 md:mb-5 animate-pulse" />
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Ready to Close the Loop?</h2>
          <p className="text-eco-700 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">Join over 1,400+ industrial members who list, match, and trade circular materials today.</p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="btn-primary inline-flex items-center gap-2">
              Get Started for Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
