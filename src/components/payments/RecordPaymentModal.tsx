import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { Client, Plan } from '../../types/database';
import { CreditCard, AlertCircle, Lock } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedClientId?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedClientId
}) => {
  const [members, setMembers] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clientId, setClientId] = useState('');
  const [planId, setPlanId] = useState('');
  const [amountUgx, setAmountUgx] = useState<number>(50000);
  const [paidOn, setPaidOn] = useState(new Date().toISOString().substring(0, 10));
  const [expiresOn, setExpiresOn] = useState('');
  const [method, setMethod] = useState('MTN MoMo');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([api.getMembers(), api.getPlans()]).then(([mList, pList]) => {
        setMembers(mList);
        setPlans(pList);
        setPlanId(pList[0]?.id ?? '');
        if (preselectedClientId) {
          setClientId(preselectedClientId);
        } else if (mList.length > 0) {
          setClientId(mList[0].id);
        }
      });
      setAmountUgx(50000);

      // Default expires on 30 days
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setExpiresOn(d.toISOString().substring(0, 10));
    }
  }, [isOpen, preselectedClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clientId) {
      setError('Please select a member.');
      return;
    }

    if (!planId) {
      setError('Please select a plan.');
      return;
    }

    setSubmitting(true);
    try {
      await api.recordPayment({
        clientId,
        planId,
        amountUgx,
        paidOn,
        expiresOn,
        method,
        notes
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Member Payment" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Select Member</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.member_code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Plan</label>
            {plans.length > 0 ? (
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (UGX {p.price_ugx.toLocaleString()})
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-300">
                No plans set up yet — add one in Settings.
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Amount (UGX)</label>
            <input
              type="number"
              required
              min={0}
              value={amountUgx}
              onChange={(e) => setAmountUgx(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] font-bold tabular-nums focus:outline-none focus:border-[#DA0E19]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Paid On Date</label>
            <input
              type="date"
              required
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Membership Expires On</label>
            <input
              type="date"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Payment Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
          >
            <option value="MTN MoMo">MTN Mobile Money (MoMo)</option>
            <option value="Airtel Money">Airtel Money</option>
            <option value="Cash">Cash (Manual)</option>
            <option value="Bank transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Feature Flag Disabled Seam for Online Payments */}
        <div className="p-3 rounded-lg bg-[#1A1D26] border border-[#262A36] flex items-center justify-between text-xs opacity-60">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Collect Online via MoMo Prompt</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-bold">
            Coming Soon
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Notes / Receipt Ref</label>
          <input
            type="text"
            placeholder="e.g. Received by Coach Alex"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#262A36] pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-lg bg-[#1A1D26] px-4 py-2 text-xs font-semibold text-[#9AA1AE] sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 w-full rounded-lg bg-[#DA0E19] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#DA0E19]/20 hover:bg-[#F0202C] sm:w-auto"
          >
            {submitting ? 'Recording...' : 'Confirm & Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
