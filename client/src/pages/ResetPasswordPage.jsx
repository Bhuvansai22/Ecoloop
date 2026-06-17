/**
 * ResetPasswordPage
 * Lets the user choose a new password using a token passed via URL params.
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Leaf, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { authService } from '../services';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, data.newPassword, data.confirmPassword);
      setSuccess(true);
      toast.success('Password reset successful!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
          <h1 className="font-display text-2xl font-bold">Choose New Password</h1>
          <p className="text-eco-700 text-sm mt-1">Please enter and confirm your new account password</p>
        </div>

        <div className="glass-card p-8">

          {success ? (
            /* ── Success State ── */
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="w-14 h-14 text-eco-400" />
              <h2 className="font-display text-xl font-semibold">Success!</h2>
              <p className="text-eco-700 text-sm">
                Your password has been successfully reset. You can now log in using your new credentials.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full mt-2"
              >
                Go to Login
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    className={`input-field pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-700 hover:text-eco-400"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-400 text-xs mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-eco-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (val) =>
                        val === watch('newPassword') || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-700 hover:text-eco-400"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
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
                  <><KeyRound className="w-4 h-4" /> Reset Password</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
