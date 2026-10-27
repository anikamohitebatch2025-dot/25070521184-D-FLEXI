import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, Terminal, CheckCircle2, Copy, 
  ExternalLink, Layers, FileJson, Table, ShieldCheck 
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const AdminCompass: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  const [summary, setSummary] = useState<any | null>(null);
  const [activeCollection, setActiveCollection] = useState<string>('users');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [docsLoading, setDocsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [resetting, setResetting] = useState<boolean>(false);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/compass/summary');
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load Compass summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionDocs = async (col: string) => {
    setDocsLoading(true);
    try {
      const res = await api.get(`/compass/collection/${col}`);
      if (res.data?.success) {
        setDocuments(res.data.data);
      }
    } catch (err) {
      console.error(`Failed to load ${col}:`, err);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchCollectionDocs(activeCollection);
  }, [activeCollection]);

  const handleCopyUri = () => {
    navigator.clipboard.writeText('mongodb://127.0.0.1:27017/gym_management');
    success('MongoDB URI copied to clipboard!');
  };

  const handleResetSeed = async () => {
    if (!confirm('Reset database to initial seed data? All custom additions will be reverted to demo seeds.')) {
      return;
    }
    setResetting(true);
    try {
      const res = await api.post('/compass/reset');
      if (res.data?.success) {
        success('Database successfully reset to pristine seeds.');
        await fetchSummary();
        await fetchCollectionDocs(activeCollection);
      }
    } catch (err: any) {
      toastError('Failed to reset database.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
            <Database className="w-4 h-4" />
            MongoDB Compass Explorer
          </div>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-white">
            Local Database Collections Inspector
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time visual replica and document browser for MongoDB Compass database: <strong className="text-white">gym_management</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetSeed}
            disabled={resetting}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 hover:text-white border border-neutral-700 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Seeds</span>
          </button>

          <Link
            to="/admin/powershell"
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>PowerShell Setup</span>
          </Link>
        </div>
      </div>

      {/* Connection Info Banner */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Compass Connection String:</div>
            <div className="font-mono text-sm text-emerald-400 font-bold flex items-center gap-2 mt-0.5">
              <span>mongodb://127.0.0.1:27017/gym_management</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyUri}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 flex items-center gap-1.5 border border-neutral-700"
          >
            <Copy className="w-3.5 h-3.5 text-[#ff6a00]" />
            <span>Copy URI</span>
          </button>
        </div>
      </div>

      {/* Collections Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {summary?.collections?.map((col: any) => (
          <button
            key={col.name}
            onClick={() => setActiveCollection(col.name)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeCollection.toLowerCase() === col.name.toLowerCase()
                ? 'bg-[#ff6a00] text-white shadow-lg shadow-[#ff6a00]/25'
                : 'bg-[#121214] text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{col.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeCollection.toLowerCase() === col.name.toLowerCase()
                ? 'bg-black/30 text-white font-mono'
                : 'bg-neutral-800 text-neutral-300 font-mono'
            }`}>
              {col.count}
            </span>
          </button>
        ))}
      </div>

      {/* View Mode Toggle and Schema Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-neutral-400">
          Showing documents for collection: <strong className="text-white font-mono">{activeCollection}</strong> ({documents.length} records)
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 ${
              viewMode === 'table' ? 'bg-[#ff6a00] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 ${
              viewMode === 'json' ? 'bg-[#ff6a00] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON BSON</span>
          </button>
        </div>
      </div>

      {/* Documents Viewer */}
      <div className="rounded-2xl bg-[#121214] border border-neutral-800 overflow-hidden shadow-2xl">
        {docsLoading ? (
          <div className="py-16 text-center text-xs text-neutral-500">
            Querying MongoDB documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-500">
            No documents in this collection.
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">_id (ObjectId)</th>
                  {Object.keys(documents[0] || {})
                    .filter((k) => k !== '_id')
                    .map((key) => (
                      <th key={key} className="py-3 px-4 whitespace-nowrap">{key}</th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                {documents.map((doc, idx) => (
                  <tr key={doc._id || idx} className="hover:bg-neutral-900/60">
                    <td className="py-3 px-4 text-[#ff6a00] font-bold whitespace-nowrap">
                      {doc._id}
                    </td>
                    {Object.keys(documents[0] || {})
                      .filter((k) => k !== '_id')
                      .map((key) => {
                        const val = doc[key];
                        const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? 'null');
                        return (
                          <td key={key} className="py-3 px-4 text-neutral-300 max-w-xs truncate">
                            {displayVal}
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 max-h-[550px] overflow-y-auto font-mono text-xs text-emerald-400 bg-neutral-950/80 leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(documents, null, 2)}
          </div>
        )}
      </div>

    </div>
  );
};
