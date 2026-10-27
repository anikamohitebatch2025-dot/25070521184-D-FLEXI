import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Users, Calendar, Star, Award, CheckCircle, 
  Clock, Plus, X, Search, ChevronRight, MessageSquare, Phone, Mail
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const TrainerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [trainerOverview, setTrainerOverview] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [searchClient, setSearchClient] = useState('');

  // Assign Workout Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [routineTitle, setRoutineTitle] = useState('Upper Body Hypertrophy Split');
  const [dayOfWeek, setDayOfWeek] = useState('Tuesday');
  const [category, setCategory] = useState<'Strength' | 'Hypertrophy' | 'Cardio' | 'Mobility' | 'Fat Loss'>('Hypertrophy');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [exercisesText, setExercisesText] = useState('Incline DB Press (4x10), Chest-Supported T-Bar Row (4x10), Overhead Cable Extensions (3x12), Hammer Curls (3x12)');
  const [assigning, setAssigning] = useState(false);

  const fetchTrainerData = async () => {
    try {
      setLoading(true);
      const [overviewRes, clientsRes] = await Promise.all([
        api.get('/trainer/overview'),
        api.get('/trainer/clients'),
      ]);

      if (overviewRes.data?.success) {
        setTrainerOverview(overviewRes.data.data);
      }
      if (clientsRes.data?.success) {
        setClients(clientsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load trainer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainerData();
  }, []);

  const handleOpenAssignModal = (client: any) => {
    setSelectedClient(client);
    setAssignModalOpen(true);
  };

  const handleAssignWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    // Parse exercises
    const lines = exercisesText.split(',').map(s => s.trim()).filter(Boolean);
    const exercises = lines.map((line, idx) => ({
      id: `ex-${Date.now()}-${idx}`,
      name: line,
      targetSets: 4,
      targetReps: '10-12',
      restSeconds: 90,
    }));

    setAssigning(true);
    try {
      const res = await api.post('/workouts/assign', {
        userId: selectedClient._id,
        title: routineTitle,
        dayOfWeek,
        category,
        difficulty,
        exercises,
        notes: `Assigned directly by Head Coach ${user?.name}. Focus on controlled eccentric tempo.`,
      });

      if (res.data?.success) {
        success(`Workout routine successfully assigned to ${selectedClient.name}!`);
        setAssignModalOpen(false);
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to assign workout.');
    } finally {
      setAssigning(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.email.toLowerCase().includes(searchClient.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Coach Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#161618] to-[#121214] border border-neutral-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#ff6a00] flex items-center justify-center text-white font-bold shadow-xl shadow-[#ff6a00]/30">
              <Dumbbell className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-wider uppercase text-white">
                  Coach Portal: {user?.name}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-[#ff6a00]/10 text-[#ff6a00] text-xs font-bold border border-[#ff6a00]/30 uppercase">
                  Certified Master Coach
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                FLEXI Athletic Club • Strength Biomechanics & Client Roster Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-400">
              Trainer ID: {user?.trainerId || 'TRN-MV-01'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#161618] border border-neutral-800">
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Active Athletes</span>
            <div className="text-3xl font-black text-white mt-1 font-heading">
              {trainerOverview?.totalClients || clients.length}
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">Assigned 1-on-1 Members</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#161618] border border-neutral-800">
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Sessions Today</span>
            <div className="text-3xl font-black text-[#ff6a00] mt-1 font-heading">
              {trainerOverview?.todaySessionsCount || 2}
            </div>
            <span className="text-[10px] text-neutral-400 mt-1 block">Scheduled on Floor</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#161618] border border-neutral-800">
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Average Rating</span>
            <div className="text-3xl font-black text-white mt-1 font-heading flex items-center gap-1.5">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              {trainerOverview?.avgRating || 4.9}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">Based on {trainerOverview?.totalReviews || 48} Reviews</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#161618] border border-neutral-800">
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Hourly Rate</span>
            <div className="text-3xl font-black text-white mt-1 font-heading">
              ${trainerOverview?.trainer?.hourlyRate || 65} <span className="text-xs text-neutral-400 font-sans">/ hr</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">Club Tier: Senior Master Coach</span>
          </div>
        </div>

        {/* Client Roster Table */}
        <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <h3 className="font-heading text-xl font-black tracking-wider uppercase text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#ff6a00]" />
                Assigned Athlete Roster
              </h3>
              <p className="text-xs text-neutral-400">
                Monitor client progression, bodyweight metrics, and push new workout assignments.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search athlete by name..."
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6a00]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-900 text-neutral-400 uppercase font-bold text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Membership Plan</th>
                  <th className="py-3 px-4">Bodyweight</th>
                  <th className="py-3 px-4">BMI</th>
                  <th className="py-3 px-4">Active Routine</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredClients.map((client) => (
                  <tr key={client._id} className="text-neutral-300 hover:bg-neutral-800/40">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{client.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{client.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white">{client.planName}</span>
                      <span className={`block text-[10px] font-bold uppercase ${
                        client.membershipStatus === 'Active' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {client.membershipStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {client.latestWeightKg} kg
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#ff6a00]">
                      {client.latestBmi}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300 max-w-xs truncate">
                      {client.activeWorkoutTitle}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenAssignModal(client)}
                        className="px-3 py-1.5 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-bold uppercase transition-colors"
                      >
                        + Assign Workout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member Feedback Section */}
        <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
          <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Athlete Reviews & Coaching Feedback
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(trainerOverview?.reviews || []).map((rev: any) => (
              <div key={rev._id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{rev.memberName}</span>
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-neutral-300 italic leading-relaxed">
                  "{rev.comment}"
                </p>
                <span className="text-[10px] text-neutral-500 font-mono block">
                  Logged on {rev.date}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ASSIGN WORKOUT MODAL */}
      {assignModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#161618] border border-neutral-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-heading text-xl font-black tracking-wider uppercase text-white">
                  Assign Routine to {selectedClient.name}
                </h3>
                <p className="text-xs text-neutral-400">Custom routine will immediately appear in their Member Dashboard.</p>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignWorkout} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Routine Title</label>
                <input
                  type="text"
                  value={routineTitle}
                  onChange={(e) => setRoutineTitle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Scheduled Day</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                  >
                    {['Hypertrophy', 'Strength', 'Cardio', 'Mobility', 'Fat Loss'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                  Exercises List (comma-separated names)
                </label>
                <textarea
                  rows={3}
                  value={exercisesText}
                  onChange={(e) => setExercisesText(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white font-bold uppercase transition-colors"
                >
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
