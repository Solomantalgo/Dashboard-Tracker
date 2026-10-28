import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { api } from './api';
import { AppRole, Client, Payment, Session } from '../types/database';

export type ReportType = 'business' | 'members' | 'attendance' | 'payments';

export interface ReportRange {
  from: string;
  to: string;
}

export interface ReportDocument {
  type: ReportType;
  title: string;
  filename: string;
  generatedBy: string;
  dateLabel: string;
  headers: string[];
  rows: string[][];
  summary: Array<[string, string]>;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

const toDateLabel = (range?: ReportRange) => {
  if (!range) return 'Current snapshot';
  return `${range.from} to ${range.to}`;
};

const inRange = (date: string, range: ReportRange) => date >= range.from && date <= range.to;

const formatUgx = (amount: number) => `UGX ${amount.toLocaleString('en-UG')}`;

const csvEscape = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const downloadCsv = (report: ReportDocument) => {
  const lines: string[] = [];
  if (report.summary.length > 0) {
    lines.push(['Summary', 'Value'].map(csvEscape).join(','));
    lines.push(...report.summary.map(row => row.map(csvEscape).join(',')));
    lines.push('');
  }
  lines.push(report.headers.map(csvEscape).join(','));
  lines.push(...report.rows.map(row => row.map(csvEscape).join(',')));
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const loadLogo = async (): Promise<string | null> => {
  try {
    const response = await fetch('/assets/logo.jpeg');
    const blob = await response.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const addBranding = async (doc: jsPDF, report: ReportDocument) => {
  const logo = await loadLogo();
  if (logo) doc.addImage(logo, 'JPEG', 14, 10, 20, 20);
  doc.setTextColor(218, 14, 25);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PRIME FORM', 39, 17);
  doc.setTextColor(30, 34, 43);
  doc.setFontSize(8);
  doc.text('FITNESS INITIATIVE', 39, 23);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(15);
  doc.text(report.title, 14, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${report.dateLabel}`, 14, 49);
  doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')} | By: ${report.generatedBy}`, 14, 55);
};

export const downloadPdf = async (report: ReportDocument) => {
  const landscape = report.type === 'members' || report.type === 'payments';
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  await addBranding(doc, report);

  let y = 63;
  if (report.summary.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: report.summary,
      theme: 'grid',
      headStyles: { fillColor: [218, 14, 25], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 }
    });
    y = ((doc as any).lastAutoTable?.finalY || y) + 8;
  }

  if (report.rows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [report.headers],
      body: report.rows,
      theme: 'striped',
      headStyles: { fillColor: [30, 34, 43], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 246, 248] },
      styles: { fontSize: landscape ? 7 : 8, cellPadding: 2, overflow: 'linebreak' },
      margin: { left: 14, right: 14 }
    });
  } else if (report.type !== 'business') {
    doc.setTextColor(90, 90, 90);
    doc.setFontSize(11);
    doc.text('No data for the selected period.', 14, y + 8);
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(218, 14, 25);
    doc.line(14,  workflowFooterY(doc), landscape ? 283 : 196, workflowFooterY(doc));
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`PFFI Member Tracker | Page ${page} of ${pageCount}`, 14, workflowFooterY(doc) + 5);
  }
  doc.save(`${report.filename}.pdf`);
};

const workflowFooterY = (doc: jsPDF) => doc.internal.pageSize.getHeight() - 14;

const membersRows = (members: Client[]) => members.map(member => [
  member.full_name,
  member.member_code,
  member.phone || '',
  member.area || '',
  member.status,
  member.coach_name || '',
  member.level || '',
  member.goals.join('; '),
  member.date_joined || ''
]);

const attendanceRows = (sessions: Session[], activeCount: number) => sessions.map(session => {
  const present = session.attended_count || 0;
  const rate = activeCount > 0 ? Math.round((present / activeCount) * 100) : 0;
  return [session.session_date, session.coach_name || '', String(present), String(activeCount), `${rate}%`];
});

const paymentRows = (payments: Payment[]) => payments.map(payment => [
  payment.paid_on,
  payment.client_name || '',
  payment.plan_name || '',
  formatUgx(payment.amount_ugx),
  payment.method || '',
  payment.status
]);

export const buildReport = async (
  type: ReportType,
  role: Extract<AppRole, 'admin' | 'coach'>,
  generatedBy: string,
  range?: ReportRange
): Promise<ReportDocument> => {
  const generated = format(new Date(), 'yyyyMMdd-HHmm');
  const dateLabel = toDateLabel(range);

  if (type === 'members') {
    const members = await api.getMembers(true, true);
    return {
      type,
      title: 'Members Directory',
      filename: `pffi-members-${generated}`,
      generatedBy,
      dateLabel,
      headers: ['Name', 'Member Code', 'Phone', 'Area', 'Status', 'Assigned Coach', 'Level', 'Goals', 'Date Joined'],
      rows: membersRows(members),
      summary: [['Members in snapshot', String(members.length)]]
    };
  }

  if (!range) throw new Error('Select a date range for this report.');
  const [members, sessions] = await Promise.all([api.getMembers(false, true), api.getSessions(true)]);
  const periodSessions = sessions.filter(session => inRange(session.session_date, range));

  if (type === 'attendance') {
    const rows = attendanceRows(periodSessions, members.length);
    return {
      type,
      title: 'Attendance Log',
      filename: `pffi-attendance-${generated}`,
      generatedBy,
      dateLabel,
      headers: ['Date', 'Coach', 'Members Present', 'Total Active Members', 'Show-Up %'],
      rows,
      summary: [
        ['Sessions held', String(periodSessions.length)],
        ['Average show-up rate', periodSessions.length > 0
          ? `${Math.round(periodSessions.reduce((sum, session) => sum + ((session.attended_count || 0) / Math.max(members.length, 1)) * 100, 0) / periodSessions.length)}%`
          : '0%']
      ]
    };
  }

  if (type === 'payments') {
    if (role !== 'admin') throw new Error('Payments reports are only available to admins.');
    const payments = (await api.getPayments(true)).filter(payment => inRange(payment.paid_on, range));
    const total = payments.reduce((sum, payment) => sum + payment.amount_ugx, 0);
    return {
      type,
      title: 'Payments / Finance Log',
      filename: `pffi-payments-${generated}`,
      generatedBy,
      dateLabel,
      headers: ['Date', 'Member', 'Plan', 'Amount', 'Method', 'Status'],
      rows: paymentRows(payments),
      summary: [['Period total', formatUgx(total)]]
    };
  }

  const allMembers = await api.getMembers(true, true);
  // Do not call dashboard metrics for coaches: that query includes finance
  // sources which are intentionally unavailable to coach sessions.
  const dashboard = role === 'admin' ? await api.getDashboardMetrics(true) : null;
  const confirmedRevenue = role === 'admin'
    ? (await api.getPayments(true)).filter(payment => inRange(payment.paid_on, range) && payment.status === 'confirmed').reduce((sum, payment) => sum + payment.amount_ugx, 0)
    : null;
  const summary: Array<[string, string]> = [
    ['Active members', String(members.length)],
    ['Sessions held', String(periodSessions.length)],
    ['Average show-up rate', periodSessions.length > 0
      ? `${Math.round(periodSessions.reduce((sum, session) => sum + ((session.attended_count || 0) / Math.max(members.length, 1)) * 100, 0) / periodSessions.length)}%`
      : '0%'],
    ['Expired memberships', String(dashboard?.expiredCount ?? allMembers.filter(member => (member as any).membership_status === 'expired').length)],
    ['Expiring soon', String(dashboard?.expiringCount ?? allMembers.filter(member => (member as any).membership_status === 'due_soon').length)],
    ['Stopped coming', String(dashboard?.stoppedComingCount ?? allMembers.filter(member => Number((member as any).show_up_rate_pct || 0) === 0).length)],
    ['Inactive members', String(allMembers.filter(member => member.status === 'inactive').length)],
    ['Equipment needed', role === 'admin' ? String(dashboard?.equipmentNeedsCount || 0) : 'Not available to coach']
  ];
  if (confirmedRevenue !== null) summary.splice(3, 0, ['Revenue collected', formatUgx(confirmedRevenue)]);

  return {
    type,
    title: 'Business Summary',
    filename: `pffi-business-summary-${generated}`,
    generatedBy,
    dateLabel,
    headers: ['Metric', 'Value'],
    rows: [],
    summary
  };
};
