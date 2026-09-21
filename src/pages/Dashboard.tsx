import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { KpiCard } from '../components/common/KpiCard';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { DashboardMetrics, Target, Client, EquipmentNeed } from '../types/database';
import {
  Users, CalendarCheck, TrendingUp, CreditCard, AlertTriangle,
  ArrowUpRight, Plus, UserPlus, Activity, CheckCircle, Package, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';
import { AddMemberDrawer } from '../components/members/AddMemberDrawer';
import { NewAssessmentModal } from '../components/assessments/NewAssessmentModal';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [members, setMembers] = useState<Client[]>([]);
  const [equipment, setEquipment] = useState<EquipmentNeed[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isNewAssessmentOpen, setIsNewAssessmentOpen] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, tRes, clRes, eqRes] = await Promise.all([
        api.getDashboardMetrics(),
        api.getTargets(),
        api.getMembers(),
        api.getEquipmentNeeds()
      ]);
      setMetrics(mRes);
      setTargets(tRes);
      setMembers(clRes);
      setEquipment(eqRes);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Targets helper
  const getGoal = (metric: Target['metric']) => targets.find(t => t.metric === metric)?.goal || 1;

  // Chart data generators
  const attendanceChartData = [
    { week: 'Wk 1', attended: 42, sessions: 4 },
    { week: 'Wk 2', attended: 48, sessions: 4 },
    { week: 'Wk 3', attended: 45, sessions: 4 },
    { week: 'Wk 4', attended: 52, sessions: 4 },
    { week: 'Wk 5', attended: 50, sessions: 4 },
    { week: 'Wk 6', attended: 56, sessions: 4 },
    { week: 'Wk 7', attended: 54, sessions: 4 },
    { week: 'Wk 8', attended: metrics?.checkinsThisWeek || 58, sessions: 4 },
  ];

  const revenueChartData = [
    { month: 'Oct', revenue: 750000 },
    { month: 'Nov', revenue: 850000 },
    { month: 'Dec', revenue: 900000 },
    { month: 'Jan', revenue: 950000 },
    { month: 'Feb', revenue: 1000000 },
    { month: 'Mar', revenue: metrics?.revenueMtdUgx || 850000 },
  ];

  // At-risk and expired member lists for alerts
  const expiredMembers = members.filter(m => (m as any).membership_status === 'expired' || (m as any).membership_status === 'never_paid');
  const stoppedComingMembers = members.filter(m => (m as any).show_up_rate_pct !== undefined && (m as any).show_up_rate_pct < 40);
  const unresolvedEquipment = equipment.filter(e => !e.resolved);

  return (
    <AdminLayout
      title="Dashboard Overview"
      onOpenRecordPayment={() => setIsRecordPaymentOpen(true)}
      onStartSession={() => navigate('/attendance')}
    >
      {/* Quick Actions Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#12141B] border border-[#262A36] rounded-[12px]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#DA0E19] animate-ping" />
          <span className="text-xs font-bold text-[#F5F6F8] tracking-wide uppercase">
            Kampala Safe Fields • Today's Workout Active
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/attendance')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#DA0E19] text-white hover:bg-[#F0202C] transition-all flex items-center gap-1.5 shadow-md shadow-[#DA0E19]/20"
          >
            <CalendarCheck className="w-4 h-4" />
            Start Session
          </button>
          <button
            onClick={() => setIsRecordPaymentOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A1D26] border border-[#262A36] text-[#F5F6F8] hover:border-[#DA0E19] transition-all flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4 text-[#DA0E19]" />
            Record Payment
          </button>
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A1D26] border border-[#262A36] text-[#F5F6F8] hover:border-[#DA0E19] transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 text-[#DA0E19]" />
            Add Member
          </button>
          <button
            onClick={() => setIsNewAssessmentOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A1D26] border border-[#262A36] text-[#F5F6F8] hover:border-[#DA0E19] transition-all flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4 text-[#DA0E19]" />
            New Assessment
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Active Members"
          value={metrics?.activeMembers || 0}
          subtitle={`Target: ${getGoal('active_members')} members`}
          icon={Users}
          trend="+3 this mo"
          trendPositive={true}
        />
        <KpiCard
          title="Check-ins This Wk"
          value={metrics?.checkinsThisWeek || 0}
          subtitle="Mon - Thu 7am sessions"
          icon={CalendarCheck}
        />
        <KpiCard
          title="Show-Up Rate (30d)"
          value={`${metrics?.showUpRatePct || 0}%`}
          subtitle={`Goal: ${getGoal('attendance_rate')}% show-up`}
          icon={Activity}
          trendPositive={(metrics?.showUpRatePct || 0) >= getGoal('attendance_rate')}
        />
        <KpiCard
          title="Revenue MTD"
          value={`UGX ${(metrics?.revenueMtdUgx || 0).toLocaleString()}`}
          subtitle={`Goal: UGX ${getGoal('monthly_revenue').toLocaleString()}`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Outstanding Due"
          value={`UGX ${(metrics?.outstandingUgx || 0).toLocaleString()}`}
          subtitle={`${(metrics?.expiredCount || 0)} expired or unpaid`}
          icon={AlertTriangle}
        />
      </div>

      {/* Analytics & Targets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-[#12141B] border border-[#262A36] rounded-[12px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold font-heading text-[#F5F6F8]">Attendance Trends</h3>
              <p className="text-xs text-[#9AA1AE]">Total check-ins across weekly outdoor sessions (Last 8 Weeks)</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-[#1A1D26] text-[#B9BEC7] border border-[#262A36]">
              Mon - Thu
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262A36" vertical={false} />
                <XAxis dataKey="week" stroke="#9AA1AE" fontSize={12} tickLine={false} />
                <YAxis stroke="#9AA1AE" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1D26', borderColor: '#262A36', borderRadius: '8px', color: '#F5F6F8' }}
                />
                <Bar dataKey="attended" fill="#DA0E19" radius={[4, 4, 0, 0]} name="Check-ins" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Targets Widget (1 Col) */}
        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold font-heading text-[#F5F6F8] mb-1">Weekly Targets</h3>
            <p className="text-xs text-[#9AA1AE] mb-5">Current performance vs business owner goals</p>

            <div className="space-y-5">
              {/* Target 1: Active Members */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[#F5F6F8]">Active Members</span>
                  <span className="text-[#9AA1AE] tabular-nums">
                    {metrics?.activeMembers || 0} / {getGoal('active_members')}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#1A1D26] rounded-full overflow-hidden border border-[#262A36]">
                  <div
                    className="h-full bg-gradient-to-r from-[#DA0E19] to-[#F0202C] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round(((metrics?.activeMembers || 0) / getGoal('active_members')) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Target 2: Attendance Rate */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[#F5F6F8]">Attendance Rate</span>
                  <span className="text-[#9AA1AE] tabular-nums">
                    {metrics?.showUpRatePct || 0}% / {getGoal('attendance_rate')}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#1A1D26] rounded-full overflow-hidden border border-[#262A36]">
                  <div
                    className="h-full bg-gradient-to-r from-[#DA0E19] to-[#F0202C] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round(((metrics?.showUpRatePct || 0) / getGoal('attendance_rate')) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Target 3: Monthly Revenue */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[#F5F6F8]">Monthly Revenue</span>
                  <span className="text-[#9AA1AE] tabular-nums">
                    UGX {((metrics?.revenueMtdUgx || 0) / 1000).toFixed(0)}k / {(getGoal('monthly_revenue') / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#1A1D26] rounded-full overflow-hidden border border-[#262A36]">
                  <div
                    className="h-full bg-gradient-to-r from-[#DA0E19] to-[#F0202C] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round(((metrics?.revenueMtdUgx || 0) / getGoal('monthly_revenue')) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#262A36] flex items-center justify-between text-xs">
            <span className="text-[#9AA1AE]">Configured in Settings</span>
            <button
              onClick={() => navigate('/settings')}
              className="text-[#DA0E19] font-semibold hover:underline"
            >
              Edit Goals →
            </button>
          </div>
        </div>
      </div>

      {/* Revenue & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-[#12141B] border border-[#262A36] rounded-[12px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold font-heading text-[#F5F6F8]">Revenue Trend (UGX)</h3>
              <p className="text-xs text-[#9AA1AE]">Monthly member payment receipts (Last 6 Months)</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              UGX Currency
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DA0E19" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#DA0E19" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262A36" vertical={false} />
                <XAxis dataKey="month" stroke="#9AA1AE" fontSize={12} tickLine={false} />
                <YAxis stroke="#9AA1AE" fontSize={12} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  formatter={(val: number) => [`UGX ${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#1A1D26', borderColor: '#262A36', borderRadius: '8px', color: '#F5F6F8' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#DA0E19" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Alerts Panel (1 Col) */}
        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold font-heading text-[#F5F6F8] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Hub Action Alerts
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {(metrics?.expiredCount || 0) + (metrics?.stoppedComingCount || 0) + unresolvedEquipment.length} Action Items
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {/* Expired Memberships */}
              {expiredMembers.slice(0, 3).map(m => (
                <div key={m.id} className="p-3 rounded-lg bg-[#1A1D26] border border-[#262A36] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#262A36] text-[#B9BEC7] font-bold text-xs flex items-center justify-center shrink-0">
                      {m.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#F5F6F8] truncate">{m.full_name}</h4>
                      <p className="text-[10px] text-amber-400 font-medium">Membership Expired</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsRecordPaymentOpen(true)}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-[#DA0E19] text-white hover:bg-[#F0202C] shrink-0"
                  >
                    Collect
                  </button>
                </div>
              ))}

              {/* Stopped Coming */}
              {stoppedComingMembers.slice(0, 2).map(m => (
                <div key={m.id} className="p-3 rounded-lg bg-[#1A1D26] border border-[#262A36] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#262A36] text-[#B9BEC7] font-bold text-xs flex items-center justify-center shrink-0">
                      {m.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#F5F6F8] truncate">{m.full_name}</h4>
                      <p className="text-[10px] text-rose-400 font-medium">Low Attendance (&lt;40%)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/members/${m.id}`)}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-[#262A36] text-[#F5F6F8] hover:border-[#DA0E19] shrink-0"
                  >
                    View
                  </button>
                </div>
              ))}

              {/* Equipment Needed */}
              {unresolvedEquipment.slice(0, 2).map(eq => (
                <div key={eq.id} className="p-3 rounded-lg bg-[#1A1D26] border border-[#262A36] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#F5F6F8] truncate">{eq.item} ({eq.quantity}x)</h4>
                      <p className="text-[10px] text-[#9AA1AE]">Wishlist priority: {eq.priority}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/equipment')}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-[#262A36] text-[#F5F6F8] shrink-0"
                  >
                    Equipment
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#262A36] text-right">
            <button
              onClick={() => navigate('/members')}
              className="text-xs font-bold text-[#DA0E19] hover:underline"
            >
              View All Members →
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSuccess={loadData}
      />

      <AddMemberDrawer
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSuccess={loadData}
      />

      <NewAssessmentModal
        isOpen={isNewAssessmentOpen}
        onClose={() => setIsNewAssessmentOpen(false)}
        onSuccess={loadData}
      />
    </AdminLayout>
  );
};
