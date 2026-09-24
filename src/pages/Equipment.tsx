import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { EquipmentNeed, PriorityLevel } from '../types/database';
import { Package, Plus, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const Equipment: React.FC = () => {
  const [equipment, setEquipment] = useState<EquipmentNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getEquipmentNeeds();
      setEquipment(res);
    } catch (err) {
      console.error('Error loading equipment needs:', err);
      setError('Equipment needs could not be loaded. Check the connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleResolved = async (id: string) => {
    setTogglingId(id);
    try {
      await api.toggleEquipmentResolved(id);
      await loadData();
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    await api.addEquipmentNeed({
      item,
      quantity,
      priority,
      notes
    });
    setItem('');
    setQuantity(1);
    setIsModalOpen(false);
    loadData();
  };

  return (
    <AdminLayout title="Equipment Needed Wishlist">
      <div className="flex flex-col items-start gap-4 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-bold font-heading text-[#F5F6F8]">Hub Equipment Wishlist</h2>
          <p className="text-xs text-[#9AA1AE]">Unresolved items automatically trigger dashboard alerts</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="min-h-11 w-full rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white sm:w-auto"
        >
          <Plus className="mr-1 inline h-4 w-4" /> Add Equipment Item
        </button>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:p-5">
        <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed text-left text-xs">
          <colgroup><col className="w-[25%]" /><col className="w-[10%]" /><col className="w-[15%]" /><col className="w-[30%]" /><col className="w-[20%]" /></colgroup>
          <thead className="bg-[#1A1D26] text-[#9AA1AE] uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3">Equipment Item</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Notes</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262A36] text-[#F5F6F8]">
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center text-[#9AA1AE]">Loading equipment needs...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="p-10 text-center"><AlertTriangle className="mx-auto h-6 w-6 text-amber-400" /><p className="mt-2 font-semibold text-[#F5F6F8]">Unable to load equipment needs</p><p className="mt-1 text-xs text-[#9AA1AE]">{error}</p><button type="button" onClick={loadData} className="mt-4 min-h-11 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white">Try Again</button></td></tr>
            ) : equipment.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center"><Package className="mx-auto h-7 w-7 text-[#DA0E19]" /><p className="mt-2 font-semibold text-[#F5F6F8]">No equipment needed yet</p><p className="mt-1 text-xs text-[#9AA1AE]">Add an item to track wishlist needs and dashboard alerts.</p><button type="button" onClick={() => setIsModalOpen(true)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Add Equipment Item</button></td></tr>
            ) : equipment.map(eq => (
              <tr key={eq.id} className="hover:bg-[#1A1D26]/60">
                <td className="break-words p-3 font-bold">{eq.item}</td>
                <td className="p-3 font-bold text-[#DA0E19]">{eq.quantity}x</td>
                <td className="p-3"><Badge status={eq.priority} /></td>
                <td className="p-3 text-[#9AA1AE]">{eq.notes || '—'}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleToggleResolved(eq.id)}
                    disabled={togglingId === eq.id}
                    className={`ml-auto inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition-all disabled:cursor-wait disabled:opacity-60 ${
                      eq.resolved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {eq.resolved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    {togglingId === eq.id ? 'Updating...' : eq.resolved ? 'Acquired · Mark needed' : 'Needed · Mark acquired'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="space-y-3 pb-8 md:hidden">
          {loading ? (
            <div className="rounded-lg border border-[#262A36] bg-[#1A1D26] p-10 text-center text-sm text-[#9AA1AE]">Loading equipment needs...</div>
          ) : error ? (
            <div className="rounded-lg border border-[#262A36] bg-[#1A1D26] p-8 text-center"><p className="font-semibold text-[#F5F6F8]">Unable to load equipment needs</p><p className="mt-1 text-xs text-[#9AA1AE]">{error}</p><button type="button" onClick={loadData} className="mt-4 min-h-11 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white">Try Again</button></div>
          ) : equipment.length === 0 ? (
            <div className="rounded-lg border border-[#262A36] bg-[#1A1D26] p-8 text-center"><Package className="mx-auto h-7 w-7 text-[#DA0E19]" /><p className="mt-2 font-semibold text-[#F5F6F8]">No equipment needed yet</p><p className="mt-1 text-xs text-[#9AA1AE]">Add an item to track wishlist needs and dashboard alerts.</p><button type="button" onClick={() => setIsModalOpen(true)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Add Equipment Item</button></div>
          ) : equipment.map(eq => (
            <article key={`mobile-${eq.id}`} className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-[#262A36] bg-[#1A1D26] p-4">
              <div className="flex min-w-0 flex-col items-start gap-2 border-b border-[#262A36] pb-3"><h3 className="break-words text-sm font-bold text-[#F5F6F8]">{eq.item}</h3><p className="text-xs text-[#B9BEC7]">Quantity: <span className="font-bold text-[#DA0E19]">{eq.quantity}x</span></p><Badge status={eq.priority} /></div>
              <p className="mt-3 break-words text-sm leading-5 text-[#B9BEC7]">{eq.notes || 'No notes provided'}</p>
              <button type="button" onClick={() => handleToggleResolved(eq.id)} disabled={togglingId === eq.id} className={`mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all disabled:cursor-wait disabled:opacity-60 ${eq.resolved ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400' : 'border border-amber-500/30 bg-amber-500/15 text-amber-300'}`}>
                {eq.resolved ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {togglingId === eq.id ? 'Updating...' : eq.resolved ? 'Acquired · Mark needed' : 'Needed · Mark acquired'}
              </button>
            </article>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Needed Equipment">
        <form onSubmit={handleAddEquipment} className="space-y-5">
          <div>
            <label className="block text-xs mb-1 text-[#F5F6F8]">Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Heavy Kettlebells (16kg)"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <div>
              <label className="block text-xs mb-1 text-[#F5F6F8]">Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-[#F5F6F8]">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25"
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 text-[#F5F6F8]">Notes</label>
            <input
              type="text"
              placeholder="e.g. Needed for Thursday outdoor circuit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-2 focus:ring-[#DA0E19]/25"
            />
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-[#262A36] pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setIsModalOpen(false)} className="min-h-11 w-full rounded-lg bg-[#1A1D26] px-3 py-1.5 text-xs sm:w-auto">Cancel</button>
            <button type="submit" className="min-h-11 w-full rounded-lg bg-[#DA0E19] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#F0202C] sm:w-auto">Add to Wishlist</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
