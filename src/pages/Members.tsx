import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { Client, Coach } from '../types/database';
import { Search, UserPlus, Upload, Filter, ExternalLink, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddMemberDrawer } from '../components/members/AddMemberDrawer';
import { CsvImportModal } from '../components/members/CsvImportModal';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';

export const Members: React.FC = () => {
  const [members, setMembers] = useState<Client[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [membershipFilter, setMembershipFilter] = useState<'all' | 'active' | 'expired' | 'due_soon' | 'never_paid'>('all');
  const [coachFilter, setCoachFilter] = useState<string>('all');

  // Drawers / Modals
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const navigate = useNavigate();

  const loadMembers = async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        api.getMembers(),
        api.getCoaches()
      ]);
      setMembers(mRes);
      setCoaches(cRes);
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = members.filter(m => {
    const matchSearch =
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.member_code.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone && m.phone.includes(search));

    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchMembership = membershipFilter === 'all' || (m as any).membership_status === membershipFilter;
    const matchCoach = coachFilter === 'all' || m.coach_id === coachFilter;

    return matchSearch && matchStatus && matchMembership && matchCoach;
  });

  return (
    <AdminLayout title="Members Directory">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12141B] border border-[#262A36] rounded-[12px] p-4">
        <div>
          <h2 className="text-base font-bold font-heading text-[#F5F6F8]">All Registered Athletes</h2>
          <p className="text-xs text-[#9AA1AE]">{filteredMembers.length} members found in Kampala hub</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#1A1D26] border border-[#262A36] text-[#F5F6F8] hover:border-[#DA0E19] flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-[#DA0E19]" />
            Import CSV
          </button>
          <button
            onClick={() => setIsAddDrawerOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white hover:bg-[#F0202C] flex items-center gap-1.5 shadow-md shadow-[#DA0E19]/20"
          >
            <UserPlus className="w-4 h-4" />
            + Add New Member
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA1AE]" />
          <input
            type="text"
            placeholder="Search name, code, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#12141B] border border-[#262A36] rounded-lg text-[#F5F6F8] placeholder-[#9AA1AE] focus:outline-none focus:border-[#DA0E19]"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 text-xs bg-[#12141B] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
        >
          <option value="all">All Statuses (Active / Inactive)</option>
          <option value="active">Active Members Only</option>
          <option value="inactive">Inactive Members Only</option>
        </select>

        {/* Membership status filter */}
        <select
          value={membershipFilter}
          onChange={(e) => setMembershipFilter(e.target.value as any)}
          className="px-3 py-2 text-xs bg-[#12141B] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
        >
          <option value="all">All Membership States</option>
          <option value="active">Paid & Active</option>
          <option value="expired">Expired</option>
          <option value="never_paid">Never Paid</option>
        </select>

        {/* Coach filter */}
        <select
          value={coachFilter}
          onChange={(e) => setCoachFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-[#12141B] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
        >
          <option value="all">All Assigned Coaches</option>
          {coaches.map(c => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </select>
      </div>

      {/* Members Data Table */}
      <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1D26] text-[#9AA1AE] text-[10px] font-bold uppercase tracking-wider border-b border-[#262A36]">
                <th className="p-3.5 pl-5">Member</th>
                <th className="p-3.5">Phone / Area</th>
                <th className="p-3.5">Coach</th>
                <th className="p-3.5">Membership</th>
                <th className="p-3.5">Show-Up (30d)</th>
                <th className="p-3.5">Level</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262A36] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#9AA1AE]">
                    Loading member directory...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#9AA1AE]">
                    No members match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const mStatus = (m as any).membership_status || 'never_paid';
                  const showUpRate = (m as any).show_up_rate_pct || 0;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-[#1A1D26]/60 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/members/${m.id}`)}
                    >
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1A1D26] border border-[#262A36] text-[#B9BEC7] font-bold text-xs flex items-center justify-center shrink-0 group-hover:border-[#DA0E19]">
                            {m.full_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#F5F6F8] block group-hover:text-[#DA0E19] transition-colors">
                              {m.full_name}
                            </span>
                            <span className="text-[10px] font-mono text-[#9AA1AE]">{m.member_code}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="block text-[#F5F6F8]">{m.phone || '—'}</span>
                        <span className="text-[10px] text-[#9AA1AE]">{m.area || 'Kampala'}</span>
                      </td>

                      <td className="p-3.5 text-[#B9BEC7]">
                        {m.coach_name || 'Coach Alex'}
                      </td>

                      <td className="p-3.5">
                        <Badge status={mStatus} />
                        {(m as any).expires_on && (
                          <span className="block text-[10px] text-[#9AA1AE] mt-0.5">
                            Exp: {(m as any).expires_on}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-[#1A1D26] rounded-full overflow-hidden border border-[#262A36]">
                            <div
                              className={`h-full rounded-full ${showUpRate >= 75 ? 'bg-emerald-500' : showUpRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${showUpRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-[#F5F6F8] tabular-nums">{showUpRate}%</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {m.level ? <Badge status={m.level} /> : '—'}
                      </td>

                      <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="p-1.5 rounded bg-[#1A1D26] text-[#9AA1AE] hover:text-white hover:bg-[#DA0E19] transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/members/${m.id}`)}
                            className="p-1.5 rounded bg-[#1A1D26] text-[#9AA1AE] hover:text-white hover:bg-[#262A36] transition-colors"
                            title="View Profile"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMemberDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onSuccess={loadMembers}
      />

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={loadMembers}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={loadMembers}
      />
    </AdminLayout>
  );
};
