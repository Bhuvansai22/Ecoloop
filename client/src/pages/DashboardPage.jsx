/**
 * DashboardPage — Unified buyer/seller dashboard
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService, transactionService } from '../services';
import TransactionCard from '../components/TransactionCard';
import {
  Package, Leaf, BarChart3, Plus, ShoppingBag,
  TrendingUp, Eye, CheckCircle2, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, sub, color = 'eco' }) => (
  <div className="glass-card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-${color}-400 shrink-0`}>
      {icon}
    </div>
    <div>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-sm text-eco-700">{label}</div>
      {sub && <div className="text-xs text-eco-800 mt-0.5">{sub}</div>}
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);

  const isSeller = user?.role === 'seller';

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await userService.getDashboard();
        setStats(data.stats);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleTransactionAction = async (id, status) => {
    try {
      await transactionService.updateStatus(id, status);
      toast.success(`Deal ${status}`);
      // Refresh
      const { data } = await userService.getDashboard();
      setStats(data.stats);
    } catch {
      toast.error('Action failed');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-eco-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">
              {isSeller ? '📦' : '🛍️'} {isSeller ? 'Seller' : 'Buyer'} Dashboard
            </h1>
            <p className="text-eco-700 mt-1">Welcome back, <span className="text-eco-400">{user?.name}</span></p>
          </div>
          {isSeller && (
            <Link to="/materials/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> List Material
            </Link>
          )}
        </div>

        {/* Stat cards */}
        {isSeller ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Package className="w-5 h-5" />} label="Active Listings" value={stats?.listings?.active ?? 0} />
            <StatCard icon={<Eye className="w-5 h-5" />}     label="Total Views"    value={stats?.listings?.totalViews ?? 0} />
            <StatCard icon={<Clock className="w-5 h-5" />}   label="Pending Deals"  value={stats?.deals?.pending ?? 0} color="amber" />
            <StatCard icon={<Leaf className="w-5 h-5" />}    label="CO₂ Saved (kg)" value={(stats?.carbon?.totalSaved ?? 0).toLocaleString()} />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<ShoppingBag className="w-5 h-5" />}   label="Total Requests" value={stats?.deals?.total ?? 0} />
            <StatCard icon={<Clock className="w-5 h-5" />}         label="Pending"        value={stats?.deals?.pending ?? 0} color="amber" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />}  label="Completed"      value={stats?.deals?.completed ?? 0} />
            <StatCard icon={<Leaf className="w-5 h-5" />}          label="CO₂ Saved (kg)" value={(stats?.carbon?.totalSaved ?? 0).toLocaleString()} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-eco-500" /> Recent Activity
            </h2>
            {stats?.recentTransactions?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTransactions.map((t) => (
                  <TransactionCard
                    key={t._id}
                    transaction={t}
                    currentUserId={user._id}
                    onAction={isSeller ? handleTransactionAction : null}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-card p-10 text-center text-eco-700">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No transactions yet</p>
                <Link to="/marketplace" className="text-eco-400 text-sm hover:underline mt-2 block">
                  Browse marketplace →
                </Link>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div>
            <h2 className="font-display font-semibold mb-4">Quick Actions</h2>
            <div className="glass-card p-5 space-y-3">
              {isSeller ? (
                <>
                  <Link to="/materials/new"  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                    <Plus className="w-5 h-5 text-eco-500" />
                    <span className="text-sm group-hover:text-eco-400 transition-colors">Create New Listing</span>
                  </Link>
                  <Link to="/marketplace?my=true"   className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                    <Package className="w-5 h-5 text-eco-500" />
                    <span className="text-sm group-hover:text-eco-400 transition-colors">My Listings</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/marketplace"  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                    <ShoppingBag className="w-5 h-5 text-eco-500" />
                    <span className="text-sm group-hover:text-eco-400 transition-colors">Browse Marketplace</span>
                  </Link>
                  <Link to="/marketplace?matches=true" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                    <TrendingUp className="w-5 h-5 text-eco-500" />
                    <span className="text-sm group-hover:text-eco-400 transition-colors">Matched For You</span>
                  </Link>
                </>
              )}
              <Link to="/carbon" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                <Leaf className="w-5 h-5 text-eco-500" />
                <span className="text-sm group-hover:text-eco-400 transition-colors">Carbon Impact</span>
              </Link>
              <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                <BarChart3 className="w-5 h-5 text-eco-500" />
                <span className="text-sm group-hover:text-eco-400 transition-colors">Edit Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
