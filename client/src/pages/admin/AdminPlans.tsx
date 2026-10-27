import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Plus, Edit2, Trash2, CheckCircle2, XCircle, 
  AlertCircle, X, Check, Sparkles, ShieldAlert 
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminPlans: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 49,
    duration: 30,
    description: '',
    benefits: '',
    workoutAccess: 'All open gym hours',
    trainerSupport: 'General floor coaches available',
    isActive: true,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plans?all=true');
      if (res.data?.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const benefitsArray = formData.benefits
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean);

      const res = await api.post('/plans', {
        ...formData,
        benefits: benefitsArray,
      });

      if (res.data?.success) {
        success('Plan created successfully in MongoDB!');
        setShowAddModal(false);
        resetForm();
        fetchPlans();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const benefitsArray = formData.benefits
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean);

      const res = await api.put(`/plans/${selectedPlan._id}`, {
        ...formData,
        benefits: benefitsArray,
      });

      if (res.data?.success) {
        success('Plan updated.');
        setShowEditModal(false);
        setSelectedPlan(null);
        fetchPlans();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/plans/${selectedPlan._id}`);
      if (res.data?.success) {
        if (res.data.data?.action === 'deactivated') {
          info(res.data.message || 'Plan is in use by members, safely deactivated.');
        } else {
          success(res.data.message || 'Plan removed.');
        }
        setShowDeleteModal(false);
        setSelectedPlan(null);
        fetchPlans();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 49,
      duration: 30,
      description: '',
      benefits: '',
      workoutAccess: 'All open gym hours',
      trainerSupport: 'General floor coaches available',
      isActive: true,
    });
  };

  const openEdit = (plan: any) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      description: plan.description || '',
      benefits: Array.isArray(plan.benefits) ? plan.benefits.join('\n') : '',
      workoutAccess: plan.workoutAccess || '',
      trainerSupport: plan.trainerSupport || '',
      isActive: plan.isActive,
    });
    setShowEditModal(true);
  };

  const openDelete = (plan: any) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-white">
            Membership Plans Management
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Create, update tiers, manage pricing, and safely deactivate referenced plans.
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
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Plans List Table */}
      <div className="rounded-2xl bg-[#121214] border border-neutral-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Plan Name</th>
                <th className="py-4 px-4">Price</th>
                <th className="py-4 px-4">Duration</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6">Included Benefits</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    Loading membership plans...
                  </td>
                </tr>
              )}

              {!loading && plans.map((plan) => (
                <tr key={plan._id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-white text-sm">{plan.name}</div>
                    <div className="text-[11px] text-neutral-400 max-w-xs truncate mt-0.5">
                      {plan.description}
                    </div>
                  </td>

                  <td className="py-4 px-4 font-mono font-bold text-white text-sm">
                    ${plan.price}
                  </td>

                  <td className="py-4 px-4 font-medium text-neutral-300">
                    {plan.duration} Days
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                      plan.isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="py-4 px-6 max-w-sm">
                    <div className="space-y-1">
                      {plan.benefits?.slice(0, 2).map((b: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-neutral-300 truncate">
                          <CheckCircle2 className="w-3 h-3 text-[#ff6a00] shrink-0" />
                          <span className="truncate">{b}</span>
                        </div>
                      ))}
                      {plan.benefits?.length > 2 && (
                        <span className="text-[10px] text-neutral-500">
                          +{plan.benefits.length - 2} more benefits
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(plan)}
                        className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                        title="Edit Plan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openDelete(plan)}
                        className="p-1.5 rounded bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400"
                        title="Delete / Deactivate Plan"
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

      {/* Modal: Add Plan */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#121214] border border-neutral-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-black uppercase text-white">Create Membership Plan</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Semi-Annual VIP"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Duration (Days) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Initial Status</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Inactive (Draft)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Short tagline explaining who this plan is best suited for"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">
                  Benefits (One per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="24/7 Floor Access&#10;Complimentary Hydrotherapy&#10;1-on-1 Fitness Assessment"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Workout Access</label>
                  <input
                    type="text"
                    value={formData.workoutAccess}
                    onChange={(e) => setFormData({ ...formData, workoutAccess: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Trainer Support</label>
                  <input
                    type="text"
                    value={formData.trainerSupport}
                    onChange={(e) => setFormData({ ...formData, trainerSupport: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-bold uppercase tracking-wider"
                >
                  {submitting ? 'Saving...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Plan */}
      {showEditModal && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#121214] border border-neutral-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-black uppercase text-white">Edit Plan</h3>
              <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditPlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1">Active Status</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                  >
                    <option value="true">Active (Live in catalog)</option>
                    <option value="false">Inactive (Archived)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">
                  Benefits (One per line)
                </label>
                <textarea
                  rows={4}
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-bold uppercase tracking-wider"
                >
                  {submitting ? 'Updating...' : 'Save Plan Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Safe Delete / Deactivation */}
      {showDeleteModal && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121214] border border-amber-500/30 p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-xs tracking-wider mb-2">
              <ShieldAlert className="w-4 h-4" />
              Referential Integrity Check
            </div>
            <h3 className="font-heading text-2xl font-black uppercase text-white mb-2">
              Remove / Deactivate Plan?
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              Per requirements, if <strong className="text-white">{selectedPlan.name}</strong> is referenced by existing member subscriptions, the system will safely <strong>deactivate</strong> it so active memberships remain intact.
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
                onClick={handleDeletePlan}
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
