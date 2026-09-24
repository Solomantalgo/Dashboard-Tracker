import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { Coach, CoachReview } from '../types/database';
import { UserCheck, Star, Plus, Shield, Mail, CheckCircle, UserX, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const Coaches: React.FC = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [reviews, setReviews] = useState<CoachReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Coach form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Review form
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [leadership, setLeadership] = useState(5);
  const [sessionQuality, setSessionQuality] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [attendanceTracking, setAttendanceTracking] = useState(5);
  const [notes, setNotes] = useState('');

  // Coach Portal Invite State
  const [inviteCoach, setInviteCoach] = useState<Coach | null>(null);
  const [coachEmail, setCoachEmail] = useState('');
  const [inviteResult, setInviteResult] = useState<{ success: boolean; tempPassword?: string } | null>(null);
  const [resetCoach, setResetCoach] = useState<Coach | null>(null);
  const [resetResult, setResetResult] = useState<{ success: boolean; tempPassword?: string } | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [revokeCoach, setRevokeCoach] = useState<Coach | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        api.getCoaches(),
        api.getCoachReviews()
      ]);
      setCoaches(cRes);
      setReviews(rRes);
      if (cRes.length > 0) setSelectedCoachId(cRes[0].id);
    } catch (err) {
      console.error('Error loading coach data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;
    await api.addCoach({ full_name: fullName, phone, active: true });
    setFullName('');
    setPhone('');
    setIsCoachModalOpen(false);
    loadData();
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoachId) return;
    await api.addCoachReview({
      coach_id: selectedCoachId,
      reviewed_on: new Date().toISOString().substring(0, 10),
      leadership,
      session_quality: sessionQuality,
      punctuality,
      attendance_tracking: attendanceTracking,
      notes
    });
    setIsReviewModalOpen(false);
    loadData();
  };

  const handleOpenInvite = (c: Coach) => {
    setInviteCoach(c);
    setCoachEmail('');
    setInviteResult(null);
  };

  const handleSendCoachInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCoach || !coachEmail) return;

    setActionLoading(true);
    try {
      const res = await api.inviteCoachToPortal(inviteCoach.id, coachEmail);
      setInviteResult(res);
      await loadData();
    } catch (err) {
      console.error('Coach portal invite failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeCoachAccess = async (coachId: string) => {
    setActionLoading(true);
    try {
      await api.revokeCoachPortalAccess(coachId);
      await loadData();
    } catch (err) {
      console.error('Revoke coach access failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetCoachPassword = async () => {
    if (!resetCoach) return;
    setActionLoading(true);
    setResetError(null);
    try {
      const res = await api.resetCoachPassword(resetCoach.id);
      setResetResult(res);
    } catch (err: any) {
      setResetError(err?.message || 'Unable to reset the coach password.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout title="Coaches Management & Reviews">
      <div className="flex flex-col items-start gap-4 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold font-heading text-[#F5F6F8]">Coaches Directory</h2>
          <p className="text-xs text-[#9AA1AE]">Lead outdoor trainers at Safe Fields Boston</p>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-[#1A1D26] border border-[#262A36] text-[#F5F6F8] hover:border-[#DA0E19]"
          >
            Add Review
          </button>
          <button
            onClick={() => setIsCoachModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white hover:bg-[#F0202C]"
          >
            New Coach
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coaches.map(c => {
          const coachRevs = reviews.filter(r => r.coach_id === c.id);
          const avgLead = coachRevs.length > 0 ? (coachRevs.reduce((s, r) => s + r.leadership, 0) / coachRevs.length).toFixed(1) : null;

          return (
            <div key={c.id} className="min-w-0 space-y-4 overflow-hidden rounded-[12px] border border-[#262A36] bg-[#12141B] p-5">
              <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1A1D26] border border-[#DA0E19] text-[#DA0E19] font-black flex items-center justify-center text-lg">
                    {c.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold font-heading text-[#F5F6F8]">{c.full_name}</h3>
                    <p className="text-xs text-[#9AA1AE]">{c.phone || 'No phone'}</p>
                  </div>
                </div>
                {avgLead ? (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400" /> Leadership avg {avgLead} / 5
                  </span>
                ) : (
                  <span className="rounded bg-[#1A1D26] px-2.5 py-1 text-xs font-semibold text-[#9AA1AE]">No reviews yet</span>
                )}
              </div>

              {/* Bug 5: Coach Portal Invitation Flow */}
              <div className="pt-3 border-t border-[#262A36] flex items-center justify-between text-xs">
                {c.user_id ? (
                  <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Portal Active
                    </span>
                    <button
                      onClick={() => setRevokeCoach(c)}
                      disabled={actionLoading}
                      className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                    >
                      Revoke access
                    </button>
                    <button
                      onClick={() => {
                        setResetCoach(c);
                        setResetResult(null);
                        setResetError(null);
                      }}
                      disabled={actionLoading}
                      className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                    >
                      Reset password
                    </button>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[#9AA1AE]">No Login Account</span>
                    <button
                      onClick={() => handleOpenInvite(c)}
                      className="px-3 py-1.5 rounded-lg bg-[#DA0E19] text-white font-bold hover:bg-[#F0202C] flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" /> Invite Coach
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reviews Table */}
      <div className="w-full max-w-full space-y-3 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-bold font-heading text-[#F5F6F8]">Coach Performance Log</h3>
          <span className="min-w-0 max-w-full break-words text-xs leading-5 text-[#9AA1AE]">Leadership, session quality, punctuality, attendance tracking</span>
        </div>
        <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#1A1D26] text-[#9AA1AE] uppercase text-[10px]">
            <tr>
              <th className="p-2.5">Date</th>
              <th className="p-2.5">Coach</th>
              <th className="p-2.5">Leadership</th>
              <th className="p-2.5">Quality</th>
              <th className="p-2.5">Punctuality</th>
              <th className="p-2.5">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262A36] text-[#F5F6F8]">
            {reviews.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center"><Star className="mx-auto h-7 w-7 text-[#DA0E19]" /><p className="mt-2 font-semibold text-[#F5F6F8]">No reviews recorded yet</p><p className="mt-1 text-xs text-[#9AA1AE]">Add a coach review to start the performance log.</p><button type="button" onClick={() => setIsReviewModalOpen(true)} className="mt-4 min-h-11 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white">Add Review</button></td></tr>
            ) : reviews.map(r => (
              <tr key={r.id}>
                <td className="p-2.5 font-mono text-[#9AA1AE]">{r.reviewed_on}</td>
                <td className="p-2.5 font-bold">{r.coach_name}</td>
                <td className="p-2.5 font-bold text-amber-400">{r.leadership} / 5</td>
                <td className="p-2.5 font-bold text-amber-400">{r.session_quality} / 5</td>
                <td className="p-2.5 font-bold text-amber-400">{r.punctuality} / 5</td>
                <td className="p-2.5 text-[#9AA1AE]">{r.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="space-y-3 pb-8 md:hidden">
          {reviews.length === 0 ? (
            <div className="p-6 text-center"><Star className="mx-auto h-7 w-7 text-[#DA0E19]" /><p className="mt-2 font-semibold text-[#F5F6F8]">No reviews recorded yet</p><p className="mt-1 text-xs text-[#9AA1AE]">Add a coach review to start the performance log.</p><button type="button" onClick={() => setIsReviewModalOpen(true)} className="mt-4 min-h-11 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white">Add Review</button></div>
          ) : reviews.map(r => (
            <article key={`mobile-review-${r.id}`} className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-[#262A36] bg-[#1A1D26] p-4">
              <div className="flex flex-col gap-1 border-b border-[#262A36] pb-3"><span className="font-mono text-[10px] text-[#9AA1AE]">{r.reviewed_on}</span><h4 className="text-sm font-bold text-[#F5F6F8]">{r.coach_name || 'Coach'}</h4></div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Leadership</dt><dd className="mt-1 font-bold text-amber-400">{r.leadership} / 5</dd></div>
                <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Quality</dt><dd className="mt-1 font-bold text-amber-400">{r.session_quality} / 5</dd></div>
                <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Punctuality</dt><dd className="mt-1 font-bold text-amber-400">{r.punctuality} / 5</dd></div>
                <div><dt className="break-words text-[10px] font-bold uppercase leading-4 tracking-wider text-[#9AA1AE]">Attendance tracking</dt><dd className="mt-1 font-bold text-amber-400">{r.attendance_tracking} / 5</dd></div>
              </dl>
              <div className="mt-3 border-t border-[#262A36] pt-3"><span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Notes</span><p className="mt-1 break-words text-xs leading-5 text-[#B9BEC7]">{r.notes || '—'}</p></div>
            </article>
          ))}
        </div>
      </div>

      {/* Add Coach Modal */}
      <Modal isOpen={isCoachModalOpen} onClose={() => setIsCoachModalOpen(false)} title="Register Coach">
        <form onSubmit={handleAddCoach} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#F5F6F8]">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Coach Alex Ssemwanga"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#F5F6F8]">Phone Number</label>
            <input
              type="text"
              placeholder="+256772123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25"
            />
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-[#262A36] pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setIsCoachModalOpen(false)} className="min-h-11 w-full rounded-lg bg-[#1A1D26] px-3 py-1.5 text-xs sm:w-auto">Cancel</button>
            <button type="submit" className="min-h-11 w-full rounded-lg bg-[#DA0E19] px-4 py-1.5 text-xs font-bold text-white sm:w-auto">Save</button>
          </div>
        </form>
      </Modal>

      {/* Coach Portal Invite Modal */}
      {inviteCoach && (
        <Modal isOpen={Boolean(inviteCoach)} onClose={() => setInviteCoach(null)} title={`Invite Coach: ${inviteCoach.full_name}`}>
          {!inviteResult ? (
            <form onSubmit={handleSendCoachInvite} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9AA1AE] mb-1">Coach Email Address</label>
                <input
                  type="email"
                  required
                  value={coachEmail}
                  onChange={e => setCoachEmail(e.target.value)}
                  placeholder="coach@pffi.ug"
                  className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] p-2.5 text-white focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25"
                />
              </div>
              <p className="text-[11px] text-[#9AA1AE]">
                Creates a coach login credential. The coach will log in to mark session attendance and view their assigned athletes.
              </p>

              <div className="flex flex-col-reverse gap-3 border-t border-[#262A36] pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setInviteCoach(null)} className="min-h-11 w-full rounded-lg bg-[#1A1D26] px-3 py-1.5 text-xs text-[#9AA1AE] sm:w-auto">Cancel</button>
                <button type="submit" disabled={actionLoading} className="min-h-11 w-full rounded-lg bg-[#DA0E19] px-4 py-1.5 text-xs font-bold text-white sm:w-auto">
                  {actionLoading ? 'Inviting...' : 'Create Login & Link'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>Coach Login Successfully Created!</span>
              </div>

              {inviteResult.tempPassword && (
                <div className="p-4 bg-[#1A1D26] border border-[#262A36] rounded-xl space-y-1">
                  <span className="text-[#9AA1AE] text-[10px] uppercase font-bold">One-Time Password:</span>
                  <div className="font-mono text-lg font-bold text-white tracking-widest">{inviteResult.tempPassword}</div>
                </div>
              )}

              <button onClick={() => setInviteCoach(null)} className="w-full py-2 bg-[#DA0E19] text-white font-bold rounded-lg">
                Done
              </button>
            </div>
          )}
        </Modal>
      )}

      {resetCoach && (
        <Modal isOpen={Boolean(resetCoach)} onClose={() => setResetCoach(null)} title={`Reset Password: ${resetCoach.full_name}`}>
          {resetError && (
            <div className="mb-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {resetError}
            </div>
          )}

          {!resetResult ? (
            <div className="space-y-4 text-xs">
              <p className="text-[#9AA1AE] leading-relaxed">
                This will invalidate the coach's current password and generate a new temporary password. Continue?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetCoach(null)}
                  className="px-3 py-1.5 bg-[#1A1D26] rounded text-[#9AA1AE]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetCoachPassword}
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-500 text-black rounded disabled:opacity-50"
                >
                  {actionLoading ? 'Resetting...' : 'Reset password'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>Password reset successfully.</span>
              </div>
              <div className="p-4 bg-[#1A1D26] border border-[#262A36] rounded-xl space-y-1">
                <span className="text-[#9AA1AE] text-[10px] uppercase font-bold">New Temporary Password:</span>
                <div className="font-mono text-lg font-bold text-white tracking-widest select-all">{resetResult.tempPassword}</div>
                <p className="text-[10px] text-[#9AA1AE]">Hand this password directly to the coach. Their previous password is no longer valid.</p>
              </div>
              <button
                onClick={() => {
                  setResetCoach(null);
                  setResetResult(null);
                }}
                className="w-full py-2 bg-[#DA0E19] text-white font-bold rounded-lg"
              >
                Done
              </button>
            </div>
          )}
        </Modal>
      )}

      {revokeCoach && (
        <Modal isOpen={Boolean(revokeCoach)} onClose={() => setRevokeCoach(null)} title="Revoke Coach Access">
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>This will remove portal access for <strong>{revokeCoach.full_name}</strong>. The coach will no longer be able to sign in.</p></div>
            <div className="flex flex-col-reverse gap-3 border-t border-[#262A36] pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setRevokeCoach(null)} className="min-h-11 w-full rounded-lg bg-[#1A1D26] px-4 py-2 font-semibold text-[#9AA1AE] sm:w-auto">Cancel</button>
              <button type="button" disabled={actionLoading} onClick={async () => { await handleRevokeCoachAccess(revokeCoach.id); setRevokeCoach(null); }} className="min-h-11 w-full rounded-lg bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-500 disabled:opacity-60 sm:w-auto">{actionLoading ? 'Revoking...' : 'Revoke access'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Review Modal */}
      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Coach Review">
        <form onSubmit={handleAddReview} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#F5F6F8]">Coach</label>
            <select value={selectedCoachId} onChange={(e) => setSelectedCoachId(e.target.value)} className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]">
              {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <div>
              <label className="block text-xs mb-1 text-[#F5F6F8]">Leadership (1-5)</label>
              <input type="number" min={1} max={5} value={leadership} onChange={(e) => setLeadership(parseInt(e.target.value, 10))} className="min-h-11 w-full rounded border border-[#262A36] bg-[#1A1D26] px-3 py-1.5 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs mb-1 text-[#F5F6F8]">Quality (1-5)</label>
              <input type="number" min={1} max={5} value={sessionQuality} onChange={(e) => setSessionQuality(parseInt(e.target.value, 10))} className="min-h-11 w-full rounded border border-[#262A36] bg-[#1A1D26] px-3 py-1.5 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs mb-1 text-[#F5F6F8]">Punctuality (1-5)</label>
              <input type="number" min={1} max={5} value={punctuality} onChange={(e) => setPunctuality(parseInt(e.target.value, 10))} className="min-h-11 w-full rounded border border-[#262A36] bg-[#1A1D26] px-3 py-1.5 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs mb-1 text-[#F5F6F8]">Attendance tracking (1-5)</label>
              <input type="number" min={1} max={5} value={attendanceTracking} onChange={(e) => setAttendanceTracking(parseInt(e.target.value, 10))} className="min-h-11 w-full rounded border border-[#262A36] bg-[#1A1D26] px-3 py-1.5 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 text-[#F5F6F8]">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-11 w-full rounded border border-[#262A36] bg-[#1A1D26] px-3 py-1.5 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none" />
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-[#262A36] pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setIsReviewModalOpen(false)} className="min-h-11 w-full rounded-lg bg-[#1A1D26] px-3 py-1.5 text-xs sm:w-auto">Cancel</button>
            <button type="submit" className="min-h-11 w-full rounded-lg bg-[#DA0E19] px-4 py-1.5 text-xs font-bold text-white sm:w-auto">Submit Review</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
