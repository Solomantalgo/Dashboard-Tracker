import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { Target, Plan } from '../types/database';
import { Settings as SettingsIcon, Download, Shield, Lock, Check } from 'lucide-react';

export const Settings: React.FC = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeGoal, setActiveGoal] = useState<number>(25);
  const [attendanceGoal, setAttendanceGoal] = useState<number>(80);
  const [revenueGoal, setRevenueGoal] = useState<number>(1000000);
  const [savedMsg, setSavedMsg] = useState('');

  const loadData = async () => {
    const [tRes, pRes] = await Promise.all([
      api.getTargets(),
      api.getPlans()
    ]);
    setTargets(tRes);
    setPlans(pRes);

    const aT = tRes.find((t: Target) => t.metric === 'active_members');
    const attT = tRes.find((t: Target) => t.metric === 'attendance_rate');
    const rT = tRes.find((t: Target) => t.metric === 'monthly_revenue');

    if (aT) setActiveGoal(aT.goal);
    if (attT) setAttendanceGoal(attT.goal);
    if (rT) setRevenueGoal(rT.goal);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateTarget('active_members', activeGoal);
    await api.updateTarget('attendance_rate', attendanceGoal);
    await api.updateTarget('monthly_revenue', revenueGoal);

    setSavedMsg('Weekly target goals updated successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
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

  return (
    <AdminLayout title="Hub Configuration & Settings">
      <div className="space-y-6">
        {/* Weekly Targets Editor */}
        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold font-heading text-[#F5F6F8]">Weekly Target Goals</h3>
              <p className="text-xs text-[#9AA1AE]">Configures dashboard progress bar targets</p>
            </div>
            {savedMsg && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">
                ✓ {savedMsg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveGoals} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Active Members Goal</label>
              <input
                type="number"
                value={activeGoal}
                onChange={(e) => setActiveGoal(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Attendance Rate Goal (%)</label>
              <input
                type="number"
                value={attendanceGoal}
                onChange={(e) => setAttendanceGoal(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Monthly Revenue Goal (UGX)</label>
              <input
                type="number"
                value={revenueGoal}
                onChange={(e) => setRevenueGoal(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
              />
            </div>

            <div className="md:col-span-3 text-right">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#DA0E19] text-white rounded-lg shadow-md"
              >
                Save Target Goals
              </button>
            </div>
          </form>
        </div>

        {/* Membership Plans Summary */}
        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 space-y-3">
          <h3 className="font-bold font-heading text-[#F5F6F8]">Active Membership Plans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plans.map(p => (
              <div key={p.id} className="p-4 rounded-lg bg-[#1A1D26] border border-[#262A36] flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs text-[#F5F6F8]">{p.name}</h4>
                  <p className="text-[11px] text-[#9AA1AE]">Duration: {p.duration_days ? `${p.duration_days} days` : `${p.session_count} sessions`}</p>
                </div>
                <span className="font-extrabold text-[#DA0E19] text-sm tabular-nums">
                  UGX {p.price_ugx.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Read-Only System Rules Summary */}
        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 space-y-3">
          <h3 className="font-bold font-heading text-[#F5F6F8] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#DA0E19]" />
            Read-Only Business Rules (Phase 1 Defaults)
          </h3>
          <div className="space-y-2 text-xs text-[#B9BEC7]">
            <div className="p-3 rounded bg-[#1A1D26] border border-[#262A36] flex justify-between">
              <span>Show-Up Rate Window:</span>
              <span className="font-bold text-[#F5F6F8]">Rolling 30 Days (Ignores sessions before join date)</span>
            </div>
            <div className="p-3 rounded bg-[#1A1D26] border border-[#262A36] flex justify-between">
              <span>"Stopped Coming" Trigger:</span>
              <span className="font-bold text-[#F5F6F8]">No attendance for 14+ consecutive days</span>
            </div>
            <div className="p-3 rounded bg-[#1A1D26] border border-[#262A36] flex justify-between">
              <span>Assessment Due Interval:</span>
              <span className="font-bold text-[#F5F6F8]">Every 4 weeks (28 days)</span>
            </div>
            <div className="p-3 rounded bg-[#1A1D26] border border-[#262A36] flex justify-between">
              <span>Online Payments Status:</span>
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                VITE_ONLINE_PAYMENTS=false (Manual Provider Seam Active)
              </span>
            </div>
          </div>
        </div>

        {/* CSV Export Button */}
        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold font-heading text-[#F5F6F8]">Export Members Directory</h3>
            <p className="text-xs text-[#9AA1AE]">Download clean CSV file of all registered hub members</p>
          </div>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#1A1D26] border border-[#262A36] text-[#F5F6F8] hover:border-[#DA0E19] flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-[#DA0E19]" />
            Export CSV File
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};
