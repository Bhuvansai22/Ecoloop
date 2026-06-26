/**
 * AddMaterialPage / EditMaterialPage — unified form for sellers
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { materialService } from '../services';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Upload, X, Leaf, MapPin } from 'lucide-react';

const CATEGORIES = [
  'Metal Scrap', 'Plastics', 'Paper & Cardboard', 'Glass', 'Organic Waste',
  'Textiles', 'Chemical Waste', 'Electronic Waste', 'Wood & Timber',
  'Rubber', 'Concrete & Construction', 'Other',
];
const UNITS = ['kg', 'tonnes', 'litres', 'units', 'cubic metres'];

const MaterialFormPage = () => {
  const { id } = useParams(); // present on edit route
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [files, setFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [priceHint, setPriceHint] = useState('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const isAuction = watch('isAuction');
  const unit = watch('unit') || 'kg';

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
            const road = addr.road || '';
            const county = addr.county || '';
            const addressText = road ? `${road}${county ? ', ' + county : ''}` : (data.display_name || '');

            setValue('address', addressText);
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

  // Load existing data on edit
  useEffect(() => {
    if (isEdit) {
      materialService.getById(id).then(({ data }) => {
        const m = data.material;
        setExistingImages(m.images || []);
        reset({
          title: m.title, description: m.description, category: m.category,
          quantity: m.quantity?.value, unit: m.quantity?.unit,
          price: m.price?.amount, negotiable: m.price?.negotiable,
          lat: m.location?.coordinates?.[1] || '',
          lng: m.location?.coordinates?.[0] || '',
          address: m.location?.address || '',
          city: m.location?.city || '',
          state: m.location?.state || '',
          condition: m.condition,
          tags: m.tags?.join(', ') || '',
          carbonFactor: m.carbonFactor || '',
        });
      });
    }
  }, [id, isEdit, reset]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 5,
    onDrop: (accepted) => {
      setFiles((prev) => [...prev, ...accepted].slice(0, 5));
      setPreviews((prev) => [
        ...prev,
        ...accepted.map((f) => URL.createObjectURL(f)),
      ].slice(0, 5));
    },
  });

  const removeFile = (i) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleAutoFillAI = async (mode = 'all') => {
    if (files.length === 0) {
      toast.error('Please select an image first.');
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      const toastId = toast.loading('Analyzing image with AI...');
      try {
        const { data } = await materialService.analyzeImage(base64Image);

        if (mode === 'all') {
          if (data.title) setValue('title', data.title);
          if (data.description) setValue('description', data.description);
          if (data.category) setValue('category', data.category);
          if (data.condition) setValue('condition', data.condition);
          if (data.tags) setValue('tags', data.tags);
          if (data.price) setValue('price', data.price);
          if (data.unit) setValue('unit', data.unit);
          if (data.priceExplanation) setPriceHint(data.priceExplanation);
          if (data.carbonFactor) {
            const cf = parseFloat(String(data.carbonFactor).replace(/[^\d.-]/g, ''));
            if (!isNaN(cf)) setValue('carbonFactor', cf);
          }
          toast.success('Form auto-filled successfully! ✨', { id: toastId });
        } else if (mode === 'carbon') {
          if (data.carbonFactor) {
            const cf = parseFloat(String(data.carbonFactor).replace(/[^\d.-]/g, ''));
            if (!isNaN(cf)) setValue('carbonFactor', cf);
          }
          toast.success('Carbon Factor calculated! ✨', { id: toastId });
        }
      } catch {
        toast.error('AI analysis failed. Please try again.', { id: toastId });
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image file.');
    };
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v); });
      files.forEach((f) => fd.append('images', f));

      if (isEdit) {
        await materialService.update(id, fd);
        toast.success('Listing updated!');
      } else {
        await materialService.create(fd);
        toast.success('Material listed! 🌱');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-3 md:px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">
            {isEdit ? '✏️ Edit Listing' : '📦 List a Material'}
          </h1>
          <p className="text-eco-700 mt-1">
            {isEdit ? 'Update your waste material listing.' : 'Post your waste material and connect with buyers.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-display font-semibold text-eco-300 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-eco-500" /> Material Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-eco-300 mb-1.5">Title *</label>
              <input className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                placeholder="e.g. Aluminium Scrap — Grade A"
                {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-eco-300 mb-1.5">Category *</label>
              <select className={`input-field ${errors.category ? 'border-red-500' : ''}`}
                {...register('category', { required: 'Category is required' })}>
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-eco-300 mb-1.5">Description *</label>
              <textarea className={`input-field resize-none ${errors.description ? 'border-red-500' : ''}`}
                rows={4} placeholder="Describe the material, quality, handling instructions..."
                {...register('description', { required: 'Description required' })} />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Quantity *</label>
                <input type="number" step="0.01" className={`input-field ${errors.quantity ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                  {...register('quantity', { required: true, min: 0.01 })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Unit</label>
                <select className="input-field" {...register('unit')}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Price (₹ / {unit}) *</label>
                <input type="number" className={`input-field ${errors.price ? 'border-red-500' : ''}`}
                  placeholder="0"
                  {...register('price', { required: true, min: 0 })} />
                {priceHint && (
                  <p className="text-xs text-eco-400 mt-1.5 font-medium">
                    💡 AI Estimate: {priceHint}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Condition</label>
                <select className="input-field" {...register('condition')}>
                  <option value="good">Good</option>
                  <option value="new">New</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="negotiable" className="accent-eco-500 w-4 h-4"
                {...register('negotiable')} defaultChecked />
              <label htmlFor="negotiable" className="text-sm text-eco-300">Price is negotiable</label>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
              <input type="checkbox" id="isAuction" className="accent-eco-500 w-4 h-4"
                {...register('isAuction')} />
              <label htmlFor="isAuction" className="text-sm font-semibold text-eco-300">Enable Auction Mode</label>
            </div>

            {isAuction && (
              <div className="p-4 bg-eco-500/5 border border-eco-500/20 rounded-xl space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-eco-300 mb-1.5">Starting Price (₹) *</label>
                    <input type="number" className={`input-field ${errors.startingPrice ? 'border-red-500' : ''}`}
                      placeholder="e.g. 5000"
                      {...register('startingPrice', { required: isAuction, min: 1 })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-eco-300 mb-1.5">Duration (Days) *</label>
                    <select className="input-field" {...register('auctionDurationDays')}>
                      <option value="3">3 Days</option>
                      <option value="7">7 Days</option>
                      <option value="14">14 Days</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-eco-700">Buyers will be able to place bids until the duration expires.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Tags (comma separated)</label>
                <input className="input-field" placeholder="aluminium, grade-a, clean-scrap"
                  {...register('tags')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5 flex items-center justify-between">
                  Carbon Factor (kg CO₂ / {unit})
                  <span className="text-[10px] text-eco-500 font-bold bg-eco-500/10 px-1.5 py-0.5 rounded">✨ AI</span>
                </label>
                <input type="number" step="0.01" className="input-field" placeholder="Auto-calculated by AI or enter manually"
                  {...register('carbonFactor')} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-eco-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-eco-500" /> Location
              </h2>
              <button
                type="button"
                onClick={handleAutoFetchLocation}
                className="text-xs bg-eco-500/10 hover:bg-eco-500/20 text-eco-500 border border-eco-500/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 font-semibold cursor-pointer"
              >
                Auto-Fetch Location
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Latitude</label>
                <input type="number" step="any" className="input-field" placeholder="e.g. 17.385"
                  {...register('lat')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Longitude</label>
                <input type="number" step="any" className="input-field" placeholder="e.g. 78.486"
                  {...register('lng')} />
              </div>
            </div>
            <input className="input-field" placeholder="Address / Locality"    {...register('address')} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder="City"  {...register('city')} />
              <input className="input-field" placeholder="State" {...register('state')} />
            </div>
          </div>

          {/* Images */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-eco-300 flex items-center gap-2">
                <Upload className="w-4 h-4 text-eco-500" /> Upload Images
              </h2>
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleAutoFillAI('all')}
                  className="text-xs bg-eco-400/20 hover:bg-eco-400/30 text-eco-400 border border-eco-400/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 font-semibold cursor-pointer"
                >
                  ✨ Auto-fill with AI
                </button>
              )}
            </div>
            {/* Existing images on edit */}
            {existingImages.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {existingImages.map((img, i) => (
                  <img key={i} src={img.url} alt="" className="w-16 h-16 rounded-xl object-cover border border-eco-500/30" />
                ))}
              </div>
            )}
            <div {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-eco-500 bg-eco-500/5' : 'border-white/10 hover:border-eco-500/40'
                }`}>
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-eco-700 mx-auto mb-2" />
              <p className="text-sm text-eco-700">
                {isDragActive ? 'Drop images here...' : 'Drag & drop images or click to browse'}
              </p>
              <p className="text-xs text-eco-800 mt-1">Up to 5 images · JPG, PNG, WebP · Max 5MB each</p>
            </div>
            {previews.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    <button type="button" onClick={() => removeFile(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              : isEdit ? 'Update Listing' : 'Publish Listing 🌱'
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default MaterialFormPage;
