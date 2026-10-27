import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  Flame,
  CreditCard,
  Sparkles,
  X,
  AlertCircle,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  Gift,
  Target,
  ArrowRight,
  Zap,
  Star
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { Card3D } from '../components/Card3D';
import confetti from 'canvas-confetti';

export const Plans: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeMembership, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { addItem, setIsCartOpen } = useCart();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isUpgradeMode, setIsUpgradeMode] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('Credit Card');
  const [processing, setProcessing] = useState<boolean>(false);

  // Different user fields
  const [assignToDiffUser, setAssignToDiffUser] = useState<boolean>(false);
  const [diffUserEmail, setDiffUserEmail] = useState<string>('');
  const [diffUserName, setDiffUserName] = useState<string>('');

  // Target macro goals
  const [applyTargets, setApplyTargets] = useState<boolean>(true);
  const [targetPreset, setTargetPreset] = useState<'hypertrophy' | 'cut' | 'maintain'>('hypertrophy');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans');
        if (res.data?.success) {
          setPlans(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleOpenSubscribe = (plan: any, isUpgrade = false) => {
    if (!user) {
      navigate('/login?redirect=/plans');
      return;
    }
    setSelectedPlan(plan);
    setIsUpgradeMode(isUpgrade);
    setAssignToDiffUser(false);
    setDiffUserEmail('');
    setDiffUserName('');
  };

  const handleAddToCart = (plan: any, isUpgrade = false, e?: React.MouseEvent) => {
    e?.stopPropagation();
    addItem({
      id: `plan-${plan._id}-${Date.now()}`,
      type: isUpgrade ? 'upgrade' : 'plan',
      title: isUpgrade ? `Upgrade: ${plan.name}` : `${plan.name} Pass`,
      price: plan.price,
      planId: plan._id,
      durationDays: plan.duration,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
      applyTargets,
    });
  };

  const TARGET_PRESETS = {
    hypertrophy: {
      name: 'Lean Hypertrophy Target',
      targetCalories: 2850,
      targetProteinG: 195,
      targetCarbsG: 320,
      targetFatsG: 75,
      waterTargetMl: 3800,
    },
    cut: {
      name: 'Metabolic Shred Target',
      targetCalories: 2150,
      targetProteinG: 210,
      targetCarbsG: 190,
      targetFatsG: 55,
      waterTargetMl: 4000,
    },
    maintain: {
      name: 'Athletic Conditioning Target',
      targetCalories: 2500,
      targetProteinG: 180,
      targetCarbsG: 260,
      targetFatsG: 68,
      waterTargetMl: 3500,
    },
  };

  const handleConfirmSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setProcessing(true);

    try {
      const endpoint = isUpgradeMode ? '/memberships/upgrade' : '/memberships';
      const targetGoals = applyTargets ? TARGET_PRESETS[targetPreset] : undefined;

      const res = await api.post(endpoint, {
        planId: selectedPlan._id,
        paymentMethod,
        targetUserEmail: assignToDiffUser ? diffUserEmail.trim() : undefined,
        applyTargets,
        targetGoals,
      });

      if (res.data?.success) {
        confetti({ particleCount: 90, spread: 60 });
        showToast(res.data.message || `Successfully activated ${selectedPlan.name}!`, 'success');
        await refreshUser();
        setSelectedPlan(null);
        navigate('/dashboard');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Subscription failed. Please check inputs.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const currentPlan = activeMembership?.plan;

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-3">
            <Flame className="w-4 h-4 fill-[#ff6a00]" />
            Official FLEXI Memberships & Upgrades
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-black uppercase tracking-tight text-white">
            Invest In Your Strength
          </h1>
          <p className="text-neutral-400 mt-4 text-base leading-relaxed">
            Upgrade your active tier, purchase for yourself or another member, or add passes to your basket for consolidated payment.
          </p>

          {/* Active Membership & Upgrade Callout */}
          {activeMembership && (
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-[#1c1c1f] border border-neutral-700 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-neutral-400">Current Membership</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-black uppercase text-white mt-0.5">
                    {currentPlan?.name || 'Member Pass'} • Valid until{' '}
                    <span className="text-emerald-400">{new Date(activeMembership.endDate).toLocaleDateString()}</span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Upgrading to a longer or higher tier preserves your remaining streak and adds extended duration.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => {
                    const upgradeTarget = plans.find(p => p._id !== currentPlan?._id) || plans[plans.length - 1];
                    if (upgradeTarget) handleOpenSubscribe(upgradeTarget, true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#ff6a00]/25 transition-all"
                >
                  <TrendingUp className="w-4 h-4" />
                  Upgrade Plan Tier
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-neutral-900 animate-pulse border border-neutral-800" />
            ))}
          </div>
        )}

        {/* Plans Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, idx) => {
              const isPopular = plan.name.toLowerCase().includes('quarterly') || idx === 1;
              const isCurrent = currentPlan?._id === plan._id;
              const isEligibleUpgrade = activeMembership && currentPlan && plan.price > currentPlan.price;

              return (
                <Card3D
                  key={plan._id}
                  glowColor={isPopular ? 'rgba(255, 106, 0, 0.45)' : 'rgba(255, 255, 255, 0.1)'}
                  maxTilt={10}
                >
                  <div
                    className={`relative rounded-2xl flex flex-col justify-between p-8 transition-all h-full ${
                      isPopular
                        ? 'bg-neutral-900 border-2 border-[#ff6a00] shadow-2xl'
                        : isCurrent
                        ? 'bg-[#141814] border-2 border-emerald-500/50'
                        : 'bg-[#121214] border border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#ff6a00] text-black font-extrabold text-[11px] uppercase tracking-widest shadow-md">
                        Recommended Choice
                      </div>
                    )}

                    {isCurrent && (
                      <div className="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-emerald-500 text-black font-extrabold text-[10px] uppercase tracking-widest shadow-md">
                        Your Current Plan
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-widest text-[#ff6a00] font-bold">
                          {plan.duration} Days Valid
                        </span>
                        {isEligibleUpgrade && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                            Upgrade Option
                          </span>
                        )}
                      </div>

                      <h2 className="font-heading text-3xl font-black uppercase text-white mt-2">
                        {plan.name}
                      </h2>

                      <p className="text-xs text-neutral-400 mt-2 min-h-[40px]">
                        {plan.description}
                      </p>

                      <div className="my-6 pb-6 border-b border-neutral-800">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-neutral-400">$</span>
                          <span className="font-heading text-5xl font-black text-white">{plan.price}</span>
                          <span className="text-neutral-400 text-sm">/ {plan.duration} days</span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">
                          Billed as a one-time pass of ${plan.price}
                        </div>
                      </div>

                      {/* Features list */}
                      <div className="space-y-3 mb-6">
                        <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                          Included Privileges:
                        </div>
                        {plan.benefits?.map((benefit: string, bIdx: number) => (
                          <div key={bIdx} className="flex items-start gap-2.5 text-xs text-neutral-200">
                            <CheckCircle2 className="w-4 h-4 text-[#ff6a00] shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>

                      {/* Extra specs */}
                      <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-1.5 text-[11px] mb-8">
                        <div className="flex justify-between text-neutral-400">
                          <span>Workout Access:</span>
                          <span className="text-white font-medium text-right">{plan.workoutAccess}</span>
                        </div>
                        <div className="flex justify-between text-neutral-400">
                          <span>Trainer Support:</span>
                          <span className="text-white font-medium text-right">{plan.trainerSupport}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dual Action Buttons: Subscribe/Upgrade & Add to Basket */}
                    <div className="space-y-2.5">
                      <button
                        onClick={() => handleOpenSubscribe(plan, isEligibleUpgrade)}
                        className={`w-full py-3.5 rounded-xl text-sm font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                          isEligibleUpgrade
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                            : isPopular
                            ? 'bg-[#ff6a00] hover:bg-[#e65c00] text-white shadow-lg shadow-[#ff6a00]/30'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                        }`}
                      >
                        {isEligibleUpgrade ? (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            Upgrade To {plan.name}
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            {isCurrent ? 'Renew Current Plan' : 'Join Now'}
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(plan, isEligibleUpgrade, e)}
                        className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 hover:text-[#ff6a00] border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Add to Basket / Cart
                      </button>
                    </div>

                  </div>
                </Card3D>
              );
            })}
          </div>
        )}

      </div>

      {/* Subscription / Upgrade / Diff-User Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#121214] border border-neutral-800 p-6 sm:p-8 shadow-2xl animate-scale-up my-8">
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs uppercase font-bold text-[#ff6a00] tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              {isUpgradeMode ? 'Membership Tier Upgrade' : 'Membership Checkout'}
            </div>
            
            <h3 className="font-heading text-3xl font-black uppercase text-white">
              {isUpgradeMode ? `Upgrade to ${selectedPlan.name}` : `Enroll In ${selectedPlan.name}`}
            </h3>

            {/* Price & Summary */}
            <div className="my-5 p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Plan Duration:</span>
                <span className="font-bold text-white">{selectedPlan.duration} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Billed:</span>
                <span className="font-bold text-[#ff6a00] text-base">${selectedPlan.price}.00</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Start Date:</span>
                <span className="text-white">Today ({new Date().toLocaleDateString()})</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Computed Expiry:</span>
                <span className="text-emerald-400 font-semibold">
                  {new Date(Date.now() + selectedPlan.duration * 86400000).toLocaleDateString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmSubscription} className="space-y-4">
              
              {/* Applicable For Different User Toggle */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-neutral-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#ff6a00]" />
                    Target Account Assignment
                  </span>
                  <div className="flex gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setAssignToDiffUser(false)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        !assignToDiffUser ? 'bg-[#ff6a00] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      For Myself
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignToDiffUser(true)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        assignToDiffUser ? 'bg-[#ff6a00] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Different User
                    </button>
                  </div>
                </div>

                {assignToDiffUser && (
                  <div className="space-y-2 pt-1 animate-fadeIn">
                    <input
                      type="email"
                      placeholder="Enter recipient member email (e.g. friend@gmail.com)"
                      value={diffUserEmail}
                      onChange={(e) => setDiffUserEmail(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
                      required={assignToDiffUser}
                    />
                    <p className="text-[10px] text-neutral-500">
                      The membership will be instantly assigned to this user's email with automatic turnstile QR privileges.
                    </p>
                  </div>
                )}
              </div>

              {/* Apply Target Macro Goals */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyTargets}
                    onChange={(e) => setApplyTargets(e.target.checked)}
                    className="rounded accent-[#ff6a00] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#ff6a00]" />
                    Apply Recommended Target Nutrition
                  </span>
                </label>

                {applyTargets && (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { key: 'hypertrophy', label: 'Hypertrophy (+300)' },
                      { key: 'cut', label: 'Shred Cut (-400)' },
                      { key: 'maintain', label: 'Conditioning' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setTargetPreset(p.key as any)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                          targetPreset === p.key
                            ? 'bg-[#ff6a00]/15 border-[#ff6a00] text-white'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Credit Card', 'Debit Card', 'UPI / Online', 'Cash at Front Desk'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                        paymentMethod === m
                          ? 'border-[#ff6a00] bg-[#ff6a00]/10 text-white font-bold'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-3.5 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-black uppercase text-sm tracking-wider shadow-lg shadow-[#ff6a00]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {processing
                      ? 'Processing...'
                      : isUpgradeMode
                      ? `Confirm & Upgrade Plan ($${selectedPlan.price})`
                      : `Confirm & Pay $${selectedPlan.price}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(selectedPlan, isUpgradeMode);
                    setSelectedPlan(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold uppercase tracking-wider border border-neutral-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Basket & Review Later
                </button>
              </div>

              <div className="text-center text-[11px] text-neutral-500">
                Safe & encrypted. Generates digital invoice receipt and updates turnstile access.
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
