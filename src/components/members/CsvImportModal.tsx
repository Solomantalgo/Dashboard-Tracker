import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { Upload, FileSpreadsheet, Check, AlertTriangle } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<Array<{ full_name: string; phone?: string; area?: string; age?: string }>>([]);
  const [step, setStep] = useState<'paste' | 'preview'>('paste');
  const [result, setResult] = useState<{ importedCount: number; duplicateCount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const sampleCsv = `full_name,phone,area,age
Robert Mackay,772123456,Kizungu,32
Sarah Tugume,0702444006,Makindye,30
David Kizza,782777003,Kabalagala,35`;

  const handleParse = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return;

    const rows: Array<{ full_name: string; phone?: string; area?: string; age?: string }> = [];
    // Assume header is line 0
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts[0]) {
        rows.push({
          full_name: parts[0],
          phone: parts[1] || undefined,
          area: parts[2] || undefined,
          age: parts[3] || undefined
        });
      }
    }
    setParsedRows(rows);
    setStep('preview');
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await api.importMembersCsv(parsedRows);
      setResult(res);
      onSuccess();
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCsvText('');
    setParsedRows([]);
    setStep('paste');
    setResult(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Members CSV" maxWidth="max-w-2xl">
      {result ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-heading text-[#F5F6F8]">CSV Import Complete!</h3>
          <div className="flex justify-center gap-6 text-sm">
            <div className="p-3 bg-[#1A1D26] rounded-lg border border-[#262A36]">
              <span className="block font-bold text-emerald-400 text-xl">{result.importedCount}</span>
              <span className="text-xs text-[#9AA1AE]">New Members Added</span>
            </div>
            <div className="p-3 bg-[#1A1D26] rounded-lg border border-[#262A36]">
              <span className="block font-bold text-amber-400 text-xl">{result.duplicateCount}</span>
              <span className="text-xs text-[#9AA1AE]">Duplicates Skipped</span>
            </div>
          </div>
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white"
          >
            Done
          </button>
        </div>
      ) : step === 'paste' ? (
        <div className="space-y-4">
          <p className="text-xs text-[#9AA1AE]">
            Paste CSV member rows exported from Google Sheets or Excel. The importer automatically generates fresh unique member codes (`PFFIxxx`) and normalizes Uganda phones to `+256...`.
          </p>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[#F5F6F8]">CSV Content</label>
              <button
                type="button"
                onClick={() => setCsvText(sampleCsv)}
                className="text-[11px] text-[#DA0E19] font-semibold hover:underline"
              >
                Load Sample Data
              </button>
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="full_name,phone,area,age&#10;Robert Mackay,772123456,Kizungu,32"
              className="w-full px-3 py-2 text-xs font-mono bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1A1D26] text-[#9AA1AE]"
            >
              Cancel
            </button>
            <button
              disabled={!csvText.trim()}
              onClick={handleParse}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white disabled:opacity-50 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Preview & Validate ({csvText.trim().split('\n').length - 1} rows)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#F5F6F8]">Import Preview ({parsedRows.length} rows)</h4>
            <button
              onClick={() => setStep('paste')}
              className="text-xs text-[#9AA1AE] hover:text-white"
            >
              ← Edit CSV text
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto border border-[#262A36] rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#1A1D26] text-[#9AA1AE] uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Phone (Normalized)</th>
                  <th className="p-2">Area</th>
                  <th className="p-2">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262A36] text-[#F5F6F8]">
                {parsedRows.map((r, i) => {
                  let p = r.phone?.trim() || '';
                  if (p && !p.startsWith('+')) {
                    if (p.startsWith('0')) p = p.substring(1);
                    p = `+256${p}`;
                  }
                  return (
                    <tr key={i} className="hover:bg-[#1A1D26]">
                      <td className="p-2 font-semibold">{r.full_name}</td>
                      <td className="p-2 text-[#9AA1AE]">{p || '—'}</td>
                      <td className="p-2 text-[#9AA1AE]">{r.area || 'Kampala'}</td>
                      <td className="p-2 text-[#9AA1AE]">{r.age || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setStep('paste')}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1A1D26] text-[#9AA1AE]"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white shadow-md"
            >
              {loading ? 'Importing...' : `Confirm & Import ${parsedRows.length} Members`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
