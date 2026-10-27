import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      success(result.message || 'Signed in successfully!');
      const role = result.user?.role;
      if (redirectPath) {
        // Prevent bouncing if user role does not match privileged redirect
        if (redirectPath.startsWith('/admin') && role !== 'admin') {
          navigate('/dashboard');
        } else if (redirectPath.startsWith('/trainer') && role !== 'trainer' && role !== 'admin') {
          navigate('/dashboard');
        } else {
          navigate(redirectPath);
        }
      } else {
        if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'trainer') {
          navigate('/trainer');
        } else {
          navigate('/dashboard');
        }
      }
    } else {
      setErrorMsg(result.message || 'Login failed.');
      toastError(result.message || 'Login failed.');
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[85vh] bg-[#0b0b0c] text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6a00] to-[#e05500] flex items-center justify-center text-white shadow-lg shadow-[#ff6a00]/30 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="font-heading text-3xl font-black tracking-wider text-white">
              FLEXI <span className="text-[#ff6a00]">.</span>
            </span>
          </Link>
          <h2 className="mt-4 font-heading text-3xl font-black uppercase text-white tracking-tight">
            Welcome To Your Portal
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Access your membership passes, schedules, or club administrative tools.
          </p>
        </div>

        {/* Demo Fast-Switcher Box */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#ff6a00]">
            <Info className="w-3.5 h-3.5" />
            Quick Demo Accounts (1-Click Fill)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@flexigym.com', 'Admin@123')}
              className="px-2.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-left border border-neutral-700 hover:border-[#ff6a00] transition-colors"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#ff6a00]" />
                Admin
              </div>
              <div className="text-[10px] text-neutral-400 truncate">admin@flexigym.com</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('marcus@flexigym.com', 'Trainer@123')}
              className="px-2.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-left border border-neutral-700 hover:border-[#ff6a00] transition-colors"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <Dumbbell className="w-3 h-3 text-blue-400" />
                Coach
              </div>
              <div className="text-[10px] text-neutral-400 truncate">marcus@flexigym.com</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('john@example.com', 'Member@123')}
              className="px-2.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-left border border-neutral-700 hover:border-[#ff6a00] transition-colors"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                Member
              </div>
              <div className="text-[10px] text-neutral-400 truncate">john@example.com</div>
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-2xl bg-[#121214] border border-neutral-800 shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@flexigym.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-[#ff6a00] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-[#ff6a00] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-black uppercase text-sm tracking-wider shadow-lg shadow-[#ff6a00]/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In To FLEXI'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-800 text-center text-xs text-neutral-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-[#ff6a00] font-bold hover:underline">
              Create a Member Account
            </Link>
          </div>
        </div>

        {/* Security Notes */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-[11px] text-neutral-500 leading-relaxed">
          <strong className="text-neutral-400">Security Architecture:</strong> Protected by JWT in an HTTP-only SameSite cookie and bcrypt password hashing. Never exposes passwords or unverified tokens.
        </div>

      </div>
    </div>
  );
};
