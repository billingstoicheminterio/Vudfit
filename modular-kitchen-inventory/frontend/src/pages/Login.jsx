import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, User as UserIcon, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Load remembered username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    const result = await login(username.trim(), password, rememberMe);
    setLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] dark:bg-forest-950 px-4 transition-colors duration-200">
      <div className="w-full max-w-md">

        {/* Company Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 mb-4 bg-forest-900/10 dark:bg-brand-500/10 rounded-3xl border border-brand-500/20">
            {/* Geometric Concentric Gold Pattern Logo */}
            <svg viewBox="0 0 100 100" className="w-14 h-14 text-brand-500" fill="none" stroke="currentColor" strokeWidth="4.5">
              <rect x="4" y="4" width="92" height="92" rx="6" stroke="currentColor" strokeWidth="4.5" fill="none" />
              {/* Top Left: center at 0,0 */}
              <path d="M 0 15 A 15 15 0 0 1 15 0" stroke="currentColor" />
              <path d="M 0 30 A 30 30 0 0 1 30 0" stroke="currentColor" />
              <path d="M 0 45 A 45 45 0 0 1 45 0" stroke="currentColor" />

              {/* Bottom Right: center at 100,100 */}
              <path d="M 100 85 A 15 15 0 0 1 85 100" stroke="currentColor" />
              <path d="M 100 70 A 30 30 0 0 1 70 100" stroke="currentColor" />
              <path d="M 100 55 A 45 45 0 0 1 55 100" stroke="currentColor" />

              {/* Top Right: center at 100,0 */}
              <path d="M 85 0 A 15 15 0 0 0 100 15" stroke="currentColor" />
              <path d="M 70 0 A 30 30 0 0 0 100 30" stroke="currentColor" />
              <path d="M 55 0 A 45 45 0 0 0 100 45" stroke="currentColor" />

              {/* Bottom Left: center at 0,100 */}
              <path d="M 0 85 A 15 15 0 0 0 15 100" stroke="currentColor" />
              <path d="M 0 70 A 30 30 0 0 0 30 100" stroke="currentColor" />
              <path d="M 0 55 A 45 45 0 0 0 45 100" stroke="currentColor" />

              {/* Grid Lines */}
              <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <h1 className="text-4xl font-semibold tracking-widest text-forest-900 dark:text-brand-400 select-none font-luxury-title">
            VUDFIT
          </h1>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-wood-600 dark:text-wood-400">
            Handcrafted Luxury Living
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-forest-300 font-medium">
            Modular Kitchen Inventory Control & Logistics
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-8 border border-brand-500/10 dark:border-brand-500/20 shadow-premium dark:shadow-premium-dark wood-accent-top">
          <h2 className="text-xl font-semibold text-forest-900 dark:text-white mb-6 font-luxury-title tracking-wide">
            Sign In to Warehouse
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-start space-x-2.5 animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-forest-400 pointer-events-none">
                  <UserIcon className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter username"
                  className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-forest-900 dark:text-white placeholder-slate-400 dark:placeholder-forest-500 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-forest-300 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-forest-400 pointer-events-none">
                  <Key className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter password"
                  className="w-full pl-11 pr-11 py-3 bg-white/50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-forest-900 dark:text-white placeholder-slate-400 dark:placeholder-forest-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-forest-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-forest-300 dark:border-forest-800 text-brand-500 focus:ring-brand-500 bg-white dark:bg-forest-950"
                />
                <span className="text-xs font-medium text-slate-650 dark:text-forest-300">
                  Remember my username
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/70 text-forest-950 rounded-xl font-bold text-sm shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 hover:scale-[1.01] transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin text-forest-950" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Access Warehouse</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
