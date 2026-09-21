import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { Assessment, Client } from '../types/database';
import { Activity, Plus, Search, Calendar, Award } from 'lucide-react';
import { NewAssessmentModal } from '../components/assessments/NewAssessmentModal';
import { differenceInDays, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const Assessments: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [members, setMembers] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [aRes, mRes] = await Promise.all([
        api.getAssessments(),
        api.getMembers()
      ]);
      setAssessments(aRes);
      setMembers(mRes);
    } catch (err) {
      console.error('Error loading assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map member latest assessment & check if due (> 28 days)
  const memberAssessmentStatus = members.map(m => {
    const mAss = assessments
      .filter(a => a.client_id === m.id)
      .sort((a, b) => b.assessed_on.localeCompare(a.assessed_on));

    const latest = mAss[0];
    let isDue = false;
    let daysSince = 999;

    if (!latest) {
      isDue = true;
    } else {
      daysSince = differenceInDays(new Date(), parseISO(latest.assessed_on));
      if (daysSince >= 28) isDue = true;
    }

    return {
      member: m,
      latest,
      totalCount: mAss.length,
      daysSince,
      isDue
    };
  });

  const filtered = memberAssessmentStatus.filter(item =>
    item.member.full_name.toLowerCase().includes(search.toLowerCase()) ||
    item.member.member_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Physical Fitness Assessments">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12141B] border border-[#262A36] rounded-[12px] p-4">
        <div>
          <h2 className="text-base font-bold font-heading text-[#F5F6F8]">Fitness Assessment Registry</h2>
          <p className="text-xs text-[#9AA1AE]">Re-evaluated every 4 weeks (Pushups, Plank, 1km Run, Waist & BMI)</p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white hover:bg-[#F0202C] flex items-center gap-1.5 shadow-md shadow-[#DA0E19]/20"
        >
          <Plus className="w-4 h-4" />
          + Log New Assessment
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA1AE]" />
        <input
          type="text"
          placeholder="Search member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs bg-[#12141B] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
        />
      </div>

      {/* Directory Table */}
      <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A1D26] text-[#9AA1AE] uppercase text-[10px] font-bold border-b border-[#262A36]">
              <tr>
                <th className="p-3.5 pl-5">Athlete Member</th>
                <th className="p-3.5">Last Assessed</th>
                <th className="p-3.5">Pushup Reps</th>
                <th className="p-3.5">Plank Hold</th>
                <th className="p-3.5">1km Run Time</th>
                <th className="p-3.5">BMI</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262A36] text-[#F5F6F8]">
              {filtered.map(({ member, latest, isDue, daysSince }) => (
                <tr key={member.id} className="hover:bg-[#1A1D26]/60 transition-colors">
                  <td className="p-3.5 pl-5">
                    <span className="font-bold text-[#F5F6F8] block">{member.full_name}</span>
                    <span className="text-[10px] font-mono text-[#9AA1AE]">{member.member_code}</span>
                  </td>

                  <td className="p-3.5 font-mono text-[#9AA1AE]">
                    {latest ? latest.assessed_on : 'Never Assessed'}
                  </td>

                  <td className="p-3.5 font-bold text-[#F5F6F8]">
                    {latest?.pushups !== undefined ? `${latest.pushups} reps` : '—'}
                  </td>

                  <td className="p-3.5 font-bold text-[#F5F6F8]">
                    {latest?.plank_seconds !== undefined ? `${latest.plank_seconds} s` : '—'}
                  </td>

                  <td className="p-3.5 font-bold text-[#F5F6F8]">
                    {latest?.run_time_seconds
                      ? `${Math.floor(latest.run_time_seconds / 60)}:${String(latest.run_time_seconds % 60).padStart(2, '0')}`
                      : '—'}
                  </td>

                  <td className="p-3.5 font-bold text-amber-400">
                    {latest?.bmi ? `${latest.bmi}` : '—'}
                  </td>

                  <td className="p-3.5">
                    {isDue ? (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Assessment Due (&gt;4 wks)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Up to Date
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 pr-5 text-right">
                    <button
                      onClick={() => navigate(`/members/${member.id}`)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded bg-[#1A1D26] text-[#DA0E19] border border-[#262A36] hover:border-[#DA0E19]"
                    >
                      History →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewAssessmentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={loadData}
      />
    </AdminLayout>
  );
};
