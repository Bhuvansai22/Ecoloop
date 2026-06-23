/**
 * ProfilePage — Edit company profile, view achievements, badges, and activity history
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { 
  BadgeCheck, Camera, Leaf, Award, Trophy, Star, 
  History, Lock, Unlock, Calendar, Settings, Compass
} from 'lucide-react';

const INDUSTRY_TYPES = [
  'Manufacturing', 'Construction', 'Agriculture', 'Chemical',
  'Textile', 'Food & Beverage', 'Automotive', 'Electronics',
  'Pharmaceutical', 'Mining', 'Paper & Pulp', 'Other',
];

const BADGES_LIST = [
  {
    name: 'Eco Beginner',
    emoji: '🔰',
    points: 0,
    description: 'Awarded to all members for joining the circular economy movement.',
    color: 'emerald'
  },
  {
    name: 'Green Advocate',
    emoji: '🌿',
    points: 200,
    description: 'Awarded for active listings, footprint assessments, and recycling efforts.',
    color: 'teal'
  },
  {
    name: 'Sustainability Champion',
    emoji: '🏆',
    points: 500,
    description: 'Awarded to top partners redirecting bulk waste streams and driving zero-waste chains.',
    color: 'amber'
  }
];

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(user?.avatar || '');
  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' or 'settings'

  const { register, handleSubmit, reset, setValue } = useForm();

  const handleAutoFetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    const toastId = toast.loading('Fetching coordinates...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setValue('lat', latitude.toFixed(6));
        setValue('lng', longitude.toFixed(6));
        
        toast.loading('Reverse-geocoding address...', { id: toastId });
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || addr.suburb || '';
            const state = addr.state || '';
            
            setValue('city', city);
            setValue('state', state);
            toast.success('Location fetched successfully! 📍', { id: toastId });
          } else {
            toast.success('Coordinates fetched! (Could not reverse-geocode)', { id: toastId });
          }
        } catch {
          toast.success('Coordinates fetched! (Reverse-geocode failed)', { id: toastId });
        }
      },
      (error) => {
        toast.error('Could not get position: ' + error.message, { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        companyName: user.companyName || '',
        industryType: user.industryType || '',
        bio: user.bio || '',
        phone: user.phone || '',
        website: user.website || '',
        city: user.location?.city || '',
        state: user.location?.state || '',
        country: user.location?.country || 'India',
        lat: user.location?.lat || '',
        lng: user.location?.lng || '',
      });
    }
  }, [user, reset]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: ([file]) => {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          fd.append(k, v);
        }
      });
      // Nest location fields
      const location = {
        city: data.city,
        state: data.state,
        country: data.country,
        lat: data.lat ? Number(data.lat) : undefined,
        lng: data.lng ? Number(data.lng) : undefined
      };
      fd.set('location', JSON.stringify(location));
      if (avatar) fd.append('avatar', avatar);

      const { data: res } = await userService.update(fd);
      updateUser(res.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const scoreRank = (score) => {
    if (score >= 75) return { label: 'Sustainability Champion', color: 'text-amber-400' };
    if (score >= 50) return { label: 'Green Advocate', color: 'text-teal-400' };
    return { label: 'Eco Beginner', color: 'text-emerald-400' };
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-3 md:px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Profile Header Card */}
        <div className="glass-card p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-eco-500/5 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center gap-6 z-10">
            <div {...getRootProps()} className="relative cursor-pointer group shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-eco-600/20 flex items-center justify-center border-2 border-eco-500/30">
                {preview ? (
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-eco-400">{user?.name?.[0]}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <input {...getInputProps()} />
            </div>
            
            <div className="text-center md:text-left">
              <div className="font-display font-bold text-2xl flex items-center justify-center md:justify-start gap-2">
                {user?.name}
                {user?.verified && <BadgeCheck className="w-6 h-6 text-eco-400" />}
              </div>
              <div className="text-sm text-eco-700 mt-1">{user?.email}</div>
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                <span className="px-2.5 py-0.5 rounded-full bg-eco-500/10 border border-eco-500/20 text-xs font-medium capitalize text-eco-400">
                  {user?.role}
                </span>
                {user?.industryType && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-eco-200">
                    🏭 {user.industryType}
                  </span>
                )}
                {user?.location?.city && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-eco-200">
                    📍 {user.location.city}, {user.location.state}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide border-b border-white/10 mb-6 md:mb-8 pb-0">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`pb-3 font-display font-semibold text-sm flex items-center gap-1.5 md:gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'achievements'
                ? 'border-eco-500 text-eco-400'
                : 'border-transparent text-eco-700 hover:text-eco-300'
            }`}
          >
            <Compass className="w-4 h-4" /> Journey
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 font-display font-semibold text-sm flex items-center gap-1.5 md:gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-eco-500 text-eco-400'
                : 'border-transparent text-eco-700 hover:text-eco-300'
            }`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>

        {/* ── TAB CONTENT: ACHIEVEMENTS & JOURNEY ── */}
        {activeTab === 'achievements' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Sustainability Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              
              {/* EcoPoints summary */}
              <div className="glass-card p-5 text-center flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-eco-500/10 border border-eco-500/20 flex items-center justify-center text-eco-400 mx-auto mb-3">
                    <Star className="w-6 h-6" />
                  </div>
                  <div className="font-display text-3xl font-extrabold text-eco-200">
                    {user?.ecoPoints ?? 50}
                  </div>
                  <div className="text-sm text-eco-400 font-medium mt-1">EcoPoints Earned</div>
                  <p className="text-xs text-eco-700 mt-2">Earn more by participating in marketplace trades and assessments.</p>
                </div>
              </div>

              {/* Circular Score */}
              <div className="glass-card p-5 flex flex-col justify-between">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mx-auto mb-3">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="font-display text-3xl font-extrabold text-teal-200">
                    {user?.sustainabilityScore ?? 45}%
                  </div>
                  <div className="text-sm text-teal-400 font-medium mt-1">Circular Score</div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-dark-300 h-2 rounded-full mt-4">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                      style={{ width: `${user?.sustainabilityScore ?? 45}%` }}
                    />
                  </div>
                </div>
                <div className="text-center mt-3">
                  <span className={`text-xs font-semibold ${scoreRank(user?.sustainabilityScore ?? 45).color}`}>
                    Rank: {scoreRank(user?.sustainabilityScore ?? 45).label}
                  </span>
                </div>
              </div>

              {/* Total CO2 Diverted */}
              <div className="glass-card p-5 text-center flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div className="font-display text-3xl font-extrabold text-emerald-200">
                    {(user?.carbonStats?.totalSaved || 0).toLocaleString()} kg
                  </div>
                  <div className="text-sm text-emerald-400 font-medium mt-1">Total CO₂ Saved</div>
                  <p className="text-xs text-eco-700 mt-2">Prevented through {user?.carbonStats?.totalTransactions || 0} completed material cycles.</p>
                </div>
              </div>
            </div>

            {/* Badges Milestones Section */}
            <div>
              <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2 text-eco-200">
                <Trophy className="w-5 h-5 text-amber-500" /> Sustainability Milestones & Badges
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
                {BADGES_LIST.map((badge) => {
                  const isUnlocked = user?.badges?.includes(badge.name) || (user?.ecoPoints >= badge.points);
                  return (
                    <div 
                      key={badge.name} 
                      className={`glass-card p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                        isUnlocked 
                          ? 'border-eco-500/30 bg-gradient-to-b from-eco-500/[0.03] to-transparent' 
                          : 'opacity-50 border-white/5'
                      }`}
                    >
                      <div className="absolute top-3 right-3">
                        {isUnlocked ? (
                          <span className="flex items-center gap-1 text-[10px] text-eco-400 font-semibold bg-eco-500/10 border border-eco-500/20 rounded-full px-2 py-0.5">
                            <Unlock className="w-2.5 h-2.5" /> Unlocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-eco-800 font-semibold bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                            <Lock className="w-2.5 h-2.5" /> Locked ({badge.points} pts)
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-3xl mb-3">{badge.emoji}</div>
                        <h3 className="font-display font-bold text-base text-eco-200">{badge.name}</h3>
                        <p className="text-xs text-eco-700 mt-2 leading-relaxed">{badge.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/[0.04]">
                        <span className="text-[10px] uppercase tracking-wider text-eco-800">
                          {isUnlocked ? 'Completed' : `Reach ${badge.points} EcoPoints`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity History Logs */}
            <div>
              <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2 text-eco-200">
                <History className="w-5 h-5 text-teal-500" /> Sustainability Activity History
              </h2>
              
              {user?.activities?.length > 0 ? (
                <div className="glass-card p-4 space-y-4">
                  {[...user.activities].reverse().map((act, idx) => (
                    <div 
                      key={act._id || idx} 
                      className="flex items-center justify-between pb-3 border-b border-white/[0.04] last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {act.type === 'Welcome Bonus' ? '🎁' : act.type === 'Carbon Assessment' ? '📊' : '🔄'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-eco-200">{act.description}</div>
                          <span className="text-[10px] text-eco-700 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" /> {new Date(act.createdAt).toLocaleDateString()} · {act.type}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-eco-400 bg-eco-500/10 border border-eco-500/20 px-2 py-0.5 rounded-md">
                          +{act.points} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 text-center text-eco-700">
                  <p>No activity records logged yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: SETTINGS & ACCOUNT EDIT ── */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fadeIn">
            {/* Personal info */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-display font-semibold text-eco-300">Personal & Company Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-eco-300 mb-1.5">Full Name</label>
                  <input className="input-field" {...register('name', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-eco-300 mb-1.5">Company Name</label>
                  <input className="input-field" {...register('companyName')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Industry Type</label>
                <select className="input-field" {...register('industryType')}>
                  <option value="">Select...</option>
                  {INDUSTRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Bio</label>
                <textarea 
                  className="input-field resize-none" 
                  rows={3} 
                  placeholder="Tell others about your circular practices or waste input requirements..."
                  {...register('bio')} 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-eco-300 mb-1.5">Phone</label>
                  <input className="input-field" placeholder="+91..." {...register('phone')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-eco-300 mb-1.5">Website</label>
                  <input className="input-field" placeholder="https://..." {...register('website')} />
                </div>
              </div>
            </div>

            {/* Location details */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-eco-300">Location Settings</h2>
                <button
                  type="button"
                  onClick={handleAutoFetchLocation}
                  className="text-xs bg-eco-500/10 hover:bg-eco-500/20 text-eco-500 border border-eco-500/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 font-semibold cursor-pointer"
                >
                  Auto-Fetch Location
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-eco-300 mb-1.5">City</label>
                  <input className="input-field" placeholder="Hyderabad" {...register('city')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-eco-300 mb-1.5">State</label>
                  <input className="input-field" placeholder="Telangana" {...register('state')} />
                </div>
              </div>
              <div className="grid grid-cols- sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-eco-300 mb-1.5">Latitude (Optional)</label>
                  <input type="number" step="any" className="input-field" {...register('lat')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-eco-300 mb-1.5">Longitude (Optional)</label>
                  <input type="number" step="any" className="input-field" {...register('lng')} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
