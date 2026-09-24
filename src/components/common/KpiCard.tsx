import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive
}) => {
  return (
    <div className="relative h-full min-h-[148px] overflow-hidden rounded-[12px] bg-[#12141B] border border-[#262A36] p-5 shadow-lg group hover:border-[#DA0E19]/40 transition-all duration-200 flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-px bg-[#3A3E4A] group-hover:bg-[#DA0E19] transition-colors" />
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#9AA1AE]">{title}</span>
        <div className="p-2 rounded-lg bg-[#1A1D26] text-[#DA0E19] group-hover:text-white group-hover:bg-[#DA0E19] transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 flex-1">
        <h3 className="text-2xl sm:text-3xl font-bold font-heading text-[#F5F6F8] tabular-nums tracking-tight">
          {value}
        </h3>
        {trend && (
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${trendPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 min-h-[30px] text-xs leading-5 text-[#9AA1AE]">{subtitle}</p>
      )}
    </div>
  );
};
