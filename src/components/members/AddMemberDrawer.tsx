import React, { useState, useEffect } from 'react';
import { Drawer } from '../common/Drawer';
import { api } from '../../services/api';
import { Coach, ClientLevel } from '../../types/database';
import { UserCheck, Shield, CheckSquare, AlertCircle } from 'lucide-react';

interface AddMemberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMemberDrawer: React.FC<AddMemberDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('Kizungu, Kampala');
  const [age, setAge] = useState<number | ''>('');
  const [dateJoined, setDateJoined] = useState(new Date().toISOString().substring(0, 10));
  const [coachId, setCoachId] = useState('');
  const [level, setLevel] = useState<ClientLevel>('A');
  const [goals, setGoals] = useState<string[]>(['Fitness']);
  const [consentGiven, setConsentGiven] = useState(false);
  const [healthNotes, setHealthNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getCoaches().then(res => {
        setCoaches(res);
        if (res.length > 0) setCoachId(res[0].id);
      });
    }
  }, [isOpen]);

  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full member name is required.');
      return;
    }
    if (!consentGiven) {
      setError('Member consent is required under Uganda Data Protection Law.');
      return;
    }

    setSubmitting(true);
    try {
      // Normalize phone
      let formattedPhone = phone.trim().replace(/\s+/g, '');
      if (formattedPhone && !formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
        formattedPhone = `+256${formattedPhone}`;
      }

      const selectedCoach = coaches.find(c => c.id === coachId);

      await api.addMember({
        full_name: fullName.trim(),
        status: 'active',
        phone: formattedPhone || undefined,
        area: area.trim() || undefined,
        age_at_joining: typeof age === 'number' ? age : undefined,
        date_joined: dateJoined,
        coach_id: coachId || undefined,
        coach_name: selectedCoach?.full_name,
        goals,
        level,
        consent_given_at: consentGiven ? new Date().toISOString() : undefined
      }, healthNotes.trim() || undefined);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add member.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableGoals = ['Weight Loss', 'Fitness', 'Muscle Gain', 'Performance'];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Register New Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">
            Full Name <span className="text-[#DA0E19]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Robert Mackay"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="e.g. 0772123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
            />
            <span className="text-[10px] text-[#9AA1AE]">Normalizes to +256...</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Area / Suburb</label>
            <input
              type="text"
              placeholder="e.g. Kizungu, Kampala"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Age at Joining</label>
            <input
              type="number"
              placeholder="e.g. 32"
              value={age}
              onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Date Joined</label>
            <input
              type="date"
              value={dateJoined}
              onChange={(e) => setDateJoined(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Assigned Coach</label>
            <select
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
            >
              {coaches.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Coach Level Eval</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as ClientLevel)}
              className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
            >
              <option value="A">Level A (Beginner)</option>
              <option value="B">Level B (Intermediate)</option>
              <option value="C">Level C (Advanced)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#F5F6F8] mb-2">Fitness Goals</label>
          <div className="flex flex-wrap gap-2">
            {availableGoals.map(g => {
              const selected = goals.includes(g);
              return (
                <button
                  type="button"
                  key={g}
                  onClick={() => toggleGoal(g)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    selected
                      ? 'bg-[#DA0E19] text-white border-[#DA0E19]'
                      : 'bg-[#1A1D26] text-[#9AA1AE] border-[#262A36] hover:text-[#F5F6F8]'
                  }`}
                >
                  {selected ? `✓ ${g}` : `+ ${g}`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-[#262A36]">
          <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">
            Optional Health Screening / Medical Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Mild asthma, previous knee surgery. (Admin Only)"
            value={healthNotes}
            onChange={(e) => setHealthNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
          />
        </div>

        {/* Required Data Protection Consent Checkbox */}
        <div className="p-3 rounded-lg bg-[#1A1D26] border border-[#262A36] space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded border-[#262A36] bg-[#0A0B10] text-[#DA0E19] focus:ring-[#DA0E19]"
            />
            <span className="text-xs text-[#B9BEC7]">
              Member explicitly consents to health & workout data storage in accordance with Uganda Data Protection and Privacy Act, 2019. <span className="text-[#DA0E19]">*</span>
            </span>
          </label>
        </div>

        <div className="pt-3 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1A1D26] text-[#9AA1AE] border border-[#262A36] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white hover:bg-[#F0202C] shadow-md shadow-[#DA0E19]/20"
          >
            {submitting ? 'Saving...' : 'Save & Register'}
          </button>
        </div>
      </form>
    </Drawer>
  );
};
