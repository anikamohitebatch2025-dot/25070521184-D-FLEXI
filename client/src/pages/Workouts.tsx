import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Flame, HeartPulse, Activity, Target, UserCheck, 
  Clock, Calendar, Users, Filter, CheckCircle2 
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Workouts: React.FC = () => {
  const { user } = useAuth();
  const { info } = useToast();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<string>('All');

  const workoutPrograms = [
    {
      title: 'Strength Training',
      icon: <Dumbbell className="w-6 h-6 text-[#ff6a00]" />,
      intensity: 'High / Heavy',
      description: 'Focus on compound power movements (Squat, Bench, Deadlift, Overhead Press) to systematically develop maximal force output and tendon density.',
      benefits: ['Maximal motor unit recruitment', 'Enhanced bone mineral density', 'Neurological strength gains'],
    },
    {
      title: 'Weight Training',
      icon: <Activity className="w-6 h-6 text-[#ff6a00]" />,
      intensity: 'Moderate to High',
      description: 'Structured resistance training employing barbells, dumbbells, and cable isolation to develop balanced muscular tension and athletic posture.',
      benefits: ['Metabolic rate elevation', 'Targeted muscle group balance', 'Joint stabilization'],
    },
    {
      title: 'Muscle Building',
      icon: <Target className="w-6 h-6 text-[#ff6a00]" />,
      intensity: 'Hypertrophic',
      description: 'Hypertrophy-focused volume training incorporating mechanical tension, metabolic stress, and muscle damage within optimal rep ranges.',
      benefits: ['Lean muscle mass accretion', 'Aesthetic muscular symmetry', 'Improved glycogen storage'],
    },
    {
      title: 'Cardio',
      icon: <HeartPulse className="w-6 h-6 text-[#ff6a00]" />,
      intensity: 'Aerobic / Zone 2-5',
      description: 'Progressive cardiovascular intervals, Concept2 rowers, assault bikes, and sled conditioning to optimize mitochondrial density and VO2 max.',
      benefits: ['Lower resting heart rate', 'Enhanced stamina & recovery', 'Cardiovascular longevity'],
    },
    {
      title: 'Weight Loss',
      icon: <Flame className="w-6 h-6 text-[#ff6a00]" />,
      intensity: 'High Metabolic Rate',
      description: 'High-intensity interval training (HIIT) combined with full-body resistance circuits to maximize caloric expenditure during and after sessions.',
      benefits: ['Accelerated EPOC calorie burn', 'Fat oxidation enhancement', 'Preserved muscle mass'],
    },
    {
      title: 'Personal Training',
      icon: <UserCheck className="w-6 h-6 text-[#ff6a00]" />,
      intensity: 'Tailored / Bespoke',
      description: 'Dedicated 1-on-1 coaching customized for your individual biomechanics, injury history, posture, and progressive athletic milestones.',
      benefits: ['Biomechanical form audits', 'Customized periodized splits', 'Uncompromising accountability'],
    },
  ];

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await api.get('/schedules', {
          params: { workoutType: selectedType },
        });
        if (res.data?.success) {
          setSchedules(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load schedules:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [selectedType]);

  const handleBook = (session: any) => {
    info(`You are enrolled for ${session.title}! Please arrive 10 minutes before ${session.startTime}.`);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-3">
            <Activity className="w-4 h-4 fill-[#ff6a00]" />
            Signature Training Protocols
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-black uppercase tracking-tight text-white">
            Workout Programs & Timetable
          </h1>
          <p className="text-neutral-400 mt-4 text-base leading-relaxed">
            Engineered disciplines designed to target every athletic objective—from raw maximal power to metabolic conditioning and functional longevity.
          </p>
        </div>

        {/* 6 Specialized Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {workoutPrograms.map((prog, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-[#121214] border border-neutral-800 hover:border-[#ff6a00]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    {prog.icon}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff6a00] bg-[#ff6a00]/10 px-2.5 py-1 rounded">
                    {prog.intensity}
                  </span>
                </div>

                <h3 className="font-heading text-2xl font-black uppercase text-white mb-2">
                  {prog.title}
                </h3>
                <p className="text-neutral-400 text-xs leading-relaxed mb-6">
                  {prog.description}
                </p>

                <div className="space-y-2 pt-4 border-t border-neutral-800/80">
                  {prog.benefits.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2 text-xs text-neutral-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#ff6a00] shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Schedules & Class Timetable */}
        <div className="rounded-2xl bg-[#121214] border border-neutral-800 p-8 sm:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-neutral-800">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-1">
                Live Timetable
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-black uppercase text-white">
                Upcoming Workout Sessions
              </h2>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {['All', 'Strength Training', 'Weight Loss', 'Muscle Building', 'Cardio', 'Personal Training'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    selectedType === type
                      ? 'bg-[#ff6a00] text-white shadow-md shadow-[#ff6a00]/25'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule List */}
          <div className="mt-8 space-y-4">
            {loading && (
              <div className="py-12 text-center text-neutral-500">
                Loading workout timetable...
              </div>
            )}

            {!loading && schedules.length === 0 && (
              <div className="py-12 text-center text-neutral-500">
                No scheduled sessions found for this category. Check back soon or contact staff.
              </div>
            )}

            {!loading && schedules.map((item) => (
              <div
                key={item._id}
                className="p-5 sm:p-6 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start sm:items-center gap-4">
                  {item.trainer?.photoUrl && (
                    <img
                      src={item.trainer.photoUrl}
                      alt={item.trainer.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-700"
                    />
                  )}
                  <div>
                    <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#ff6a00]/15 text-[#ff6a00] mb-1.5">
                      {item.workoutType}
                    </div>
                    <h4 className="font-heading text-xl sm:text-2xl font-bold uppercase text-white">
                      {item.title}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                      {item.description}
                    </p>
                    <div className="text-xs text-neutral-400 mt-2 flex items-center gap-2">
                      <span className="text-neutral-500">Coach:</span>
                      <span className="text-white font-medium">{item.trainer?.name || 'Assigned Master Coach'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-800 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                      <Calendar className="w-3.5 h-3.5 text-[#ff6a00]" />
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                      <Clock className="w-3.5 h-3.5 text-[#ff6a00]" />
                      <span>{item.startTime} ({item.duration} mins)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBook(item)}
                    className="px-5 py-2.5 rounded-lg bg-[#ff6a00] hover:bg-[#e65c00] text-white text-xs font-black uppercase tracking-wider shadow-md transition-colors"
                  >
                    Reserve Spot
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
