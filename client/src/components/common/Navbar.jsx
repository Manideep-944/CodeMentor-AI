import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Code2, 
  Terminal, 
  LayoutDashboard, 
  Sparkles, 
  Info, 
  Menu, 
  X, 
  ChevronRight,
  History,
  LogIn,
  UserPlus,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { checkHealth } from '../../services/api';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);
  const { user, isAuthenticated, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const verifyBackend = async () => {
      const res = await checkHealth();
      if (isMounted) {
        setBackendOnline(res.success);
      }
    };

    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Navigation Links dynamically based on auth state
  const baseNavLinks = isAuthenticated
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Code Analyzer', path: '/mentor', icon: Terminal },
        { name: 'History', path: '/history', icon: History },
        { name: 'Profile', path: '/profile', icon: User },
        { name: 'Features', path: '/features', icon: Sparkles },
        { name: 'About', path: '/about', icon: Info },
      ]
    : [
        { name: 'Home', path: '/', icon: Code2 },
        { name: 'Code Analyzer', path: '/mentor', icon: Terminal },
        { name: 'Features', path: '/features', icon: Sparkles },
        { name: 'About', path: '/about', icon: Info },
      ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path === '/mentor' && (location.pathname === '/mentor' || location.pathname === '/analyzer')) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-surface-400/40 bg-[#0a0d14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-600 p-0.5 flex items-center justify-center shadow-glow-brand group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-surface-100 rounded-[10px] flex items-center justify-center">
                <Code2 className="w-5 h-5 text-brand-400 group-hover:text-white transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  CodeMentor
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30">
                  AI
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:inline-block">
                Intelligent Coding Mentor
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {baseNavLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    active
                      ? 'bg-surface-300 text-white shadow-inner border border-surface-400/50'
                      : 'text-slate-300 hover:text-white hover:bg-surface-200/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Actions: Auth buttons & Start Coding CTA */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Backend Health Pill */}
            <div 
              className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-surface-200 border border-surface-400/40 text-slate-300"
              title={backendOnline === true ? 'Backend API Connected' : backendOnline === false ? 'Backend Offline' : 'Checking API...'}
            >
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : backendOnline === false ? 'bg-rose-500' : 'bg-amber-400'}`} />
              <span className="text-[11px] font-mono">
                {backendOnline === true ? 'AI Live' : backendOnline === false ? 'Offline' : '...'}
              </span>
            </div>

            {/* Auth Buttons / User Profile */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-surface-200 border border-surface-400/40 text-slate-200 text-xs font-medium hover:bg-surface-300 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-[10px] font-bold">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{user?.name}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg bg-surface-200 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-surface-400/40 text-xs transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-surface-200 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-300 bg-brand-500/15 border border-brand-500/30 hover:bg-brand-500/25 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Start Coding CTA */}
            <button
              onClick={() => navigate('/mentor')}
              className="relative group overflow-hidden px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-semibold shadow-glow-brand transition-all duration-200 flex items-center space-x-1.5"
            >
              <span>Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-surface-200 text-slate-300 hover:text-white hover:bg-surface-300 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-surface-400/60 bg-surface-100/98 backdrop-blur-xl px-4 pt-2 pb-6 space-y-3">
          {isAuthenticated && (
            <div className="p-3 rounded-xl bg-surface-200 border border-surface-400/40 flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-xs font-bold border border-brand-500/30">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{user?.name}</div>
                  <div className="text-[10px] text-slate-400">{user?.email}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 text-xs border border-rose-500/20"
              >
                Logout
              </button>
            </div>
          )}

          <div className="space-y-1">
            {baseNavLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                    active
                      ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-surface-200'
                  }`}
                >
                  <Icon className="w-4 h-4 text-brand-400" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-surface-300/60 flex flex-col space-y-3">
            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 rounded-lg bg-surface-200 text-slate-200 text-center text-xs font-semibold border border-surface-400/40"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 rounded-lg bg-brand-500/20 text-brand-300 text-center text-xs font-semibold border border-brand-500/30"
                >
                  Register
                </Link>
              </div>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/mentor');
              }}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 text-white text-center text-sm font-semibold shadow-glow-brand"
            >
              Start Coding
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
