import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, CreditCard, User, Flame, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MemberLayoutProps {
  children: React.ReactNode;
}

export const MemberLayout: React.FC<MemberLayoutProps> = ({ children }) => {
  const { setRole, activeMember, setActiveMemberId, allMembers, isDemoMode, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0B10] text-[#F5F6F8] flex flex-col pb-24 md:pb-0 md:pl-64">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 bg-[#12141B]/95 backdrop-blur-md border-b border-[#262A36] px-4 py-3 md:px-8 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/assets/logo.jpeg"
            alt="PFFI Logo"
            className="w-9 h-9 object-contain rounded-lg border border-[#262A36] bg-[#0A0B10]"
          />
          <div className="min-w-0">
            <h1 className="break-words font-extrabold font-heading text-sm text-[#F5F6F8]">PFFI Member Portal</h1>
            <p className="text-[10px] text-[#9AA1AE]">Kampala Outdoor Training</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isDemoMode && (
            <div className="flex items-center gap-2">
            {/* Member Switcher for Demo */}
            <select
              aria-label="Demo member switcher"
              value={activeMember?.id || ''}
              onChange={(e) => setActiveMemberId(e.target.value)}
              className="bg-[#1A1D26] text-xs border border-[#262A36] text-[#F5F6F8] rounded-md px-2 py-1 focus:outline-none"
            >
              {allMembers.map(m => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>

            {/* Switch to Admin mode */}
            <button
              onClick={() => setRole('admin')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#1A1D26] border border-[#262A36] text-[#9AA1AE] hover:text-white hover:border-[#DA0E19] flex items-center gap-1"
            >
              <Shield className="w-3 h-3 text-[#DA0E19]" />
              Admin
            </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg p-2 text-[#9AA1AE] transition-colors hover:bg-[#1A1D26] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/50"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-5 md:max-w-4xl md:px-8 md:py-10">
        {children}
      </main>

      {/* Portal Navigation: bottom tabs on phones, left rail on larger screens */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[#262A36] bg-[#12141B] px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.2)] md:top-0 md:bottom-0 md:left-0 md:right-auto md:w-64 md:max-w-none md:border-r md:border-t-0 md:px-4 md:py-8 md:shadow-none md:flex-col md:justify-start md:items-stretch md:gap-2">
        <div className="hidden md:flex items-center gap-3 px-2 pb-8">
          <img src="/assets/logo.jpeg" alt="PFFI Logo" className="w-11 h-11 object-contain rounded-lg border border-[#262A36] bg-[#0A0B10]" />
          <div>
            <div className="text-sm font-extrabold font-heading text-[#F5F6F8]">PFFI</div>
            <div className="text-[10px] text-[#9AA1AE] uppercase tracking-widest">Member Portal</div>
          </div>
        </div>
        <NavLink
          to="/portal"
          end
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col md:flex-row md:items-center md:gap-3 md:w-full md:flex-none md:px-3 md:py-3 md:rounded-lg items-center gap-1 rounded-lg p-1 text-xs font-semibold transition-colors ${
              isActive ? 'bg-[#DA0E19]/10 text-[#DA0E19] ring-1 ring-inset ring-[#DA0E19]/35' : 'text-[#9AA1AE] hover:bg-[#1A1D26] hover:text-[#F5F6F8]'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/portal/progress"
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col md:flex-row md:items-center md:gap-3 md:w-full md:flex-none md:px-3 md:py-3 md:rounded-lg items-center gap-1 rounded-lg p-1 text-xs font-semibold transition-colors ${
              isActive ? 'bg-[#DA0E19]/10 text-[#DA0E19] ring-1 ring-inset ring-[#DA0E19]/35' : 'text-[#9AA1AE] hover:bg-[#1A1D26] hover:text-[#F5F6F8]'
            }`
          }
        >
          <TrendingUp className="w-5 h-5" />
          <span>Progress</span>
        </NavLink>

        <NavLink
          to="/portal/payments"
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col md:flex-row md:items-center md:gap-3 md:w-full md:flex-none md:px-3 md:py-3 md:rounded-lg items-center gap-1 rounded-lg p-1 text-xs font-semibold transition-colors ${
              isActive ? 'bg-[#DA0E19]/10 text-[#DA0E19] ring-1 ring-inset ring-[#DA0E19]/35' : 'text-[#9AA1AE] hover:bg-[#1A1D26] hover:text-[#F5F6F8]'
            }`
          }
        >
          <CreditCard className="w-5 h-5" />
          <span>Payments</span>
        </NavLink>

        <NavLink
          to="/portal/profile"
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col md:flex-row md:items-center md:gap-3 md:w-full md:flex-none md:px-3 md:py-3 md:rounded-lg items-center gap-1 rounded-lg p-1 text-xs font-semibold transition-colors ${
              isActive ? 'bg-[#DA0E19]/10 text-[#DA0E19] ring-1 ring-inset ring-[#DA0E19]/35' : 'text-[#9AA1AE] hover:bg-[#1A1D26] hover:text-[#F5F6F8]'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};
