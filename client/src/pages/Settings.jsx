import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  HardDrive,
  Cloud,
  Bot,
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Globe,
  Save,
  Lock,
} from 'lucide-react';
import Loader from '../components/Loader';
import apiClient from '../services/apiClient';

export default function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [googleStorage, setGoogleStorage] = useState(null);

  const [name, setName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  const [isDisconnectingDrive, setIsDisconnectingDrive] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchStats();
    fetchGoogleStorage();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setUser(res.data);
      setName(res.data.name || '');
    } catch (err) {
      console.error('Fetch user error:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const fetchGoogleStorage = async () => {
    try {
      const res = await apiClient.get('/cloud/google/storage');
      setGoogleStorage(res.data);
    } catch (err) {
      console.error('Fetch Google storage error:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdatingName(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const res = await apiClient.put('/auth/profile', { name: name.trim() });
      setProfileMessage({ type: 'success', text: 'Name updated successfully!' });
      setUser((prev) => ({ ...prev, name: res.data.name }));

      // Update localStorage userInfo
      try {
        const info = JSON.parse(localStorage.getItem('userInfo') || '{}');
        info.name = res.data.name;
        localStorage.setItem('userInfo', JSON.stringify(info));
      } catch (e) {}
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update name.',
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPassMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsChangingPass(true);

    try {
      await apiClient.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPassMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password.',
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleDisconnectDrive = async () => {
    if (!confirm('Are you sure you want to disconnect Google Drive?')) return;

    setIsDisconnectingDrive(true);
    try {
      await apiClient.post('/cloud/google/disconnect');
      fetchGoogleStorage();
      alert('Google Drive disconnected.');
    } catch (err) {
      console.error('Disconnect error:', err);
      alert('Failed to disconnect Google Drive.');
    } finally {
      setIsDisconnectingDrive(false);
    }
  };

  const formatGB = (bytes) => {
    if (!bytes) return '0.00';
    return (bytes / 1024 ** 3).toFixed(2);
  };

  const storageUsedMB = stats?.storageUsedMB || '0.0';
  const storagePercent = stats?.storagePercent || 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto text-white space-y-8">
      {/* HEADER */}
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Workspace Settings
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your account, AI preferences, storage quotas, and connected cloud services.
          </p>
        </div>

        <a
          href="https://ialksng.me"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-blue-300 hover:text-white transition group self-start md:self-auto"
        >
          <Globe size={14} className="text-blue-400 group-hover:rotate-12 transition-transform" />
          <span>Developer: ialksng</span>
          <ExternalLink size={12} className="text-gray-400 group-hover:text-white" />
        </a>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 1. PROFILE SETTINGS */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">User Profile</h2>
              <p className="text-xs text-gray-400">Personal information and identity</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-black/20 border border-white/5 rounded-xl text-sm text-gray-400">
                <Mail size={16} className="text-gray-500" />
                <span className="truncate">{user?.email || 'Loading...'}</span>
              </div>
            </div>

            {profileMessage.text && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-300 border border-red-500/20'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingName}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 disabled:opacity-50 shadow-lg"
            >
              {isUpdatingName ? <Loader variant="button" size="sm" text="Saving..." /> : <><Save size={16} /> Save Profile</>}
            </button>
          </form>
        </div>

        {/* 2. LOCAL STORAGE QUOTA (100 MB) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Local Workspace Storage</h2>
              <p className="text-xs text-gray-400">100 MB personal storage quota</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-baseline text-sm">
              <span className="font-semibold text-2xl text-white">{storageUsedMB} MB</span>
              <span className="text-gray-400 text-xs">Quota: 100 MB</span>
            </div>

            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${storagePercent}%` }}
              />
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Your local space stores parsed files, drafts, and notes. Connect Google Drive below to expand up to 15 GB.
            </p>

            <button
              onClick={() => navigate('/mystorage')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl transition flex items-center gap-2"
            >
              <HardDrive size={14} /> Manage Files in MyStorage
            </button>
          </div>
        </div>

        {/* 3. CLOUD INTEGRATIONS (GOOGLE DRIVE) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Google Drive Integration</h2>
              <p className="text-xs text-gray-400">15 GB cloud synchronization</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-black/40 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3">
                <Cloud size={24} className="text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-white">Google Drive</div>
                  <div className="text-xs text-gray-400">
                    {googleStorage?.connected
                      ? `${formatGB(googleStorage.used)} GB / ${formatGB(googleStorage.total)} GB used`
                      : 'Not connected'}
                  </div>
                </div>
              </div>

              {googleStorage?.connected ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 size={12} /> Connected
                </span>
              ) : (
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  Disconnected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {googleStorage?.connected ? (
                <>
                  <button
                    onClick={() => navigate('/cloudhub/google')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition shadow-lg"
                  >
                    Browse Files
                  </button>
                  <button
                    onClick={handleDisconnectDrive}
                    disabled={isDisconnectingDrive}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium rounded-xl border border-red-500/30 transition disabled:opacity-50"
                  >
                    {isDisconnectingDrive ? (
                      <Loader variant="button" size="xs" color="text-red-300" text="Disconnecting..." />
                    ) : (
                      'Disconnect'
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/cloudhub/google')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition shadow-lg flex items-center gap-2"
                >
                  <Cloud size={14} /> Connect Google Drive
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. AI INTELLIGENCE SETTINGS (GROQ) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Assistant (Groq Cloud)</h2>
              <p className="text-xs text-gray-400">Intelligence engine configuration</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs text-gray-300">
            <div className="flex justify-between items-center p-3 bg-black/40 border border-white/10 rounded-xl">
              <div>
                <span className="font-semibold text-white block">Active LLM Model</span>
                <span className="text-gray-400 text-[11px]">Groq LPU Inference</span>
              </div>
              <span className="bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/30 font-mono">
                llama-3.3-70b-versatile
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-black/40 border border-white/10 rounded-xl">
              <div>
                <span className="font-semibold text-white block">Global Document Scanning</span>
                <span className="text-gray-400 text-[11px]">Deep context awareness across all files</span>
              </div>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> Active
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-black/40 border border-white/10 rounded-xl">
              <div>
                <span className="font-semibold text-white block">Automatic Summarization</span>
                <span className="text-gray-400 text-[11px]">Instant takeaways for uploaded documents</span>
              </div>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> Enabled
              </span>
            </div>
          </div>
        </div>

        {/* 5. CHANGE PASSWORD */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-5 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Security & Password</h2>
              <p className="text-xs text-gray-400">Update your account credentials</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {passMessage.text && (
              <div
                className={`md:col-span-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-300 border border-red-500/20'
                }`}
              >
                {passMessage.type === 'success' ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                <span>{passMessage.text}</span>
              </div>
            )}

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-5 py-2.5 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50 shadow-lg"
              >
                {isChangingPass ? (
                  <Loader variant="button" size="sm" color="text-black" text="Updating..." />
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

