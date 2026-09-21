import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { Client } from '../../types/database';
import { Activity, AlertCircle, Calculator } from 'lucide-react';

interface NewAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedClientId?: string;
}

export const NewAssessmentModal: React.FC<NewAssessmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedClientId
}) => {
  const [members, setMembers] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [assessedOn, setAssessedOn] = useState(new Date().toISOString().substring(0, 10));
  const [heightCm, setHeightCm] = useState<number | ''>(175);
  const [weightKg, setWeightKg] = useState<number | ''>(75);
  const [waistCm, setWaistCm] = useState<number | ''>(82);
  const [waistInchesInput, setWaistInchesInput] = useState('');
  const [pushups, setPushups] = useState<number | ''>(25);
  const [pushupsProperForm, setPushupsProperForm] = useState(true);
  const [plankSeconds, setPlankSeconds] = useState<number | ''>(60);
  const [runMmSs, setRunMmSs] = useState('06:00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getMembers().then(mList => {
        setMembers(mList);
        if (preselectedClientId) {
          setClientId(preselectedClientId);
        } else if (mList.length > 0) {
          setClientId(mList[0].id);
        }
      });
    }
  }, [isOpen, preselectedClientId]);

  // Live BMI calculation
  let computedBmi: number | undefined = undefined;
  if (typeof heightCm === 'number' && typeof weightKg === 'number' && heightCm > 0) {
    const hM = heightCm / 100;
    computedBmi = parseFloat((weightKg / (hM * hM)).toFixed(1));
  }

  // Convert waist inches to cm helper
  const handleConvertInchesToCm = () => {
    const inchVal = parseFloat(waistInchesInput);
    if (!isNaN(inchVal) && inchVal > 0) {
      setWaistCm(Math.round(inchVal * 2.54));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clientId) {
      setError('Please select a member.');
      return;
    }

    // Convert mm:ss to run_time_seconds
    let runTimeSeconds: number | undefined = undefined;
    if (runMmSs) {
      const parts = runMmSs.split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10) || 0;
        const secs = parseInt(parts[1], 10) || 0;
        runTimeSeconds = mins * 60 + secs;
      }
    }

    setSubmitting(true);
    try {
      await api.addAssessment({
        client_id: clientId,
        assessed_on: assessedOn,
        height_cm: typeof heightCm === 'number' ? heightCm : undefined,
        weight_kg: typeof weightKg === 'number' ? weightKg : undefined,
        waist_cm: typeof waistCm === 'number' ? waistCm : undefined,
        pushups: typeof pushups === 'number' ? pushups : undefined,
        pushups_proper_form: pushupsProperForm,
        plank_seconds: typeof plankSeconds === 'number' ? plankSeconds : undefined,
        run_time_seconds: runTimeSeconds,
        notes: notes.trim() || undefined
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Fitness Assessment" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Athlete Member</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.full_name} ({m.member_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Assessment Date</label>
            <input
              type="date"
              required
              value={assessedOn}
              onChange={(e) => setAssessedOn(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Height (cm)</label>
            <input
              type="number"
              placeholder="175"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Weight (kg)</label>
            <input
              type="number"
              placeholder="75"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Calculated BMI</label>
            <div className="px-3 py-2 text-xs bg-[#0A0B10] border border-[#262A36] rounded-lg font-bold text-amber-400">
              {computedBmi ? `${computedBmi} kg/m²` : '—'}
            </div>
          </div>
        </div>

        {/* Waist with Inches Converter Helper */}
        <div className="p-3 rounded-lg bg-[#1A1D26] border border-[#262A36] space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-[#F5F6F8]">Waist Circumference (cm)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Inches"
                value={waistInchesInput}
                onChange={(e) => setWaistInchesInput(e.target.value)}
                className="w-16 px-2 py-0.5 text-[11px] bg-[#0A0B10] border border-[#262A36] rounded text-[#F5F6F8]"
              />
              <button
                type="button"
                onClick={handleConvertInchesToCm}
                className="px-2 py-0.5 text-[10px] font-bold bg-[#DA0E19] text-white rounded"
              >
                Inches → cm
              </button>
            </div>
          </div>

          <input
            type="number"
            placeholder="e.g. 82"
            value={waistCm}
            onChange={(e) => setWaistCm(e.target.value ? parseFloat(e.target.value) : '')}
            className="w-full px-3 py-2 text-xs bg-[#0A0B10] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Pushup Max Reps</label>
            <input
              type="number"
              placeholder="e.g. 25"
              value={pushups}
              onChange={(e) => setPushups(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none"
            />
            <label className="flex items-center gap-1.5 mt-1 text-[11px] text-[#9AA1AE] cursor-pointer">
              <input
                type="checkbox"
                checked={pushupsProperForm}
                onChange={(e) => setPushupsProperForm(e.target.checked)}
                className="rounded border-[#262A36] text-[#DA0E19]"
              />
              <span>Strict Proper Form Verified</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Plank Hold (seconds)</label>
            <input
              type="number"
              placeholder="e.g. 60"
              value={plankSeconds}
              onChange={(e) => setPlankSeconds(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">1km Run Time (mm:ss)</label>
          <input
            type="text"
            placeholder="05:30"
            value={runMmSs}
            onChange={(e) => setRunMmSs(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none"
          />
          <span className="text-[10px] text-[#9AA1AE]">Stored internally as seconds for performance charting</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#F5F6F8] mb-1">Assessment Notes</label>
          <input
            type="text"
            placeholder="e.g. Improved core stability; tight hip flexors."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none"
          />
        </div>

        <div className="pt-3 flex justify-end gap-3 border-t border-[#262A36]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1A1D26] text-[#9AA1AE]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white shadow-md"
          >
            {submitting ? 'Saving...' : 'Save Assessment Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
