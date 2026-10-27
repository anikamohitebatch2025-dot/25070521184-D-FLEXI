import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, Clock, User, Award, CheckCircle2, XCircle, 
  Sparkles, ArrowRight, ShieldCheck, Dumbbell, Activity, 
  HeartPulse, Zap, AlertCircle, FileText, Check 
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card3D } from '../components/Card3D';

export const BookAppointment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const services = [
    {
      id: '1-on-1 Personal Training Session',
      title: '1-on-1 Personal Training Session',
      duration: 60,
      icon: <Dumbbell className="w-5 h-5 text-[#ff6a00]" />,
      desc: 'Dedicated private lifting session tailored to your periodized training block and form execution.',
      badge: 'Most Popular',
    },
    {
      id: 'Biomechanics & Form Assessment',
      title: 'Biomechanics & Form Assessment',
      duration: 45,
      icon: <Activity className="w-5 h-5 text-blue-400" />,
      desc: 'Video motion capture and joint angle audit of your squat, bench, and deadlift mechanics.',
      badge: 'Injury Prevention',
    },
    {
      id: 'Nutrition & Macro Periodization Consult',
      title: 'Nutrition & Macro Periodization Consult',
      duration: 45,
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      desc: 'Targeted caloric calculation, carbohydrate cycling, and nutrient timing for athletic body composition.',
      badge: 'Dietary Protocol',
    },
    {
      id: 'InBody 570 Composition Analysis & Scan',
      title: 'InBody 570 Composition Analysis & Scan',
      duration: 30,
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      desc: 'Clinical segmental lean mass, visceral fat level, and intracellular water balance scan.',
      badge: 'Diagnostic Scan',
    },
    {
      id: 'Contrast Hydrotherapy (Sauna + Cold Plunge)',
      title: 'Contrast Hydrotherapy (Sauna + Cold Plunge)',
      duration: 45,
      icon: <HeartPulse className="w-5 h-5 text-cyan-400" />,
      desc: 'Supervised 3-round contrast cycle: 180°F infrared sauna and 45°F cryo cold plunge.',
      badge: 'Rapid Recovery',
    },
    {
      id: 'Functional Mobility & Injury Rehab',
      title: 'Functional Mobility & Injury Rehab',
      duration: 60,
      icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
      desc: 'Active release therapy, joint distraction, and corrective motor recruitment exercises.',
      badge: 'Mobility Rehab',
    },
  ];

  // Trainers list from API
  const [trainers, setTrainers] = useState<any[]>([]);

  // Selection states
  const [selectedService, setSelectedService] = useState<string>(services[0].id);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  
  // Date selection: generate next 14 days
  const generateDates = () => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      list.push({ iso, dayName, dayNumber, monthName, isToday: i === 0 });
    }
    return list;
  };

  const datesList = generateDates();
  const [selectedDate, setSelectedDate] = useState<string>(datesList[0].iso);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  // Live Slots Availability
  const [slotsData, setSlotsData] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(true);

  // Form Details
  const [memberName, setMemberName] = useState<string>(user?.name || '');
  const [memberEmail, setMemberEmail] = useState<string>(user?.email || '');
  const [memberPhone, setMemberPhone] = useState<string>(user?.phone || '');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Pre-fill user data if auth changes
  useEffect(() => {
    if (user) {
      if (!memberName) setMemberName(user.name);
      if (!memberEmail) setMemberEmail(user.email);
      if (!memberPhone && user.phone) setMemberPhone(user.phone);
    }
  }, [user]);

  // Fetch trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await api.get('/trainers');
        if (res.data?.success) {
          setTrainers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load trainers:', err);
      }
    };
    fetchTrainers();
  }, []);

  // Fetch Live Slot Availability whenever Date or Trainer changes
  useEffect(() => {
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.get('/appointments/available-slots', {
          params: {
            date: selectedDate,
            trainerId: selectedTrainerId || undefined,
          },
        });
        if (res.data?.success) {
          setSlotsData(res.data.data.slots);
          // If previously selected slot is now booked, reset selected slot
          const currentSlot = res.data.data.slots.find((s: any) => s.time === selectedSlot);
          if (currentSlot && !currentSlot.isAvailable) {
            setSelectedSlot('');
          }
        }
      } catch (err) {
        console.error('Failed to fetch available slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedTrainerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      toastError('Please choose an available time slot.');
      return;
    }

    if (!memberName.trim() || !memberEmail.trim()) {
      toastError('Please enter your name and email.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedTrainerObj = trainers.find((t) => t._id === selectedTrainerId);
      const serviceObj = services.find((s) => s.id === selectedService);

      const payload = {
        memberName,
        memberEmail,
        memberPhone,
        service: selectedService,
        trainerId: selectedTrainerId || undefined,
        trainerName: selectedTrainerObj?.name || 'Any Available Coach',
        date: selectedDate,
        timeSlot: selectedSlot,
        duration: serviceObj?.duration || 60,
        notes,
      };

      const res = await api.post('/appointments', payload);
      if (res.data?.success) {
        success(res.data.message || 'Appointment confirmed!');
        setConfirmedBooking(res.data.data);
        // Refresh slots to show newly booked slot as disabled
        const refreshed = await api.get('/appointments/available-slots', {
          params: { date: selectedDate, trainerId: selectedTrainerId || undefined },
        });
        if (refreshed.data?.success) {
          setSlotsData(refreshed.data.data.slots);
        }
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setConfirmedBooking(null);
    setSelectedSlot('');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-3">
            <Calendar className="w-4 h-4 fill-[#ff6a00]" />
            Live Scheduling & Appointments
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-black uppercase tracking-tight text-white">
            Book Your Session
          </h1>
          <p className="text-neutral-400 mt-4 text-base leading-relaxed">
            Reserve dedicated 1-on-1 personal coaching, biomechanics assessments, or contrast recovery. Live slot availability is synchronized with our MongoDB database.
          </p>
        </div>

        {confirmedBooking ? (
          /* Confirmation Success Slip */
          <div className="max-w-xl mx-auto">
            <Card3D glowColor="rgba(16, 185, 129, 0.4)">
              <div className="p-8 sm:p-10 rounded-2xl bg-[#121214] border-2 border-emerald-500/60 shadow-2xl space-y-6">
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-400">
                      Booking Confirmed • MongoDB Persisted
                    </span>
                    <h2 className="font-heading text-3xl font-black uppercase text-white">
                      You're Scheduled!
                    </h2>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Reference ID:</span>
                    <span className="font-mono text-emerald-400 font-bold">{confirmedBooking._id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Service:</span>
                    <span className="font-bold text-white text-right">{confirmedBooking.service}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Coach:</span>
                    <span className="font-bold text-[#ff6a00]">{confirmedBooking.trainerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Date & Time:</span>
                    <span className="font-bold text-white">
                      {confirmedBooking.date} at {confirmedBooking.timeSlot}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Attendee:</span>
                    <span className="font-medium text-neutral-200">
                      {confirmedBooking.memberName} ({confirmedBooking.memberEmail})
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={resetForm}
                    className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Book Another Session
                  </button>
                  <Link
                    to="/dashboard"
                    className="flex-1 py-3 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5"
                  >
                    <span>View in Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            </Card3D>
          </div>
        ) : (
          /* Multi-step Interactive Booking Form */
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Step 1: Select Service */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#ff6a00] text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h2 className="font-heading text-2xl font-black uppercase text-white tracking-wide">
                  Select Training or Recovery Service
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((srv) => {
                  const isSelected = selectedService === srv.id;
                  return (
                    <Card3D key={srv.id} glowColor={isSelected ? 'rgba(255, 106, 0, 0.4)' : 'rgba(0, 0, 0, 0.3)'}>
                      <div
                        onClick={() => setSelectedService(srv.id)}
                        className={`p-5 rounded-2xl cursor-pointer transition-all h-full flex flex-col justify-between border ${
                          isSelected
                            ? 'bg-neutral-900 border-[#ff6a00] shadow-lg shadow-[#ff6a00]/20'
                            : 'bg-[#121214] border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-neutral-800/80 flex items-center justify-center">
                              {srv.icon}
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#ff6a00]/10 text-[#ff6a00]">
                              {srv.duration} Mins
                            </span>
                          </div>

                          <h3 className="font-heading text-lg font-bold uppercase text-white mb-1">
                            {srv.title}
                          </h3>
                          <p className="text-neutral-400 text-xs leading-relaxed">
                            {srv.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-neutral-500">
                            {srv.badge}
                          </span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isSelected ? 'bg-[#ff6a00] border-[#ff6a00] text-white' : 'border-neutral-700'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    </Card3D>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Master Coach */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#ff6a00] text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="font-heading text-2xl font-black uppercase text-white tracking-wide">
                  Select Coach / Trainer
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Any Available Option */}
                <button
                  type="button"
                  onClick={() => setSelectedTrainerId('')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    selectedTrainerId === ''
                      ? 'bg-neutral-900 border-[#ff6a00] shadow-md shadow-[#ff6a00]/20'
                      : 'bg-[#121214] border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#ff6a00]/15 flex items-center justify-center text-[#ff6a00] mb-3">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-heading text-base font-black uppercase text-white">Any Coach</div>
                    <div className="text-[11px] text-neutral-400">First available trainer</div>
                  </div>
                </button>

                {trainers.map((t) => {
                  const isSelected = selectedTrainerId === t._id;
                  return (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => setSelectedTrainerId(t._id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-neutral-900 border-[#ff6a00] shadow-md shadow-[#ff6a00]/20'
                          : 'bg-[#121214] border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <img
                        src={t.photoUrl}
                        alt={t.name}
                        className="w-11 h-11 rounded-lg object-cover border border-neutral-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-heading text-sm font-black uppercase text-white truncate">
                          {t.name}
                        </div>
                        <div className="text-[10px] text-[#ff6a00] font-medium truncate">
                          {t.specialization}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Select Date */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#ff6a00] text-white text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <h2 className="font-heading text-2xl font-black uppercase text-white tracking-wide">
                    Select Appointment Date
                  </h2>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  Selected: {selectedDate}
                </span>
              </div>

              {/* Horizontal Date Slider */}
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {datesList.map((d) => {
                  const isSelected = selectedDate === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setSelectedDate(d.iso)}
                      className={`px-4 py-3 rounded-xl flex flex-col items-center min-w-[76px] transition-all border shrink-0 ${
                        isSelected
                          ? 'bg-[#ff6a00] border-[#ff6a00] text-white shadow-lg shadow-[#ff6a00]/30 scale-105'
                          : 'bg-[#121214] border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {d.dayName}
                      </span>
                      <span className="font-heading text-2xl font-black my-0.5">
                        {d.dayNumber}
                      </span>
                      <span className="text-[10px] uppercase font-semibold">
                        {d.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Live Slot Availability */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#ff6a00] text-white text-xs font-black flex items-center justify-center">
                    4
                  </span>
                  <h2 className="font-heading text-2xl font-black uppercase text-white tracking-wide">
                    Live Slot Availability
                  </h2>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-neutral-300">Live Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-neutral-500">Booked (Disabled)</span>
                  </div>
                </div>
              </div>

              {loadingSlots ? (
                <div className="py-8 text-center text-xs text-neutral-500 animate-pulse">
                  Querying live slot availability from MongoDB...
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {slotsData.map((slot) => {
                    const isSelected = selectedSlot === slot.time;
                    const isAvailable = slot.isAvailable;

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                          !isAvailable
                            ? 'bg-neutral-950/80 border-neutral-900 text-neutral-600 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-[#ff6a00] border-[#ff6a00] text-white shadow-lg shadow-[#ff6a00]/30 scale-105'
                            : 'bg-[#121214] border-neutral-800 text-neutral-200 hover:border-[#ff6a00]/60 hover:bg-neutral-900 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-heading text-lg font-black tracking-wide">
                          <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : isAvailable ? 'text-[#ff6a00]' : 'text-neutral-600'}`} />
                          <span>{slot.time}</span>
                        </div>

                        <div className="mt-1">
                          {isAvailable ? (
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              isSelected ? 'text-white' : 'text-emerald-400'
                            }`}>
                              Available
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Booked
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 5: Member Info & Submission */}
            <div className="p-8 rounded-2xl bg-[#121214] border border-neutral-800 shadow-xl space-y-6">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#ff6a00] text-white text-xs font-black flex items-center justify-center">
                  5
                </span>
                <h2 className="font-heading text-2xl font-black uppercase text-white tracking-wide">
                  Confirm Member Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="e.g. John Miller"
                    className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="e.g. john@example.com"
                    className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-300 mb-1.5 text-xs">
                  Workout Objectives & Special Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Preparing for a powerlifting meet; recovering from left hamstring strain..."
                  className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff6a00]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  className="w-full py-4 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-black uppercase text-sm tracking-wider shadow-xl shadow-[#ff6a00]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {submitting
                      ? 'Saving to MongoDB...'
                      : selectedSlot
                      ? `Confirm Booking for ${selectedSlot} (${selectedDate})`
                      : 'Please Select An Available Time Slot Above'}
                  </span>
                </button>
              </div>

            </div>

          </form>
        )}

      </div>
    </div>
  );
};
