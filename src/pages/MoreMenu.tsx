import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  ChevronRight,
  Package,
  Settings,
  Share2,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';

const moreItems = [
  { name: 'Assessments', description: 'Track member progress and fitness assessments', path: '/assessments', icon: Activity },
  { name: 'Finance', description: 'Review revenue, expenses, and financial activity', path: '/finance', icon: TrendingUp },
  { name: 'Coaches', description: 'Manage coaches and coach performance', path: '/coaches', icon: UserCheck },
  { name: 'Content', description: 'Track content production and publishing', path: '/content', icon: Share2 },
  { name: 'Equipment', description: 'Monitor equipment and maintenance needs', path: '/equipment', icon: Package },
  { name: 'Settings', description: 'Configure hub targets and business rules', path: '/settings', icon: Settings },
];

export const MoreMenu: React.FC = () => {
  return (
    <AdminLayout title="More">
      <div className="space-y-4">
        <div>
          <h2 className="font-bold font-heading text-[#F5F6F8] text-lg">More sections</h2>
          <p className="text-sm text-[#9AA1AE] mt-1">Access the rest of the admin tools.</p>
        </div>

        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] overflow-hidden">
          {moreItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-4 hover:bg-[#1A1D26] transition-colors ${
                  index < moreItems.length - 1 ? 'border-b border-[#262A36]' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#1A1D26] border border-[#262A36] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#DA0E19]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold font-heading text-sm text-[#F5F6F8]">{item.name}</h3>
                  <p className="text-xs text-[#9AA1AE] mt-0.5">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#9AA1AE] shrink-0" />
              </NavLink>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};
