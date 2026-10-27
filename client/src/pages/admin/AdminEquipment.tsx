import React, { useState, useEffect } from 'react';
import { 
  Wrench, AlertTriangle, CheckCircle2, Plus, Search, 
  Trash2, Edit3, X, RefreshCw, Calendar, ShieldAlert 
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminEquipment: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Strength Machine',
    brand: '',
    serialNumber: '',
    location: 'Zone 1 - Main Floor',
    condition: 'Good',
    lastServicedDate: new Date().toISOString().split('T')[0],
    nextServiceDueDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    technicianNotes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await api.get('/equipment');
      if (res.data?.success) {
        setEquipment(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Strength Machine',
      brand: '',
      serialNumber: `ELK-${Math.floor(1000 + Math.random() * 9000)}`,
      location: 'Zone 1 - Main Floor',
      condition: 'Good',
      lastServicedDate: new Date().toISOString().split('T')[0],
      nextServiceDueDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      technicianNotes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      brand: item.brand,
      serialNumber: item.serialNumber,
      location: item.location,
      condition: item.condition,
      lastServicedDate: item.lastServicedDate,
      nextServiceDueDate: item.nextServiceDueDate,
      technicianNotes: item.technicianNotes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        const res = await api.put(`/equipment/${editingItem._id}`, formData);
        if (res.data?.success) {
          success('Equipment specifications updated!');
          setEquipment(prev => prev.map(e => e._id === editingItem._id ? res.data.data : e));
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/equipment', formData);
        if (res.data?.success) {
          success('Equipment added to facility inventory!');
          setEquipment(prev => [res.data.data, ...prev]);
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from equipment registry?`)) return;
    try {
      const res = await api.delete(`/equipment/${id}`);
      if (res.data?.success) {
        success('Equipment item deleted.');
        setEquipment(prev => prev.filter(e => e._id !== id));
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const filtered = equipment.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.serialNumber.toLowerCase().includes(search.toLowerCase());
    const matchesCond = !conditionFilter || e.condition === conditionFilter;
    return matchesSearch && matchesCond;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#ff6a00]" />
            Gym Equipment & Preventive Maintenance
          </h2>
          <p className="text-xs text-neutral-400">
            Track condition status, service intervals, and safety certifications for all machines.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#ff6a00]/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Machine / Rig
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#161618] border border-neutral-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by machine name or serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6a00]"
          />
        </div>

        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
        >
          <option value="">All Conditions</option>
          <option value="Excellent">Excellent</option>
          <option value="Good">Good</option>
          <option value="Needs Maintenance">Needs Maintenance</option>
          <option value="Out of Order">Out of Order</option>
        </select>
      </div>

      {/* Equipment Table */}
      <div className="rounded-3xl bg-[#161618] border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-900 text-neutral-400 uppercase font-bold text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Equipment & Brand</th>
                <th className="py-3 px-4">Category & Location</th>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Next Service Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((item) => (
                <tr key={item._id} className="text-neutral-300 hover:bg-neutral-800/40">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{item.name}</div>
                    <div className="text-[10px] text-neutral-500">{item.brand}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-white">{item.category}</span>
                    <span className="block text-[10px] text-neutral-400">{item.location}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-400">
                    {item.serialNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.condition === 'Excellent'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : item.condition === 'Good'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : item.condition === 'Needs Maintenance'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    {item.nextServiceDueDate}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                        title="Edit Machine"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.name)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400"
                        title="Delete Equipment"
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#161618] border border-neutral-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-heading text-xl font-black uppercase tracking-wider text-white">
                {editingItem ? 'Edit Equipment' : 'Add New Gym Machine'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Equipment Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Eleiko Olympic Power Rack #2"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                  >
                    <option value="Cardio">Cardio</option>
                    <option value="Strength Machine">Strength Machine</option>
                    <option value="Free Weights">Free Weights</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Functional">Functional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Needs Maintenance">Needs Maintenance</option>
                    <option value="Out of Order">Out of Order</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Brand / Maker</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Eleiko"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Floor Zone</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Next Service Due</label>
                  <input
                    type="date"
                    value={formData.nextServiceDueDate}
                    onChange={(e) => setFormData({ ...formData, nextServiceDueDate: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Technician Notes</label>
                <textarea
                  rows={2}
                  value={formData.technicianNotes}
                  onChange={(e) => setFormData({ ...formData, technicianNotes: e.target.value })}
                  placeholder="e.g. Cables lubricated and verified"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white font-bold uppercase transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
