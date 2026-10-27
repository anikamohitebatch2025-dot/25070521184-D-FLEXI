import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Award, Search, Filter, Trash2, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, X 
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminAppointments: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments', {
        params: { status: statusFilter, search },
      });
      if (res.data?.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, search]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await api.put(`/appointments/${id}`, { status: newStatus });
      if (res.data?.success) {
        success(`Appointment marked as ${newStatus}.`);
        fetchAppointments();
        if (selectedAppt && selectedAppt._id === id) {
          setSelectedAppt({ ...selectedAppt, status: newStatus });
        }
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update appointment.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel and delete this appointment? The time slot will immediately become available again for booking.')) {
      return;
    }
    try {
      const res = await api.delete(`/appointments/${id}`);
      if (res.data?.success) {
        success('Appointment cancelled and slot freed.');
        if (selectedAppt?._id === id) setSelectedAppt(null);
        fetchAppointments();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete appointment.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-1">
            <Calendar className="w-4 h-4" />
            Scheduling Operations
          </div>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-white">
            Appointment Management
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            View member bookings, update session statuses, and audit slot occupancy from MongoDB.
          </p>
        </div>

        <button
          onClick={fetchAppointments}
          className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 hover:text-white border border-neutral-700 flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Bookings</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#121214] border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by member, email, coach, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Status:</span>
          {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? 'bg-[#ff6a00] text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

      </div>

      {/* Appointments Table */}
      <div className="rounded-2xl bg-[#121214] border border-neutral-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Member Athlete</th>
                <th className="py-4 px-4">Service</th>
                <th className="py-4 px-4">Coach / Trainer</th>
                <th className="py-4 px-4">Date & Slot</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Update Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    Loading appointments from MongoDB...
                  </td>
                </tr>
              )}

              {!loading && appointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    No appointments found matching this criteria.
                  </td>
                </tr>
              )}

              {!loading && appointments.map((appt) => (
                <tr key={appt._id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-white text-sm">{appt.memberName}</div>
                    <div className="text-neutral-400 text-[11px]">{appt.memberEmail}</div>
                    {appt.memberPhone && (
                      <div className="text-neutral-500 text-[10px]">{appt.memberPhone}</div>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-semibold text-white max-w-xs">{appt.service}</div>
                    <div className="text-[10px] text-neutral-400">{appt.duration} Mins</div>
                  </td>

                  <td className="py-4 px-4">
                    <span className="font-medium text-[#ff6a00]">
                      {appt.trainerName || 'Any Coach'}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-white font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#ff6a00]" />
                      <span>{appt.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{appt.timeSlot}</span>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                      appt.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : appt.status === 'completed'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : appt.status === 'cancelled'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {appt.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={appt.status}
                        disabled={updatingId === appt._id}
                        onChange={(e) => handleUpdateStatus(appt._id, e.target.value)}
                        className="p-1 rounded bg-neutral-900 border border-neutral-700 text-white text-[11px] font-bold uppercase focus:outline-none focus:border-[#ff6a00]"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        onClick={() => handleDelete(appt._id)}
                        title="Delete / Cancel & Free Slot"
                        className="p-1.5 rounded bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
