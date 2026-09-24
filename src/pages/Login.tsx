import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Users, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
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
    <div className="w-full max-w-full min-h-screen bg-[#0A0B10] text-[#F5F6F8] flex flex-col md:grid md:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
      <section className="w-full max-w-full min-w-0 md:min-h-screen bg-[#12141B] border-b md:border-b-0 md:border-r border-[#262A36] px-6 pt-8 pb-12 sm:px-10 md:px-12 md:pr-12 lg:px-16 lg:pr-16 xl:px-20 xl:pr-20 md:py-14 flex flex-col justify-start md:justify-between relative">
        <div className="absolute top-0 right-0 h-full w-16 border-l border-[#262A36]/70 pointer-events-none" />
        <div className="absolute top-10 right-8 w-2 h-2 bg-[#DA0E19]/70 pointer-events-none" />
        <div className="absolute bottom-10 right-8 w-10 h-px bg-[#DA0E19]/25 pointer-events-none" />

        <div className="relative w-full min-w-0 max-w-none md:max-w-xl">
          <div className="flex items-center gap-3 mb-7 md:mb-12">
            <img
              src="/assets/logo.jpeg"
              alt="Prime Form Fitness Initiative Logo"
              className="w-12 h-12 rounded-xl object-cover border border-[#3A3E4A] bg-[#0A0B10]"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-black font-heading tracking-[0.18em] text-[#F5F6F8]">PRIME FORM</h1>
              <p className="text-xs tracking-widest text-[#B9BEC7] uppercase">FITNESS INITIATIVE</p>
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#DA0E19] mb-4">Member Tracker</p>
          <h2 className="break-words text-3xl sm:text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl font-black font-heading tracking-[-0.04em] leading-[0.96] text-[#F5F6F8] mb-5">
            Real Training.<br />
            <span className="text-[#DA0E19]">Real Results.</span>
          </h2>
          <p className="w-full max-w-full break-words text-[#B9BEC7] text-sm md:text-base leading-6 md:leading-7">
            <span className="md:hidden">Track attendance, assessments, and progress for the PFFI community.</span>
            <span className="hidden md:inline">Kampala's premier outdoor group training community hub at Kizungu, Safe Fields Boston. Track attendance, assessments, and progress in real time.</span>
          </p>
        </div>

        <div className="hidden md:flex relative mt-16 pt-5 border-t border-[#262A36] text-xs text-[#9AA1AE] items-start justify-between gap-x-4 gap-y-2 flex-wrap max-w-xl">
          <span className="shrink-0">PFFI Member Tracker v2.0</span>
          <span className="min-w-0 flex items-center gap-1 text-right break-words">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isSupabaseConfigured ? 'Supabase Connected' : 'Local Demo Mode'}
          </span>
        </div>
      </section>

      <section className="w-full max-w-full min-w-0 px-6 py-10 sm:px-10 md:pl-12 md:pr-12 lg:pl-16 lg:pr-16 flex items-center justify-center">
        <div className="w-full min-w-0 max-w-none md:max-w-[460px] md:border md:border-[#262A36] md:bg-[#12141B] md:rounded-2xl md:p-8 md:pr-8 lg:p-10 lg:pr-10">
          <div className="w-full mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#DA0E19] mb-3">Secure access</p>
            <h3 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-[#F5F6F8] mb-3">Welcome back.</h3>
            <p className="w-full max-w-full break-words text-sm leading-6 text-[#9AA1AE]">
              Sign in to continue to your dashboard or member portal.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm leading-5">
              Demo mode - not connected to a live database. Set `VITE_DEMO_MODE=true` for explicit local demo access, or configure Supabase to sign in to a real account.
            </div>
          )}

          {error && (
            <div className="mb-6" aria-live="polite">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm leading-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full min-w-0 space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-[#B9BEC7] uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative w-full min-w-0">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA1AE]" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3.5 text-sm bg-[#0F1016] border border-[#30343F] rounded-xl text-[#F5F6F8] placeholder-[#6F7684] focus:outline-none focus:border-[#DA0E19] focus:ring-2 focus:ring-[#DA0E19]/25 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-[#B9BEC7] uppercase tracking-wider mb-2">Password</label>
              <div className="relative w-full min-w-0">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA1AE]" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3.5 text-sm bg-[#0F1016] border border-[#30343F] rounded-xl text-[#F5F6F8] placeholder-[#6F7684] focus:outline-none focus:border-[#DA0E19] focus:ring-2 focus:ring-[#DA0E19]/25 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#DA0E19] hover:bg-[#F0202C] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/40 focus:ring-offset-2 focus:ring-offset-[#12141B] text-white font-bold rounded-xl shadow-lg shadow-[#DA0E19]/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {isDemoMode && (
            <div className="mt-8 pt-7 border-t border-[#262A36]">
              <div className="text-xs font-semibold text-[#9AA1AE] uppercase tracking-wider mb-4 text-center">Quick Demo Access</div>
              <div className="grid grid-cols-3 gap-3">
                <button type="button" onClick={() => handleDemoLogin('admin')} className="min-h-[76px] p-3 rounded-xl bg-[#0F1016] border border-[#30343F] hover:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/30 text-center transition-all flex flex-col items-center justify-center gap-1.5">
                  <Shield className="w-5 h-5 text-[#DA0E19]" />
                  <span className="text-xs font-bold text-[#F5F6F8]">Admin</span>
                </button>
                <button type="button" onClick={() => handleDemoLogin('coach')} className="min-h-[76px] p-3 rounded-xl bg-[#0F1016] border border-[#30343F] hover:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/30 text-center transition-all flex flex-col items-center justify-center gap-1.5">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-bold text-[#F5F6F8]">Coach</span>
                </button>
                <button type="button" onClick={() => handleDemoLogin('client')} className="min-h-[76px] p-3 rounded-xl bg-[#0F1016] border border-[#30343F] hover:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/30 text-center transition-all flex flex-col items-center justify-center gap-1.5">
                  <User className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-bold text-[#F5F6F8]">Member</span>
                </button>
              </div>
            </div>
          )}

          <div className="md:hidden mt-8 pt-5 border-t border-[#262A36] text-[11px] text-[#7F8795] flex flex-col items-start gap-3">
            <span>PFFI Member Tracker v2.0</span>
            <span className="flex items-center gap-1.5 break-words">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isSupabaseConfigured ? 'Supabase Connected' : 'Local Demo Mode'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
