import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Code2, 
  Award, 
  History, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  Sparkles,
  LayoutDashboard,
  KeyRound,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAnalyses } from '../services/api';
import Badge from '../components/common/Badge';

export const ProfilePage = () => {
  const { user, updateProfileData } = useAuth();
  const navigate = useNavigate();

  // Name form state
  const [name, setName] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameFeedback, setNameFeedback] = useState(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Statistics state
  const [analyses, setAnalyses] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      const res = await fetchAnalyses();
      if (isMounted) {
        setAnalyses(res.data || []);
        setLoadingStats(false);
      }
    };
    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Display Name Update
  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameFeedback({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }
    setIsSavingName(true);
    setNameFeedback(null);

    const res = await updateProfileData(name.trim());
    setIsSavingName(false);
    if (res.success) {
      setNameFeedback({ type: 'success', message: 'Display name updated successfully!' });
      setTimeout(() => setNameFeedback(null), 3500);
    } else {
      setNameFeedback({ type: 'error', message: res.error || 'Failed to update name.' });
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Please enter your current password.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsSavingPassword(true);
    const res = await updateProfileData(undefined, currentPassword, newPassword);
    setIsSavingPassword(false);

    if (res.success) {
      setPasswordFeedback({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordFeedback(null), 3500);
    } else {
      setPasswordFeedback({ type: 'error', message: res.error || 'Failed to update password.' });
    }
  };

  // Metrics derivation
  const totalAnalyses = analyses.length;

  const validScores = analyses
    .map((a) => a.analysis?.codeQuality?.score)
    .filter((sc) => typeof sc === 'number' && !isNaN(sc));

  const averageScore =
    validScores.length > 0
      ? `${Math.round(validScores.reduce((sum, val) => sum + val, 0) / validScores.length)}/100`
      : 'N/A';

  const totalBugs = analyses.reduce(
    (total, a) => total + (a.analysis?.bugs?.length || 0),
    0
  );

  // Calculate most used language
  const languageCounts = analyses.reduce((acc, curr) => {
    const lang = curr.language?.toLowerCase() || 'unknown';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  const favoriteLanguage = Object.keys(languageCounts).length > 0
    ? Object.keys(languageCounts).reduce((a, b) => (languageCounts[a] > languageCounts[b] ? a : b))
    : 'None yet';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-400/30">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-glow-brand">
              <div className="w-full h-full bg-[#111622] rounded-[14px] flex items-center justify-center font-bold text-xl text-brand-300">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {user?.name || 'Developer Profile'}
                </h1>
                <Badge variant="brand" size="sm">Active Account</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your developer credentials and view your learning metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3.5 py-2 rounded-xl bg-surface-200 hover:bg-surface-300 text-slate-200 text-xs font-semibold border border-surface-400/40 flex items-center space-x-1.5 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-brand-400" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="px-3.5 py-2 rounded-xl bg-surface-200 hover:bg-surface-300 text-slate-200 text-xs font-semibold border border-surface-400/40 flex items-center space-x-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>History</span>
          </button>
          <button
            onClick={() => navigate('/mentor')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow-brand flex items-center space-x-1.5 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>
        </div>
      </div>

      {/* Grid: Profile Edit Forms & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Profile Form & Password Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Details Form */}
          <div className="p-6 rounded-2xl bg-surface-100 border border-surface-400/40 shadow-subtle space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-surface-400/30">
              <User className="w-4 h-4 text-brand-400" />
              <h2 className="text-base font-semibold text-white">Account Details</h2>
            </div>

            {nameFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
                  nameFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {nameFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{nameFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    maxLength={50}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-200 border border-surface-400/50 text-slate-100 text-xs focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address (Verified)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-200/50 border border-surface-400/30 text-slate-400 text-xs cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Email address is permanently bound to your account history.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSavingName || name.trim() === user?.name}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSavingName ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Name</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Security Card */}
          <div className="p-6 rounded-2xl bg-surface-100 border border-surface-400/40 shadow-subtle space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-surface-400/30">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-semibold text-white">Security & Password</h2>
            </div>

            {passwordFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-200 border border-surface-400/50 text-slate-100 text-xs focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-200 border border-surface-400/50 text-slate-100 text-xs focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-200 border border-surface-400/50 text-slate-100 text-xs focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword || !currentPassword || !newPassword}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-glow-cyan flex items-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Account Metadata */}
          <div className="p-6 rounded-2xl bg-surface-100 border border-surface-400/40 shadow-subtle space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-surface-400/30">
              <Calendar className="w-4 h-4 text-slate-400" />
              <h2 className="text-base font-semibold text-white">Account Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-200/50 border border-surface-400/30">
                <span className="text-slate-400 block mb-1">Member Since</span>
                <span className="font-semibold text-slate-200">{memberSince}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-200/50 border border-surface-400/30">
                <span className="text-slate-400 block mb-1">Account Role</span>
                <span className="font-semibold text-brand-300">Software Developer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Personal Coding Stats */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-100 border border-surface-400/40 shadow-subtle space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-surface-400/30">
              <Award className="w-4 h-4 text-brand-400" />
              <h2 className="text-base font-semibold text-white">Your Stats</h2>
            </div>

            {loadingStats ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Loader2 className="w-5 h-5 text-brand-400 animate-spin mx-auto mb-2" />
                <span>Loading statistics...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-surface-200/50 border border-surface-400/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Total Analyses</span>
                      <span className="text-sm font-bold text-white font-mono">{totalAnalyses}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-200/50 border border-surface-400/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Average Quality</span>
                      <span className="text-sm font-bold text-white font-mono">{averageScore}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-200/50 border border-surface-400/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Favorite Language</span>
                      <span className="text-sm font-bold text-cyan-300 font-mono uppercase">{favoriteLanguage}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-200/50 border border-surface-400/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Total Issues Caught</span>
                      <span className="text-sm font-bold text-white font-mono">{totalBugs}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Engine Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-950/40 to-surface-100 border border-brand-500/20 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-300">
              <Sparkles className="w-4 h-4" />
              <span>Local AI Engine Active</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Powered by Ollama + Qwen2.5-Coder running privately on your machine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
