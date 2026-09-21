import React from 'react';
import { AlertTriangle, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface BadgeProps {
  status: 'active' | 'expired' | 'due_soon' | 'never_paid' | 'inactive' | 'A' | 'B' | 'C' | 'high' | 'normal' | 'low' | 'confirmed' | 'pending' | 'failed';
  label?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, label, className = '' }) => {
  switch (status) {
    case 'active':
    case 'confirmed':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}>
          <CheckCircle className="w-3 h-3" />
          {label || (status === 'confirmed' ? 'Confirmed' : 'Active')}
        </span>
      );
    case 'expired':
    case 'failed':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}>
          <AlertCircle className="w-3 h-3" />
          {label || (status === 'failed' ? 'Failed' : 'Expired')}
        </span>
      );
    case 'due_soon':
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 ${className}`}>
          <Clock className="w-3 h-3" />
          {label || (status === 'pending' ? 'Pending Online' : 'Due Soon')}
        </span>
      );
    case 'never_paid':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 ${className}`}>
          <AlertTriangle className="w-3 h-3" />
          {label || 'Never Paid'}
        </span>
      );
    case 'inactive':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 ${className}`}>
          {label || 'Inactive'}
        </span>
      );
    case 'A':
      return <span className={`px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 ${className}`}>Level A (Beginner)</span>;
    case 'B':
      return <span className={`px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 ${className}`}>Level B (Inter)</span>;
    case 'C':
      return <span className={`px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/20 text-purple-300 ${className}`}>Level C (Advanced)</span>;
    case 'high':
      return <span className={`px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 ${className}`}>High</span>;
    case 'normal':
      return <span className={`px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 ${className}`}>Normal</span>;
    case 'low':
      return <span className={`px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/20 text-slate-400 ${className}`}>Low</span>;
    default:
      return <span className={`px-2 py-0.5 rounded text-xs ${className}`}>{label || status}</span>;
  }
};
