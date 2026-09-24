import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { Payment } from '../types/database';
import { CreditCard, Plus, Search, TrendingUp, AlertTriangle, X } from 'lucide-react';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';
import { format, isValid, parseISO } from 'date-fns';

const displayDate = (value?: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'dd MMM yyyy') : value;
};

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'failed'>('all');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getPayments();
      setPayments(res);
    } catch (err) {
      console.error('Error loading payments:', err);
      setError('Payment records could not be loaded. Check the connection and try again.');
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

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const emptyState = (variant: 'empty' | 'filtered') => (
    <div className="flex min-h-[15rem] flex-col items-center justify-center px-6 py-10 text-center">
      {variant === 'empty' ? <CreditCard className="h-8 w-8 text-[#DA0E19]" /> : <Search className="h-7 w-7 text-[#9AA1AE]" />}
      <p className="mt-3 font-semibold text-[#F5F6F8]">{variant === 'empty' ? 'No payment receipts yet' : 'No matching payments'}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#9AA1AE]">{variant === 'empty' ? 'Record the first payment to start the ledger.' : 'Adjust the search or payment status filter.'}</p>
      {variant === 'empty' ? (
        <button type="button" onClick={() => setIsRecordModalOpen(true)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#DA0E19]/20 hover:bg-[#F0202C]"><Plus className="h-4 w-4" /> Record Payment</button>
      ) : (
        <button type="button" onClick={clearFilters} className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[#DA0E19] hover:underline"><X className="h-3.5 w-3.5" /> Clear filters</button>
      )}
    </div>
  );

  return (
    <AdminLayout title="Payment Receipts & Membership Ledgers">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex min-h-[8.5rem] items-center justify-between rounded-[12px] border border-[#262A36] bg-[#12141B] p-5">
          <div>
            <span className="text-xs uppercase font-bold text-[#9AA1AE]">Collected This Month</span>
            <h3 className="mt-2 text-2xl font-black font-heading text-[#F5F6F8] tabular-nums sm:text-[1.65rem]">
              UGX {collectedThisMonth.toLocaleString()}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="flex min-h-[8.5rem] items-center justify-between rounded-[12px] border border-[#262A36] bg-[#12141B] p-5">
          <div>
            <span className="text-xs uppercase font-bold text-[#9AA1AE]">Total Receipts Logged</span>
            <h3 className="mt-2 text-2xl font-black font-heading text-[#F5F6F8] tabular-nums sm:text-[1.65rem]">
              {payments.length} <span className="text-sm font-bold text-[#B9BEC7]">Transactions</span>
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-[#1A1D26] text-[#DA0E19]">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="col-span-1 flex min-h-[8.5rem] min-w-0 max-w-full flex-col gap-4 overflow-hidden rounded-[12px] border border-[#262A36] bg-[#12141B] p-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:col-span-1 lg:flex-col lg:items-start">
          <div className="min-w-0">
            <span className="text-xs uppercase font-bold text-[#9AA1AE]">Standard Plan Fee</span>
            <h3 className="mt-2 whitespace-nowrap text-2xl font-black font-heading text-[#DA0E19] tabular-nums sm:text-[1.65rem]">
              UGX 50,000 / mo
            </h3>
          </div>
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DA0E19] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#DA0E19]/20 transition-colors hover:bg-[#F0202C] sm:w-auto lg:w-full"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="relative w-full sm:max-w-md sm:flex-1">
          <span className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Search payments</span>
          <Search className="absolute left-3 top-[29px] h-4 w-4 -translate-y-1/2 text-[#9AA1AE]" />
          <input
            type="text"
            placeholder="Search member, method, ref..."
            aria-label="Search payments"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] pl-9 pr-3 py-2 text-xs text-[#F5F6F8] placeholder-[#9AA1AE] focus:border-[#DA0E19] focus:outline-none focus:ring-1 focus:ring-[#DA0E19]/40 sm:min-h-0"
          />
        </label>

        <label className="flex w-full flex-col gap-1 sm:w-56">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Payment status</span>
          <select
            aria-label="Filter payment status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="min-h-11 rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-1 focus:ring-[#DA0E19]/40 sm:min-h-0"
          >
            <option value="all">All Payment Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending Online</option>
            <option value="failed">Failed</option>
          </select>
        </label>
      </div>

      {/* Payments Table */}
      <div className="hidden overflow-hidden rounded-[12px] border border-[#262A36] bg-[#12141B] shadow-xl md:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[16%]" /><col className="w-[12%]" /><col className="w-[14%]" /><col className="w-[12%]" />
              <col className="w-[12%]" /><col className="w-[11%]" /><col className="w-[14%]" /><col className="w-[9%]" />
            </colgroup>
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
              ) : error ? (
                <tr><td colSpan={8} className="p-10 text-center"><AlertTriangle className="mx-auto h-6 w-6 text-amber-400" /><p className="mt-2 font-semibold text-[#F5F6F8]">Unable to load payment records</p><p className="mt-1 text-xs text-[#9AA1AE]">{error}</p><button type="button" onClick={loadPayments} className="mt-4 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white hover:bg-[#F0202C]">Try Again</button></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={8}>{emptyState('empty')}</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan={8}>{emptyState('filtered')}</td></tr>
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
                    <td className="p-3.5 font-mono text-[#9AA1AE]">{displayDate(p.paid_on)}</td>
                    <td className="p-3.5 font-mono text-emerald-400">{displayDate(p.expires_on)}</td>
                    <td className="truncate p-3.5 text-[#9AA1AE]">{p.method || '—'}</td>
                    <td className="truncate p-3.5 font-mono text-[10px] text-[#9AA1AE]" title={p.provider_ref || 'No reference'}>{p.provider_ref || '—'}</td>
                    <td className="p-3.5 pr-5"><Badge status={p.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 pb-8 md:hidden">
        {loading ? (
          <div className="rounded-[12px] border border-[#262A36] bg-[#12141B] p-10 text-center text-sm text-[#9AA1AE]">Loading payment records...</div>
        ) : error ? (
          <div className="rounded-[12px] border border-[#262A36] bg-[#12141B]"><div className="p-10 text-center"><AlertTriangle className="mx-auto h-6 w-6 text-amber-400" /><p className="mt-2 font-semibold text-[#F5F6F8]">Unable to load payment records</p><p className="mt-1 text-xs text-[#9AA1AE]">{error}</p><button type="button" onClick={loadPayments} className="mt-4 min-h-11 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white">Try Again</button></div></div>
        ) : payments.length === 0 ? (
          <div className="rounded-[12px] border border-[#262A36] bg-[#12141B]">{emptyState('empty')}</div>
        ) : filteredPayments.length === 0 ? (
          <div className="rounded-[12px] border border-[#262A36] bg-[#12141B]">{emptyState('filtered')}</div>
        ) : filteredPayments.map(p => (
          <article key={p.id} className="min-w-0 max-w-full overflow-hidden rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 shadow-lg">
            <div className="flex min-w-0 flex-col items-start gap-2 border-b border-[#262A36] pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0"><h3 className="truncate text-sm font-bold text-[#F5F6F8]">{p.client_name || 'Member'}</h3><p className="mt-1 text-xs text-[#B9BEC7]">{p.plan_name}</p></div>
              <div className="shrink-0 text-right"><p className="text-base font-black tabular-nums text-[#F5F6F8]">UGX {p.amount_ugx.toLocaleString()}</p><Badge status={p.status} /></div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Paid on</dt><dd className="mt-1 text-[#F5F6F8]">{displayDate(p.paid_on)}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Expires on</dt><dd className="mt-1 text-emerald-400">{displayDate(p.expires_on)}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Method</dt><dd className="mt-1 break-words text-[#B9BEC7]">{p.method}</dd></div>
              <div className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Reference</dt><dd className="mt-1 break-all font-mono text-[11px] text-[#B9BEC7]" title={p.provider_ref || 'No reference'}>{p.provider_ref || '—'}</dd></div>
            </dl>
          </article>
        ))}
      </div>

      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={loadPayments}
      />
    </AdminLayout>
  );
};
