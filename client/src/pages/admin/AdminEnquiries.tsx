import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Search, Filter, Trash2, CheckCircle2, 
  Clock, AlertCircle, Phone, Mail, User, X 
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const AdminEnquiries: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/enquiries', {
        params: { search, status: statusFilter },
      });
      if (res.data?.success) {
        setEnquiries(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [search, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.put(`/enquiries/${id}`, { status: newStatus });
      if (res.data?.success) {
        success(`Status updated to ${newStatus}.`);
        fetchEnquiries();
        if (selectedEnquiry && selectedEnquiry._id === id) {
          setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
        }
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/enquiries/${id}`);
      if (res.data?.success) {
        success('Enquiry removed.');
        if (selectedEnquiry?._id === id) setSelectedEnquiry(null);
        fetchEnquiries();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete enquiry.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-white">
            Public Enquiries & Leads
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Review incoming inquiries, update CRM statuses (`pending`, `contacted`, `resolved`), and follow up.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#121214] border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, email, subject, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Filter:</span>
          {['all', 'pending', 'contacted', 'resolved'].map((st) => (
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

      {/* Enquiries Grid / List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Table / List (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#121214] border border-neutral-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
            <span>Inquiries ({enquiries.length})</span>
            <span className="text-[11px] text-neutral-500">Click to view details</span>
          </div>

          <div className="divide-y divide-neutral-800/80 max-h-[600px] overflow-y-auto">
            {loading && (
              <div className="py-12 text-center text-xs text-neutral-500">Loading inquiries...</div>
            )}

            {!loading && enquiries.length === 0 && (
              <div className="py-12 text-center text-xs text-neutral-500">No inquiries found.</div>
            )}

            {!loading && enquiries.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedEnquiry(item)}
                className={`p-4 transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                  selectedEnquiry?._id === item._id ? 'bg-neutral-800/80 border-l-4 border-[#ff6a00]' : 'hover:bg-neutral-900/60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-sm truncate">{item.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : item.status === 'contacted'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-300 font-medium truncate">{item.subject}</div>
                  <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{item.message}</p>
                </div>

                <div className="text-right text-[10px] text-neutral-500 shrink-0">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail View (5 cols) */}
        <div className="lg:col-span-5">
          {selectedEnquiry ? (
            <div className="p-6 rounded-2xl bg-[#121214] border border-neutral-800 shadow-xl space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
                <div>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase inline-block mb-2 ${
                    selectedEnquiry.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-400'
                      : selectedEnquiry.status === 'contacted'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    Status: {selectedEnquiry.status}
                  </span>
                  <h3 className="font-heading text-2xl font-black uppercase text-white">
                    {selectedEnquiry.subject}
                  </h3>
                  <div className="text-xs text-neutral-400 mt-1">
                    Received on {new Date(selectedEnquiry.createdAt).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(selectedEnquiry._id)}
                  title="Delete Inquiry"
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sender info */}
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-white font-bold">
                  <User className="w-4 h-4 text-[#ff6a00]" />
                  <span>{selectedEnquiry.name}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-300">
                  <Mail className="w-4 h-4 text-neutral-500" />
                  <a href={`mailto:${selectedEnquiry.email}`} className="hover:underline">
                    {selectedEnquiry.email}
                  </a>
                </div>
                {selectedEnquiry.phone && (
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Phone className="w-4 h-4 text-neutral-500" />
                    <span>{selectedEnquiry.phone}</span>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  Full Inquiry Message:
                </span>
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  {selectedEnquiry.message}
                </div>
              </div>

              {/* Status Updater */}
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  Update Lead Status:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {['pending', 'contacted', 'resolved'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedEnquiry._id, st)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        selectedEnquiry.status === st
                          ? 'bg-[#ff6a00] text-white shadow-md'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#121214] border border-neutral-800 text-center text-neutral-500 text-xs">
              Select an inquiry from the list to view complete communication details and update lead status.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
