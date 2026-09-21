import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { Transaction, Payment } from '../types/database';
import { TrendingUp, Plus, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const Finance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form states
  const [description, setDescription] = useState('');
  const [amountUgx, setAmountUgx] = useState<number | ''>('');
  const [type, setType] = useState<'expense' | 'revenue'>('expense');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().substring(0, 10));

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([
        api.getTransactions(),
        api.getPayments()
      ]);
      setTransactions(tRes);
      setPayments(pRes);
    } catch (err) {
      console.error('Error loading finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amountUgx) return;

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
        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5">
          <span className="text-xs uppercase font-bold text-[#9AA1AE]">Total Revenue Recorded</span>
          <h3 className="text-2xl font-black font-heading text-emerald-400 tabular-nums mt-1">
            UGX {totalRevenue.toLocaleString()}
          </h3>
        </div>

        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5">
          <span className="text-xs uppercase font-bold text-[#9AA1AE]">Total Expenses Logged</span>
          <h3 className="text-2xl font-black font-heading text-rose-400 tabular-nums mt-1">
            UGX {totalExpense.toLocaleString()}
          </h3>
        </div>

        <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-[#9AA1AE]">Running Net Balance</span>
            <h3 className="text-2xl font-black font-heading text-[#DA0E19] tabular-nums mt-1">
              UGX {netBalance.toLocaleString()}
            </h3>
          </div>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white hover:bg-[#F0202C]"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#262A36] flex justify-between items-center">
          <h3 className="font-bold font-heading text-[#F5F6F8]">Unified Financial Ledger</h3>
          <span className="text-xs text-[#9AA1AE]">Auto-combines member receipts + expense entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A1D26] text-[#9AA1AE] uppercase text-[10px] font-bold border-b border-[#262A36]">
              <tr>
                <th className="p-3.5 pl-5">Date</th>
                <th className="p-3.5">Category / Source</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Revenue (UGX)</th>
                <th className="p-3.5 pr-5">Expense (UGX)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262A36] text-[#F5F6F8]">
              {unifiedLedger.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#1A1D26]/60 transition-colors">
                  <td className="p-3.5 pl-5 font-mono text-[#9AA1AE]">{item.date}</td>
                  <td className="p-3.5 font-semibold text-[#B9BEC7]">{item.source}</td>
                  <td className="p-3.5 text-[#F5F6F8]">{item.description}</td>
                  <td className="p-3.5 font-bold text-emerald-400 tabular-nums">
                    {item.revenue > 0 ? `+ UGX ${item.revenue.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3.5 pr-5 font-bold text-rose-400 tabular-nums">
                    {item.expense > 0 ? `- UGX ${item.expense.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Log Transaction">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Transaction Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
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
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Amount (UGX)</label>
              <input
                type="number"
                required
                placeholder="150000"
                value={amountUgx}
                onChange={(e) => setAmountUgx(e.target.value ? parseInt(e.target.value, 10) : '')}
                className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Date</label>
              <input
                type="date"
                required
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-[#262A36]">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold bg-[#1A1D26] text-[#9AA1AE] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#DA0E19] text-white rounded-lg"
            >
              Save Entry
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
