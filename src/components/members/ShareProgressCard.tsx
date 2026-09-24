import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Client, Assessment } from '../../types/database';
import { Share2, Download, Flame, Check } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShareProgressCardProps {
  isOpen: boolean;
  onClose: () => void;
  member: Client;
  assessments: Assessment[];
  showUpRatePct: number;
}

export const ShareProgressCard: React.FC<ShareProgressCardProps> = ({
  isOpen,
  onClose,
  member,
  assessments,
  showUpRatePct
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [includePushups, setIncludePushups] = useState(true);
  const [includePlank, setIncludePlank] = useState(true);
  const [includeRun, setIncludeRun] = useState(true);
  const [includeWeight, setIncludeWeight] = useState(false); // Default false per brief
  const [downloading, setDownloading] = useState(false);

  const baseline = assessments[assessments.length - 1];
  const latest = assessments[0];

  const pushupDiff = (latest?.pushups ?? 0) - (baseline?.pushups ?? 0);
  const plankDiff = (latest?.plank_seconds ?? 0) - (baseline?.plank_seconds ?? 0);
  const runDiff = (baseline?.run_time_seconds ?? 0) - (latest?.run_time_seconds ?? 0); // positive = faster

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0A0B10',
        scale: 2
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${member.full_name.replace(/\s+/g, '_')}_PFFI_Progress.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Failed to generate image:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Member Progress Card" maxWidth="max-w-xl">
      <div className="space-y-4">
        <p className="text-xs text-[#9AA1AE]">
          Customize metrics to include on the WhatsApp progress card. Health screening data is strictly excluded.
        </p>

        {/* Toggle options */}
        <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-[#1A1D26] border border-[#262A36] text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includePushups}
              onChange={(e) => setIncludePushups(e.target.checked)}
              className="rounded border-[#262A36] text-[#DA0E19]"
            />
            <span>Pushup Gains</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includePlank}
              onChange={(e) => setIncludePlank(e.target.checked)}
              className="rounded border-[#262A36] text-[#DA0E19]"
            />
            <span>Plank Hold</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeRun}
              onChange={(e) => setIncludeRun(e.target.checked)}
              className="rounded border-[#262A36] text-[#DA0E19]"
            />
            <span>Sprint Time</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeWeight}
              onChange={(e) => setIncludeWeight(e.target.checked)}
              className="rounded border-[#262A36] text-[#DA0E19]"
            />
            <span className="text-amber-400">Weight (Default Off)</span>
          </label>
        </div>

        {/* Preview Card Element */}
        <div
          ref={cardRef}
          className="p-6 rounded-2xl bg-gradient-to-br from-[#12141B] via-[#1A1D26] to-[#0A0B10] border-2 border-[#DA0E19]/40 shadow-2xl relative overflow-hidden"
        >
          {/* Brand accent background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#DA0E19]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#262A36] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo.jpeg"
                alt="PFFI Logo"
                className="w-12 h-12 object-contain rounded-xl border border-[#262A36] bg-[#0A0B10]"
              />
              <div>
                <h2 className="text-lg font-extrabold font-heading text-[#F5F6F8]">
                  PRIME FORM FITNESS
                </h2>
                <p className="text-[10px] tracking-widest text-[#DA0E19] uppercase font-bold">
                  Kampala Athlete Progress
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-[#B9BEC7]">{member.member_code}</span>
              <p className="text-[10px] text-[#9AA1AE]">Kampala, Uganda</p>
            </div>
          </div>

          {/* Member Spotlight */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black font-heading text-[#F5F6F8]">{member.full_name}</h3>
              <p className="text-xs text-[#9AA1AE]">Outdoor Group Training • Kizungu Field</p>
            </div>

            <div className="text-center px-4 py-2 rounded-xl bg-[#1A1D26] border border-[#262A36]">
              <span className="block text-xl font-extrabold text-[#DA0E19] tabular-nums">
                {showUpRatePct}%
              </span>
              <span className="text-[9px] uppercase font-bold text-[#9AA1AE]">Show-Up Rate</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {includePushups && (
              <div className="p-3 rounded-xl bg-[#0A0B10]/80 border border-[#262A36]">
                <span className="text-[10px] uppercase font-bold text-[#9AA1AE]">Pushup Reps</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-[#F5F6F8]">{latest?.pushups ?? 0} reps</span>
                  {pushupDiff > 0 && (
                    <span className="text-xs font-bold text-emerald-400">+{pushupDiff} reps</span>
                  )}
                </div>
              </div>
            )}

            {includePlank && (
              <div className="p-3 rounded-xl bg-[#0A0B10]/80 border border-[#262A36]">
                <span className="text-[10px] uppercase font-bold text-[#9AA1AE]">Plank Hold</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-[#F5F6F8]">{latest?.plank_seconds ?? 0}s</span>
                  {plankDiff > 0 && (
                    <span className="text-xs font-bold text-emerald-400">+{plankDiff}s hold</span>
                  )}
                </div>
              </div>
            )}

            {includeRun && (
              <div className="p-3 rounded-xl bg-[#0A0B10]/80 border border-[#262A36]">
                <span className="text-[10px] uppercase font-bold text-[#9AA1AE]">1km Run Time</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-[#F5F6F8]">
                    {latest?.run_time_seconds ? `${Math.floor(latest.run_time_seconds / 60)}:${String(latest.run_time_seconds % 60).padStart(2, '0')}` : '—'}
                  </span>
                  {runDiff > 0 && (
                    <span className="text-xs font-bold text-emerald-400">-{runDiff}s faster</span>
                  )}
                </div>
              </div>
            )}

            {includeWeight && latest?.weight_kg && (
              <div className="p-3 rounded-xl bg-[#0A0B10]/80 border border-[#262A36]">
                <span className="text-[10px] uppercase font-bold text-[#9AA1AE]">Current Weight</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-[#F5F6F8]">{latest.weight_kg} kg</span>
                  {baseline?.weight_kg && (
                    <span className="text-xs font-bold text-emerald-400">
                      {(latest.weight_kg - baseline.weight_kg).toFixed(1)} kg
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer tagline */}
          <div className="text-center pt-2 border-t border-[#262A36]/60">
            <p className="text-[11px] font-bold text-[#B9BEC7] tracking-wider uppercase">
              "Real Training. Real Results." • Prime Form Fitness
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1A1D26] text-[#9AA1AE]"
          >
            Close
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white flex items-center gap-2 shadow-md"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generating PNG...' : 'Download Image for WhatsApp'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
