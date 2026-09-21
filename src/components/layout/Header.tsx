import React, { useState } from 'react';
import { Search, Plus, CreditCard, Calendar, UserCheck, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  onOpenRecordPayment?: () => void;
  onStartSession?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenRecordPayment,
  onStartSession
}) => {
  const { role, setRole, activeMember, setActiveMemberId, allMembers } = useAuth();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-[#0A0B10]/90 backdrop-blur-md border-b border-[#262A36] px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-[#F5F6F8] tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
        {/* Global Search */}
        <div className="relative hidden md:block w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA1AE]" />
          <input
            type="text"
            placeholder="Search member, phone or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-[#12141B] border border-[#262A36] rounded-lg text-[#F5F6F8] placeholder-[#9AA1AE] focus:outline-none focus:border-[#DA0E19]"
          />
        </div>

        {/* Quick Action Buttons */}
        {role === 'admin' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onStartSession) onStartSession();
                else navigate('/attendance');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1A1D26] text-[#F5F6F8] border border-[#262A36] hover:border-[#DA0E19] transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-[#DA0E19]" />
              <span className="hidden sm:inline">+ Session</span>
            </button>
            <button
              onClick={() => {
                if (onOpenRecordPayment) onOpenRecordPayment();
                else navigate('/payments');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#DA0E19] text-white hover:bg-[#F0202C] transition-all shadow-md shadow-[#DA0E19]/20"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Payment</span>
            </button>
          </div>
        )}

        {/* Demo Role Switcher */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#262A36]">
          <div className="flex items-center rounded-lg p-0.5 bg-[#12141B] border border-[#262A36] text-xs">
            <button
              onClick={() => {
                setRole('admin');
                navigate('/dashboard');
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${role === 'admin' ? 'bg-[#DA0E19] text-white shadow-sm' : 'text-[#9AA1AE] hover:text-white'}`}
            >
              <Shield className="w-3 h-3" />
              Admin
            </button>
            <button
              onClick={() => {
                setRole('client');
                navigate('/portal');
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${role === 'client' ? 'bg-[#DA0E19] text-white shadow-sm' : 'text-[#9AA1AE] hover:text-white'}`}
            >
              <User className="w-3 h-3" />
              Portal
            </button>
          </div>

          {/* If Portal Mode, allow selecting demo member */}
          {role === 'client' && (
            <select
              value={activeMember?.id || ''}
              onChange={(e) => setActiveMemberId(e.target.value)}
              className="bg-[#1A1D26] text-xs border border-[#262A36] text-[#F5F6F8] rounded-md px-2 py-1 focus:outline-none"
            >
              {allMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.member_code})
                </option>
              ))}
            </select>
          )}

          {/* User Avatar Initials */}
          <div className="w-8 h-8 rounded-full bg-[#1A1D26] border border-[#262A36] text-[#B9BEC7] font-semibold text-xs flex items-center justify-center">
            {role === 'admin' ? 'AD' : activeMember?.full_name.substring(0, 2).toUpperCase() || 'MB'}
          </div>
        </div>
      </div>
    </header>
  );
};
