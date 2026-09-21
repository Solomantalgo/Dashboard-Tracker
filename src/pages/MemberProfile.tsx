import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { Client, Payment, Session, Assessment, HealthScreening } from '../types/database';
import {
  Calendar, CreditCard, Activity, ShieldAlert, Share2, ArrowLeft,
  Flame, CheckCircle, TrendingUp, Clock, Plus, Award
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
  const [sessionsAttended, setSessionsAttended] = useState<Session[]>([]);
  const [healthScreening, setHealthScreening] = useState<HealthScreening | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'payments' | 'assessments' | 'health'>('overview');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const mRes = await api.getMemberById(id);
      if (mRes) {
        setMember(mRes);
        const [pRes, aRes, allSess, hsRes] = await Promise.all([
          api.getPayments(),
          api.getAssessments(id),
          api.getSessions(),
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
  const showUpRate = (member as any).show_up_rate_pct || 0;

  // Format chart data for assessments
  const chartData = [...assessments].reverse().map(a => ({
    date: a.assessed_on,
    weight: a.weight_kg,
    pushups: a.pushups,
    plank: a.plank_seconds,
    run: a.run_time_seconds ? Math.round(a.run_time_seconds / 60) : undefined
  }));

  return (
    <AdminLayout title={`Member: ${member.full_name}`}>
      {/* Back Button & Header Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/members')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9AA1AE] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>

        <div className="flex items-center gap-2">
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

      {/* Member Profile Hero Card */}
      <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#DA0E19]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1A1D26] border-2 border-[#DA0E19] text-[#F5F6F8] font-black text-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#DA0E19]/10">
            {member.full_name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black font-heading text-[#F5F6F8]">{member.full_name}</h2>
              <Badge status={mStatus} />
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

        {/* Show Up Rate Ring / Stats Widget */}
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
        {/* OVERVIEW TAB */}
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

        {/* PAYMENTS TAB */}
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

        {/* ASSESSMENTS TAB */}
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

            {/* Chart */}
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

            {/* Assessment History Table */}
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

        {/* HEALTH TAB (ADMIN SENSITIVE) */}
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
