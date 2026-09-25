import React, { useEffect, useState } from 'react';
import { MemberLayout } from '../../components/layout/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Payment, Assessment } from '../../types/database';
import { Badge } from '../../components/common/Badge';
import { AlertTriangle, Lock, TrendingUp, Receipt, UserRound } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { differenceInDays, parseISO } from 'date-fns';
import { Routes, Route } from 'react-router-dom';

const missing = 'Not recorded';
const formatDate = (value?: string) => value || missing;
const formatMetric = (value: number | undefined, unit: string) => value === undefined || value === null ? missing : `${value} ${unit}`;

const comparison = (latest?: number, baseline?: number) => {
  if (latest === undefined || baseline === undefined || latest === baseline) return null;
  const delta = latest - baseline;
  return { text: `${delta > 0 ? '+' : ''}${delta} since baseline`, className: delta > 0 ? 'text-emerald-400' : 'text-rose-300' };
};

const MemberHome: React.FC = () => {
  const { activeMember } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    if (activeMember) api.getAssessments(activeMember.id).then(setAssessments);
  }, [activeMember]);

  if (!activeMember) return <div className="rounded-xl border border-[#262A36] bg-[#12141B] p-5 text-sm text-[#9AA1AE]">Select a member above.</div>;

  const mStatus = (activeMember as any).membership_status || 'never_paid';
  const showUpRate = Math.max(0, Math.min(100, Number((activeMember as any).show_up_rate_pct ?? 0)));
  const expiresOn = (activeMember as any).expires_on as string | undefined;
  const daysLeft = expiresOn ? differenceInDays(parseISO(expiresOn), new Date()) : undefined;
  const coachName = activeMember.coach_name?.trim();
  const latestAss = assessments[0];
  const notifications: string[] = [];

  if (mStatus === 'never_paid') notifications.push('No membership payment has been recorded yet.');
  else if (mStatus === 'expired') notifications.push(`Membership expired${coachName ? ` — contact ${coachName} about renewal.` : '. Please contact the PFFI team about renewal.'}`);
  else if (daysLeft !== undefined && daysLeft >= 0 && daysLeft <= 7) notifications.push(`Membership expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`);
  if (!latestAss || differenceInDays(new Date(), parseISO(latestAss.assessed_on)) > 28) notifications.push('Monthly fitness assessment is due.');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#DA0E19]">Member home</p><h2 className="mt-1 break-words text-2xl font-black font-heading text-[#F5F6F8]">Welcome, {activeMember.full_name}</h2></div>
        <p className="text-xs text-[#9AA1AE]">Your current training snapshot</p>
      </div>

      {notifications.length > 0 && <div className="space-y-2" aria-label="Member alerts">{notifications.map((msg, i) => <div key={i} className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 p-3 text-xs leading-5 text-amber-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{msg}</span></div>)}</div>}

      <section className="relative overflow-hidden space-y-5 rounded-2xl border border-[#DA0E19]/40 bg-gradient-to-br from-[#12141B] via-[#1A1D26] to-[#0A0B10] p-5 shadow-xl sm:p-6" aria-labelledby="athlete-pass-title">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><span className="text-[10px] font-bold uppercase tracking-wider text-[#DA0E19]">PFFI Athlete Pass</span><h3 id="athlete-pass-title" className="mt-1 break-words text-xl font-extrabold font-heading text-[#F5F6F8]">{activeMember.full_name}</h3><p className="mt-1 break-words font-mono text-xs text-[#9AA1AE]">{activeMember.member_code}</p></div><Badge status={mStatus} /></div>
        <div className="grid gap-4 border-t border-[#262A36] pt-4 sm:grid-cols-2"><div className="min-w-0"><span className="text-[10px] font-bold uppercase text-[#9AA1AE]">Expires on</span><span className="mt-1 block break-words font-mono text-sm font-bold text-[#F5F6F8]">{formatDate(expiresOn)}</span></div><div className="min-w-0"><span className="text-[10px] font-bold uppercase text-[#9AA1AE]">Assigned coach</span><span className="mt-1 block break-words text-sm font-bold text-[#F5F6F8]">{coachName || 'No coach assigned'}</span></div></div>
      </section>

      <section className="flex items-center justify-between gap-5 rounded-xl border border-[#262A36] bg-[#12141B] p-5" aria-labelledby="attendance-title"><div className="min-w-0"><span id="attendance-title" className="text-xs font-bold uppercase text-[#9AA1AE]">30-day attendance</span><p className="mt-1 text-sm font-semibold text-[#F5F6F8]">Recorded session attendance</p><p className="mt-1 text-[11px] leading-5 text-[#9AA1AE]">Based on attendance records from the last 30 days.</p></div><div className="grid h-20 w-20 shrink-0 place-items-center rounded-full text-[#F5F6F8]" style={{ background: `conic-gradient(#DA0E19 ${showUpRate}%, #262A36 ${showUpRate}% 100%)` }} aria-label={`${showUpRate}% 30-day attendance`}><div className="grid h-14 w-14 place-items-center rounded-full bg-[#12141B] text-base font-black tabular-nums">{showUpRate}%</div></div></section>
    </div>
  );
};

const MemberProgress: React.FC = () => {
  const { activeMember } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  useEffect(() => { if (activeMember) api.getAssessments(activeMember.id).then(setAssessments); }, [activeMember]);
  if (!activeMember) return null;

  const latest = assessments[0];
  const oldestWithPushups = [...assessments].reverse().find(a => a.pushups !== undefined && a.pushups !== null);
  const oldestWithPlank = [...assessments].reverse().find(a => a.plank_seconds !== undefined && a.plank_seconds !== null);
  const pushupChange = latest ? comparison(latest.pushups, oldestWithPushups?.id === latest.id ? undefined : oldestWithPushups?.pushups) : null;
  const plankChange = latest ? comparison(latest.plank_seconds, oldestWithPlank?.id === latest.id ? undefined : oldestWithPlank?.plank_seconds) : null;
  const chartData = [...assessments].reverse().filter(a => a.pushups !== undefined && a.pushups !== null).map(a => ({ date: a.assessed_on, pushups: a.pushups }));

  return (
    <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#DA0E19]">Progress</p><h2 className="mt-1 text-2xl font-black font-heading text-[#F5F6F8]">My fitness progress</h2><p className="mt-1 text-sm text-[#9AA1AE]">Assessment results recorded by the PFFI team.</p></div>
      {assessments.length === 0 ? <div className="rounded-xl border border-dashed border-[#3A3E4A] bg-[#12141B] p-8 text-center"><TrendingUp className="mx-auto h-8 w-8 text-[#DA0E19]" /><h3 className="mt-3 text-sm font-bold text-[#F5F6F8]">No assessment recorded yet</h3><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#9AA1AE]">Your pushup and plank results will appear here after a coach records an assessment.</p></div> : <>
        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#262A36] bg-[#12141B] p-4"><span className="text-[10px] font-bold uppercase text-[#9AA1AE]">Latest pushups</span><h3 className="mt-1 text-2xl font-black text-[#F5F6F8]">{formatMetric(latest?.pushups, 'reps')}</h3><p className="mt-1 text-[11px] text-[#9AA1AE]">Assessed {formatDate(latest?.assessed_on)}</p>{pushupChange && <p className={`mt-2 text-xs font-bold ${pushupChange.className}`}>{pushupChange.text} reps</p>}{latest?.pushups !== undefined && latest?.pushups !== null && !pushupChange && oldestWithPushups?.id === latest.id && <p className="mt-2 text-xs text-[#9AA1AE]">Baseline assessment</p>}</div><div className="rounded-xl border border-[#262A36] bg-[#12141B] p-4"><span className="text-[10px] font-bold uppercase text-[#9AA1AE]">Latest plank hold</span><h3 className="mt-1 text-2xl font-black text-[#F5F6F8]">{formatMetric(latest?.plank_seconds, 'seconds')}</h3><p className="mt-1 text-[11px] text-[#9AA1AE]">Assessed {formatDate(latest?.assessed_on)}</p>{plankChange && <p className={`mt-2 text-xs font-bold ${plankChange.className}`}>{plankChange.text} seconds</p>}{latest?.plank_seconds !== undefined && latest?.plank_seconds !== null && !plankChange && oldestWithPlank?.id === latest.id && <p className="mt-2 text-xs text-[#9AA1AE]">Baseline assessment</p>}</div></div>
        {chartData.length >= 2 && <div className="rounded-xl border border-[#262A36] bg-[#12141B] p-4 sm:p-5"><div className="mb-3 flex items-end justify-between gap-3"><div><h3 className="text-sm font-bold text-[#F5F6F8]">Pushup progression</h3><p className="mt-1 text-[11px] text-[#9AA1AE]">Recorded results by assessment date</p></div><TrendingUp className="h-4 w-4 text-[#DA0E19]" /></div><div className="h-52 w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#262A36" /><XAxis dataKey="date" stroke="#9AA1AE" fontSize={10} tickMargin={8} /><YAxis stroke="#9AA1AE" fontSize={10} allowDecimals={false} /><Tooltip contentStyle={{ backgroundColor: '#1A1D26', borderColor: '#262A36', fontSize: '11px' }} /><Line type="monotone" dataKey="pushups" name="Pushups" stroke="#DA0E19" strokeWidth={3} dot={{ fill: '#DA0E19', r: 3 }} /></LineChart></ResponsiveContainer></div></div>}
      </>}
    </div>
  );
};

const MemberPayments: React.FC = () => {
  const { activeMember } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  useEffect(() => { if (activeMember) api.getPayments().then(pList => setPayments(pList.filter(p => p.client_id === activeMember.id))); }, [activeMember]);
  if (!activeMember) return null;
  const mStatus = (activeMember as any).membership_status || 'never_paid';
  const expiresOn = (activeMember as any).expires_on as string | undefined;
  const membershipMessage = mStatus === 'active' ? `Membership active${expiresOn ? ` through ${expiresOn}` : ''}.` : mStatus === 'expired' ? 'Membership expired. Please contact the PFFI team about renewal.' : 'No membership payment has been recorded yet.';

  return (
    <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#DA0E19]">Payments</p><h2 className="mt-1 text-2xl font-black font-heading text-[#F5F6F8]">Membership & payments</h2><p className="mt-1 text-sm text-[#9AA1AE]">Your recorded receipts and current membership status.</p></div>
      <section className="rounded-xl border border-[#262A36] bg-[#12141B] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="text-[10px] font-bold uppercase text-[#9AA1AE]">Membership status</span><p className="mt-1 break-words text-base font-bold text-[#F5F6F8]">{membershipMessage}</p></div><Badge status={mStatus} /></div><p className="mt-4 border-t border-[#262A36] pt-4 text-xs leading-5 text-[#9AA1AE]">A balance is not calculated here because the available records contain receipts, not an account-balance ledger.</p><button disabled className="mt-4 flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-[#262A36] bg-[#1A1D26] px-4 py-2.5 text-xs font-bold text-[#9AA1AE] opacity-80"><Lock className="h-3.5 w-3.5 text-amber-400" /> Pay online via MoMo — Coming soon</button></section>
      <section className="rounded-xl border border-[#262A36] bg-[#12141B] p-4 sm:p-5"><div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-[#DA0E19]" /><h3 className="text-sm font-bold text-[#F5F6F8]">Payment receipts</h3></div>{payments.length === 0 ? <div className="py-8 text-center"><p className="text-sm font-semibold text-[#F5F6F8]">No receipts recorded yet</p><p className="mt-1 text-xs leading-5 text-[#9AA1AE]">Recorded payments will appear here once the PFFI team adds them.</p></div> : <div className="mt-4 space-y-2">{payments.map(p => <div key={p.id} className="flex flex-col gap-3 rounded-lg border border-[#262A36] bg-[#1A1D26] p-3 text-xs sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><span className="block break-words font-bold text-[#F5F6F8]">{p.plan_name || 'Membership payment'}</span><span className="mt-1 block break-words text-[10px] leading-4 text-[#9AA1AE]">Paid on {p.paid_on || missing} · {p.method || 'Method not recorded'}</span></div><div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end"><Badge status={p.status} /><span className={`font-extrabold tabular-nums ${p.amount_ugx === 0 ? 'text-[#B9BEC7]' : 'text-[#F5F6F8]'}`}>UGX {(p.amount_ugx ?? 0).toLocaleString()}</span></div></div>)}</div>}</section>
    </div>
  );
};

const MemberProfileView: React.FC = () => {
  const { activeMember } = useAuth();
  if (!activeMember) return null;
  const goals = activeMember.goals?.filter(Boolean).join(', ') || 'No goals recorded';
  const rows = [['Full name', activeMember.full_name || missing], ['Member code', activeMember.member_code || missing], ['Phone number', activeMember.phone || missing], ['Area', activeMember.area || missing], ['Fitness goals', goals]];
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#DA0E19]">Profile</p><h2 className="mt-1 text-2xl font-black font-heading text-[#F5F6F8]">My profile details</h2><p className="mt-1 text-sm text-[#9AA1AE]">Read-only information held in your member record.</p></div><section className="rounded-xl border border-[#262A36] bg-[#12141B] p-4 sm:p-5" aria-label="Profile details"><div className="divide-y divide-[#262A36]">{rows.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[minmax(8rem,30%)_1fr] sm:items-start sm:gap-6"><span className="text-xs text-[#9AA1AE]">{label}</span><span className="min-w-0 break-words text-sm font-bold text-[#F5F6F8]">{value}</span></div>)}</div></section><div className="flex items-start gap-2 rounded-xl border border-[#262A36] bg-[#12141B] p-4 text-xs leading-5 text-[#9AA1AE]"><UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#DA0E19]" /><span>Need to update a profile detail? Please contact the PFFI team.</span></div></div>;
};

export const MemberPortal: React.FC = () => <MemberLayout><Routes><Route index element={<MemberHome />} /><Route path="progress" element={<MemberProgress />} /><Route path="payments" element={<MemberPayments />} /><Route path="profile" element={<MemberProfileView />} /></Routes></MemberLayout>;
