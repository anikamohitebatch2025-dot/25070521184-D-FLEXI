import React, { useState, useEffect } from 'react';
import { 
  Package, AlertTriangle, Plus, Search, Trash2, 
  Edit3, X, RefreshCw, ShoppingBag, ArrowUpRight 
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminInventory: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Supplements',
    sku: '',
    price: 39.99,
    costPrice: 24.00,
    stockQuantity: 20,
    minThreshold: 8,
    unit: 'Tub',
    description: '',
    imageUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      if (res.data?.success) {
        setInventory(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Supplements',
      sku: `FLX-${Math.floor(1000 + Math.random() * 9000)}`,
      price: 39.99,
      costPrice: 24.00,
      stockQuantity: 20,
      minThreshold: 8,
      unit: 'Tub',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku,
      price: item.price,
      costPrice: item.costPrice || Number(item.price) * 0.6,
      stockQuantity: item.stockQuantity,
      minThreshold: item.minThreshold,
      unit: item.unit,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
    });
    setModalOpen(true);
  };

  const handleQuickRestock = async (item: any, addCount: number) => {
    const updatedCount = item.stockQuantity + addCount;
    try {
      const res = await api.put(`/inventory/${item._id}`, { stockQuantity: updatedCount });
      if (res.data?.success) {
        success(`Restocked ${item.name} (+${addCount})!`);
        setInventory(prev => prev.map(i => i._id === item._id ? { ...i, stockQuantity: updatedCount } : i));
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update stock.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        const res = await api.put(`/inventory/${editingItem._id}`, formData);
        if (res.data?.success) {
          success('Product updated!');
          setInventory(prev => prev.map(i => i._id === editingItem._id ? res.data.data : i));
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/inventory', formData);
        if (res.data?.success) {
          success('Product added to Pro Shop catalog!');
          setInventory(prev => [res.data.data, ...prev]);
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
    if (!window.confirm(`Delete product "${name}" from store?`)) return;
    try {
      const res = await api.delete(`/inventory/${id}`);
      if (res.data?.success) {
        success('Product deleted.');
        setInventory(prev => prev.filter(i => i._id !== id));
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const filtered = inventory.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !categoryFilter || i.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-[#ff6a00]" />
            Gym Inventory & Pro Shop Management
          </h2>
          <p className="text-xs text-neutral-400">
            Supplements, lifting gear, apparel, and beverage stock tracking with automated low-inventory alerts.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#ff6a00]/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Store Item
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#161618] border border-neutral-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search merchandise by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6a00]"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
        >
          <option value="">All Categories</option>
          <option value="Supplements">Supplements</option>
          <option value="Accessories">Accessories</option>
          <option value="Apparel">Apparel</option>
          <option value="Beverages">Beverages</option>
        </select>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isLowStock = item.stockQuantity <= item.minThreshold;
          return (
            <div
              key={item._id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                isLowStock ? 'bg-rose-500/5 border-rose-500/30' : 'bg-[#161618] border-neutral-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-bold uppercase">
                    {item.category}
                  </span>
                  {isLowStock ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase flex items-center gap-1 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" /> Low Stock
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
                      In Stock
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-white text-sm line-clamp-2">{item.name}</h4>
                <p className="text-[11px] text-neutral-500 font-mono mt-0.5">SKU: {item.sku}</p>

                {/* Stock Bar */}
                <div className="mt-4 p-3 rounded-2xl bg-neutral-900 border border-neutral-800/80 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Stock Available:</span>
                    <span className={`font-mono font-bold ${isLowStock ? 'text-rose-400' : 'text-white'}`}>
                      {item.stockQuantity} {item.unit}s
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isLowStock ? 'bg-rose-500' : 'bg-[#ff6a00]'}`}
                      style={{ width: `${Math.min(100, (item.stockQuantity / (item.minThreshold * 3)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">Retail Price</span>
                    <span className="font-heading text-lg font-black text-white">${item.price.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">Min Threshold</span>
                    <span className="font-mono text-neutral-400">{item.minThreshold}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleQuickRestock(item, 5)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-white transition-colors"
                    title="Quick add 5 items"
                  >
                    +5 Restock
                  </button>
                  <button
                    onClick={() => handleQuickRestock(item, 10)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-white transition-colors"
                    title="Quick add 10 items"
                  >
                    +10
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id, item.name)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#161618] border border-neutral-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-heading text-xl font-black uppercase tracking-wider text-white">
                {editingItem ? 'Edit Product' : 'Add Pro Shop Item'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Product Title</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Optimum Nutrition Gold Standard Whey 5lb"
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
                    <option value="Supplements">Supplements</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Alert Threshold</label>
                  <input
                    type="number"
                    value={formData.minThreshold}
                    onChange={(e) => setFormData({ ...formData, minThreshold: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
