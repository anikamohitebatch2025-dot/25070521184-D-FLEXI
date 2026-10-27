import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Edit2, Trash2, Shield, Calendar, 
  CreditCard, CheckCircle2, AlertCircle, X, Check, ArrowUpDown 
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminMembers: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showAssignPlanModal, setShowAssignPlanModal] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    planId: '',
  });

  const [assignPlanId, setAssignPlanId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/members', {
        params: { search, status: statusFilter, page, limit: 10 },
      });
      if (res.data?.success) {
        setMembers(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans?all=true');
      if (res.data?.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [search, statusFilter, page]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/members', formData);
      if (res.data?.success) {
        success('Member added successfully!');
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '', phone: '', planId: '' });
        fetchMembers();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/members/${selectedMember._id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || undefined,
      });
      if (res.data?.success) {
        success('Member profile updated.');
        setShowEditModal(false);
        setSelectedMember(null);
        fetchMembers();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/members/${selectedMember._id}`);
      if (res.data?.success) {
        success(res.data.message || 'Member deleted.');
        setShowDeleteModal(false);
        setSelectedMember(null);
        fetchMembers();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !assignPlanId) return;
    setSubmitting(true);
    try {
      const res = await api.post('/memberships', {
        userId: selectedMember._id,
        planId: assignPlanId,
        paymentMethod: 'Admin Assigned / Front Desk',
      });
      if (res.data?.success) {
        success('Plan assigned successfully!');
        setShowAssignPlanModal(false);
        setSelectedMember(null);
        setAssignPlanId('');
        fetchMembers();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to assign plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (member: any) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      password: '',
      planId: '',
    });
    setShowEditModal(true);
  };

  const openAssign = (member: any) => {
    setSelectedMember(member);
    setAssignPlanId(plans[0]?._id || '');
    setShowAssignPlanModal(true);
  };

  const openDelete = (member: any) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-white">
            Member Management
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Search, edit, assign membership plans, and audit athlete statuses.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ name: '', email: '', password: '', phone: '', planId: '' });
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#ff6a00]/25"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-[#121214] border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Status:</span>
          {['all', 'active', 'expired', 'no plan'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
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

      {/* Members Table */}
      <div className="rounded-2xl bg-[#121214] border border-neutral-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Athlete / Member</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4">Current Plan</th>
                <th className="py-4 px-4">Membership Status</th>
                <th className="py-4 px-4">Expiry Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    Querying members from MongoDB...
                  </td>
                </tr>
              )}

              {!loading && members.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    No members match the query or filter criteria.
                  </td>
                </tr>
              )}

              {!loading && members.map((m) => (
                <tr key={m._id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-[#ff6a00]">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{m.name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">ID: {m._id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="text-white">{m.email}</div>
                    <div className="text-neutral-400 text-[11px]">{m.phone || '—'}</div>
                  </td>

                  <td className="py-4 px-4">
                    <span className="font-semibold text-white">
                      {m.planName || 'None'}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                      m.computedStatus === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : m.computedStatus === 'Expired'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        m.computedStatus === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                      }`} />
                      {m.computedStatus}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-neutral-300">
                    {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : '—'}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openAssign(m)}
                        title="Assign / Renew Plan"
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[#ff6a00] text-[11px] font-bold uppercase transition-colors"
                      >
                        Plan
                      </button>
                      <button
                        onClick={() => openEdit(m)}
                        title="Edit Member"
                        className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openDelete(m)}
                        title="Delete Member"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded bg-neutral-900 border border-neutral-800 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded bg-neutral-900 border border-neutral-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121214] border border-neutral-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-black uppercase text-white">Add New Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
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
                <label className="block font-bold uppercase text-neutral-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Initial Plan (Optional)</label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                >
                  <option value="">No Plan (Assign Later)</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (${p.price} - {p.duration} days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-bold uppercase tracking-wider"
                >
                  {submitting ? 'Creating...' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Member */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121214] border border-neutral-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-black uppercase text-white">Edit Member Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditMember} className="space-y-4 text-xs">
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
                <label className="block font-bold uppercase text-neutral-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
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

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">
                  Reset Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="New password (optional)"
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-bold uppercase tracking-wider"
                >
                  {submitting ? 'Saving...' : 'Update Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Plan */}
      {showAssignPlanModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121214] border border-neutral-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-black uppercase text-white">Assign Plan</h3>
              <button onClick={() => setShowAssignPlanModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              Assign or extend a membership plan for <strong className="text-white">{selectedMember.name}</strong>.
            </p>

            <form onSubmit={handleAssignPlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1">Select Plan *</label>
                <select
                  required
                  value={assignPlanId}
                  onChange={(e) => setAssignPlanId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-[#ff6a00]"
                >
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — ${p.price} ({p.duration} days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-bold uppercase tracking-wider"
                >
                  {submitting ? 'Assigning...' : 'Confirm Plan Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121214] border border-rose-500/30 p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase text-xs tracking-wider mb-2">
              <AlertCircle className="w-4 h-4" />
              Confirmation Required
            </div>
            <h3 className="font-heading text-2xl font-black uppercase text-white mb-2">
              Delete Member Record?
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-white">{selectedMember.name}</strong>? This will permanently delete their account and remove all associated membership documents from MongoDB.
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
                onClick={handleDeleteMember}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white uppercase tracking-wider shadow-lg shadow-rose-600/30"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
