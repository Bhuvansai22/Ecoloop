/**
 * RegisterPage — role selection + registration form
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Leaf, Eye, EyeOff, Factory, ShoppingBag } from 'lucide-react';

const INDUSTRY_TYPES = [
  'Manufacturing', 'Construction', 'Agriculture', 'Chemical',
  'Textile', 'Food & Beverage', 'Automotive', 'Electronics',
  'Pharmaceutical', 'Mining', 'Paper & Pulp', 'Other',
];

const RegisterPage = () => {
  const { user, loading: authLoading, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [role,    setRole]    = useState('buyer');
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser({ ...data, role });
      toast.success('Account created! Welcome to EcoLoop 🌱');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10 bg-mesh">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-display font-bold text-2xl mb-2">
            <Leaf className="text-eco-500 w-7 h-7" />
            Eco<span className="text-eco-400">Loop</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Create your account</h1>
          <p className="text-eco-700 text-sm mt-1">Join the circular economy revolution</p>
        </div>

        <div className="glass-card p-8">
          {/* Role selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('seller')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                role === 'seller'
                  ? 'bg-eco-500/15 border-eco-500/50 text-eco-400'
                  : 'border-white/10 text-eco-700 hover:border-eco-500/30'
              }`}
            >
              <Factory className="w-6 h-6" />
              <span className="font-semibold text-sm">Seller</span>
              <span className="text-xs opacity-70">I have waste materials</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                role === 'buyer'
                  ? 'bg-eco-500/15 border-eco-500/50 text-eco-400'
                  : 'border-white/10 text-eco-700 hover:border-eco-500/30'
              }`}
            >
              <ShoppingBag className="w-6 h-6" />
              <span className="font-semibold text-sm">Buyer</span>
              <span className="text-xs opacity-70">I need raw materials</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Full Name</label>
                <input
                  className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="John Doe"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">Company Name</label>
                <input
                  className="input-field"
                  placeholder="Acme Industries"
                  {...register('companyName')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-eco-300 mb-1.5">Email</label>
              <input
                type="email"
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                placeholder="you@company.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                })}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-eco-300 mb-1.5">Industry Type</label>
              <select className="input-field" {...register('industryType')}>
                <option value="">Select industry...</option>
                {INDUSTRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-eco-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Min 6 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Min 6 characters' },
                  })}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-700 hover:text-eco-400" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-eco-300 mb-1.5">Confirm Password</label>
              <input
                type="password"
                className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Repeat password"
                {...register('confirmPassword', {
                  validate: (v) => v === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : `Create ${role === 'seller' ? 'Seller' : 'Buyer'} Account`
              }
            </button>
          </form>

          <p className="text-center text-sm text-eco-700 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-eco-400 hover:text-eco-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
