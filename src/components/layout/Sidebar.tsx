import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarCheck, CreditCard, Activity,
  TrendingUp, UserCheck, Share2, Package, Settings, Flame
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', path: '/members', icon: Users },
  { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Assessments', path: '/assessments', icon: Activity },
  { name: 'Finance', path: '/finance', icon: TrendingUp },
  { name: 'Coaches', path: '/coaches', icon: UserCheck },
  { name: 'Content', path: '/content', icon: Share2 },
  { name: 'Equipment', path: '/equipment', icon: Package },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#12141B] border-r border-[#262A36] flex flex-col justify-between hidden md:flex shrink-0">
      <div>
        {/* Brand Header & Logo */}
        <div className="p-4 border-b border-[#262A36] flex items-center gap-3">
          <img
            src="/assets/logo.jpeg"
            alt="Prime Form Fitness Initiative Logo"
            className="w-12 h-12 object-contain rounded-lg border border-[#262A36] bg-[#0A0B10]"
          />
          <div>
            <h2 className="font-extrabold font-heading text-[#F5F6F8] text-sm tracking-wider leading-tight">
              PRIME FORM
            </h2>
            <p className="text-[10px] font-semibold text-[#9AA1AE] tracking-widest uppercase">
              FITNESS INITIATIVE
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#DA0E19] text-white shadow-md shadow-[#DA0E19]/25 font-semibold'
                      : 'text-[#9AA1AE] hover:text-[#F5F6F8] hover:bg-[#1A1D26]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-[#262A36] text-xs text-[#9AA1AE]">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-[#F5F6F8]">Kampala Hub</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <p className="text-[11px]">Safe Fields Boston, Kizungu</p>
      </div>
    </aside>
  );
};
