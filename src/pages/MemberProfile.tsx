import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { Client, Payment, Session, Assessment, HealthScreening } from '../types/database';
import {
  Calendar, CreditCard, Activity, ShieldAlert, Share2, ArrowLeft,
  Flame, CheckCircle, TrendingUp, Clock, Plus, Award, UserCheck, UserX,
  Trash2, Mail, Key, Lock, AlertTriangle, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { ShareProgressCard } from '../components/members/ShareProgressCard';
import { NewAssessmentModal } from '../components/assessments/NewAssessmentModal';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';

export const MemberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Client | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [healthScreening, setHealthScreening] = useState<HealthScreening | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'payments' | 'assessments' | 'health'>('overview');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Bug 4 Modals (Deactivate & Permanent Delete)
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Bug 5 Modals (Portal Invite)
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteResult, setInviteResult] = useState<{ success: boolean; tempPassword?: string } | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; tempPassword?: string } | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const mRes = await api.getMemberById(id);
      if (mRes) {
        setMember(mRes);
        setInviteEmail(mRes.phone ? `${mRes.member_code.toLowerCase()}@pffi.ug` : '');
        const [pRes, aRes, hsRes] = await Promise.all([
          api.getPayments(),
          api.getAssessments(id),
          api.getHealthScreening(id)
        ]);

        setPayments(pRes.filter(p => p.client_id === id));
        setAssessments(aRes);
        setHealthScreening(hsRes || null);
      }
    } catch (err) {
      console.error('Error loading member profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDeactivate = async () => {
    if (!member) return;
    setActionLoading(true);
    try {
      await api.deactivateMember(member.id);
      setIsDeactivateOpen(false);
      await loadData();
    } catch (err) {
      console.error('Deactivate failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!member) return;
    setActionLoading(true);
    try {
      await api.reactivateMember(member.id);
      await loadData();
    } catch (err) {
      console.error('Reactivate failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!member) return;
    if (deleteConfirmName.trim() !== member.full_name.trim()) return;

    setActionLoading(true);
    try {
      await api.permanentlyDeleteMember(member.id);
      setIsDeleteOpen(false);
      navigate('/members');
    } catch (err) {
      console.error('Permanent delete failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !inviteEmail) return;

    setActionLoading(true);
    try {
      const res = await api.inviteClientToPortal(member.id, inviteEmail);
      setInviteResult(res);
      await loadData();
    } catch (err) {
      console.error('Portal invite failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokePortalAccess = async () => {
    if (!member) return;
    setActionLoading(true);
    try {
      await api.revokeClientPortalAccess(member.id);
      setInviteResult(null);
      await loadData();
    } catch (err) {
      console.error('Revoke access failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!member) return;
    setActionLoading(true);
    setResetError(null);
    try {
      const res = await api.resetClientPassword(member.id);
      setResetResult(res);
    } catch (err: any) {
      setResetError(err?.message || 'Unable to reset the member password.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Member Profile">
        <div className="p-12 text-center text-[#9AA1AE]">Loading athlete profile...</div>
      </AdminLayout>
    );
  }

  if (!member) {
    return (
      <AdminLayout title="Member Profile">
        <div className="p-12 text-center text-[#9AA1AE]">
          <p>Member not found.</p>
          <button onClick={() => navigate('/members')} className="mt-4 text-[#DA0E19] font-bold">
            ← Back to Directory
          </button>
        </div>
      </AdminLayout>
    );
  }

  const mStatus = (member as any).membership_status || 'never_paid';
  const showUpRate = (member as any).show_up_rate_pct ?? 0;
  const isInactive = member.status === 'inactive';

  const chartData = [...assessments].reverse().map(a => ({
    date: a.assessed_on,
    weight: a.weight_kg,
    pushups: a.pushups,
    plank: a.plank_seconds
  }));

  return (
    <AdminLayout title={`Member: ${member.full_name}`}>
      {/* Top Bar with Back Button & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/members')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9AA1AE] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Deactivate / Reactivate Button */}
          {isInactive ? (
            <button
              onClick={handleReactivate}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reactivate Member
            </button>
          ) : (
            <button
              onClick={() => setIsDeactivateOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1A1D26] border border-[#262A36] text-[#9AA1AE] hover:text-rose-400 hover:border-rose-500/30 flex items-center gap-1.5"
            >
              <UserX className="w-3.5 h-3.5" />
              Deactivate Member
            </button>
          )}

          {/* Permanent Delete Action */}
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 flex items-center gap-1.5"
            title="Permanently Delete Member"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            onClick={() => setIsShareOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1A1D26] border border-[#262A36] text-[#F5F6F8] hover:border-[#DA0E19] flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4 text-[#DA0E19]" />
            Share WhatsApp Card
          </button>

          <button
            onClick={() => setIsPaymentOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#DA0E19] text-white hover:bg-[#F0202C] flex items-center gap-1.5 shadow-md shadow-[#DA0E19]/20"
          >
            <CreditCard className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Member Inactive Banner */}
      {isInactive && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              <strong>Member Inactive:</strong> Excluded from active counts, attendance sessions, and alerts. History is retained.
            </span>
          </div>
          <button
            onClick={handleReactivate}
            className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400"
          >
            Reactivate Now
          </button>
        </div>
      )}

      {/* Hero Card */}
      <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1A1D26] border-2 border-[#DA0E19] text-[#F5F6F8] font-black text-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#DA0E19]/10">
            {member.full_name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black font-heading text-[#F5F6F8]">{member.full_name}</h2>
              <Badge status={isInactive ? 'inactive' : mStatus} />
            </div>
            <p className="text-xs text-[#9AA1AE] mt-0.5">
              Code: <span className="font-mono text-[#B9BEC7] font-bold">{member.member_code}</span> • Phone: {member.phone || 'N/A'} • Area: {member.area || 'Kampala'}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {member.goals.map(g => (
                <span key={g} className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1A1D26] text-[#B9BEC7] border border-[#262A36]">
                  {g}
                </span>
              ))}
              {member.level && <Badge status={member.level} />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 self-stretch md:self-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#262A36]">
          <div className="text-center px-4 py-2 rounded-xl bg-[#1A1D26] border border-[#262A36]">
            <span className="block text-2xl font-black text-[#DA0E19] tabular-nums">{showUpRate}%</span>
            <span className="text-[10px] font-bold text-[#9AA1AE] uppercase">Show-Up Rate (30d)</span>
          </div>

          <div className="text-center px-4 py-2 rounded-xl bg-[#1A1D26] border border-[#262A36]">
            <span className="block text-2xl font-black text-[#F5F6F8] tabular-nums">{payments.length}</span>
            <span className="text-[10px] font-bold text-[#9AA1AE] uppercase">Payments Recorded</span>
          </div>
        </div>
      </div>

      {/* Bug 5: Member Portal Access / Invite Widget */}
      <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-[#F5F6F8]">Member Portal Access</h3>
              <p className="text-xs text-[#9AA1AE]">Allow athlete to log in and view their personal attendance & progress.</p>
            </div>
          </div>

          {member.user_id ? (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Portal Access Active
              </span>
              <button
                onClick={handleRevokePortalAccess}
                disabled={actionLoading}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
              >
                Revoke Access
              </button>
              <button
                onClick={() => {
                  setResetError(null);
                  setResetResult(null);
                  setIsResetOpen(true);
                }}
                disabled={actionLoading}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
              >
                Reset Password
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#DA0E19] text-white hover:bg-[#F0202C] shadow-md shadow-[#DA0E19]/20 flex items-center gap-1.5"
            >
              <Mail className="w-4 h-4" />
              Invite to Member Portal
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[#262A36] gap-2 overflow-x-auto">
        {(['overview', 'attendance', 'payments', 'assessments', 'health'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold capitalize transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab
                ? 'border-[#DA0E19] text-[#F5F6F8] bg-[#12141B]'
                : 'border-transparent text-[#9AA1AE] hover:text-[#F5F6F8]'
            }`}
          >
            {tab === 'health' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 space-y-4">
              <h3 className="font-bold font-heading text-[#F5F6F8]">Membership Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#262A36]">
                  <span className="text-[#9AA1AE]">Joined Date</span>
                  <span className="font-semibold text-[#F5F6F8]">{member.date_joined || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#262A36]">
                  <span className="text-[#9AA1AE]">Assigned Coach</span>
                  <span className="font-semibold text-[#F5F6F8]">{member.coach_name || 'Coach Alex'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#262A36]">
                  <span className="text-[#9AA1AE]">Membership Expiry</span>
                  <span className="font-semibold text-emerald-400">
                    {(member as any).expires_on || 'Expired / None'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#262A36]">
                  <span className="text-[#9AA1AE]">Uganda Data Consent</span>
                  <span className="font-semibold text-emerald-400">
                    {member.consent_given_at ? '✓ Agreed & Recorded' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 space-y-4">
              <h3 className="font-bold font-heading text-[#F5F6F8]">Fitness Quick Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#1A1D26] border border-[#262A36]">
                  <span className="text-[10px] text-[#9AA1AE] uppercase font-bold">Latest Pushups</span>
                  <span className="block text-xl font-bold text-[#F5F6F8] mt-1">
                    {assessments[0]?.pushups || '—'} reps
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#1A1D26] border border-[#262A36]">
                  <span className="text-[10px] text-[#9AA1AE] uppercase font-bold">Plank Hold</span>
                  <span className="block text-xl font-bold text-[#F5F6F8] mt-1">
                    {assessments[0]?.plank_seconds || '—'} s
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('assessments')}
                className="w-full py-2 text-xs font-bold rounded-lg bg-[#1A1D26] border border-[#262A36] text-[#DA0E19] hover:border-[#DA0E19]"
              >
                View Full Assessment Progression →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold font-heading text-[#F5F6F8]">Payment History</h3>
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#DA0E19] text-white"
              >
                + Record Payment
              </button>
            </div>

            {payments.length === 0 ? (
              <p className="text-xs text-[#9AA1AE] py-4 text-center">No payment history recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1A1D26] text-[#9AA1AE] uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Paid On</th>
                      <th className="p-2.5">Plan</th>
                      <th className="p-2.5">Amount (UGX)</th>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5">Expires On</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262A36] text-[#F5F6F8]">
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td className="p-2.5 font-mono">{p.paid_on}</td>
                        <td className="p-2.5 font-semibold">{p.plan_name}</td>
                        <td className="p-2.5 font-bold tabular-nums">UGX {p.amount_ugx.toLocaleString()}</td>
                        <td className="p-2.5 text-[#9AA1AE]">{p.method}</td>
                        <td className="p-2.5 text-[#9AA1AE]">{p.expires_on || '—'}</td>
                        <td className="p-2.5"><Badge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold font-heading text-[#F5F6F8]">Physical Assessment Progression</h3>
              <button
                onClick={() => setIsAssessmentOpen(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#DA0E19] text-white"
              >
                + New Assessment
              </button>
            </div>

            {chartData.length > 0 && (
              <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5">
                <h4 className="text-xs font-bold text-[#F5F6F8] mb-3">Pushup Reps Progress</h4>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262A36" />
                      <XAxis dataKey="date" stroke="#9AA1AE" fontSize={11} />
                      <YAxis stroke="#9AA1AE" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#1A1D26', borderColor: '#262A36' }} />
                      <Line type="monotone" dataKey="pushups" stroke="#DA0E19" strokeWidth={3} dot={{ fill: '#DA0E19' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1A1D26] text-[#9AA1AE] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Weight (kg)</th>
                    <th className="p-2.5">Waist (cm)</th>
                    <th className="p-2.5">BMI</th>
                    <th className="p-2.5">Pushups</th>
                    <th className="p-2.5">Plank (s)</th>
                    <th className="p-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262A36] text-[#F5F6F8]">
                  {assessments.map(a => (
                    <tr key={a.id}>
                      <td className="p-2.5 font-mono">{a.assessed_on}</td>
                      <td className="p-2.5 font-bold">{a.weight_kg || '—'} kg</td>
                      <td className="p-2.5">{a.waist_cm || '—'} cm</td>
                      <td className="p-2.5 font-bold text-amber-400">{a.bmi || '—'}</td>
                      <td className="p-2.5 font-bold text-emerald-400">{a.pushups || '—'}</td>
                      <td className="p-2.5">{a.plank_seconds || '—'} s</td>
                      <td className="p-2.5 text-[#9AA1AE] max-w-xs truncate">{a.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="bg-[#12141B] border border-rose-500/30 rounded-[12px] p-6 space-y-4">
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>
                <strong>Confidential Health Data (Admin Eyes Only):</strong> Excluded from export CSVs and shared progress cards in accordance with Uganda privacy guidelines.
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-[#F5F6F8] uppercase">Recorded Medical Conditions</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {healthScreening?.conditions?.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs">
                      {c}
                    </span>
                  )) || <span className="text-xs text-[#9AA1AE]">No pre-existing conditions logged.</span>}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#F5F6F8] uppercase">Coach Notes</h4>
                <p className="text-xs text-[#B9BEC7] p-3 rounded bg-[#1A1D26] border border-[#262A36]">
                  {healthScreening?.notes || 'No extra notes recorded.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deactivate Confirmation Modal */}
      {isDeactivateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141B] border border-[#262A36] rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">Deactivate Member?</h3>
            </div>
            <p className="text-xs text-[#9AA1AE] leading-relaxed">
              This member will no longer appear in active lists, attendance, or alerts. Their history (payments, attendance, assessments) is kept. You can reactivate them anytime.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDeactivateOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#262A36] text-xs text-[#9AA1AE] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400"
              >
                Deactivate Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141B] border border-rose-500/30 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">Permanently Delete Member</h3>
            </div>
            <p className="text-xs text-rose-300/80 leading-relaxed bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
              <strong>WARNING:</strong> This action is permanent and irreversible. All payment, attendance, and assessment history for this member will be permanently deleted.
            </p>
            <div className="space-y-1 text-xs">
              <label className="block text-[#9AA1AE]">
                To confirm, type <strong className="text-white">{member.full_name}</strong> below:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={e => setDeleteConfirmName(e.target.value)}
                placeholder={member.full_name}
                className="w-full p-2.5 bg-[#1A1D26] border border-[#262A36] rounded-lg text-white font-semibold"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#262A36] text-xs text-[#9AA1AE] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={deleteConfirmName.trim() !== member.full_name.trim() || actionLoading}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-40"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141B] border border-amber-500/30 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-[#F5F6F8]">Reset Member Password</h3>

            {resetError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {resetError}
              </div>
            )}

            {!resetResult ? (
              <>
                <p className="text-xs text-[#9AA1AE] leading-relaxed">
                  This will invalidate {member.full_name}'s current password and generate a new temporary password. Continue?
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsResetOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#262A36] text-xs text-[#9AA1AE] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 disabled:opacity-50"
                  >
                    {actionLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>Password reset successfully.</span>
                </div>
                <div className="p-4 bg-[#1A1D26] border border-[#262A36] rounded-xl space-y-1">
                  <span className="text-[#9AA1AE] text-[10px] uppercase font-bold">New Temporary Password:</span>
                  <div className="font-mono text-lg font-bold text-white tracking-widest select-all">{resetResult.tempPassword}</div>
                  <p className="text-[10px] text-[#9AA1AE]">Hand this password directly to the member. Their previous password is no longer valid.</p>
                </div>
                <button
                  onClick={() => {
                    setIsResetOpen(false);
                    setResetResult(null);
                  }}
                  className="w-full py-2 bg-[#DA0E19] text-white font-bold rounded-lg"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141B] border border-[#262A36] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-[#F5F6F8]">Invite Athlete to Member Portal</h3>

            {!inviteResult ? (
              <form onSubmit={handleSendInvite} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#9AA1AE] mb-1">Athlete Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="athlete@example.com"
                    className="w-full p-2.5 bg-[#1A1D26] border border-[#262A36] rounded-lg text-white"
                  />
                </div>
                <p className="text-[11px] text-[#9AA1AE]">
                  Creates a portal sign-in account. The athlete can log in with this email to view their attendance, progress charts, and membership card.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#262A36] text-[#9AA1AE] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-[#DA0E19] hover:bg-[#F0202C] text-white font-bold"
                  >
                    {actionLoading ? 'Inviting...' : 'Create Credentials & Link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>Portal Access Successfully Created!</span>
                </div>

                {inviteResult.tempPassword && (
                  <div className="p-4 bg-[#1A1D26] border border-[#262A36] rounded-xl space-y-1">
                    <span className="text-[#9AA1AE] text-[10px] uppercase font-bold">One-Time Login Password:</span>
                    <div className="font-mono text-lg font-bold text-white tracking-widest">{inviteResult.tempPassword}</div>
                    <p className="text-[10px] text-[#9AA1AE]">Hand this password directly to the member for their initial sign in.</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsInviteOpen(false);
                    setInviteResult(null);
                  }}
                  className="w-full py-2 bg-[#DA0E19] text-white font-bold rounded-lg"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ShareProgressCard
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        member={member}
        assessments={assessments}
        showUpRatePct={showUpRate}
      />

      <NewAssessmentModal
        isOpen={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
        onSuccess={loadData}
        preselectedClientId={member.id}
      />

      <RecordPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={loadData}
        preselectedClientId={member.id}
      />
    </AdminLayout>
  );
};
