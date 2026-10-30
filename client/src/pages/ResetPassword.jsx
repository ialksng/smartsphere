import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import apiClient from '../services/apiClient';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient.post(`/auth/reset-password/${token}`, {
        password,
      });

      if (res.data.token) {
        localStorage.setItem('sphere_token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('userInfo', JSON.stringify(res.data.user));
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to reset password. The link may have expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            Reset Password
          </h1>
          <p className="text-gray-400 text-sm">
            Please enter and confirm your new password below.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="text-center space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-300 text-sm p-4 rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 size={20} />
              Password reset successfully! Redirecting to dashboard...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="New Password (min. 6 characters)"
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-sm transition placeholder-gray-500"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm New Password"
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-sm transition placeholder-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl py-3 text-sm font-medium transition shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                'Save New Password'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/auth"
            className="text-sm text-gray-400 hover:text-white transition inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

