import React, { useState, useEffect } from 'react';
import { 
  Award, Plus, Edit2, Trash2, Mail, Phone, CheckCircle2, 
  X, AlertCircle, ShieldAlert 
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminTrainers: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    specialization: '',
    experience: '',
    bio: '',
    email: '',
    phone: '',
    isActive: true,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trainers?all=true');
      if (res.data?.success) {
        setTrainers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load trainers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/trainers', formData);
      if (res.data?.success) {
        success('Trainer added to MongoDB.');
        setShowAddModal(false);
        resetForm();
        fetchTrainers();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to add trainer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/trainers/${selectedTrainer._id}`, formData);
      if (res.data?.success) {
        success('Trainer profile updated.');
        setShowEditModal(false);
        setSelectedTrainer(null);
        fetchTrainers();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update trainer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrainer = async () => {
    if (!selectedTrainer) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/trainers/${selectedTrainer._id}`);
      if (res.data?.success) {
        if (res.data.data?.action === 'deactivated') {
          info(res.data.message || 'Trainer has scheduled workouts and was marked inactive.');
        } else {
          success(res.data.message || 'Trainer removed.');
        }
        setShowDeleteModal(false);
        setSelectedTrainer(null);
        fetchTrainers();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete trainer.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      specialization: '',
      experience: '',
      bio: '',
      email: '',
      phone: '',
      isActive: true,
    });
  };

  const openEdit = (trainer: any) => {
    setSelectedTrainer(trainer);
    setFormData({
      name: trainer.name,
      photoUrl: trainer.photoUrl,
      specialization: trainer.specialization,
      experience: trainer.experience,
      bio: trainer.bio || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      isActive: trainer.isActive,
    });
    setShowEditModal(true);
  };

  const openDelete = (trainer: any) => {
    setSelectedTrainer(trainer);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-white">
            Trainers & Coaching Staff
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage trainer profiles, specializations, credentials, and active statuses.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#ff6a00]/25"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Trainer</span>
        </button>
      </div>

      {/* Trainers Table */}
      <div className="rounded-2xl bg-[#121214] border border-neutral-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Coach Name</th>
                <th className="py-4 px-4">Specialization</th>
                <th className="py-4 px-4">Experience</th>
                <th className="py-4 px-4">Contact Info</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    Loading trainers from database...
                  </td>
                </tr>
              )}

              {!loading && trainers.map((t) => (
                <tr key={t._id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={t.photoUrl}
                        alt={t.name}
                        className="w-10 h-10 rounded-xl object-cover border border-neutral-700"
                      />
                      <div>
                        <div className="font-bold text-white text-sm">{t.name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">ID: {t._id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span className="font-medium text-white">{t.specialization}</span>
                  </td>

                  <td className="py-4 px-4 font-semibold text-[#ff6a00]">
                    {t.experience}
                  </td>

                  <td className="py-4 px-4 text-neutral-300">
                    <div>{t.email || '—'}</div>
                    <div className="text-neutral-500 text-[11px]">{t.phone || '—'}</div>
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                      t.isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                        title="Edit Trainer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openDelete(t)}
                        className="p-1.5 rounded bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400"
                        title="Delete / Deactivate Trainer"
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

      {/* Modal: Add Trainer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#121214] border border-neutral-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-black uppercase text-white">Add Trainer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrainer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Experience *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7+ Years"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Specialization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Strength Training, HIIT Conditioning"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Photo URL (Unsplash)</label>
                <input
                  type="url"
                  required
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Short Biography</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Coaching credentials, background and accomplishments..."
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-bold uppercase tracking-wider"
                >
                  {submitting ? 'Saving...' : 'Add Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Trainer */}
      {showEditModal && selectedTrainer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#121214] border border-neutral-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-black uppercase text-white">Edit Trainer</h3>
              <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditTrainer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Experience</label>
                  <input
                    type="text"
                    required
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Specialization</label>
                <input
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Photo URL</label>
                <input
                  type="url"
                  required
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Active Status</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Short Biography</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-bold uppercase tracking-wider"
                >
                  {submitting ? 'Saving...' : 'Update Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Safe Delete / Deactivation */}
      {showDeleteModal && selectedTrainer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121214] border border-amber-500/30 p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-xs tracking-wider mb-2">
              <ShieldAlert className="w-4 h-4" />
              Schedule Reference Check
            </div>
            <h3 className="font-heading text-2xl font-black uppercase text-white mb-2">
              Remove Trainer?
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              If coach <strong className="text-white">{selectedTrainer.name}</strong> is currently assigned to upcoming workout sessions, the system will safely mark them <strong>inactive</strong> to preserve member schedule integrity.
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
                onClick={handleDeleteTrainer}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white uppercase tracking-wider"
              >
                {submitting ? 'Processing...' : 'Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
