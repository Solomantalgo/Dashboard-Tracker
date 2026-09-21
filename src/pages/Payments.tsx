import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { Payment } from '../types/database';
import { CreditCard, Plus, Filter, Search, TrendingUp, AlertTriangle } from 'lucide-react';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';
import { format } from 'date-fns';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'failed'>('all');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.getPayments();
      setPayments(res);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Summary strip metrics
  const currentMonthPrefix = format(new Date(), 'yyyy-MM');
  const collectedThisMonth = payments
    .filter(p => p.paid_on.startsWith(currentMonthPrefix) && p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount_ugx, 0);

  const filteredPayments = payments.filter(p => {
    const matchSearch =
      (p.client_name && p.client_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.method && p.method.toLowerCase().includes(search.toLowerCase())) ||
      (p.provider_ref && p.provider_ref.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout title="Payment Receipts & Membership Ledgers">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-[#9AA1AE]">Collected This Month</span>
            <h3 className="text-2xl font-black font-heading text-[#F5F6F8] tabular-nums mt-1">
              UGX {collectedThisMonth.toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-[#9AA1AE]">Total Receipts Logged</span>
            <h3 className="text-2xl font-black font-heading text-[#F5F6F8] tabular-nums mt-1">
              {payments.length} Transactions
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-[#1A1D26] text-[#DA0E19]">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 flex items-center justify-between col-span-1 sm:col-span-2 lg:col-span-1">
          <div>
            <span className="text-xs uppercase font-bold text-[#9AA1AE]">Standard Plan Fee</span>
            <h3 className="text-2xl font-black font-heading text-[#DA0E19] tabular-nums mt-1">
              UGX 50,000 / mo
            </h3>
          </div>
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold rounded-lg bg-[#DA0E19] text-white hover:bg-[#F0202C] shadow-md shadow-[#DA0E19]/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#12141B] border border-[#262A36] rounded-[12px] p-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA1AE]" />
          <input
            type="text"
            placeholder="Search member, method, ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-1.5 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none"
        >
          <option value="all">All Payment Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending Online</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A1D26] text-[#9AA1AE] uppercase text-[10px] font-bold border-b border-[#262A36]">
              <tr>
                <th className="p-3.5 pl-5">Member</th>
                <th className="p-3.5">Plan</th>
                <th className="p-3.5">Amount (UGX)</th>
                <th className="p-3.5">Paid On</th>
                <th className="p-3.5">Expires On</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Reference</th>
                <th className="p-3.5 pr-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262A36] text-[#F5F6F8]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#9AA1AE]">
                    Loading payment records...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#9AA1AE]">
                    No payments found matching your query.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-[#1A1D26]/60 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-[#F5F6F8]">
                      {p.client_name || 'Member'}
                    </td>
                    <td className="p-3.5 text-[#B9BEC7]">{p.plan_name}</td>
                    <td className="p-3.5 font-extrabold text-[#F5F6F8] tabular-nums">
                      UGX {p.amount_ugx.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-[#9AA1AE]">{p.paid_on}</td>
                    <td className="p-3.5 font-mono text-emerald-400">{p.expires_on || '—'}</td>
                    <td className="p-3.5 text-[#9AA1AE]">{p.method}</td>
                    <td className="p-3.5 font-mono text-[10px] text-[#9AA1AE]">{p.provider_ref || '—'}</td>
                    <td className="p-3.5 pr-5"><Badge status={p.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={loadPayments}
      />
    </AdminLayout>
  );
};
