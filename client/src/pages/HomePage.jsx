/**
 * HomePage — Landing page
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Zap, Globe, BarChart3, ShieldCheck, RefreshCw } from 'lucide-react';

const STATS = [
  { label: 'Tonnes Diverted',    value: '500K+' },
  { label: 'Industries Joined',  value: '1,200+' },
  { label: 'CO₂ Saved (kg)',     value: '900M+' },
  { label: 'Active Listings',    value: '8,400+' },
];

const FEATURES = [
  { icon: <Zap className="w-6 h-6" />,          title: 'Smart Matching',     desc: 'AI-powered algorithm connects waste generators with the right buyers instantly.' },
  { icon: <Globe className="w-6 h-6" />,         title: 'Geo Discovery',      desc: 'Find materials near you using radius-based geospatial search on an interactive map.' },
  { icon: <Leaf className="w-6 h-6" />,          title: 'Carbon Tracking',    desc: 'Every transaction automatically calculates and logs your CO₂ savings.' },
  { icon: <ShieldCheck className="w-6 h-6" />,   title: 'Verified Businesses',desc: 'Trust badges and verification for all listed industries on the platform.' },
  { icon: <BarChart3 className="w-6 h-6" />,     title: 'ESG Dashboard',      desc: 'Visual dashboards for environmental impact reporting and green portfolio building.' },
  { icon: <RefreshCw className="w-6 h-6" />,     title: 'Circular Economy',   desc: 'Close the loop — one company\'s waste becomes another\'s raw material.' },
];

const STEPS = [
  { n: '01', title: 'Register & List',    desc: 'Sellers post waste materials with quantity, photos, and location.' },
  { n: '02', title: 'Get Matched',        desc: 'Buyers discover relevant listings via smart filters and geo-search.' },
  { n: '03', title: 'Negotiate & Deal',   desc: 'Built-in messaging to finalize terms and request transactions.' },
  { n: '04', title: 'Track Your Impact',  desc: 'CO₂ savings are calculated and credited to your green dashboard.' },
];

const HomePage = () => (
  <div className="min-h-screen">
    {/* ── HERO ── */}
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden bg-mesh">
      {/* Decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-eco-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-up">
          <div className="section-tag">
            <Leaf className="w-3.5 h-3.5" /> B2B Circular Economy Platform
          </div>
          <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
            We Connect <br />
            <span className="gradient-text">Waste to</span> <br />
            Opportunity
          </h1>
          <p className="text-lg text-eco-700 mb-8 max-w-lg leading-relaxed">
            EcoLoop is the marketplace where industrial waste becomes valuable raw materials —
            reducing costs, cutting carbon, and accelerating the circular economy.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base">
              Start for Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/marketplace" className="btn-ghost inline-flex items-center gap-2 text-base">
              Browse Marketplace
            </Link>
          </div>
        </div>

        {/* Animated circular graphic */}
        <div className="relative flex justify-center items-center h-[420px]">
          <div className="absolute w-72 h-72 rounded-full border border-eco-500/20 animate-spin-slow" />
          <div className="absolute w-52 h-52 rounded-full border border-eco-500/10" style={{ animationDuration: '14s' }} />
          <div className="relative w-36 h-36 rounded-full bg-eco-500/10 border border-eco-500/30 flex items-center justify-center">
            <Leaf className="w-14 h-14 text-eco-400" />
          </div>
          {/* Orbiting nodes */}
          {['🏭', '📦', '🤝', '🌿', '📍'].map((emoji, i) => (
            <div
              key={i}
              className="absolute flex flex-col items-center gap-1"
              style={{
                top: `${50 - 42 * Math.cos((2 * Math.PI * i) / 5)}%`,
                left: `${50 + 42 * Math.sin((2 * Math.PI * i) / 5)}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-xl hover:scale-110 transition-transform">
                {emoji}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── STATS ── */}
    <section className="border-y border-white/[0.06] py-12 bg-dark-400/40">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-3xl font-bold gradient-text mb-1">{s.value}</div>
            <div className="text-sm text-eco-700">{s.label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* ── FEATURES ── */}
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="section-tag"><Zap className="w-3.5 h-3.5" /> Platform Features</div>
        <h2 className="font-display text-4xl font-bold mt-2">Everything You Need</h2>
        <p className="text-eco-700 mt-3 max-w-xl mx-auto">Six powerful modules working in sync to power industrial symbiosis at scale.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass-card p-6 hover:border-eco-500/30 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-11 h-11 rounded-xl bg-eco-500/10 border border-eco-500/20 flex items-center justify-center text-eco-400 mb-4 group-hover:bg-eco-500/20 transition-all">
              {f.icon}
            </div>
            <h3 className="font-display font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-eco-700 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── HOW IT WORKS ─── */}
    <section id="how-it-works" className="py-24 bg-dark-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="section-tag"><RefreshCw className="w-3.5 h-3.5" /> Process</div>
          <h2 className="font-display text-4xl font-bold mt-2">How EcoLoop Works</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.n} className="glass-card p-6 relative">
              <div className="font-display text-5xl font-extrabold text-eco-500/20 mb-4">{s.n}</div>
              <h3 className="font-display font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-eco-700">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-eco-700 w-5 h-5" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA ── */}
    <section className="py-24 max-w-7xl mx-auto px-4 text-center">
      <div className="glass-card max-w-2xl mx-auto p-12 border-eco-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-eco-500/5 to-transparent" />
        <Leaf className="w-12 h-12 text-eco-400 mx-auto mb-5" />
        <h2 className="font-display text-3xl font-bold mb-4">Ready to Close the Loop?</h2>
        <p className="text-eco-700 mb-8">Join 1,200+ industries already reducing waste and carbon impact on EcoLoop.</p>
        <Link to="/register" className="btn-primary inline-flex items-center gap-2">
          Join EcoLoop Free <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>

    {/* ── FOOTER ── */}
    <footer className="border-t border-white/[0.06] py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-eco-800">
        <div className="flex items-center gap-2 font-display font-bold text-eco-200">
          <Leaf className="w-4 h-4 text-eco-500" /> EcoLoop
        </div>
        <p>© 2025 EcoLoop. B2B Circular Economy Platform. MERN Stack.</p>
        <div className="flex gap-4">
          <Link to="/marketplace" className="hover:text-eco-400 transition-colors">Marketplace</Link>
          <Link to="/register"    className="hover:text-eco-400 transition-colors">Register</Link>
        </div>
      </div>
    </footer>
  </div>
);

export default HomePage;
