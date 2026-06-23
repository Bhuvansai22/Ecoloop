/**
 * AdminPage — user management and listing oversight
 */
import { useEffect, useState } from 'react';
import { userService, materialService } from '../services';
import toast from 'react-hot-toast';
import { BadgeCheck, Package, Users, ShieldCheck, Trash2, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { confirmToast } from '../components/ConfirmToast';

const AdminPage = () => {
  const [tab,      setTab]      = useState('users');
  const [users,    setUsers]    = useState([]);
  const [materials,setMaterials]= useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [uTotal,   setUTotal]   = useState(0);
  const [mTotal,   setMTotal]   = useState(0);

  const loadUsers = async (q = '') => {
    setLoading(true);
    try {
      const { data } = await userService.getAllUsers({ search: q, limit: 30 });
      setUsers(data.users);
      setUTotal(data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const loadMaterials = async (q = '') => {
    setLoading(true);
    try {
      const { data } = await materialService.getAll({ search: q, limit: 30, status: '' });
      setMaterials(data.materials);
      setMTotal(data.total);
    } catch { toast.error('Failed to load materials'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'users')     loadUsers(search);
    if (tab === 'materials') loadMaterials(search);
  }, [tab, search]);

  const handleVerify = async (id) => {
    try {
      const { data } = await userService.toggleVerify(id);
      setUsers((prev) => prev.map((u) => u._id === id ? data.user : u));
      toast.success(data.message);
    } catch { toast.error('Action failed'); }
  };

  const handleDeleteMaterial = async (id) => {
    const confirmed = await confirmToast('Delete this listing permanently?', {
      confirmText: 'Yes, delete',
      icon: '🗑️',
    });
    if (!confirmed) return;
    try {
      await materialService.delete(id);
      setMaterials((prev) => prev.filter((m) => m._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-3xl font-bold mb-2">🛡️ Admin Panel</h1>
        <p className="text-eco-700 mb-8">Manage users, listings, and platform verification.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-5 flex items-center gap-4">
            <Users className="w-8 h-8 text-eco-400" />
            <div>
              <div className="font-display text-2xl font-bold">{uTotal}</div>
              <div className="text-sm text-eco-700">Total Users</div>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <Package className="w-8 h-8 text-eco-400" />
            <div>
              <div className="font-display text-2xl font-bold">{mTotal}</div>
              <div className="text-sm text-eco-700">Total Listings</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['users', 'materials'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all capitalize ${
                tab === t ? 'bg-eco-500/20 border border-eco-500/40 text-eco-400' : 'btn-ghost'
              }`}>{t}</button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-eco-700" />
          <input
            type="text" placeholder={`Search ${tab}...`}
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 py-2.5"
          />
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="glass-card h-16 animate-pulse" />)}</div>
        ) : tab === 'users' ? (
          <div className="glass-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-eco-700 text-xs uppercase tracking-wider">
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Industry</th>
                  <th className="text-left p-4">Joined</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-eco-600/20 flex items-center justify-center text-eco-400 font-bold text-xs">
                          {u.name?.[0]}
                        </div>
                        <div>
                          <div className="font-medium text-xs flex items-center gap-1">
                            {u.name}
                            {u.verified && <BadgeCheck className="w-3.5 h-3.5 text-eco-400" />}
                          </div>
                          <div className="text-eco-800 text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 capitalize">
                      <span className={`status-badge text-xs ${
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-400'
                        : u.role === 'seller' ? 'bg-eco-500/20 text-eco-400'
                        : 'bg-blue-500/20 text-blue-400'
                      }`}>{u.role}</span>
                    </td>
                    <td className="p-4 text-eco-700 text-xs">{u.industryType || '—'}</td>
                    <td className="p-4 text-eco-800 text-xs">
                      {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : '—'}
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleVerify(u._id)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          u.verified
                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                            : 'border-eco-500/30 text-eco-400 hover:bg-eco-500/10'
                        }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {u.verified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((m) => (
              <div key={m._id} className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-300 shrink-0">
                  {m.images?.[0]?.url
                    ? <img src={m.images[0].url} alt="" className="w-full h-full object-cover" />
                    : <Package className="w-6 h-6 text-eco-800 m-3" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{m.title}</div>
                  <div className="text-xs text-eco-700">{m.category} · {m.quantity?.value} {m.quantity?.unit} · ₹{m.price?.amount}</div>
                  <div className="text-xs text-eco-800">{m.seller?.companyName || m.seller?.name}</div>
                </div>
                <span className={`status-badge text-xs ${
                  m.status === 'active' ? 'bg-eco-500/20 text-eco-400' : 'bg-gray-500/20 text-gray-400'
                }`}>{m.status}</span>
                <button onClick={() => handleDeleteMaterial(m._id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
