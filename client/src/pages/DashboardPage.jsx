/**
 * DashboardPage — Personalized B2B sustainability dashboard with gamification
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { userService, transactionService, materialService } from '../services';
import TransactionCard from '../components/TransactionCard';
import MaterialCard from '../components/MaterialCard';
import {
  Package, Leaf, BarChart3, Plus, ShoppingBag,
  TrendingUp, Eye, CheckCircle2, Clock, BadgeCheck,
  MessageSquare, Sparkles, Building2, Star, Award,
  Trees, Car, Plane, ChevronRight, User
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLOR_MAPS = {
  eco: {
    bg: 'bg-eco-500/10 dark:bg-eco-500/20',
    border: 'border-eco-500/20 dark:border-eco-500/30',
    text: 'text-eco-600 dark:text-eco-400'
  },
  teal: {
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
    border: 'border-teal-500/20 dark:border-teal-500/30',
    text: 'text-teal-600 dark:text-teal-400'
  },
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-500/20 dark:border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400'
  },
  sky: {
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    border: 'border-sky-500/20 dark:border-sky-500/30',
    text: 'text-sky-600 dark:text-sky-400'
  }
};

const StatCard = ({ icon, label, value, sub, color = 'eco' }) => {
  const colors = COLOR_MAPS[color] || COLOR_MAPS.eco;
  return (
    <div className="glass-card p-5 flex items-center gap-4 hover:-translate-y-1 hover:border-eco-500/20 transition-all duration-300 flex-shrink-0 w-72 md:w-auto snap-center select-none">
      <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-display text-xl md:text-2xl font-bold text-eco-100 truncate">{value}</div>
        <div className="text-sm font-semibold text-eco-200 truncate">{label}</div>
        {sub && <div className="text-xs text-eco-300 mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user, updateUser } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Buyer Specific states
  const [matches, setMatches] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  // Seller Specific states
  const [myListings, setMyListings] = useState([]);


  const isSeller = user?.role === 'seller';

  const loadDashboardData = useCallback(async () => {
    try {
      if (user?.role === 'seller') {
        const [dashboardRes, profileRes, myListingsRes] = await Promise.all([
          userService.getDashboard(),
          userService.getProfile(),
          materialService.getMy({ limit: 5 })
        ]);
        setStats(dashboardRes.data.stats);
        updateUser(profileRes.data.user);
        setMyListings(myListingsRes.data.materials || []);
      } else {
        const [dashboardRes, profileRes, matchDataRes, newArrivalDataRes] = await Promise.all([
          userService.getDashboard(),
          userService.getProfile(),
          materialService.getMatches(),
          materialService.getAll({ limit: 3 })
        ]);
        setStats(dashboardRes.data.stats);
        updateUser(profileRes.data.user);
        setMatches(matchDataRes.data.matches || []);
        setNewArrivals(newArrivalDataRes.data.materials || []);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.role, updateUser]);

  // Fetch fresh data every time the dashboard mounts or user/role changes
  useEffect(() => {
    if (user) {
      setLoading(true);
      loadDashboardData();
    }
  }, [loadDashboardData]);

  // Real-time updates via socket: refresh dashboard when a transaction changes
  useEffect(() => {
    if (!socket) return;

    const handleTransactionUpdate = () => {
      loadDashboardData();
    };

    socket.on('transactionUpdated', handleTransactionUpdate);
    socket.on('bidAccepted', handleTransactionUpdate);

    return () => {
      socket.off('transactionUpdated', handleTransactionUpdate);
      socket.off('bidAccepted', handleTransactionUpdate);
    };
  }, [socket, loadDashboardData]);

  const handleTransactionAction = async (id, status) => {
    try {
      await transactionService.updateStatus(id, status);
      toast.success(`Deal completed successfully! +100 EcoPoints earned.`);
      loadDashboardData();
    } catch {
      toast.error('Action failed');
    }
  };



  // Extract active sellers for the buyer directory
  const getVerifiedSellers = () => {
    const sellersMap = new Map();
    [...matches, ...newArrivals].forEach((item) => {
      const s = item.seller;
      if (s && s._id && s.verified) {
        sellersMap.set(s._id, s);
      }
    });
    return Array.from(sellersMap.values()).slice(0, 5);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-eco-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalSaved = stats?.carbon?.totalSaved || 0;
  const treesEquiv = Math.round(totalSaved / 22);
  const carKmAvoided = Math.round(totalSaved / 0.17);
  const flightHours = +(totalSaved / 90).toFixed(1);

  const verifiedSellers = getVerifiedSellers();

  return (
    <div className="min-h-screen pt-20 pb-12 px-3 md:px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* ── PERSONALIZED WELCOME BLOCK ── */}
        <div className="glass-card p-4 md:p-6 mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-eco-500/5 to-transparent pointer-events-none" />
          <div className="z-10">
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              Welcome back, <span className="gradient-text">{user?.name?.trim()}</span>!
            </h1>
            <p className="text-eco-400 font-medium mt-1 text-sm md:text-base">
              🌱 Continue your sustainability journey.
            </p>
            {user?.badges?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-2 md:mt-3">
                <span className="text-[10px] md:text-xs text-eco-300 font-semibold mr-1">Achievements:</span>
                {user.badges.map((b) => (
                  <span key={b} className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] md:text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 hover:scale-105 transition-all duration-200">
                    🏆 {b}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 shrink-0 z-10">
            <Link to="/marketplace" className="btn-primary flex items-center gap-2 text-xs md:text-sm py-2.5 px-4">
              <ShoppingBag className="w-4 h-4" /> Explore Marketplace
            </Link>
            {isSeller && (
              <Link to="/materials/new" className="bg-dark-400 hover:bg-dark-200 border border-dark-100/60 text-eco-100 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-semibold transition-all flex items-center gap-2">
                <Plus className="w-4 h-4 text-eco-500" /> List Material
              </Link>
            )}
          </div>
        </div>

        {/* ── MODERN DASHBOARD IMPACT CARDS ── */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 mb-6 md:mb-8 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:pb-0 snap-x snap-mandatory">
          <StatCard 
            icon={<Leaf className="w-5 h-5" />} 
            label="Total CO₂ Saved" 
            value={`${totalSaved.toLocaleString()} kg`} 
            sub={`Across ${stats?.deals?.completed || 0} completed trades`}
            color="eco"
          />
          <StatCard 
            icon={<CheckCircle2 className="w-5 h-5" />} 
            label="Materials Reused" 
            value={user?.materialsReused ?? 0} 
            sub="Active circular exchanges"
            color="teal"
          />
          <StatCard 
            icon={<Star className="w-5 h-5" />} 
            label="EcoPoints Earned" 
            value={user?.ecoPoints ?? 50} 
            sub="Convert points to rewards"
            color="amber"
          />
          <StatCard 
            icon={<Award className="w-5 h-5" />} 
            label="Sustainability Rank" 
            value={user?.sustainabilityScore ? `${user.sustainabilityScore}%` : '45%'} 
            sub="Overall circular score"
            color="sky"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* ── LEFT & CENTER COLUMNS ── */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* QUICK ACTIONS ROW */}
            <div>
              <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                ⚡ Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <Link to="/marketplace" className="glass-card p-4 text-center hover:bg-eco-50/50 border hover:border-eco-500/30 transition-all duration-300 text-eco-100">
                  <ShoppingBag className="w-6 h-6 mx-auto text-eco-500 mb-2" />
                  <div className="text-xs font-bold">Buy Materials</div>
                </Link>
                {isSeller ? (
                  <Link to="/materials/new" className="glass-card p-4 text-center hover:bg-eco-50/50 border hover:border-eco-500/30 transition-all duration-300 text-eco-100">
                    <Plus className="w-6 h-6 mx-auto text-eco-500 mb-2" />
                    <div className="text-xs font-bold">List Material</div>
                  </Link>
                ) : (
                  <Link to="/profile" className="glass-card p-4 text-center hover:bg-eco-50/50 border hover:border-eco-500/30 transition-all duration-300 text-eco-100">
                    <Building2 className="w-6 h-6 mx-auto text-eco-500 mb-2" />
                    <div className="text-xs font-bold">Setup Company</div>
                  </Link>
                )}
                <Link to="/carbon" className="glass-card p-4 text-center hover:bg-eco-50/50 border hover:border-eco-500/30 transition-all duration-300 text-eco-100">
                  <Leaf className="w-6 h-6 mx-auto text-eco-500 mb-2" />
                  <div className="text-xs font-bold">Carbon Impact</div>
                </Link>
                <Link to="/profile" className="glass-card p-4 text-center hover:bg-eco-50/50 border hover:border-eco-500/30 transition-all duration-300 text-eco-100">
                  <User className="w-6 h-6 mx-auto text-eco-500 mb-2" />
                  <div className="text-xs font-bold">My Journey</div>
                </Link>
              </div>
            </div>

            {/* BUYER FEED VIEW */}
            {!isSeller && (
              <>
                {/* Matches For Your Industry */}
                <div>
                  <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2 text-eco-200">
                    <Sparkles className="w-5 h-5 text-eco-400 animate-pulse" /> Matches For Your Industry ({user?.industryType || 'General'})
                  </h2>
                  
                  {matches.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-5">
                      {matches.slice(0, 4).map((m) => (
                        <MaterialCard key={m._id} material={m} compact />
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card p-6 text-center text-eco-700">
                      <p className="text-sm">No specific matches for your industry yet.</p>
                      <Link to="/profile" className="text-xs text-eco-400 mt-1 block hover:underline">
                        Update industry preferences in profile →
                      </Link>
                    </div>
                  )}
                </div>

                {/* New Arrivals */}
                <div>
                  <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2 text-eco-200">
                    <TrendingUp className="w-5 h-5 text-eco-500" /> New Arrivals in Marketplace
                  </h2>
                  {newArrivals.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-5">
                      {newArrivals.map((m) => (
                        <MaterialCard key={m._id} material={m} compact />
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card p-6 text-center text-eco-700">
                      <p>No new listings found.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SELLER FEED VIEW */}
            {isSeller && (
              <div>
                <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2 text-eco-200">
                  <Package className="w-5 h-5 text-eco-500" /> My Listed Materials
                </h2>
                {myListings.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-5">
                    {myListings.map((m) => (
                      <MaterialCard key={m._id} material={m} compact />
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center text-eco-700">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="mb-4">You haven't listed any materials yet.</p>
                    <Link to="/materials/new" className="btn-primary py-2 px-4 text-sm inline-block">
                      List Your First Material
                    </Link>
                  </div>
                )}
              </div>
            )}





          </div>

          {/* ── RIGHT COLUMN: ACTIVE DEALS & ACTIVITIES ── */}
          <div className="space-y-8">
            
            {/* Active Negotiations & Deal Status Tracker */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-xl flex items-center gap-2 text-eco-200">
                  <Clock className="w-5 h-5 text-eco-400" /> {isSeller ? 'Incoming Deal Requests' : 'My Deal Negotiations'}
                </h2>
                <Link to="/transactions" className="text-xs text-eco-400 hover:text-eco-300 flex items-center gap-1 transition-colors">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {stats?.recentTransactions?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentTransactions.slice(0, 5).map((t) => (
                    <TransactionCard
                      key={t._id}
                      transaction={t}
                      currentUserId={user._id}
                      onAction={isSeller ? handleTransactionAction : null}
                    />
                  ))}
                  {stats.recentTransactions.length > 5 && (
                    <Link to="/transactions" className="block text-center text-xs text-eco-400 hover:text-eco-300 py-2 border border-dashed border-dark-100 rounded-xl hover:border-eco-500/30 transition-all">
                      +{stats.recentTransactions.length - 5} more deals → View all
                    </Link>
                  )}
                </div>
              ) : (
                <div className="glass-card p-8 text-center text-eco-700">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-35" />
                  <p className="text-sm">No ongoing deal negotiations.</p>
                  {!isSeller && (
                    <Link to="/marketplace" className="text-xs text-eco-400 mt-1 block hover:underline">
                      Initiate a request from the marketplace →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* ── RECENT ACTIVITY FEED ── */}
            <div>
              <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-eco-500" /> Recent Activities
              </h2>
              {user?.activities?.length > 0 ? (
                <div className="glass-card p-4 space-y-3">
                  {[...user.activities].reverse().slice(0, 4).map((act, idx) => (
                    <div key={idx} className="flex justify-between items-start pb-2 border-b border-dark-100/30 last:border-b-0 last:pb-0">
                      <div>
                        <div className="text-xs font-semibold text-eco-100">{act.description}</div>
                        <div className="text-[9px] text-eco-300 mt-0.5">{act.type}</div>
                      </div>
                      <span className="text-[10px] text-eco-500 bg-eco-50 border border-eco-200 px-1.5 py-0.5 rounded font-extrabold shrink-0 ml-2">
                        +{act.points} pts
                      </span>
                    </div>
                  ))}
                  <Link to="/profile" className="text-xs text-eco-400 block text-center hover:underline mt-2">
                    View complete sustainability history →
                  </Link>
                </div>
              ) : (
                <div className="glass-card p-6 text-center text-eco-700 text-xs">
                  No activity log found.
                </div>
              )}
            </div>

            {/* Buyer Specific Side Section: Verified Sellers Directory */}
            {!isSeller && verifiedSellers.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2 text-eco-200">
                  <Building2 className="w-5 h-5 text-eco-500" /> Active Verified Sellers
                </h2>
                <div className="glass-card p-4 space-y-4">
                  {verifiedSellers.map((seller) => (
                    <div key={seller._id} className="flex items-center justify-between pb-3 border-b border-dark-100/30 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-eco-500/10 border border-eco-500/20 flex items-center justify-center font-bold text-xs text-eco-400 shrink-0">
                          {seller.name?.[0] || 'S'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-eco-200 flex items-center gap-1">
                            <span className="truncate">{seller.companyName || seller.name}</span>
                            <BadgeCheck className="w-3.5 h-3.5 text-eco-500 shrink-0" />
                          </div>
                          <span className="text-[10px] text-eco-700 block">{seller.industryType || 'Industrial Seller'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/messages?user=${seller._id}`)}
                        className="p-1.5 rounded-lg bg-dark-400 hover:bg-dark-200 text-eco-500 border border-dark-100 transition-all"
                        title="Contact Seller"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Quick Actions */}
            <div>
              <h2 className="font-display font-bold text-xl mb-4">Impact Reports</h2>
              <div className="glass-card p-5 space-y-3">
                <Link to="/carbon" className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <Leaf className="w-5 h-5 text-eco-500" />
                    <span className="text-sm group-hover:text-eco-500 transition-colors">Carbon Impact Report</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-eco-300" />
                </Link>
                <Link to="/profile" className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-eco-500" />
                    <span className="text-sm group-hover:text-eco-500 transition-colors">Company & Profile Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-eco-300" />
                </Link>
              </div>
            </div>
            
          </div>

        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
