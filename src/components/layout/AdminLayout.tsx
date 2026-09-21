import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Users, CreditCard, MoreHorizontal } from 'lucide-react';

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
  onOpenRecordPayment?: () => void;
  onStartSession?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  title,
  children,
  onOpenRecordPayment,
  onStartSession
}) => {
  return (
    <div className="flex h-screen bg-[#0A0B10] overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          onOpenRecordPayment={onOpenRecordPayment}
          onStartSession={onStartSession}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-[1280px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#12141B] border-t border-[#262A36] px-2 py-1.5 flex items-center justify-around">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#DA0E19]' : 'text-[#9AA1AE]'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/attendance"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#DA0E19]' : 'text-[#9AA1AE]'
            }`
          }
        >
          <CalendarCheck className="w-5 h-5" />
          <span>Attendance</span>
        </NavLink>

        <NavLink
          to="/members"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#DA0E19]' : 'text-[#9AA1AE]'
            }`
          }
        >
          <Users className="w-5 h-5" />
          <span>Members</span>
        </NavLink>

        <NavLink
          to="/payments"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#DA0E19]' : 'text-[#9AA1AE]'
            }`
          }
        >
          <CreditCard className="w-5 h-5" />
          <span>Payments</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#DA0E19]' : 'text-[#9AA1AE]'
            }`
          }
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </NavLink>
      </div>
    </div>
  );
};
