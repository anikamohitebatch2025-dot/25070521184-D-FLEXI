import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, Edit2, Trash2, Dumbbell, User, 
  X, Check, AlertCircle, Users 
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminSchedules: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    workoutType: 'Strength Training',
    trainerId: '',
    date: todayStr,
    startTime: '08:00',
    duration: 60,
    description: '',
    maxCapacity: 15,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  const workoutTypes = [
    'Strength Training',
    'Weight Training',
    'Muscle Building',
    'Cardio',
    'Weight Loss',
    'Personal Training',
  ];

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/trainers'),
      ]);
      if (sRes.data?.success) setSchedules(sRes.data.data);
      if (tRes.data?.success) {
        setTrainers(tRes.data.data);
        if (tRes.data.data.length > 0 && !formData.trainerId) {
          setFormData((prev) => ({ ...prev, trainerId: tRes.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/schedules', formData);
      if (res.data?.success) {
        success('Workout session created.');
        setShowAddModal(false);
        fetchSchedules();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/schedules/${selectedSchedule._id}`, formData);
      if (res.data?.success) {
        success('Schedule updated.');
        setShowEditModal(false);
        setSelectedSchedule(null);
        fetchSchedules();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSchedule) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/schedules/${selectedSchedule._id}`);
      if (res.data?.success) {
        success('Schedule deleted.');
        setShowDeleteModal(false);
        setSelectedSchedule(null);
        fetchSchedules();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (schedule: any) => {
    setSelectedSchedule(schedule);
    setFormData({
      title: schedule.title,
      workoutType: schedule.workoutType,
      trainerId: schedule.trainerId,
      date: schedule.date,
      startTime: schedule.startTime,
      duration: schedule.duration,
      description: schedule.description || '',
      maxCapacity: schedule.maxCapacity || 15,
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-white">
            Workout Schedules & Sessions
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Program daily lifting blocks, conditioning classes, and assign coaches.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              workoutType: 'Strength Training',
              trainerId: trainers[0]?._id || '',
              date: todayStr,
              startTime: '08:00',
              duration: 60,
              description: '',
              maxCapacity: 15,
            });
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#ff6a00]/25"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Session</span>
        </button>
      </div>

      {/* Schedules Table */}
      <div className="rounded-2xl bg-[#121214] border border-neutral-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Session Details</th>
                <th className="py-4 px-4">Workout Type</th>
                <th className="py-4 px-4">Assigned Coach</th>
                <th className="py-4 px-4">Date & Time</th>
                <th className="py-4 px-4">Duration</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    Loading workout schedules...
                  </td>
                </tr>
              )}

              {!loading && schedules.map((item) => (
                <tr key={item._id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-white text-sm">{item.title}</div>
                    <div className="text-[11px] text-neutral-400 max-w-sm truncate mt-0.5">
                      {item.description}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded bg-[#ff6a00]/10 text-[#ff6a00] text-[10px] font-bold uppercase">
                      {item.workoutType}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {item.trainer?.photoUrl && (
                        <img
                          src={item.trainer.photoUrl}
                          alt={item.trainer.name}
                          className="w-7 h-7 rounded-lg object-cover border border-neutral-700"
                        />
                      )}
                      <span className="font-semibold text-white">{item.trainer?.name || 'Assigned Coach'}</span>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="text-white font-medium">{item.date}</div>
                    <div className="text-neutral-400 text-[11px]">{item.startTime}</div>
                  </td>

                  <td className="py-4 px-4 font-mono text-neutral-300">
                    {item.duration} mins
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                        title="Edit Session"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSchedule(item);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 rounded bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400"
                        title="Delete Session"
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

      {/* Modal: Add Session */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#121214] border border-neutral-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-black uppercase text-white">Schedule New Session</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barbell Squat & Deadlift Clinic"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Workout Type *</label>
                  <select
                    value={formData.workoutType}
                    onChange={(e) => setFormData({ ...formData, workoutType: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  >
                    {workoutTypes.map((wt) => (
                      <option key={wt} value={wt}>{wt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Assigned Coach *</label>
                  <select
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  >
                    {trainers.map((t) => (
                      <option key={t._id} value={t._id}>{t.name} ({t.specialization})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    min={15}
                    step={5}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Session Overview</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Workout objectives, equipment used, safety protocols..."
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-bold uppercase tracking-wider"
                >
                  {submitting ? 'Scheduling...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Session */}
      {showEditModal && selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#121214] border border-neutral-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-black uppercase text-white">Edit Schedule</h3>
              <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Workout Type</label>
                  <select
                    value={formData.workoutType}
                    onChange={(e) => setFormData({ ...formData, workoutType: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  >
                    {workoutTypes.map((wt) => (
                      <option key={wt} value={wt}>{wt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Assigned Coach</label>
                  <select
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  >
                    {trainers.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Duration</label>
                  <input
                    type="number"
                    min={15}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-bold uppercase tracking-wider"
                >
                  {submitting ? 'Updating...' : 'Update Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteModal && selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121214] border border-rose-500/30 p-6 shadow-2xl">
            <h3 className="font-heading text-2xl font-black uppercase text-white mb-2">
              Delete Schedule?
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              Delete <strong className="text-white">{selectedSchedule.title}</strong> on {selectedSchedule.date} at {selectedSchedule.startTime}?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white uppercase tracking-wider"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
