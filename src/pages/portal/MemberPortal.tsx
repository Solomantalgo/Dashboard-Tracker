import React, { useEffect, useState } from 'react';
import { MemberLayout } from '../../components/layout/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Payment, Assessment, Session } from '../../types/database';
import { Badge } from '../../components/common/Badge';
import {
  Flame, CreditCard, Activity, CalendarCheck, CheckCircle2,
  AlertTriangle, Lock, TrendingUp, ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { differenceInDays, parseISO } from 'date-fns';
import { Routes, Route, NavLink } from 'react-router-dom';

const MemberHome: React.FC = () => {
  const { activeMember } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    if (activeMember) {
      api.getPayments().then(pList => setPayments(pList.filter(p => p.client_id === activeMember.id)));
      api.getAssessments(activeMember.id).then(aList => setAssessments(aList));
    }
  }, [activeMember]);

  if (!activeMember) return <div>Select a member above</div>;

  const mStatus = (activeMember as any).membership_status || 'never_paid';
  const showUpRate = (activeMember as any).show_up_rate_pct ?? 0;
  const expiresOn = (activeMember as any).expires_on;

  let daysLeft = 0;
  if (expiresOn) {
    daysLeft = differenceInDays(parseISO(expiresOn), new Date());
  }

  // Calculate notifications
  const notifications: string[] = [];
  if (mStatus === 'expired' || mStatus === 'never_paid') {
    notifications.push('Membership Expired! Please renew with Coach Alex.');
  } else if (daysLeft >= 0 && daysLeft <= 7) {
    notifications.push(`Membership expiring in ${daysLeft} days.`);
  }

  const latestAss = assessments[0];
  if (!latestAss || differenceInDays(new Date(), parseISO(latestAss.assessed_on)) > 28) {
    notifications.push('Monthly Fitness Assessment is due!');
  }

  return (
    <div className="space-y-4">
      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((msg, i) => (
            <div key={i} className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Member Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#12141B] via-[#1A1D26] to-[#0A0B10] border border-[#DA0E19]/40 shadow-xl relative overflow-hidden space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#DA0E19] tracking-wider">PFFI Athlete Pass</span>
            <h2 className="text-xl font-extrabold font-heading text-[#F5F6F8]">{activeMember.full_name}</h2>
            <p className="text-xs font-mono text-[#9AA1AE]">{activeMember.member_code}</p>
          </div>
          <Badge status={mStatus} />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#262A36]">
          <div>
            <span className="text-[10px] text-[#9AA1AE] uppercase font-bold">Expires On</span>
            <span className="block text-sm font-bold text-[#F5F6F8] font-mono">{expiresOn || 'Expired'}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#9AA1AE] uppercase font-bold">Assigned Coach</span>
            <span className="block text-sm font-bold text-[#F5F6F8]">{activeMember.coach_name || 'Coach Alex'}</span>
          </div>
        </div>
      </div>

      {/* Show-up Ring Card */}
      <div className="p-5 rounded-xl bg-[#12141B] border border-[#262A36] flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold text-[#9AA1AE]">30-Day Attendance</span>
          <h3 className="text-2xl font-black font-heading text-[#DA0E19] tabular-nums mt-0.5">
            {showUpRate}%
          </h3>
          <p className="text-[11px] text-[#9AA1AE]">Outdoor Monday - Thursday Sessions</p>
        </div>

        <div className="w-14 h-14 rounded-full bg-[#1A1D26] border-4 border-[#DA0E19] text-[#F5F6F8] font-black text-sm flex items-center justify-center">
          {showUpRate}%
        </div>
      </div>
    </div>
  );
};

const MemberProgress: React.FC = () => {
  const { activeMember } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    if (activeMember) {
      api.getAssessments(activeMember.id).then(aList => setAssessments(aList));
    }
  }, [activeMember]);

  if (!activeMember) return null;

  const baseline = assessments[assessments.length - 1];
  const latest = assessments[0];

  const chartData = [...assessments].reverse().map(a => ({
    date: a.assessed_on,
    pushups: a.pushups,
    plank: a.plank_seconds
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold font-heading text-[#F5F6F8]">My Fitness Progress</h2>

      {/* Progression Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-[#12141B] border border-[#262A36]">
          <span className="text-[10px] text-[#9AA1AE] uppercase font-bold">Max Pushups</span>
          <h3 className="text-xl font-black text-[#F5F6F8] mt-1">{latest?.pushups ?? 0} reps</h3>
          {baseline && latest && (
            <p className="text-[10px] font-bold text-emerald-400 mt-0.5">
              +{(latest.pushups ?? 0) - (baseline.pushups ?? 0)} reps since baseline
            </p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-[#12141B] border border-[#262A36]">
          <span className="text-[10px] text-[#9AA1AE] uppercase font-bold">Plank Hold</span>
          <h3 className="text-xl font-black text-[#F5F6F8] mt-1">{latest?.plank_seconds ?? 0} s</h3>
          {baseline && latest && (
            <p className="text-[10px] font-bold text-emerald-400 mt-0.5">
              +{(latest.plank_seconds ?? 0) - (baseline.plank_seconds ?? 0)}s hold
            </p>
          )}
        </div>
      </div>

      {/* Pushups Progression Chart */}
      {chartData.length > 0 && (
        <div className="p-4 rounded-xl bg-[#12141B] border border-[#262A36]">
          <h3 className="text-xs font-bold text-[#F5F6F8] mb-3">Pushups Progression</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262A36" />
                <XAxis dataKey="date" stroke="#9AA1AE" fontSize={10} />
                <YAxis stroke="#9AA1AE" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D26', borderColor: '#262A36', fontSize: '11px' }} />
                <Line type="monotone" dataKey="pushups" stroke="#DA0E19" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const MemberPayments: React.FC = () => {
  const { activeMember } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (activeMember) {
      api.getPayments().then(pList => setPayments(pList.filter(p => p.client_id === activeMember.id)));
    }
  }, [activeMember]);

  if (!activeMember) return null;

  const mStatus = (activeMember as any).membership_status || 'never_paid';
  const balanceDue = (mStatus === 'expired' || mStatus === 'never_paid') ? 50000 : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold font-heading text-[#F5F6F8]">My Membership & Payments</h2>

      {/* Balance Card */}
      <div className="p-5 rounded-xl bg-[#12141B] border border-[#262A36] space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-[#9AA1AE] uppercase font-bold">Outstanding Balance</span>
          <Badge status={mStatus} />
        </div>
        <h3 className="text-2xl font-black text-[#DA0E19] tabular-nums font-heading">
          UGX {balanceDue.toLocaleString()}
        </h3>

        {/* Disabled Online Payment Seam Button */}
        <button
          disabled
          className="w-full py-2.5 rounded-lg text-xs font-bold bg-[#1A1D26] border border-[#262A36] text-[#9AA1AE] flex items-center justify-center gap-2 cursor-not-allowed opacity-70"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          Pay Online via MoMo (Coming Soon)
        </button>
      </div>

      {/* Payment History */}
      <div className="p-4 rounded-xl bg-[#12141B] border border-[#262A36] space-y-3">
        <h3 className="text-xs font-bold text-[#F5F6F8]">Payment Receipts</h3>
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="p-3 rounded-lg bg-[#1A1D26] border border-[#262A36] flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-[#F5F6F8] block">{p.plan_name}</span>
                <span className="text-[10px] text-[#9AA1AE]">Paid on {p.paid_on} via {p.method}</span>
              </div>
              <span className="font-extrabold text-emerald-400 tabular-nums">
                UGX {p.amount_ugx.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MemberProfileView: React.FC = () => {
  const { activeMember } = useAuth();
  if (!activeMember) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold font-heading text-[#F5F6F8]">My Profile Details</h2>

      <div className="p-5 rounded-xl bg-[#12141B] border border-[#262A36] space-y-3 text-xs">
        <div className="flex justify-between py-1.5 border-b border-[#262A36]">
          <span className="text-[#9AA1AE]">Full Name</span>
          <span className="font-bold text-[#F5F6F8]">{activeMember.full_name}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-[#262A36]">
          <span className="text-[#9AA1AE]">Member Code</span>
          <span className="font-mono font-bold text-[#B9BEC7]">{activeMember.member_code}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-[#262A36]">
          <span className="text-[#9AA1AE]">Phone Number</span>
          <span className="font-bold text-[#F5F6F8]">{activeMember.phone || '—'}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-[#262A36]">
          <span className="text-[#9AA1AE]">Area</span>
          <span className="font-bold text-[#F5F6F8]">{activeMember.area || 'Kampala'}</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-[#9AA1AE]">Fitness Goals</span>
          <span className="font-bold text-[#F5F6F8]">{activeMember.goals.join(', ')}</span>
        </div>
      </div>
    </div>
  );
};

export const MemberPortal: React.FC = () => {
  return (
    <MemberLayout>
      <Routes>
        <Route index element={<MemberHome />} />
        <Route path="progress" element={<MemberProgress />} />
        <Route path="payments" element={<MemberPayments />} />
        <Route path="profile" element={<MemberProfileView />} />
      </Routes>
    </MemberLayout>
  );
};
