/**
 * LoginPage
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Leaf, Eye, EyeOff, LogIn } from 'lucide-react';

const LoginPage = () => {
  const { user, loading: authLoading, login } = useAuth();
  const navigate        = useNavigate();
  const location        = useLocation();
  const from            = location.state?.from?.pathname || '/dashboard';
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 md:px-4 pt-20 bg-mesh">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-display font-bold text-2xl mb-2">
            <Leaf className="text-eco-500 w-7 h-7" />
            Eco<span className="text-eco-400">Loop</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="text-eco-700 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-eco-300 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                })}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-eco-300">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-eco-400 hover:text-eco-300 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-700 hover:text-eco-400"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-eco-700 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-eco-400 hover:text-eco-300 font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
