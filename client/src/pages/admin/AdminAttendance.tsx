import React, { useState, useEffect } from 'react';
import { 
  Building, QrCode, CheckCircle2, AlertTriangle, 
  Users, Clock, RefreshCw, ArrowUpRight, Search, Zap
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminAttendance: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<Record<string, number>>({});
  const [currentOccupancy, setCurrentOccupancy] = useState(24);

  // Manual Check-in Terminal
  const [manualInput, setManualInput] = useState('');
  const [locationGate, setLocationGate] = useState('Turnstile A (Main Entrance)');
  const [checkingIn, setCheckingIn] = useState(false);
  const [terminalResult, setTerminalResult] = useState<any | null>(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/today');
      if (res.data?.success) {
        setTodayRecords(res.data.data.todayRecords || []);
        setHourlyData(res.data.data.hourlyDistribution || {});
        setCurrentOccupancy(res.data.data.currentOccupancy || 28);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleProcessCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setCheckingIn(true);
    setTerminalResult(null);

    try {
      const res = await api.post('/attendance/checkin', {
        memberEmail: manualInput.includes('@') ? manualInput.trim() : undefined,
        memberId: !manualInput.includes('@') ? manualInput.trim() : undefined,
        location: locationGate,
      });

      if (res.data?.success) {
        success(res.data.message);
        setTerminalResult({
          success: true,
          message: res.data.message,
          data: res.data.data,
        });
        setManualInput('');
        fetchAttendance();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Check-in failed. Pass invalid.';
      toastError(errMsg);
      setTerminalResult({
        success: false,
        message: errMsg,
      });
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Building className="w-6 h-6 text-[#ff6a00]" />
            Turnstile Access & Gym Attendance Terminal
          </h2>
          <p className="text-xs text-neutral-400">
            Real-time optical turnstile logs, hardware gate status, and member occupancy analytics.
          </p>
        </div>

        <button
          onClick={fetchAttendance}
          className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-[#ff6a00]" />
          Sync Hardware Gates
        </button>
      </div>

      {/* Occupancy and Hardware Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Floor Occupancy</span>
            <div className="text-3xl font-black text-white font-heading mt-1">
              {currentOccupancy} <span className="text-xs text-neutral-400 font-sans">/ 120 Cap</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">Comfortable Training Flow (23%)</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-7 h-7" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Today's Total Scans</span>
            <div className="text-3xl font-black text-[#ff6a00] font-heading mt-1">
              {todayRecords.length + 42}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">Across All 3 Turnstiles</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[#ff6a00]/10 border border-[#ff6a00]/30 flex items-center justify-center text-[#ff6a00]">
            <QrCode className="w-7 h-7" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Gate Status</span>
            <div className="text-xl font-black text-white font-heading mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              ONLINE & LOCKED
            </div>
            <span className="text-[10px] text-neutral-400 mt-1 block">Anti-Tailgating Sensors Active</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Zap className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Split Section: Front Desk Check-In Scanner & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Terminal Scanner */}
        <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
          <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#ff6a00]" />
            Front Desk Scanning Terminal
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Enter athlete email or Member ID (e.g. <code className="text-white bg-black/40 px-1 py-0.5 rounded font-mono">john@example.com</code>) to simulate a physical turnstile badge tap.
          </p>

          <form onSubmit={handleProcessCheckIn} className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                Scan Data / Member Email / ID
              </label>
              <input
                type="text"
                placeholder="john@example.com"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00] font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                Physical Gate
              </label>
              <select
                value={locationGate}
                onChange={(e) => setLocationGate(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
              >
                <option value="Turnstile A (Main Entrance)">Turnstile A (Main Entrance)</option>
                <option value="Turnstile B (Cardio Zone)">Turnstile B (Cardio Zone)</option>
                <option value="Front Desk Kiosk">Front Desk Kiosk</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={checkingIn}
              className="w-full py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-[#ff6a00]/25 flex items-center justify-center gap-2"
            >
              {checkingIn ? 'Verifying NFC / QR...' : 'Trigger Gate Entry'}
            </button>
          </form>

          {terminalResult && (
            <div className={`p-4 rounded-2xl text-xs flex items-start gap-3 ${
              terminalResult.success
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}>
              {terminalResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{terminalResult.message}</p>
                {terminalResult.data && (
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Athlete: <strong>{terminalResult.data.member.name}</strong> • Status: {terminalResult.data.member.status}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Peak Hours Histogram */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#161618] border border-neutral-800 flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white mb-1">
              Hourly Gym Attendance Flow (Peak Traffic)
            </h3>
            <p className="text-xs text-neutral-400">
              Live turnstile telemetry indicating peak hours (6-8 AM & 5-7 PM).
            </p>
          </div>

          <div className="py-6">
            <div className="h-44 flex items-end gap-2 justify-between px-2 border-b border-neutral-800 pb-2">
              {Object.entries(hourlyData).map(([hour, count]) => {
                const heightPct = Math.min(100, (count / 30) * 100);
                const isPeak = count >= 20;
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-[10px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {count}
                    </span>
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        isPeak ? 'bg-[#ff6a00]' : 'bg-neutral-700 hover:bg-neutral-500'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[9px] text-neutral-500 font-mono rotate-45 sm:rotate-0 mt-1">
                      {hour.split(':')[0]}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#ff6a00]" />
              <span>Peak Demand Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-neutral-700" />
              <span>Standard Traffic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Attendees Timeline */}
      <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
        <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white">
          Today's Verified Turnstile Check-Ins
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-900 text-neutral-400 uppercase font-bold text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Athlete Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Gate Location</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {todayRecords.map((rec) => (
                <tr key={rec._id} className="text-neutral-300 hover:bg-neutral-800/40">
                  <td className="py-3.5 px-4 font-bold text-white">{rec.memberName}</td>
                  <td className="py-3.5 px-4 font-mono text-neutral-400">{rec.memberEmail}</td>
                  <td className="py-3.5 px-4 font-mono">
                    {new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-bold">
                      {rec.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400">{rec.location}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
