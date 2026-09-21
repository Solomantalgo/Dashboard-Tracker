import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, TrendingUp, CreditCard, User, Flame, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MemberLayoutProps {
  children: React.ReactNode;
}

export const MemberLayout: React.FC<MemberLayoutProps> = ({ children }) => {
  const { setRole, activeMember, setActiveMemberId, allMembers } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0B10] text-[#F5F6F8] flex flex-col pb-20">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 bg-[#12141B]/95 backdrop-blur-md border-b border-[#262A36] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo.jpeg"
            alt="PFFI Logo"
            className="w-9 h-9 object-contain rounded-lg border border-[#262A36] bg-[#0A0B10]"
          />
          <div>
            <h1 className="font-extrabold font-heading text-sm text-[#F5F6F8]">PFFI Member Portal</h1>
            <p className="text-[10px] text-[#9AA1AE]">Kampala Outdoor Training</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Member Switcher for Demo */}
          <select
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
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-5">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#12141B] border-t border-[#262A36] px-4 py-2 flex items-center justify-around max-w-md mx-auto">
        <NavLink
          to="/portal"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-[#DA0E19]' : 'text-[#9AA1AE]'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/portal/progress"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-[#DA0E19]' : 'text-[#9AA1AE]'
            }`
          }
        >
          <TrendingUp className="w-5 h-5" />
          <span>Progress</span>
        </NavLink>

        <NavLink
          to="/portal/payments"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-[#DA0E19]' : 'text-[#9AA1AE]'
            }`
          }
        >
          <CreditCard className="w-5 h-5" />
          <span>Payments</span>
        </NavLink>

        <NavLink
          to="/portal/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-[#DA0E19]' : 'text-[#9AA1AE]'
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
