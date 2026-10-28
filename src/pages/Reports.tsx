import React, { useMemo, useState } from 'react';
import { endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { BarChart3, Download, FileText, Loader2 } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { AppRole } from '../types/database';
import { buildReport, downloadCsv, downloadPdf, ReportDocument, ReportRange, ReportType } from '../services/reports';

interface ReportsPageProps {
  embedded?: boolean;
  roleOverride?: Extract<AppRole, 'admin' | 'coach'>;
}

const dateString = (date: Date) => format(date, 'yyyy-MM-dd');

export const ReportsPage: React.FC<ReportsPageProps> = ({ embedded = false, roleOverride }) => {
  const { role, user, activeCoach } = useAuth();
  const reportRole = roleOverride || (role === 'coach' ? 'coach' : 'admin');
  const today = dateString(new Date());
  const [reportType, setReportType] = useState<ReportType>('business');
  const [preset, setPreset] = useState('month');
  const [from, setFrom] = useState(dateString(startOfMonth(new Date())));
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<ReportDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const options = useMemo(() => ([
    { value: 'business' as const, label: 'Business Summary' },
    { value: 'members' as const, label: 'Members Directory' },
    { value: 'attendance' as const, label: 'Attendance Log' },
    ...(reportRole === 'admin' ? [{ value: 'payments' as const, label: 'Payments / Finance Log' }] : [])
  ]), [reportRole]);

  const applyPreset = (value: string) => {
    setPreset(value);
    const now = new Date();
    if (value === 'week') {
      setFrom(dateString(startOfWeek(now, { weekStartsOn: 1 })));
      setTo(dateString(endOfWeek(now, { weekStartsOn: 1 })));
    } else if (value === 'month') {
      setFrom(dateString(startOfMonth(now)));
      setTo(today);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const range: ReportRange | undefined = reportType === 'members' ? undefined : { from, to };
      const generated = await buildReport(
        reportType,
        reportRole,
        reportRole === 'coach' ? (activeCoach?.full_name || 'Coach') : (user?.email || 'Admin'),
        range
      );
      setReport(generated);
    } catch (err: any) {
      setReport(null);
      setError(err?.message || 'The report could not be generated.');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={embedded ? 'space-y-4' : 'space-y-6'}>
      <div className="flex flex-col gap-3 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="flex items-center gap-2 font-bold font-heading text-[#F5F6F8]"><BarChart3 className="h-5 w-5 text-[#DA0E19]" />Reports</h2>
          <p className="mt-1 text-xs text-[#9AA1AE]">Generate current, real-data reports for download.</p>
        </div>
        <span className="rounded-full border border-[#DA0E19]/30 bg-[#DA0E19]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#DA0E19]">
          {reportRole === 'coach' ? 'Coach reports' : 'Admin reports'}
        </span>
      </div>

      <div className="rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
          <label className="text-xs font-semibold text-[#B9BEC7]">
            Report type
            <select value={reportType} onChange={e => { setReportType(e.target.value as ReportType); setReport(null); }} className="mt-2 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2.5 text-sm text-[#F5F6F8]">
              {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          {reportType !== 'members' ? (
            <>
              <label className="text-xs font-semibold text-[#B9BEC7]">
                Date range
                <select value={preset} onChange={e => applyPreset(e.target.value)} className="mt-2 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2.5 text-sm text-[#F5F6F8]">
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold text-[#B9BEC7]">From<input type="date" value={from} onChange={e => { setPreset('custom'); setFrom(e.target.value); }} className="mt-2 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-2 py-2.5 text-sm text-[#F5F6F8]" /></label>
                <label className="text-xs font-semibold text-[#B9BEC7]">To<input type="date" value={to} onChange={e => { setPreset('custom'); setTo(e.target.value); }} className="mt-2 w-full rounded-lg border border-[#262A36] bg-[#1A1D26] px-2 py-2.5 text-sm text-[#F5F6F8]" /></label>
              </div>
            </>
          ) : (
            <div className="lg:col-span-2 flex items-end text-xs text-[#9AA1AE]">Current member snapshot — no date range required.</div>
          )}
        </div>

        {error && <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button onClick={handleGenerate} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white hover:bg-[#F0202C] disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {loading ? 'Generating...' : 'Generate report'}
          </button>
          {report && <>
            <button onClick={() => downloadPdf(report)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#262A36] bg-[#1A1D26] px-4 py-2 text-xs font-bold text-[#F5F6F8] hover:border-[#DA0E19]"><Download className="h-4 w-4 text-[#DA0E19]" />Download PDF</button>
            <button onClick={() => downloadCsv(report)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#262A36] bg-[#1A1D26] px-4 py-2 text-xs font-bold text-[#F5F6F8] hover:border-[#DA0E19]"><Download className="h-4 w-4 text-[#DA0E19]" />Download CSV</button>
          </>}
        </div>
      </div>

      {report && (
        <div className="rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="font-bold font-heading text-[#F5F6F8]">{report.title}</h3><p className="text-xs text-[#9AA1AE]">{report.dateLabel} · {report.rows.length} data rows</p></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Generated from live app data</span>
          </div>
          {report.summary.length > 0 && <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{report.summary.map(([label, value]) => <div key={label} className="rounded-lg border border-[#262A36] bg-[#1A1D26] p-3"><div className="text-[10px] uppercase tracking-wide text-[#9AA1AE]">{label}</div><div className="mt-1 text-sm font-bold text-[#F5F6F8]">{value}</div></div>)}</div>}
          {report.rows.length === 0 && report.type !== 'business' ? <div className="rounded-lg border border-dashed border-[#262A36] p-8 text-center text-xs text-[#9AA1AE]">No data for the selected period.</div> : report.type === 'business' ? null : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-[#1A1D26] text-[10px] uppercase text-[#9AA1AE]"><tr>{report.headers.map(header => <th key={header} className="p-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#262A36]">{report.rows.slice(0, 25).map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="p-3 text-[#F5F6F8]">{cell}</td>)}</tr>)}</tbody></table>{report.rows.length > 25 && <p className="mt-3 text-xs text-[#9AA1AE]">Preview shows the first 25 rows; downloads include all rows.</p>}</div>}
        </div>
      )}
    </div>
  );

  return embedded ? content : <AdminLayout title="Reports">{content}</AdminLayout>;
};
