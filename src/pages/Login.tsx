import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Users, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, loginAsDemoRole, isDemoMode } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password.');
      }
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'client' | 'coach') => {
    await loginAsDemoRole(role);
    if (role === 'admin') navigate('/dashboard');
    else if (role === 'client') navigate('/portal');
    else navigate('/coach');
  };

  return (
    <div className="min-h-screen bg-[#0A0B10] text-[#F5F6F8] flex flex-col md:flex-row">
      {/* Left Banner / Graphic */}
      <div className="md:w-1/2 bg-[#12141B] border-b md:border-b-0 md:border-r border-[#262A36] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DA0E19]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#DA0E19] flex items-center justify-center font-extrabold text-2xl text-white shadow-lg shadow-[#DA0E19]/30">
              P
            </div>
            <div>
              <h1 className="text-xl font-black font-heading tracking-wider text-[#F5F6F8]">PRIME FORM</h1>
              <p className="text-xs tracking-widest text-[#B9BEC7] uppercase">FITNESS INITIATIVE</p>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading tracking-tight leading-tight text-[#F5F6F8] mb-4">
            Real Training.<br />
            <span className="text-[#DA0E19]">Real Results.</span>
          </h2>
          <p className="text-[#9AA1AE] text-sm md:text-base max-w-md">
            Kampala's premier outdoor group training community hub at Kizungu, Safe Fields Boston. Track attendance, assessments, and progress in real time.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-[#262A36] text-xs text-[#9AA1AE] flex items-center justify-between">
          <span>PFFI Member Tracker v2.0</span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isSupabaseConfigured ? 'Supabase Connected' : 'Local Demo Mode'}
          </span>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="md:w-1/2 p-8 md:p-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h3 className="text-2xl font-bold font-heading text-[#F5F6F8] mb-2">Sign in to your account</h3>
            <p className="text-sm text-[#9AA1AE]">
              Enter your credentials to access your dashboard or member portal.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
              Demo mode — not connected to a live database. Set `VITE_DEMO_MODE=true` for explicit local demo access, or configure Supabase to sign in to a real account.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#B9BEC7] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA1AE]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pffi.ug or member@pffi.ug"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-[#12141B] border border-[#262A36] rounded-xl text-[#F5F6F8] placeholder-[#9AA1AE] focus:outline-none focus:border-[#DA0E19] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B9BEC7] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA1AE]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-[#12141B] border border-[#262A36] rounded-xl text-[#F5F6F8] placeholder-[#9AA1AE] focus:outline-none focus:border-[#DA0E19] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#DA0E19] hover:bg-[#F0202C] text-white font-bold rounded-xl shadow-lg shadow-[#DA0E19]/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Options */}
          {isDemoMode && (
            <div className="mt-10 pt-8 border-t border-[#262A36]">
              <div className="text-xs font-semibold text-[#9AA1AE] uppercase tracking-wider mb-4 text-center">
                Quick Demo Access
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  className="p-3 rounded-xl bg-[#12141B] border border-[#262A36] hover:border-[#DA0E19] text-center transition-all flex flex-col items-center gap-1.5"
                >
                  <Shield className="w-5 h-5 text-[#DA0E19]" />
                  <span className="text-xs font-bold text-[#F5F6F8]">Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('coach')}
                  className="p-3 rounded-xl bg-[#12141B] border border-[#262A36] hover:border-[#DA0E19] text-center transition-all flex flex-col items-center gap-1.5"
                >
                  <Users className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-bold text-[#F5F6F8]">Coach</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('client')}
                  className="p-3 rounded-xl bg-[#12141B] border border-[#262A36] hover:border-[#DA0E19] text-center transition-all flex flex-col items-center gap-1.5"
                >
                  <User className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-bold text-[#F5F6F8]">Member</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
