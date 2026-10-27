import React, { useState } from 'react';
import { 
  FileText, Download, Printer, Users, CreditCard, 
  Building, Wrench, CheckCircle, ArrowDownToLine 
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminReports: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const reportCards = [
    {
      id: 'members',
      title: 'Member Registry & Status Report',
      description: 'Comprehensive roster of all registered athletes, assigned membership tier, start and expiry dates, phone contacts, and status.',
      icon: <Users className="w-6 h-6 text-[#ff6a00]" />,
      filename: 'flexi_members_report.csv',
      format: 'CSV / Excel',
    },
    {
      id: 'revenue',
      title: 'Financial Revenue & Invoices Audit',
      description: 'Itemized revenue breakdown including invoice numbers, transaction IDs, payment methods (Credit/UPI/Cash), paid amounts, and dates.',
      icon: <CreditCard className="w-6 h-6 text-emerald-400" />,
      filename: 'flexi_revenue_report.csv',
      format: 'CSV / Financial Ledger',
    },
    {
      id: 'attendance',
      title: 'Turnstile Attendance & Peak Traffic Logs',
      description: 'Physical turnstile check-in logs with timestamped badge scans, member IDs, gate locations (Turnstiles A/B), and verification methods.',
      icon: <Building className="w-6 h-6 text-blue-400" />,
      filename: 'flexi_attendance_report.csv',
      format: 'CSV / Hardware Audit',
    },
    {
      id: 'equipment',
      title: 'Equipment Condition & Service Due Register',
      description: 'Equipment inventory tracking, manufacturer brands, serial numbers, current operational condition, and scheduled preventive maintenance.',
      icon: <Wrench className="w-6 h-6 text-amber-400" />,
      filename: 'flexi_equipment_report.csv',
      format: 'CSV / Safety Compliance',
    },
  ];

  const handleDownloadCSV = async (reportId: string, filename: string) => {
    setDownloading(reportId);
    try {
      const res = await api.get(`/reports/export/${reportId}`, {
        responseType: 'blob',
      });

      // Trigger browser download
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      success(`Exported ${filename} successfully!`);
    } catch (err: any) {
      toastError('Failed to generate export file.');
    } finally {
      setDownloading(null);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#ff6a00]" />
            Enterprise Reports & Data Export Center
          </h2>
          <p className="text-xs text-neutral-400">
            Export club analytics, financial ledgers, member rosters, and hardware audits in standard CSV or printable format.
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-neutral-700 transition-colors self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-[#ff6a00]" />
          Print / PDF Export
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((rep) => (
          <div
            key={rep.id}
            className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 flex flex-col justify-between hover:border-neutral-700 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 group-hover:scale-110 transition-transform">
                  {rep.icon}
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-400 text-[10px] font-mono font-bold uppercase border border-neutral-800">
                  {rep.format}
                </span>
              </div>

              <h3 className="font-heading text-xl font-black tracking-wide text-white uppercase">
                {rep.title}
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                {rep.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-500">
                {rep.filename}
              </span>
              <button
                onClick={() => handleDownloadCSV(rep.id, rep.filename)}
                disabled={downloading === rep.id}
                className="px-4 py-2 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] disabled:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md shadow-[#ff6a00]/20"
              >
                <ArrowDownToLine className="w-4 h-4" />
                {downloading === rep.id ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Info Box */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-3 text-xs text-neutral-400">
        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>
          All exported files are formatted according to ISO 8601 timestamps and RFC 4180 CSV specifications, ready for import into Excel, Google Sheets, PowerBI, or QuickBooks.
        </span>
      </div>
    </div>
  );
};
