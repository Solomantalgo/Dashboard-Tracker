import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { Client, Coach } from '../types/database';
import { Search, UserPlus, Upload, CreditCard, ChevronRight, MapPin, UserRound, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddMemberDrawer } from '../components/members/AddMemberDrawer';
import { CsvImportModal } from '../components/members/CsvImportModal';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';

export const Members: React.FC = () => {
  const [members, setMembers] = useState<Client[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
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
        api.getMembers(true),
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#12141B] border border-[#262A36] rounded-[12px] p-4 sm:p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold font-heading text-[#F5F6F8]">All Registered Athletes</h2>
            <span className="rounded-full border border-[#DA0E19]/30 bg-[#DA0E19]/10 px-2 py-0.5 text-[11px] font-semibold text-[#F58A90]">
              {filteredMembers.length} shown
            </span>
          </div>
          <p className="mt-1 text-xs text-[#9AA1AE]">Members found in Kampala hub</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs font-semibold text-[#F5F6F8] transition-colors hover:border-[#DA0E19] sm:min-h-0"
          >
            <Upload className="w-4 h-4 text-[#DA0E19]" />
            Import CSV
          </button>
          <button
            onClick={() => setIsAddDrawerOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#DA0E19] px-3 py-2 text-xs font-bold text-white shadow-md shadow-[#DA0E19]/20 transition-colors hover:bg-[#F0202C] sm:min-h-0 sm:px-4"
          >
            <UserPlus className="w-4 h-4" />
            + Add New Member
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <label className="relative flex min-w-0 flex-col gap-1 sm:col-span-2 lg:col-span-1">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Search members</span>
          <Search className="absolute left-3 top-[29px] h-4 w-4 text-[#9AA1AE]" />
          <input
            type="text"
            placeholder="Search name, code, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#12141B] pl-9 pr-3 py-2 text-xs text-[#F5F6F8] placeholder-[#9AA1AE] transition-colors focus:border-[#DA0E19] focus:outline-none focus:ring-1 focus:ring-[#DA0E19]/40 sm:min-h-0"
          />
        </label>

        {/* Status filter */}
        <label className="flex min-w-0 flex-col gap-1">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Member status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="min-h-11 min-w-0 rounded-lg border border-[#262A36] bg-[#12141B] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-1 focus:ring-[#DA0E19]/40 sm:min-h-0"
          >
            <option value="active">Active Members Only (Default)</option>
            <option value="inactive">Inactive Members Only</option>
            <option value="all">All Members (Active & Inactive)</option>
          </select>
        </label>

        {/* Membership status filter */}
        <label className="flex min-w-0 flex-col gap-1">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Membership</span>
          <select
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value as any)}
            className="min-h-11 min-w-0 rounded-lg border border-[#262A36] bg-[#12141B] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-1 focus:ring-[#DA0E19]/40 sm:min-h-0"
          >
            <option value="all">All Membership States</option>
            <option value="active">Paid & Active</option>
            <option value="expired">Expired</option>
            <option value="never_paid">Never Paid</option>
          </select>
        </label>

        {/* Coach filter */}
        <label className="flex min-w-0 flex-col gap-1">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Coach</span>
          <select
            value={coachFilter}
            onChange={(e) => setCoachFilter(e.target.value)}
            className="min-h-11 min-w-0 rounded-lg border border-[#262A36] bg-[#12141B] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-1 focus:ring-[#DA0E19]/40 sm:min-h-0"
          >
            <option value="all">All Assigned Coaches</option>
            {coaches.map(c => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Members Data Table */}
      <div className="hidden overflow-hidden rounded-[12px] border border-[#262A36] bg-[#12141B] shadow-xl md:block">
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
                  const showUpRate = (m as any).show_up_rate_pct ?? 0;
                  const isInactive = m.status === 'inactive';

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-[#1A1D26]/60 transition-colors group cursor-pointer ${isInactive ? 'opacity-60 bg-black/20' : ''}`}
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
                        {m.coach_name || 'Unassigned'}
                      </td>

                      <td className="p-3.5">
                        <Badge status={isInactive ? 'inactive' : mStatus} />
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

      {/* Responsive member cards */}
      <div className="space-y-3 pb-8 md:hidden">
        {loading ? (
          <div className="rounded-[12px] border border-[#262A36] bg-[#12141B] p-8 text-center text-sm text-[#9AA1AE]">
            Loading member directory...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-[12px] border border-[#262A36] bg-[#12141B] p-8 text-center text-sm text-[#9AA1AE]">
            No members match the selected filters.
          </div>
        ) : (
          filteredMembers.map((m) => {
            const mStatus = (m as any).membership_status || 'never_paid';
            const showUpRate = (m as any).show_up_rate_pct ?? 0;
            const isInactive = m.status === 'inactive';

            return (
              <article
                key={m.id}
                className={`rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 shadow-lg ${isInactive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/members/${m.id}`)}
                    className="group flex min-w-0 items-center gap-3 text-left"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#262A36] bg-[#1A1D26] text-xs font-bold text-[#B9BEC7] transition-colors group-hover:border-[#DA0E19] group-hover:text-[#F5F6F8]">
                      {m.full_name.substring(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#F5F6F8] group-hover:text-[#DA0E19]">{m.full_name}</span>
                      <span className="font-mono text-[10px] text-[#9AA1AE]">{m.member_code}</span>
                    </span>
                  </button>
                  <Badge status={isInactive ? 'inactive' : mStatus} className="shrink-0" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#262A36] pt-3 text-xs">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]"><MapPin className="h-3 w-3" /> Phone / Area</span>
                    <span className="mt-1 block truncate text-[#F5F6F8]">{m.phone || '—'}</span>
                    <span className="block truncate text-[10px] text-[#9AA1AE]">{m.area || 'Kampala'}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]"><UserRound className="h-3 w-3" /> Coach</span>
                    <span className="mt-1 block truncate text-[#F5F6F8]">{m.coach_name || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]"><Activity className="h-3 w-3" /> Show-up (30d)</span>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full border border-[#262A36] bg-[#1A1D26]">
                        <div className={`h-full rounded-full ${showUpRate >= 75 ? 'bg-emerald-500' : showUpRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${showUpRate}%` }} />
                      </div>
                      <span className="font-bold tabular-nums text-[#F5F6F8]">{showUpRate}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Level</span>
                    <div className="mt-1">{m.level ? <Badge status={m.level} /> : <span className="text-[#9AA1AE]">Unassigned</span>}</div>
                  </div>
                </div>

                {((m as any).expires_on) && (
                  <p className="mt-3 text-[10px] text-[#9AA1AE]">Expires {(m as any).expires_on}</p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#262A36] pt-3">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs font-semibold text-[#F5F6F8] transition-colors hover:border-[#DA0E19] hover:text-white"
                  >
                    <CreditCard className="h-4 w-4 text-[#DA0E19]" />
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/members/${m.id}`)}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#DA0E19] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#F0202C]"
                  >
                    View Profile
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })
        )}
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
