/**
 * ProfilePage — Edit company profile and see stats
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { BadgeCheck, Camera, Leaf } from 'lucide-react';

const INDUSTRY_TYPES = [
  'Manufacturing', 'Construction', 'Agriculture', 'Chemical',
  'Textile', 'Food & Beverage', 'Automotive', 'Electronics',
  'Pharmaceutical', 'Mining', 'Paper & Pulp', 'Other',
];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [loading,  setLoading]  = useState(false);
  const [avatar,   setAvatar]   = useState(null);
  const [preview,  setPreview]  = useState(user?.avatar || '');

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        name:         user.name,
        companyName:  user.companyName || '',
        industryType: user.industryType || '',
        bio:          user.bio || '',
        phone:        user.phone || '',
        website:      user.website || '',
        city:         user.location?.city || '',
        state:        user.location?.state || '',
        country:      user.location?.country || 'India',
        lat:          user.location?.lat || '',
        lng:          user.location?.lng || '',
      });
    }
  }, [user, reset]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] }, maxFiles: 1,
    onDrop: ([file]) => { setAvatar(file); setPreview(URL.createObjectURL(file)); },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v); });
      // Nest location fields
      const location = { city: data.city, state: data.state, country: data.country, lat: data.lat, lng: data.lng };
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

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold mb-8">👤 My Profile</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="glass-card p-6 flex items-center gap-6">
            <div {...getRootProps()} className="relative cursor-pointer group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-eco-600/20 flex items-center justify-center">
                {preview
                  ? <img src={preview} alt="" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-eco-400">{user?.name?.[0]}</span>
                }
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Camera className="w-5 h-5" />
              </div>
              <input {...getInputProps()} />
            </div>
            <div>
              <div className="font-display font-semibold text-lg flex items-center gap-2">
                {user?.name}
                {user?.verified && <BadgeCheck className="w-5 h-5 text-eco-400" />}
              </div>
              <div className="text-sm text-eco-700 mt-0.5">{user?.email}</div>
              <div className="text-xs text-eco-800 mt-1 capitalize">{user?.role} · {user?.industryType || 'No industry set'}</div>
            </div>
          </div>

          {/* Personal info */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-display font-semibold text-eco-300">Personal & Company</h2>
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
              <textarea className="input-field resize-none" rows={3} placeholder="About your company..."
                {...register('bio')} />
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

          {/* Location */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-display font-semibold text-eco-300">Location</h2>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Latitude</label>
                <input type="number" step="any" className="input-field" {...register('lat')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Longitude</label>
                <input type="number" step="any" className="input-field" {...register('lng')} />
              </div>
            </div>
          </div>

          {/* Carbon stats */}
          {user?.carbonStats && (
            <div className="glass-card p-6">
              <h2 className="font-display font-semibold text-eco-300 flex items-center gap-2 mb-4">
                <Leaf className="w-4 h-4 text-eco-500" /> Your Carbon Impact
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="font-display text-2xl font-bold gradient-text">
                    {(user.carbonStats.totalSaved || 0).toLocaleString()} kg
                  </div>
                  <div className="text-xs text-eco-700">CO₂ Saved</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl font-bold gradient-text">
                    {user.carbonStats.totalTransactions || 0}
                  </div>
                  <div className="text-xs text-eco-700">Completed Deals</div>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              : 'Save Changes'
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
