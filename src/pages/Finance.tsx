import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { Transaction, Payment } from '../types/database';
import { TrendingUp, Plus, ArrowUpRight, ArrowDownLeft, DollarSign, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const Finance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form states
  const [description, setDescription] = useState('');
  const [amountUgx, setAmountUgx] = useState<number | ''>('');
  const [type, setType] = useState<'expense' | 'revenue'>('expense');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().substring(0, 10));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [tRes, pRes] = await Promise.all([
        api.getTransactions(),
        api.getPayments()
      ]);
      setTransactions(tRes);
      setPayments(pRes);
    } catch (err) {
      console.error('Error loading finance data:', err);
      setError('Financial records could not be loaded. Check the connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!description || !amountUgx) {
      setFormError('Enter a description and amount before saving.');
      return;
    }

    setSaving(true);
    try {
      await api.addTransaction({
        description,
        amount_ugx: typeof amountUgx === 'number' ? amountUgx : 0,
        type,
        txn_date: txnDate
      });

      setDescription('');
      setAmountUgx('');
      setIsExpenseModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving transaction:', err);
      setFormError('Transaction could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Build unified ledger
  const unifiedLedger = [
    ...payments.map(p => ({
      id: p.id,
      date: p.paid_on,
      description: `Member payment (${p.client_name || 'Member'})`,
      revenue: p.amount_ugx,
      expense: 0,
      source: 'Member Payment'
    })),
    ...transactions.map(t => ({
      id: t.id,
      date: t.txn_date,
      description: t.description,
      revenue: t.type === 'revenue' ? t.amount_ugx : 0,
      expense: t.type === 'expense' ? t.amount_ugx : 0,
      source: t.type === 'revenue' ? 'Other Revenue' : 'Business Expense'
    }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  const totalRevenue = unifiedLedger.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpense = unifiedLedger.reduce((sum, item) => sum + item.expense, 0);
  const netBalance = totalRevenue - totalExpense;

  return (
    <AdminLayout title="Hub Financial Ledger">
      {/* Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="min-h-[8.5rem] bg-[#12141B] border border-[#262A36] rounded-[12px] p-5">
          <span className="text-xs uppercase font-bold text-[#9AA1AE]">Total Revenue Recorded</span>
          <h3 className="mt-2 text-2xl font-black font-heading text-emerald-400 tabular-nums sm:text-[1.65rem]">
            UGX {totalRevenue.toLocaleString()}
          </h3>
        </div>

        <div className="min-h-[8.5rem] bg-[#12141B] border border-[#262A36] rounded-[12px] p-5">
          <span className="text-xs uppercase font-bold text-[#9AA1AE]">Total Expenses Logged</span>
          <h3 className="mt-2 text-2xl font-black font-heading text-rose-400 tabular-nums sm:text-[1.65rem]">
            UGX {totalExpense.toLocaleString()}
          </h3>
        </div>

        <div className="flex min-h-[8.5rem] min-w-0 flex-col gap-4 bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-[#9AA1AE]">Running Net Balance</span>
            <h3 className="mt-2 whitespace-nowrap text-2xl font-black font-heading text-[#DA0E19] tabular-nums sm:text-[1.65rem]">
              UGX {netBalance.toLocaleString()}
            </h3>
          </div>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white hover:bg-[#F0202C]"
          >
            Add Transaction
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-[12px] border border-[#262A36] bg-[#12141B] shadow-xl">
        <div className="flex flex-col gap-2 border-b border-[#262A36] p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-bold font-heading text-[#F5F6F8]">Unified Financial Ledger</h3>
          <span className="text-xs leading-5 text-[#9AA1AE]">Auto-combines member receipts + expense entries</span>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full table-fixed text-left text-xs">
            <colgroup><col className="w-[14%]" /><col className="w-[20%]" /><col className="w-[34%]" /><col className="w-[16%]" /><col className="w-[16%]" /></colgroup>
            <thead className="bg-[#1A1D26] text-[#9AA1AE] uppercase text-[10px] font-bold border-b border-[#262A36]">
              <tr>
                <th className="p-3.5 pl-5">Date</th>
                <th className="p-3.5">Category / Source</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Revenue (UGX)</th>
                <th className="p-3.5 pr-5 text-right">Expense (UGX)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262A36] text-[#F5F6F8]">
              {loading ? <tr><td colSpan={5} className="p-10 text-center text-[#9AA1AE]">Loading financial records...</td></tr> : error ? <tr><td colSpan={5} className="p-10 text-center"><AlertTriangle className="mx-auto h-6 w-6 text-amber-400" /><p className="mt-2 font-semibold text-[#F5F6F8]">Unable to load financial records</p><p className="mt-1 text-xs text-[#9AA1AE]">{error}</p><button type="button" onClick={loadData} className="mt-4 min-h-11 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white">Try Again</button></td></tr> : unifiedLedger.length === 0 ? <tr><td colSpan={5} className="p-10 text-center"><DollarSign className="mx-auto h-7 w-7 text-[#DA0E19]" /><p className="mt-2 font-semibold text-[#F5F6F8]">No transactions recorded</p><p className="mt-1 text-xs text-[#9AA1AE]">Add a transaction to start the financial ledger.</p><button type="button" onClick={() => setIsExpenseModalOpen(true)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Add Transaction</button></td></tr> : unifiedLedger.map(item => (
                <tr key={`${item.source}-${item.id}`} className="transition-colors hover:bg-[#1A1D26]/60">
                  <td className="p-3.5 pl-5 font-mono text-[#9AA1AE]">{item.date}</td>
                  <td className="p-3.5 font-semibold text-[#B9BEC7]">{item.source}</td>
                  <td className="p-3.5 text-[#F5F6F8]">{item.description}</td>
                  <td className="p-3.5 text-right font-bold text-emerald-400 tabular-nums">
                    {item.revenue > 0 ? `+ UGX ${item.revenue.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3.5 pr-5 text-right font-bold text-rose-400 tabular-nums">
                    {item.expense > 0 ? `- UGX ${item.expense.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 pb-8 md:hidden">
        {loading ? (
          <div className="rounded-[12px] border border-[#262A36] bg-[#12141B] p-10 text-center text-sm text-[#9AA1AE]">Loading financial records...</div>
        ) : error ? (
          <div className="rounded-[12px] border border-[#262A36] bg-[#12141B] p-10 text-center"><AlertTriangle className="mx-auto h-6 w-6 text-amber-400" /><p className="mt-2 font-semibold text-[#F5F6F8]">Unable to load financial records</p><p className="mt-1 text-xs text-[#9AA1AE]">{error}</p><button type="button" onClick={loadData} className="mt-4 min-h-11 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white">Try Again</button></div>
        ) : unifiedLedger.length === 0 ? (
          <div className="rounded-[12px] border border-[#262A36] bg-[#12141B] p-10 text-center"><DollarSign className="mx-auto h-7 w-7 text-[#DA0E19]" /><p className="mt-2 font-semibold text-[#F5F6F8]">No transactions recorded</p><p className="mt-1 text-xs text-[#9AA1AE]">Add a transaction to start the financial ledger.</p><button type="button" onClick={() => setIsExpenseModalOpen(true)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Add Transaction</button></div>
        ) : (
          unifiedLedger.map(item => {
            const isRevenue = item.revenue > 0;
            const amount = isRevenue ? item.revenue : item.expense;
            return (
              <article key={`mobile-${item.source}-${item.id}`} className="min-w-0 overflow-hidden rounded-[12px] border border-[#262A36] bg-[#12141B] p-4">
                <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0"><p className="font-mono text-[10px] text-[#9AA1AE]">{item.date}</p><h4 className="mt-1 text-xs font-bold text-[#B9BEC7]">{item.source}</h4></div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${isRevenue ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-400'}`}>{isRevenue ? 'Revenue' : 'Expense'}</span>
                </div>
                <p className="mt-3 break-words text-sm leading-5 text-[#F5F6F8]">{item.description}</p>
                <p className={`mt-3 text-lg font-black tabular-nums ${isRevenue ? 'text-emerald-400' : 'text-rose-400'}`}>{isRevenue ? '+' : '-'} UGX {amount.toLocaleString()}</p>
              </article>
            );
          })
        )}
      </div>

      {/* Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Log Transaction">
        <form onSubmit={handleAddTransaction} className="space-y-5">
          {formError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{formError}</p>}
          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Transaction Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25"
            >
              <option value="expense">Expense (Venue, cones, equipment)</option>
              <option value="revenue">Other Income (Corporate event)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Safe Fields Boston reservation fee"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Amount (UGX)</label>
              <input
                type="number"
                required
                placeholder="150000"
                value={amountUgx}
                onChange={(e) => setAmountUgx(e.target.value ? parseInt(e.target.value, 10) : '')}
                className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Date</label>
              <input
                type="date"
                required
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#262A36] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="min-h-11 w-full rounded-lg bg-[#1A1D26] px-4 py-2 text-xs font-semibold text-[#9AA1AE] sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 w-full rounded-lg bg-[#DA0E19] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#DA0E19]/20 hover:bg-[#F0202C] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
