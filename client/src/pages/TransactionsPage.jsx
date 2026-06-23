/**
 * TransactionsPage — Full list of all deal negotiations for the current user
 */
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { transactionService } from '../services';
import TransactionCard from '../components/TransactionCard';
import { BarChart3, Filter, RefreshCw, Trophy, Clock, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { key: '',          label: 'All',       icon: BarChart3 },
  { key: 'pending',   label: 'Pending',   icon: Clock },
  { key: 'accepted',  label: 'Accepted',  icon: CheckCircle2 },
  { key: 'completed', label: 'Completed', icon: Trophy },
  { key: 'rejected',  label: 'Rejected',  icon: XCircle },
];

const TransactionsPage = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const isSeller = user?.role === 'seller';

  const fetchTransactions = useCallback(async (statusFilter, pageNum = 1) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const { data } = await transactionService.getAll(params);
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(activeTab, page);
  }, [fetchTransactions, activeTab, page]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleAction = async (id, status) => {
    try {
      await transactionService.updateStatus(id, status);
      const label = status === 'completed' ? 'completed' : status;
      toast.success(`Deal ${label} successfully!`);
      fetchTransactions(activeTab, page);
    } catch {
      toast.error('Action failed');
    }
  };

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchTransactions(activeTab, page);
    socket.on('transactionUpdated', refresh);
    socket.on('bidAccepted', refresh);
    return () => {
      socket.off('transactionUpdated', refresh);
      socket.off('bidAccepted', refresh);
    };
  }, [socket, fetchTransactions, activeTab, page]);

  const pages = Math.ceil(total / LIMIT);



  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-8 md:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-eco-100">
            {isSeller ? 'Incoming Requests' : 'My Deal Negotiations'}
          </h1>
          <p className="text-eco-400 text-sm mt-1">
            {isSeller
              ? 'All deal requests received from buyers, including auction-accepted bids.'
              : 'All your deal requests and auction wins, in one place.'}
          </p>
        </div>
        <button
          onClick={() => fetchTransactions(activeTab, page)}
          className="flex items-center justify-center gap-2 text-sm bg-dark-400 hover:bg-dark-300 text-eco-400 border border-dark-100 px-4 py-2 rounded-xl transition-all self-start sm:self-center"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeTab === t.key
                  ? 'bg-eco-500 text-dark-900 border-eco-500'
                  : 'bg-dark-400 text-eco-400 border-dark-100 hover:border-eco-500/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
        <span className="ml-auto self-center text-xs text-eco-600 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> {total} total
        </span>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse h-28 rounded-2xl" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="glass-card p-12 text-center text-eco-700">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No {activeTab || ''} deals found.</p>
          {!isSeller && activeTab === '' && (
            <p className="text-xs mt-1 text-eco-600">
              Head to the <a href="/marketplace" className="text-eco-400 hover:underline">marketplace</a> to initiate requests or bid on auctions.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => (
            <TransactionCard
              key={t._id}
              transaction={t}
              currentUserId={user._id}
              onAction={isSeller ? handleAction : null}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {[...Array(pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                page === i + 1
                  ? 'bg-eco-500 text-dark-900'
                  : 'bg-dark-400 text-eco-400 hover:bg-dark-300 border border-dark-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
