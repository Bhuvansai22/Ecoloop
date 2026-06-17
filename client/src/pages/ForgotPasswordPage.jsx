/**
 * ForgotPasswordPage
 * Requests a password reset link by email (secure Brevo-based flow).
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Leaf, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../services';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [devLink, setDevLink] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.forgotPassword(data.email);
      setSuccessMessage(res.data?.message || 'If an account exists for that email, we have sent a link to reset your password. Please check your inbox and spam folder.');
      setDevLink(res.data?.devLink || '');
      setSuccess(true);
      toast.success('Reset link requested successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 bg-mesh">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-display font-bold text-2xl mb-2">
            <Leaf className="text-eco-500 w-7 h-7" />
            Eco<span className="text-eco-400">Loop</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Forgot Password</h1>
          <p className="text-eco-700 text-sm mt-1">We will email you a link to secure your account</p>
        </div>

        <div className="glass-card p-8">

          {success ? (
            /* ── Success State ── */
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="w-14 h-14 text-eco-400 animate-bounce" />
              <h2 className="font-display text-xl font-semibold">Reset Requested</h2>
              <p className="text-eco-300 text-sm leading-relaxed whitespace-pre-line">
                {successMessage}
              </p>

              {devLink && (
                <div className="w-full mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                  <p className="text-xs text-amber-400 mb-1 font-medium">Development Fallback Link:</p>
                  <a
                    href={devLink}
                    className="text-eco-400 hover:text-eco-300 font-mono text-xs break-all underline block hover:underline"
                  >
                    Click to Reset Password
                  </a>
                </div>
              )}

              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full mt-2"
              >
                Return to Login
              </button>
            </div>
          ) : (
            /* ── Reset Form ── */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
                  })}
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Mail className="w-4 h-4" /> Send Reset Link</>
                )}
              </button>
            </form>
          )}

          {/* Back to login */}
          {!success && (
            <p className="text-center text-sm text-eco-700 mt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-eco-400 hover:text-eco-300 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
