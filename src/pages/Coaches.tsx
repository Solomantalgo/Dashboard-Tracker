import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { Coach, CoachReview } from '../types/database';
import { UserCheck, Star, Plus, Shield } from 'lucide-react';
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

  return (
    <AdminLayout title="Coaches Management & Reviews">
      <div className="flex justify-between items-center bg-[#12141B] border border-[#262A36] rounded-[12px] p-4">
        <div>
          <h2 className="font-bold font-heading text-[#F5F6F8]">Coaches Directory</h2>
          <p className="text-xs text-[#9AA1AE]">Lead outdoor trainers at Safe Fields Boston</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-[#1A1D26] border border-[#262A36] text-[#F5F6F8]"
          >
            + Add Review
          </button>
          <button
            onClick={() => setIsCoachModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white"
          >
            + New Coach
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coaches.map(c => {
          const coachRevs = reviews.filter(r => r.coach_id === c.id);
          const avgLead = coachRevs.length > 0 ? (coachRevs.reduce((s, r) => s + r.leadership, 0) / coachRevs.length).toFixed(1) : '5.0';

          return (
            <div key={c.id} className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1A1D26] border border-[#DA0E19] text-[#DA0E19] font-black flex items-center justify-center text-lg">
                    {c.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold font-heading text-[#F5F6F8]">{c.full_name}</h3>
                    <p className="text-xs text-[#9AA1AE]">{c.phone || 'No phone'}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {avgLead} / 5.0
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reviews Table */}
      <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 space-y-3">
        <h3 className="font-bold font-heading text-[#F5F6F8]">Coach Performance Log</h3>
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
            {reviews.map(r => (
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
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#F5F6F8]">Phone Number</label>
            <input
              type="text"
              placeholder="+256772123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsCoachModalOpen(false)} className="px-3 py-1.5 text-xs bg-[#1A1D26] rounded">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-[#DA0E19] text-white rounded">Save</button>
          </div>
        </form>
      </Modal>

      {/* Add Review Modal */}
      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Coach Review">
        <form onSubmit={handleAddReview} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#F5F6F8]">Coach</label>
            <select value={selectedCoachId} onChange={(e) => setSelectedCoachId(e.target.value)} className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]">
              {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 text-[#F5F6F8]">Leadership (1-5)</label>
              <input type="number" min={1} max={5} value={leadership} onChange={(e) => setLeadership(parseInt(e.target.value, 10))} className="w-full px-3 py-1.5 text-xs bg-[#1A1D26] border border-[#262A36] rounded text-[#F5F6F8]" />
            </div>
            <div>
              <label className="block text-xs mb-1 text-[#F5F6F8]">Quality (1-5)</label>
              <input type="number" min={1} max={5} value={sessionQuality} onChange={(e) => setSessionQuality(parseInt(e.target.value, 10))} className="w-full px-3 py-1.5 text-xs bg-[#1A1D26] border border-[#262A36] rounded text-[#F5F6F8]" />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 text-[#F5F6F8]">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-1.5 text-xs bg-[#1A1D26] border border-[#262A36] rounded text-[#F5F6F8]" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsReviewModalOpen(false)} className="px-3 py-1.5 text-xs bg-[#1A1D26] rounded">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-[#DA0E19] text-white rounded">Submit Review</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
