import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, User, ArrowLeft, CheckCircle2, ExternalLink, Globe } from 'lucide-react';
import Loader from '../components/Loader';
import apiClient, { getApiUrl } from '../services/apiClient';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Handle Google OAuth callback redirect (with token in query params)
  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const authError = searchParams.get('error');

    if (token) {
      localStorage.setItem('sphere_token', token);
      localStorage.setItem(
        'userInfo',
        JSON.stringify({ _id: userId, name: decodeURIComponent(name || ''), email: decodeURIComponent(email || ''), token })
      );
      navigate('/dashboard', { replace: true });
    } else if (authError) {
      setError(`Google Sign-In failed: ${decodeURIComponent(authError)}`);
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (isForgotPass) {
      try {
        const res = await apiClient.post('/auth/forgot-password', {
          email: formData.email,
        });
        setSuccessMessage(res.data.message || 'Reset link sent to your email.');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to send reset link.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const res = await apiClient.post(endpoint, payload);

      localStorage.setItem('sphere_token', res.data.token);
      localStorage.setItem('userInfo', JSON.stringify(res.data));

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = getApiUrl('/auth/google');
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* DEVELOPER PORTFOLIO LINK */}
      <a
        href="https://ialksng.me"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition shadow-lg backdrop-blur-md group"
      >
        <Globe size={13} className="text-blue-400 group-hover:rotate-12 transition-transform" />
        <span className="font-medium">ialksng</span>
        <ExternalLink size={12} className="text-gray-400 group-hover:text-white transition-colors" />
      </a>

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            SmartSphere
          </h1>
          <p className="text-gray-400 text-sm">
            {isForgotPass
              ? 'Enter your email to receive a password reset link.'
              : isLogin
              ? 'Welcome back to your AI intelligence workspace.'
              : 'Create your workspace account to get started.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-300 text-sm p-3 rounded-xl mb-6 text-center flex items-center justify-center gap-2">
            <CheckCircle2 size={16} />
            {successMessage}
          </div>
        )}

        {/* GOOGLE AUTH BUTTON (Available on Login/Register) */}
        {!isForgotPass && (
          <>
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full mb-5 bg-white text-gray-900 hover:bg-gray-100 font-medium rounded-xl py-3 text-sm transition shadow-lg flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-white/10"></div>
              <span className="px-3 text-xs text-gray-500 uppercase tracking-wider">or with email</span>
              <div className="flex-1 border-t border-white/10"></div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isForgotPass && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <User size={18} />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Full Name"
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-sm transition placeholder-gray-500"
              />
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Mail size={18} />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Email Address"
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-sm transition placeholder-gray-500"
            />
          </div>

          {!isForgotPass && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Password (min. 6 characters)"
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-sm transition placeholder-gray-500"
              />
            </div>
          )}

          {isLogin && !isForgotPass && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPass(true);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl py-3 text-sm font-medium transition shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <Loader variant="button" size="sm" text="Please wait..." />
            ) : isForgotPass ? (
              'Send Reset Link'
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {isForgotPass ? (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsForgotPass(false);
                setError('');
                setSuccessMessage('');
              }}
              className="text-sm text-gray-400 hover:text-white transition flex items-center justify-center gap-2 mx-auto"
              type="button"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </div>
        ) : (
          <div className="mt-6 text-center text-sm text-gray-400">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccessMessage('');
              }}
              className="text-blue-400 hover:text-blue-300 font-medium transition"
              type="button"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
