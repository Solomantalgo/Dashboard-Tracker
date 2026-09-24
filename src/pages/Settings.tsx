import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { Target, Plan } from '../types/database';
import { Download, Shield, Lock, Check, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeGoal, setActiveGoal] = useState<number>(25);
  const [attendanceGoal, setAttendanceGoal] = useState<number>(80);
  const [revenueGoal, setRevenueGoal] = useState<number>(1000000);
  const [savedMsg, setSavedMsg] = useState('');
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [tRes, pRes] = await Promise.all([api.getTargets(), api.getPlans()]);
      setPlans(pRes);

      const activeTarget = tRes.find((t: Target) => t.metric === 'active_members');
      const attendanceTarget = tRes.find((t: Target) => t.metric === 'attendance_rate');
      const revenueTarget = tRes.find((t: Target) => t.metric === 'monthly_revenue');
      if (activeTarget) setActiveGoal(activeTarget.goal);
      if (attendanceTarget) setAttendanceGoal(attendanceTarget.goal);
      if (revenueTarget) setRevenueGoal(revenueTarget.goal);
    } catch (err) {
      console.error('Error loading settings:', err);
      setLoadError('Settings could not be loaded. Check the connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    setSaveError('');
    try {
      await api.updateTarget('active_members', activeGoal);
      await api.updateTarget('attendance_rate', attendanceGoal);
      await api.updateTarget('monthly_revenue', revenueGoal);
      setSavedMsg('Dashboard targets saved successfully.');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      console.error('Error saving dashboard targets:', err);
      setSaveError('Targets could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = async () => {
    const members = await api.getMembers();
    const headers = ['member_code', 'full_name', 'status', 'phone', 'area', 'date_joined', 'level', 'membership_status'];
    const rows = members.map(m => [
      m.member_code,
      `"${m.full_name}"`,
      m.status,
      m.phone || '',
      `"${m.area || ''}"`,
      m.date_joined || '',
      m.level || '',
      (m as any).membership_status || 'never_paid'
    ]);
    const csvStr = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PFFI_Members_Export_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  const inputClass = 'min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25 disabled:cursor-wait disabled:opacity-60';

  return (
    <AdminLayout title="Hub Configuration & Settings">
      <div className="space-y-6">
        <div className="space-y-4 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:p-5">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-bold font-heading text-[#F5F6F8]">Dashboard Targets</h3>
              <p className="text-xs text-[#9AA1AE]">Configure the progress targets used across the dashboard.</p>
            </div>
            {savedMsg && <span role="status" className="rounded border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400"><Check className="mr-1 inline h-3.5 w-3.5" />{savedMsg}</span>}
          </div>

          {loadError && <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /><div><p className="font-semibold">Unable to load configuration</p><p className="mt-1 text-amber-100/80">{loadError}</p><button type="button" onClick={loadData} className="mt-2 min-h-10 rounded-lg bg-[#DA0E19] px-3 py-2 font-bold text-white">Try Again</button></div></div>}

          <form onSubmit={handleSaveGoals} className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-busy={loading}>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#F5F6F8]">Active Members Goal <span className="font-normal text-[#9AA1AE]">(members)</span></label>
              <input type="number" value={activeGoal} onChange={(e) => setActiveGoal(parseInt(e.target.value, 10))} disabled={loading || saving} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#F5F6F8]">Attendance Rate Goal <span className="font-normal text-[#9AA1AE]">(percentage)</span></label>
              <input type="number" value={attendanceGoal} onChange={(e) => setAttendanceGoal(parseInt(e.target.value, 10))} disabled={loading || saving} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#F5F6F8]">Monthly Revenue Goal <span className="font-normal text-[#9AA1AE]">(UGX)</span></label>
              <input type="number" value={revenueGoal} onChange={(e) => setRevenueGoal(parseInt(e.target.value, 10))} disabled={loading || saving} className={inputClass} />
            </div>
            <div className="space-y-2 text-left md:col-span-3 md:text-right">
              {loading && <p className="text-xs text-[#9AA1AE]">Loading configured targets...</p>}
              {saveError && <p role="alert" className="text-xs font-semibold text-rose-300">{saveError}</p>}
              <button type="submit" disabled={loading || saving} className="min-h-11 w-full rounded-lg bg-[#DA0E19] px-5 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#F0202C] disabled:cursor-wait disabled:opacity-60 md:w-auto">{saving ? 'Saving...' : 'Save Dashboard Targets'}</button>
            </div>
          </form>
        </div>

        <div className="space-y-3 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:p-5">
          <h3 className="font-bold font-heading text-[#F5F6F8]">Active Membership Plans</h3>
          {loading ? <p className="rounded-lg bg-[#1A1D26] p-4 text-xs text-[#9AA1AE]">Loading membership plans...</p> : <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{plans.map(p => <div key={p.id} className="flex min-w-0 flex-col items-start gap-3 rounded-lg border border-[#262A36] bg-[#1A1D26] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h4 className="break-words text-xs font-bold text-[#F5F6F8]">{p.name}</h4><p className="mt-1 text-[11px] text-[#9AA1AE]">Duration: {p.duration_days ? `${p.duration_days} days` : `${p.session_count} sessions`}</p></div><span className="break-words text-sm font-extrabold tabular-nums text-[#DA0E19]">UGX {p.price_ugx.toLocaleString()}</span></div>)}</div>}
        </div>

        <div className="space-y-3 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:p-5">
          <h3 className="flex items-center gap-2 font-bold font-heading text-[#F5F6F8]"><Shield className="h-4 w-4 shrink-0 text-[#DA0E19]" />Read-Only Business Rules</h3>
          <div className="space-y-2 text-xs text-[#B9BEC7]">
            <div className="flex flex-col gap-1 rounded border border-[#262A36] bg-[#1A1D26] p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"><span>Show-Up Rate Window:</span><span className="font-bold text-[#F5F6F8] sm:text-right">Rolling 30 Days (Ignores sessions before join date)</span></div>
            <div className="flex flex-col gap-1 rounded border border-[#262A36] bg-[#1A1D26] p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"><span>Stopped Coming Trigger:</span><span className="font-bold text-[#F5F6F8] sm:text-right">No attendance for 14+ consecutive days</span></div>
            <div className="flex flex-col gap-1 rounded border border-[#262A36] bg-[#1A1D26] p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"><span>Assessment Due Interval:</span><span className="font-bold text-[#F5F6F8] sm:text-right">Every 4 weeks (28 days)</span></div>
            <div className="flex flex-col gap-1 rounded border border-[#262A36] bg-[#1A1D26] p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"><span>Online Payments Status:</span><span className="flex items-start gap-1 font-bold text-amber-400 sm:justify-end sm:text-right"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />Online payments disabled; manual recording active.</span></div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0"><h3 className="font-bold font-heading text-[#F5F6F8]">Export Members Directory</h3><p className="text-xs text-[#9AA1AE]">Download clean CSV file of all registered hub members</p></div>
          <button onClick={handleExportCsv} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#262A36] bg-[#1A1D26] px-4 py-2 text-xs font-bold text-[#F5F6F8] hover:border-[#DA0E19] sm:w-auto"><Download className="h-4 w-4 text-[#DA0E19]" />Export CSV File</button>
        </div>
      </div>
    </AdminLayout>
  );
};
