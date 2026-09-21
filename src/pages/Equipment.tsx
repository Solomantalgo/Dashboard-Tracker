import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { EquipmentNeed, PriorityLevel } from '../types/database';
import { Package, Plus, CheckCircle2, Circle } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const Equipment: React.FC = () => {
  const [equipment, setEquipment] = useState<EquipmentNeed[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    const res = await api.getEquipmentNeeds();
    setEquipment(res);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleResolved = async (id: string) => {
    await api.toggleEquipmentResolved(id);
    loadData();
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
      <div className="flex justify-between items-center bg-[#12141B] border border-[#262A36] rounded-[12px] p-4">
        <div>
          <h2 className="font-bold font-heading text-[#F5F6F8]">Hub Equipment Wishlist</h2>
          <p className="text-xs text-[#9AA1AE]">Unresolved items automatically trigger dashboard alerts</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white"
        >
          + Add Equipment Item
        </button>
      </div>

      <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5">
        <table className="w-full text-left text-xs">
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
            {equipment.map(eq => (
              <tr key={eq.id}>
                <td className="p-3 font-bold">{eq.item}</td>
                <td className="p-3 font-bold text-[#DA0E19]">{eq.quantity}x</td>
                <td className="p-3"><Badge status={eq.priority} /></td>
                <td className="p-3 text-[#9AA1AE]">{eq.notes || '—'}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleToggleResolved(eq.id)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ml-auto ${
                      eq.resolved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {eq.resolved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    {eq.resolved ? 'Acquired' : 'Unresolved Wishlist'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Needed Equipment">
        <form onSubmit={handleAddEquipment} className="space-y-3">
          <div>
            <label className="block text-xs mb-1 text-[#F5F6F8]">Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Heavy Kettlebells (16kg)"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 text-[#F5F6F8]">Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-[#F5F6F8]">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
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
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs bg-[#1A1D26] rounded">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-[#DA0E19] text-white rounded">Add to Wishlist</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
