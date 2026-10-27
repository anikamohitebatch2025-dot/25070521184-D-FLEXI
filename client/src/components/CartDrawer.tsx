import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Tag,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Gift,
  Target,
  QrCode,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart, CartItem } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    updateRecipient,
    clearCart,
    subtotal,
    discountAmount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    itemCount,
    checkout
  } = useCart();

  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Coupon input
  const [couponInput, setCouponInput] = useState('');
  
  // Checkout & Payment step
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('Credit Card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [isProcessing, setIsProcessing] = useState(false);

  // Apply Target Goal
  const [applyTargets, setApplyTargets] = useState(true);
  const [selectedTargetPreset, setSelectedTargetPreset] = useState<'hypertrophy' | 'cut' | 'maintain'>('hypertrophy');

  // Recipient edit modal/input state
  const [editingRecipientId, setEditingRecipientId] = useState<string | null>(null);
  const [tempRecipientEmail, setTempRecipientEmail] = useState('');
  const [tempRecipientName, setTempRecipientName] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const ok = applyCoupon(couponInput);
    if (ok) setCouponInput('');
  };

  const handleOpenRecipientEdit = (item: CartItem) => {
    setEditingRecipientId(item.id);
    setTempRecipientEmail(item.recipientEmail || '');
    setTempRecipientName(item.recipientName || '');
  };

  const handleSaveRecipient = (itemId: string) => {
    updateRecipient(itemId, tempRecipientEmail, tempRecipientName);
    setEditingRecipientId(null);
    showToast(`Membership assignment updated for ${tempRecipientEmail || 'Myself'}.`, 'info');
  };

  const TARGET_PRESETS = {
    hypertrophy: {
      name: 'Lean Hypertrophy Target',
      targetCalories: 2850,
      targetProteinG: 195,
      targetCarbsG: 320,
      targetFatsG: 75,
      waterTargetMl: 3800,
      desc: '+300 kcal surplus • 195g Protein'
    },
    cut: {
      name: 'Metabolic Shred Target',
      targetCalories: 2150,
      targetProteinG: 210,
      targetCarbsG: 190,
      targetFatsG: 55,
      waterTargetMl: 4000,
      desc: '-400 kcal deficit • 210g High Protein'
    },
    maintain: {
      name: 'Athletic Conditioning Target',
      targetCalories: 2500,
      targetProteinG: 180,
      targetCarbsG: 260,
      targetFatsG: 68,
      waterTargetMl: 3500,
      desc: 'Isocaloric baseline • 180g Protein'
    }
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('Please log in or register before completing checkout.', 'info');
      setIsCartOpen(false);
      navigate('/login?redirect=/plans');
      return;
    }

    setIsProcessing(true);
    try {
      const targetGoals = applyTargets ? TARGET_PRESETS[selectedTargetPreset] : undefined;
      const res = await checkout(paymentMethod, applyTargets, targetGoals);

      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        showToast(`🎉 Payment approved! Receipt #${res.data?.invoiceNumber} generated.`, 'success');
        await refreshUser();
        setIsCheckingOut(false);
        setIsCartOpen(false);
        navigate('/dashboard');
      } else {
        showToast(res.message || 'Payment could not be processed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Payment failure.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#121214] border-l border-neutral-800 text-white flex flex-col shadow-2xl relative">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-[#161618]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6a00] to-[#d64e00] flex items-center justify-center text-white shadow-md shadow-[#ff6a00]/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-black uppercase tracking-wider text-white">
                  Gym Basket
                </h2>
                <p className="text-xs text-neutral-400">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-y overflow-x-hidden p-6 space-y-6">
            
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-heading text-xl font-bold uppercase text-white">
                  Your Basket Is Empty
                </h3>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Explore our membership tiers, upgrade your active pass, or add performance nutrition to your cart.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/plans');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#ff6a00]/25 transition-all"
                  >
                    View Membership Plans
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white font-heading uppercase">
                              {item.title}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#ff6a00]/10 text-[#ff6a00] border border-[#ff6a00]/20">
                              {item.type}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-heading text-lg font-black text-white">
                              ${item.price}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-xs text-neutral-400">
                                (${item.price * item.quantity} total)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls / Remove */}
                        <div className="flex items-center gap-2">
                          {item.type !== 'plan' && item.type !== 'upgrade' ? (
                            <div className="flex items-center border border-neutral-700 rounded-lg bg-neutral-950">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 hover:text-[#ff6a00] text-neutral-400"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 text-xs font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 hover:text-[#ff6a00] text-neutral-400"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : null}

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Applicable for Different User Section */}
                      {(item.type === 'plan' || item.type === 'upgrade') && (
                        <div className="pt-2 border-t border-neutral-800/80">
                          {editingRecipientId === item.id ? (
                            <div className="space-y-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff6a00] block">
                                Assign to Member Account:
                              </span>
                              <input
                                type="email"
                                placeholder="Recipient Email (e.g. friend@example.com)"
                                value={tempRecipientEmail}
                                onChange={(e) => setTempRecipientEmail(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
                              />
                              <input
                                type="text"
                                placeholder="Recipient Name (optional)"
                                value={tempRecipientName}
                                onChange={(e) => setTempRecipientName(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff6a00]"
                              />
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveRecipient(item.id)}
                                  className="px-3 py-1 bg-[#ff6a00] text-white rounded-lg text-xs font-bold uppercase"
                                >
                                  Save Recipient
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingRecipientId(null)}
                                  className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-lg text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-neutral-400 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-[#ff6a00]" />
                                Applicable for:{' '}
                                <strong className="text-white">
                                  {item.recipientEmail ? item.recipientEmail : 'My Account (Self)'}
                                </strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenRecipientEdit(item)}
                                className="text-[#ff6a00] font-bold hover:underline flex items-center gap-1"
                              >
                                <Gift className="w-3 h-3" />
                                {item.recipientEmail ? 'Change User' : 'Assign to Diff User'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Apply Target Goals Section */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-900 to-[#18181b] border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyTargets}
                        onChange={(e) => setApplyTargets(e.target.checked)}
                        className="rounded accent-[#ff6a00] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-[#ff6a00]" />
                        Apply Target Goals with Purchase
                      </span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Recommended
                    </span>
                  </div>

                  {applyTargets && (
                    <div className="space-y-2 pt-1 animate-fadeIn">
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { key: 'hypertrophy', label: 'Hypertrophy Bulk', tag: '+300 kcal' },
                          { key: 'cut', label: 'Metabolic Shred', tag: '-400 kcal' },
                          { key: 'maintain', label: 'Athletic Baseline', tag: '2,500 kcal' },
                        ].map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setSelectedTargetPreset(p.key as any)}
                            className={`p-2 rounded-xl text-left border transition-all ${
                              selectedTargetPreset === p.key
                                ? 'bg-[#ff6a00]/15 border-[#ff6a00] text-white font-bold'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            <div className="text-[10px] font-bold uppercase truncate">{p.label}</div>
                            <div className="text-[9px] text-[#ff6a00]">{p.tag}</div>
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800/80 text-[11px] text-neutral-400">
                        <strong className="text-white block mb-0.5">
                          {TARGET_PRESETS[selectedTargetPreset].name}:
                        </strong>
                        Target {TARGET_PRESETS[selectedTargetPreset].targetCalories} kcal •{' '}
                        {TARGET_PRESETS[selectedTargetPreset].targetProteinG}g Protein •{' '}
                        {(TARGET_PRESETS[selectedTargetPreset].waterTargetMl / 1000).toFixed(1)}L Hydration.
                      </div>
                    </div>
                  )}
                </div>

                {/* Promo Code Input & Quick Badges */}
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-neutral-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#ff6a00]" />
                      Target Promo Code
                    </span>
                    {appliedCoupon && (
                      <button
                        onClick={removeCoupon}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Remove ({appliedCoupon.code})
                      </button>
                    )}
                  </div>

                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. FLEXI10 or TARGET20"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white uppercase tracking-wider focus:outline-none focus:border-[#ff6a00]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#ff6a00] hover:bg-[#e05500] text-white text-xs font-bold uppercase rounded-xl transition-colors"
                      >
                        Apply
                      </button>
                    </form>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {appliedCoupon.code} ({appliedCoupon.discountPercent}% OFF)
                      </span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Quick-tap coupon tags */}
                  {!appliedCoupon && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { code: 'FLEXI10', label: '10% Welcome' },
                        { code: 'TARGET20', label: '20% Target Deal' },
                        { code: 'TITAN15', label: '15% Titan Upgrade' }
                      ].map((cpn) => (
                        <button
                          key={cpn.code}
                          type="button"
                          onClick={() => applyCoupon(cpn.code)}
                          className="px-2 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 hover:text-[#ff6a00] hover:border-[#ff6a00] transition-colors"
                        >
                          +{cpn.code} ({cpn.label})
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Checkout & Payment Section */}
                {isCheckingOut ? (
                  <form onSubmit={handleExecutePayment} className="p-5 rounded-2xl bg-[#161618] border border-neutral-700 space-y-4 animate-scale-up">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <h4 className="font-heading text-lg font-black uppercase text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-[#ff6a00]" />
                        Payment Method
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsCheckingOut(false)}
                        className="text-xs text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {['Credit Card', 'UPI / QR', 'Debit Card', 'Front Desk Cash'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                            paymentMethod === m
                              ? 'bg-[#ff6a00] border-[#ff6a00] text-white shadow-md'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card' ? (
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Card Number</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#ff6a00]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Expiry</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#ff6a00]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">CVC / CVV</label>
                            <input
                              type="password"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#ff6a00]"
                            />
                          </div>
                        </div>
                      </div>
                    ) : paymentMethod === 'UPI / QR' ? (
                      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center space-y-2">
                        <QrCode className="w-16 h-16 text-[#ff6a00] mx-auto" />
                        <p className="text-xs font-mono text-neutral-300">flexigym@okicici</p>
                        <p className="text-[10px] text-neutral-500">Scan via Google Pay, PhonePe, or Paytm for instant pass activation.</p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400">
                        Pay cash or physical swipe at the gym front desk kiosk upon arrival. Digital pass will be registered.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff6a00] to-[#e05500] hover:from-[#ff7b1a] hover:to-[#eb6009] text-white font-heading text-lg font-black uppercase tracking-wider shadow-lg shadow-[#ff6a00]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? 'Verifying Transaction...' : `Confirm & Pay $${total.toFixed(2)}`}
                    </button>
                  </form>
                ) : null}
              </>
            )}

          </div>

          {/* Drawer Footer with Totals & Primary CTA */}
          {items.length > 0 && !isCheckingOut && (
            <div className="p-6 border-t border-neutral-800 bg-[#161618] space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal:</span>
                  <span className="font-medium text-white">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount ({appliedCoupon?.code}):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-400">
                  <span>Sales Tax & Turnstile Fee:</span>
                  <span className="text-emerald-400 font-medium">$0.00 (Waived)</span>
                </div>
                <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline">
                  <span className="font-heading text-lg font-black uppercase text-white">
                    Estimated Total:
                  </span>
                  <span className="font-heading text-3xl font-black text-[#ff6a00]">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCheckingOut(true)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#ff6a00] to-[#e05500] hover:from-[#ff7b1a] hover:to-[#eb6009] text-white font-heading text-lg font-black uppercase tracking-wider shadow-xl shadow-[#ff6a00]/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>SSL Encrypted • Instant MongoDB Pass Sync</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
