import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, ShieldCheck, Calendar, Clock, CreditCard, 
  Dumbbell, Phone, Mail, Edit3, Save, X, Sparkles, CheckCircle2, AlertTriangle, ArrowRight,
  CalendarCheck, Trash2, QrCode, TrendingUp, Flame, Trophy, Award, Utensils, 
  Droplet, Plus, Play, Pause, RotateCcw, Check, FileText, ShoppingBag, Gift, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { QRPassModal } from '../components/QRPassModal';
import { ReceiptModal, PaymentReceiptData } from '../components/ReceiptModal';
import { FitnessAIChatbot } from '../components/FitnessAIChatbot';

type ActiveTab = 'overview' | 'progress' | 'workouts' | 'nutrition' | 'goals' | 'challenges' | 'billing';

export const MemberDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  // Core Data
  const [activeMembership, setActiveMembership] = useState<any | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);

  // Modals & Cart
  const { addItem, setIsCartOpen, itemCount } = useCart();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceiptData | null>(null);

  // Upgrade Plan State
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<any | null>(null);
  const [upgradeDiffUser, setUpgradeDiffUser] = useState(false);
  const [upgradeDiffEmail, setUpgradeDiffEmail] = useState('');
  const [upgradeApplyTargets, setUpgradeApplyTargets] = useState(true);
  const [upgradeTargetPreset, setUpgradeTargetPreset] = useState<'hypertrophy' | 'cut' | 'maintain'>('hypertrophy');
  const [upgradePaymentMethod, setUpgradePaymentMethod] = useState('Credit Card');
  const [upgrading, setUpgrading] = useState(false);

  // Edit Profile
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Fitness Progress Data
  const [progressHistory, setProgressHistory] = useState<any[]>([]);
  const [logWeight, setLogWeight] = useState('');
  const [logHeight, setLogHeight] = useState('180');
  const [logWaist, setLogWaist] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [loggingProgress, setLoggingProgress] = useState(false);

  // Workout Plans Data
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([]);
  const [activePlanIdx, setActivePlanIdx] = useState(0);

  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerRemaining, setTimerRemaining] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Nutrition Data
  const [dietPlan, setDietPlan] = useState<any | null>(null);
  const [waterAddAmount, setWaterAddAmount] = useState(250);

  // Goals Data
  const [goals, setGoals] = useState<any[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalUnit, setNewGoalUnit] = useState('kg');

  // Challenges & Leaderboard
  const [challenges, setChallenges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Payments
  const [payments, setPayments] = useState<any[]>([]);
  const [payingPending, setPayingPending] = useState(false);

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining(prev => prev - 1);
      }, 1000);
    } else if (timerRemaining === 0 && timerRunning) {
      setTimerRunning(false);
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch {}
      success('Rest interval complete! Time for the next set.');
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerRemaining]);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        memRes, apptRes, trainRes, progRes, wpRes, dietRes, goalRes, chalRes, payRes, plansRes
      ] = await Promise.all([
        api.get('/memberships/my'),
        api.get('/appointments/my'),
        api.get('/trainers'),
        api.get('/progress/history'),
        api.get('/workouts/my'),
        api.get('/nutrition/my'),
        api.get('/goals'),
        api.get('/challenges'),
        api.get('/payments/my'),
        api.get('/plans'),
      ]);

      if (memRes.data?.success) {
        setMemberships(memRes.data.data.allMemberships || []);
        setActiveMembership(memRes.data.data.activeMembership || null);
      }
      if (apptRes.data?.success) setAppointments(apptRes.data.data || []);
      if (trainRes.data?.success) setTrainers(trainRes.data.data || []);
      if (progRes.data?.success) setProgressHistory(progRes.data.data || []);
      if (wpRes.data?.success) setWorkoutPlans(wpRes.data.data || []);
      if (dietRes.data?.success) setDietPlan(dietRes.data.data || null);
      if (goalRes.data?.success) setGoals(goalRes.data.data || []);
      if (chalRes.data?.success) {
        setChallenges(chalRes.data.data.challenges || []);
        setLeaderboard(chalRes.data.data.leaderboard || []);
      }
      if (payRes.data?.success) setPayments(payRes.data.data || []);
      if (plansRes.data?.success) setAvailablePlans(plansRes.data.data || []);
    } catch (err) {
      console.error('Error loading member dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApplyTarget = async (presetKey: 'hypertrophy' | 'cut' | 'maintain') => {
    const presets = {
      hypertrophy: { targetCalories: 2850, targetProteinG: 195, targetCarbsG: 320, targetFatsG: 75, waterTargetMl: 3800, name: 'Lean Hypertrophy' },
      cut: { targetCalories: 2150, targetProteinG: 210, targetCarbsG: 190, targetFatsG: 55, waterTargetMl: 4000, name: 'Metabolic Shred' },
      maintain: { targetCalories: 2500, targetProteinG: 180, targetCarbsG: 260, targetFatsG: 68, waterTargetMl: 3500, name: 'Athletic Conditioning' },
    };
    const chosen = presets[presetKey];
    try {
      const res = await api.put('/nutrition/targets', chosen);
      if (res.data?.success) {
        confetti({ particleCount: 70, spread: 60 });
        success(`🎯 Applied ${chosen.name} Target: ${chosen.targetCalories} kcal & ${chosen.targetProteinG}g Protein!`);
        setDietPlan(res.data.data);
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Could not update targets.');
    }
  };

  const handleExecuteUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpgradePlan) return;
    setUpgrading(true);

    const presets = {
      hypertrophy: { targetCalories: 2850, targetProteinG: 195, targetCarbsG: 320, targetFatsG: 75, waterTargetMl: 3800 },
      cut: { targetCalories: 2150, targetProteinG: 210, targetCarbsG: 190, targetFatsG: 55, waterTargetMl: 4000 },
      maintain: { targetCalories: 2500, targetProteinG: 180, targetCarbsG: 260, targetFatsG: 68, waterTargetMl: 3500 },
    };

    try {
      const res = await api.post('/memberships/upgrade', {
        planId: selectedUpgradePlan._id,
        paymentMethod: upgradePaymentMethod,
        targetUserEmail: upgradeDiffUser ? upgradeDiffEmail.trim() : undefined,
        applyTargets: upgradeApplyTargets,
        targetGoals: presets[upgradeTargetPreset],
      });

      if (res.data?.success) {
        confetti({ particleCount: 90, spread: 65 });
        success(res.data.message || `Upgraded to ${selectedUpgradePlan.name}!`);
        await refreshUser();
        await loadAllData();
        setUpgradeModalOpen(false);
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Upgrade failed.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleAddUpgradeToCart = (plan: any) => {
    addItem({
      id: `upgrade-${plan._id}-${Date.now()}`,
      type: 'upgrade',
      title: `Plan Upgrade: ${plan.name}`,
      price: plan.price,
      planId: plan._id,
      durationDays: plan.duration,
      recipientEmail: upgradeDiffUser ? upgradeDiffEmail.trim() : undefined,
      applyTargets: upgradeApplyTargets,
    });
    setUpgradeModalOpen(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const res = await api.put(`/members/${user._id}`, {
        name: editName,
        phone: editPhone,
      });
      if (res.data?.success) {
        success('Profile details saved!');
        await refreshUser();
        setIsEditing(false);
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await api.delete(`/appointments/${apptId}`);
      if (res.data?.success) {
        success('Appointment cancelled successfully and slot freed.');
        setAppointments(prev => prev.filter(a => a._id !== apptId));
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to cancel appointment.');
    }
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logWeight || !logHeight) return;
    setLoggingProgress(true);
    try {
      const res = await api.post('/progress/log', {
        weightKg: Number(logWeight),
        heightCm: Number(logHeight),
        waistCm: logWaist ? Number(logWaist) : undefined,
        notes: logNotes,
      });
      if (res.data?.success) {
        success('Metrics logged successfully!');
        setProgressHistory(prev => [...prev, res.data.data]);
        setLogWeight('');
        setLogWaist('');
        setLogNotes('');
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to log metrics.');
    } finally {
      setLoggingProgress(false);
    }
  };

  const handleToggleExercise = async (planId: string, exerciseId: string) => {
    try {
      const res = await api.put(`/workouts/${planId}/exercise/${exerciseId}/toggle`);
      if (res.data?.success) {
        setWorkoutPlans(prev => prev.map(p => {
          if (p._id !== planId) return p;
          return {
            ...p,
            exercises: p.exercises.map((e: any) => e.id === exerciseId ? res.data.data : e),
          };
        }));
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update exercise.');
    }
  };

  const handleToggleMeal = async (mealId: string) => {
    try {
      const res = await api.post('/nutrition/meal', { mealId, toggle: true });
      if (res.data?.success) {
        setDietPlan(res.data.data);
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update meal.');
    }
  };

  const handleAddWater = async () => {
    try {
      const res = await api.post('/nutrition/water', { amountMl: waterAddAmount });
      if (res.data?.success) {
        setDietPlan((prev: any) => ({ ...prev, waterConsumedMl: res.data.waterConsumedMl }));
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update water.');
    }
  };

  const handleAchieveGoal = async (goalId: string, title: string) => {
    try {
      const res = await api.put(`/goals/${goalId}/achieve`);
      if (res.data?.success) {
        // Trigger celebration confetti explosion!
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff6a00', '#10b981', '#ffffff', '#ffd700'],
        });
        success(`Milestone achieved: "${title}"! Incredible effort.`);
        setGoals(prev => prev.map(g => g._id === goalId ? res.data.data : g));
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update goal.');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalTarget) return;
    try {
      const res = await api.post('/goals', {
        title: newGoalTitle,
        targetValue: Number(newGoalTarget),
        unit: newGoalUnit,
      });
      if (res.data?.success) {
        success('New target established!');
        setGoals(prev => [res.data.data, ...prev]);
        setNewGoalTitle('');
        setNewGoalTarget('');
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create goal.');
    }
  };

  const handleJoinChallenge = async (challengeId: string, title: string) => {
    try {
      const res = await api.post(`/challenges/${challengeId}/join`);
      if (res.data?.success) {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
        success(`Enrolled in "${title}" challenge!`);
        setChallenges(prev => prev.map(c => c._id === challengeId ? res.data.data : c));
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to join challenge.');
    }
  };

  const handlePayPending = async (paymentId: string) => {
    setPayingPending(true);
    try {
      const res = await api.post('/payments/pay-pending', { paymentId });
      if (res.data?.success) {
        confetti({ particleCount: 80, spread: 60 });
        success('Invoice paid and membership renewed!');
        setPayments(prev => prev.map(p => p._id === paymentId ? res.data.data : p));
        await loadAllData();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setPayingPending(false);
    }
  };

  const latestMetric = progressHistory[progressHistory.length - 1] || {
    weightKg: 82.0,
    bmi: 25.3,
  };

  const isExpired = activeMembership?.computedStatus === 'Expired';
  const daysRemaining = activeMembership ? Math.max(0, Math.ceil((new Date(activeMembership.endDate).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOP WELCOME HERO */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#161618] via-[#1a1a1d] to-[#121214] border border-neutral-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff6a00] to-[#d64e00] flex items-center justify-center text-white shadow-xl shadow-[#ff6a00]/30 font-bold">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-wider uppercase text-white">
                  Welcome Back, {user?.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isExpired
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isExpired ? 'Membership Expired' : 'Active Member'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 flex items-center gap-3">
                <span>Member ID: FLX-{user?._id.substring(0, 8).toUpperCase()}</span>
                <span>•</span>
                <span className="text-[#ff6a00] font-semibold">{activeMembership?.plan?.name || 'Quarterly Pro'}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setQrModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#ff6a00]/25 transition-all"
            >
              <QrCode className="w-4 h-4" />
              Digital QR Pass
            </button>
            <Link
              to="/book"
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-neutral-700 transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#ff6a00]" />
              Book Session
            </Link>
          </div>
        </div>

        {/* EXPIRATION ALERT BANNER */}
        {isExpired ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Membership Expired</h3>
                <p className="text-xs text-rose-300/90 mt-0.5">
                  Your gym floor & turnstile access is paused. Renew now with discount code <span className="font-mono font-bold text-white bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/40">FLEXI10</span> for 10% off!
                </p>
              </div>
            </div>
            <Link
              to="/plans"
              className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider transition-colors shrink-0"
            >
              Renew Membership
            </Link>
          </div>
        ) : daysRemaining <= 7 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <p className="text-xs">
                Your pass expires in <span className="font-bold text-white">{daysRemaining} days</span> ({new Date(activeMembership.endDate).toLocaleDateString()}). Renew early to preserve your workout streak.
              </p>
            </div>
            <Link
              to="/plans"
              className="px-4 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold uppercase"
            >
              Extend Pass
            </Link>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-neutral-800 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'overview', label: 'Overview', icon: <UserIcon className="w-4 h-4" /> },
            { id: 'progress', label: 'Fitness & BMI', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'workouts', label: 'Workout Planner', icon: <Dumbbell className="w-4 h-4" /> },
            { id: 'nutrition', label: 'Diet & Nutrition', icon: <Utensils className="w-4 h-4" /> },
            { id: 'goals', label: 'Goals & PRs', icon: <Trophy className="w-4 h-4" /> },
            { id: 'challenges', label: 'Challenges', icon: <Award className="w-4 h-4" /> },
            { id: 'billing', label: 'Billing & Invoices', icon: <CreditCard className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#ff6a00] text-[#ff6a00] bg-[#ff6a00]/5'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#161618] border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Current Weight</span>
                <div className="text-2xl font-black text-white mt-1 font-heading">
                  {latestMetric.weightKg} <span className="text-xs text-[#ff6a00] font-mono">KG</span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                  ↓ 2.5 kg past 30 days
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#161618] border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">BMI Ratio</span>
                <div className="text-2xl font-black text-white mt-1 font-heading">
                  {latestMetric.bmi} <span className="text-xs text-emerald-400 font-mono">OPTIMAL</span>
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">Normal Athletic Range</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#161618] border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Gym Streak</span>
                <div className="text-2xl font-black text-[#ff6a00] mt-1 font-heading flex items-center gap-1.5">
                  <Flame className="w-6 h-6 fill-[#ff6a00]" /> 28 <span className="text-xs text-white">DAYS</span>
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">Top 5% of Club Members</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#161618] border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Active Pass</span>
                <div className="text-2xl font-black text-white mt-1 font-heading truncate">
                  {activeMembership?.plan?.name?.split(' ')[0] || 'Quarterly'}
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  {isExpired ? 'Needs Renewal' : `${daysRemaining} days remaining`}
                </span>
              </div>
            </div>

            {/* Split Grid: Profile & Booked Sessions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Member Profile Details */}
              <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                  <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-[#ff6a00]" />
                    Profile Details
                  </h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase font-bold">Full Name</span>
                      <p className="font-bold text-white text-sm">{user?.name}</p>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase font-bold">Email Address</span>
                      <p className="font-mono text-neutral-300">{user?.email}</p>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase font-bold">Phone Number</span>
                      <p className="text-neutral-300">{user?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase font-bold">Assigned Head Trainer</span>
                      <p className="text-[#ff6a00] font-bold">Marcus Vance (Powerlifting & Hypertrophy)</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Phone</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="w-full py-2.5 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-bold uppercase transition-colors"
                    >
                      {savingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                  </form>
                )}
              </div>

              {/* Booked Sessions Feed */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                  <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    My Booked Sessions & Consultations
                  </h3>
                  <Link
                    to="/book"
                    className="text-xs text-[#ff6a00] font-bold hover:underline flex items-center gap-1"
                  >
                    + Book New Slot
                  </Link>
                </div>

                {appointments.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-xs">
                    No active bookings. Ready for a 1-on-1 coaching or InBody scan?{' '}
                    <Link to="/book" className="text-[#ff6a00] font-bold underline">
                      Schedule now.
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((appt) => (
                      <div
                        key={appt._id}
                        className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-white">{appt.service}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              appt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {appt.status}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 flex items-center gap-3">
                            <span>Coach: <strong className="text-neutral-200">{appt.trainerName || 'Assigned Coach'}</strong></span>
                            <span>•</span>
                            <span>Date: <strong className="text-neutral-200">{appt.date} at {appt.timeSlot}</strong></span>
                          </p>
                          {appt.notes && (
                            <p className="text-[11px] text-neutral-500 italic mt-1">"{appt.notes}"</p>
                          )}
                        </div>

                        {appt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelAppointment(appt._id)}
                            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-rose-500/10 hover:text-rose-400 text-neutral-400 text-xs font-semibold flex items-center gap-1 transition-colors self-start sm:self-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Cancel
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FITNESS PROGRESS & BMI */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            
            {/* Header info + log button */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Log Measurement Form */}
              <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
                <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#ff6a00]" />
                  Log New Body Metrics
                </h3>
                <form onSubmit={handleLogProgress} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="82.0"
                        value={logWeight}
                        onChange={(e) => setLogWeight(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Height (cm)</label>
                      <input
                        type="number"
                        placeholder="180"
                        value={logHeight}
                        onChange={(e) => setLogHeight(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Waist Circumference (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="84.0"
                      value={logWaist}
                      onChange={(e) => setLogWaist(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Workout / Diet Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Broke personal record on deadlift today"
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loggingProgress}
                    className="w-full py-2.5 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    {loggingProgress ? 'Saving...' : 'Record Metrics'}
                  </button>
                </form>
              </div>

              {/* BMI Gauge & Classification */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-[#161618] border border-neutral-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white mb-2">
                    BMI Index & Body Composition Status
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Calculated from your verified height and weight history.
                  </p>
                </div>

                <div className="py-6 flex flex-col items-center justify-center">
                  <div className="text-5xl font-black font-heading text-white tracking-wider flex items-baseline gap-2">
                    {latestMetric.bmi} <span className="text-sm font-mono text-[#ff6a00]">BMI</span>
                  </div>
                  <span className="mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase">
                    Optimal Athletic Body Composition
                  </span>

                  {/* Horizontal BMI scale */}
                  <div className="w-full max-w-md mt-6 space-y-2">
                    <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                      <div className="w-[18%] bg-blue-500/80" title="Underweight (< 18.5)" />
                      <div className="w-[32%] bg-emerald-500" title="Normal / Athletic (18.5 - 24.9)" />
                      <div className="w-[25%] bg-amber-500" title="Overweight / Muscular (25.0 - 29.9)" />
                      <div className="w-[25%] bg-rose-500" title="High Risk (> 30.0)" />
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                      <span>16.0</span>
                      <span>18.5 (Normal)</span>
                      <span>25.0 (Muscular)</span>
                      <span>30.0+</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff6a00] shrink-0" />
                  <span>Coach Note: Highly trained lifters with dense muscle mass will naturally test higher on standard BMI. Always pair with InBody scan results!</span>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
              <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white">
                Historical Progression Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-900 text-neutral-400 uppercase font-bold text-[10px] border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Weight (kg)</th>
                      <th className="py-3 px-4">BMI</th>
                      <th className="py-3 px-4">Waist (cm)</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {progressHistory.map((p) => (
                      <tr key={p._id} className="text-neutral-300 hover:bg-neutral-800/40">
                        <td className="py-3 px-4 font-mono">{p.date}</td>
                        <td className="py-3 px-4 font-bold text-white">{p.weightKg} kg</td>
                        <td className="py-3 px-4 font-mono text-[#ff6a00]">{p.bmi}</td>
                        <td className="py-3 px-4">{p.waistCm ? `${p.waistCm} cm` : '—'}</td>
                        <td className="py-3 px-4 text-neutral-400 italic">{p.notes || 'Routine check-in'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WORKOUT PLANNER */}
        {activeTab === 'workouts' && (
          <div className="space-y-6">
            
            {/* Rest Timer Widget */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#ff6a00]/10 border border-[#ff6a00]/30 flex items-center justify-center text-[#ff6a00]">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading text-base font-black tracking-wider uppercase text-white">
                    Smart Rest Interval Timer
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Recover neuromuscular output between working sets.
                  </p>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-3">
                <div className="font-mono text-2xl font-black text-[#ff6a00] px-4 py-1.5 rounded-xl bg-black/40 border border-neutral-800">
                  {Math.floor(timerRemaining / 60)}:{(timerRemaining % 60).toString().padStart(2, '0')}
                </div>

                <div className="flex gap-1.5">
                  {[45, 60, 90, 120].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => {
                        setTimerSeconds(sec);
                        setTimerRemaining(sec);
                        setTimerRunning(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        timerSeconds === sec ? 'bg-[#ff6a00] text-white' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold transition-colors"
                  title={timerRunning ? 'Pause' : 'Start'}
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setTimerRemaining(timerSeconds);
                    setTimerRunning(false);
                  }}
                  className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Plans List */}
            {workoutPlans.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 bg-[#161618] rounded-3xl border border-neutral-800">
                No custom workouts assigned yet. Ask your coach in the chat!
              </div>
            ) : (
              workoutPlans.map((plan) => (
                <div key={plan._id} className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ff6a00]/10 text-[#ff6a00] text-[10px] font-bold uppercase border border-[#ff6a00]/20">
                          {plan.dayOfWeek} • {plan.category}
                        </span>
                        <span className="text-xs text-neutral-500">• {plan.difficulty}</span>
                      </div>
                      <h3 className="font-heading text-xl font-black tracking-wider uppercase text-white mt-1">
                        {plan.title}
                      </h3>
                      {plan.notes && (
                        <p className="text-xs text-neutral-400 italic mt-0.5">"{plan.notes}"</p>
                      )}
                    </div>

                    <div className="text-xs text-neutral-400 font-mono">
                      Completed: {plan.exercises.filter((e: any) => e.isCompleted).length} / {plan.exercises.length} Exercises
                    </div>
                  </div>

                  {/* Exercises Checklist */}
                  <div className="space-y-2.5">
                    {plan.exercises.map((ex: any) => (
                      <div
                        key={ex.id}
                        onClick={() => handleToggleExercise(plan._id, ex.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          ex.isCompleted
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            ex.isCompleted ? 'bg-emerald-500 text-black' : 'border border-neutral-600'
                          }`}>
                            {ex.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${ex.isCompleted ? 'text-neutral-400 line-through' : 'text-white'}`}>
                              {ex.name}
                            </p>
                            <p className="text-[11px] text-neutral-400 font-mono">
                              {ex.targetSets} Sets × {ex.targetReps} {ex.weightTargetKg ? `• Target: ${ex.weightTargetKg} kg` : ''} • Rest: {ex.restSeconds}s
                            </p>
                          </div>
                        </div>

                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          ex.isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {ex.isCompleted ? 'Finished' : 'Mark Done'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: DIET & NUTRITION */}
        {activeTab === 'nutrition' && dietPlan && (
          <div className="space-y-6">
            
            {/* Calorie Dial & Macro Splits */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 flex flex-col justify-between">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Caloric Target</span>
                <div className="my-3">
                  <div className="text-3xl font-black font-heading text-white">
                    {dietPlan.targetCalories} <span className="text-xs text-[#ff6a00] font-mono">KCAL</span>
                  </div>
                  <span className="text-xs text-neutral-500 block mt-1">High-Protein Recomposition</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-bold uppercase">Target Met Daily</div>
              </div>

              <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Protein (4 kcal/g)</span>
                <div className="text-2xl font-black text-white mt-1 font-heading">
                  {dietPlan.targetProteinG} <span className="text-xs text-blue-400 font-mono">G</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-blue-400 h-full w-[80%]" />
                </div>
                <span className="text-[10px] text-neutral-500 mt-2 block">1.9g / kg body mass</span>
              </div>

              <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Carbs (4 kcal/g)</span>
                <div className="text-2xl font-black text-white mt-1 font-heading">
                  {dietPlan.targetCarbsG} <span className="text-xs text-amber-400 font-mono">G</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-400 h-full w-[65%]" />
                </div>
                <span className="text-[10px] text-neutral-500 mt-2 block">Complex Glycemic Matrix</span>
              </div>

              <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Fats (9 kcal/g)</span>
                <div className="text-2xl font-black text-white mt-1 font-heading">
                  {dietPlan.targetFatsG} <span className="text-xs text-emerald-400 font-mono">G</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[70%]" />
                </div>
                <span className="text-[10px] text-neutral-500 mt-2 block">Hormonal & Joint Support</span>
              </div>
            </div>

            {/* Hydration Bar */}
            <div className="p-5 rounded-2xl bg-[#161618] border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Droplet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading text-base font-black tracking-wider uppercase text-white">
                    Daily Water Hydration: {dietPlan.waterConsumedMl} / {dietPlan.waterTargetMl} ml
                  </h4>
                  <div className="w-48 sm:w-64 bg-neutral-800 h-2 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-blue-400 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (dietPlan.waterConsumedMl / dietPlan.waterTargetMl) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddWater}
                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Log +250ml Glass
              </button>
            </div>

            {/* Daily Meals Breakdown */}
            <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
              <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white">
                Assigned Meals & Calorie Breakdown
              </h3>
              <div className="space-y-3">
                {dietPlan.meals.map((meal: any) => (
                  <div
                    key={meal.id}
                    onClick={() => handleToggleMeal(meal.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      meal.isLogged
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        meal.isLogged ? 'bg-emerald-500 text-black' : 'border border-neutral-600'
                      }`}>
                        {meal.isLogged && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#ff6a00] uppercase block">
                          {meal.mealType}
                        </span>
                        <p className={`text-xs font-bold ${meal.isLogged ? 'text-neutral-400' : 'text-white'}`}>
                          {meal.title}
                        </p>
                        <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          {meal.calories} kcal • P: {meal.proteinG}g | C: {meal.carbsG}g | F: {meal.fatsG}g
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      meal.isLogged ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {meal.isLogged ? 'Consumed' : 'Mark Eaten'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GOALS & PR MILESTONES */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            
            {/* Create Goal Form */}
            <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
              <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#ff6a00]" />
                Establish New Athletic Goal / Milestone
              </h3>
              <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Goal description (e.g. Squat 160kg for 3 reps)"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Target number (e.g. 160)"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-bold uppercase transition-colors"
                >
                  Set Target
                </button>
              </form>
            </div>

            {/* Goals Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((g) => (
                <div
                  key={g._id}
                  className={`p-6 rounded-3xl border transition-all ${
                    g.status === 'achieved'
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-[#161618] border-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#ff6a00] block mb-1">
                        {g.category}
                      </span>
                      <h4 className="font-bold text-white text-sm">{g.title}</h4>
                    </div>
                    {g.status === 'achieved' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Smashed!
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAchieveGoal(g._id, g.title)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-[#ff6a00] hover:text-white text-neutral-300 text-xs font-bold uppercase transition-colors border border-neutral-700"
                      >
                        Mark Achieved
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Current: <strong className="text-white">{g.currentValue} {g.unit}</strong></span>
                      <span>Target: <strong className="text-[#ff6a00]">{g.targetValue} {g.unit}</strong></span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${g.status === 'achieved' ? 'bg-emerald-400' : 'bg-[#ff6a00]'}`}
                        style={{ width: `${Math.min(100, (g.currentValue / g.targetValue) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CHALLENGES & LEADERBOARD */}
        {activeTab === 'challenges' && (
          <div className="space-y-6">
            
            {/* Active Challenges */}
            <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
              <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#ff6a00]" />
                FLEXI Community Fitness Quests
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {challenges.map((c) => (
                  <div key={c._id} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ff6a00]/10 text-[#ff6a00] text-[10px] font-bold uppercase border border-[#ff6a00]/20">
                          {c.category} • {c.durationDays} Days
                        </span>
                        <span className="text-xs text-emerald-400 font-mono font-bold">+{c.points} PTS</span>
                      </div>
                      <h4 className="font-bold text-white text-base">{c.title}</h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{c.description}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center justify-between">
                      <span className="text-xs text-neutral-500">{c.participantsCount} Athletes Active</span>
                      <button
                        onClick={() => handleJoinChallenge(c._id, c.title)}
                        className="px-4 py-2 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-bold uppercase transition-colors"
                      >
                        Enroll Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Club Leaderboard */}
            <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
              <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white">
                Athletic Club Leaderboard
              </h3>
              <div className="space-y-2.5">
                {leaderboard.map((item) => (
                  <div
                    key={item.rank}
                    className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-heading text-sm font-black ${
                        item.rank === 1 ? 'bg-amber-400 text-black' : item.rank === 2 ? 'bg-neutral-300 text-black' : item.rank === 3 ? 'bg-amber-700 text-white' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        #{item.rank}
                      </span>
                      <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-neutral-700" />
                      <div>
                        <p className="text-xs font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-[#ff6a00] font-semibold">{item.badge}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-white">{item.points} pts</span>
                      <span className="text-[10px] text-neutral-500 block">{item.streakDays} Day Streak 🔥</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: BILLING & INVOICES */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#161618] border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <h3 className="font-heading text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#ff6a00]" />
                  Billing History & Tax Receipts
                </h3>
                <Link
                  to="/plans"
                  className="px-3.5 py-1.5 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-[#ff6a00]/25 transition-all"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Upgrade Tier
                </Link>
              </div>

              {payments.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs">No billing records found.</div>
              ) : (
                <div className="space-y-3">
                  {payments.map((pay) => (
                    <div
                      key={pay._id}
                      className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-xs">{pay.planName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            pay.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {pay.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 font-mono">
                          Invoice: {pay.invoiceNumber} • Date: {new Date(pay.invoiceDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-heading text-lg font-black text-white">
                          ${pay.amount} <span className="text-xs text-neutral-400 font-sans">USD</span>
                        </span>

                        {pay.status === 'pending' ? (
                          <button
                            onClick={() => handlePayPending(pay._id)}
                            disabled={payingPending}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase tracking-wider transition-colors"
                          >
                            {payingPending ? 'Processing...' : 'Pay Now'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedReceipt(pay);
                              setReceiptModalOpen(true);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-neutral-700"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#ff6a00]" />
                            View Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODALS */}
      <QRPassModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onCheckinSuccess={loadAllData}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        payment={selectedReceipt}
      />

      {/* Floating AI Coach */}
      <FitnessAIChatbot />
    </div>
  );
};
