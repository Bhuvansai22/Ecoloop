/**
 * Footer — modern glassmorphism site footer
 */
import { Link } from 'react-router-dom';
import { Leaf, Mail, ShieldAlert, Sparkles, Building } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-dark-400/40 backdrop-blur-md relative overflow-hidden">
      {/* Light mesh highlight */}
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-eco-500/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 font-display font-extrabold text-lg">
              <div className="w-7 h-7 rounded-lg bg-eco-500/10 border border-eco-500/20 flex items-center justify-center">
                <Leaf className="text-eco-400 w-4 h-4" />
              </div>
              <span className="text-white">Eco<span className="text-eco-400 font-medium">Loop</span></span>
            </Link>
            <p className="text-xs text-eco-700 max-w-sm leading-relaxed">
              EcoLoop is a premium B2B industrial waste recycling and circular economy marketplace. 
              We empower manufacturing businesses to trade byproducts, track carbon emissions, 
              and build zero-waste supply chains.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-eco-400 font-bold mb-4">Discover</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/marketplace" className="text-eco-700 hover:text-eco-300 transition-colors">
                  Waste Marketplace
                </Link>
              </li>
              <li>
                <a href="/#how-it-works" className="text-eco-700 hover:text-eco-300 transition-colors">
                  Circular Mechanics
                </a>
              </li>
              <li>
                <Link to="/carbon" className="text-eco-700 hover:text-eco-300 transition-colors">
                  Emissions Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Trust Stats */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-eco-400 font-bold mb-4">Circular Trust</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-eco-200">
                <Sparkles className="w-4 h-4 text-eco-400 shrink-0" />
                <span>Verified Materials Traceability</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-eco-200">
                <Building className="w-4 h-4 text-eco-400 shrink-0" />
                <span>Verified B2B Suppliers</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-eco-200">
                <Mail className="w-4 h-4 text-eco-400 shrink-0" />
                <span className="truncate">support@ecoloop.in</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright banner */}
        <div className="pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-eco-800">
          <div>
            © {new Date().getFullYear()} EcoLoop Technologies. All rights reserved.
          </div>
          <div className="flex gap-4">
            <span className="hover:text-eco-700 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-eco-700 cursor-pointer">Terms of Service</span>
            <span className="hover:text-eco-700 cursor-pointer">E-Waste Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
