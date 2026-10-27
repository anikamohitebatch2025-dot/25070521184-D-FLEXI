import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface CartItem {
  id: string;
  type: 'plan' | 'upgrade' | 'inventory' | 'session';
  title: string;
  price: number;
  quantity: number;
  image?: string;
  planId?: string;
  durationDays?: number;
  recipientEmail?: string; // For "applicable for diff user"
  recipientName?: string;
  applyTargets?: boolean;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  updateRecipient: (id: string, recipientEmail: string, recipientName?: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  total: number;
  itemCount: number;
  checkout: (
    paymentMethod: string,
    applyGlobalTargets?: boolean,
    targetMacroGoals?: any
  ) => Promise<{ success: boolean; data?: any; message?: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const VALID_COUPONS: Record<string, Coupon> = {
  FLEXI10: { code: 'FLEXI10', discountPercent: 10, description: '10% Welcome Athletic Discount' },
  TARGET20: { code: 'TARGET20', discountPercent: 20, description: '20% Target Goal Package Discount' },
  TITAN15: { code: 'TITAN15', discountPercent: 15, description: '15% Titan Tier Upgrade Bonus' },
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('flexi_cart_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const stored = localStorage.getItem('flexi_cart_coupon');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('flexi_cart_items', JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('flexi_cart_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('flexi_cart_coupon');
      }
    } catch {}
  }, [appliedCoupon]);

  const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      // If plan, only one of the same plan ID with same recipient
      const existingIndex = prev.findIndex(
        (i) => i.id === newItem.id && (i.recipientEmail || '') === (newItem.recipientEmail || '')
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        if (newItem.type === 'plan' || newItem.type === 'upgrade') {
          // Keep quantity 1 for plans, just alert
          return updated;
        }
        updated[existingIndex].quantity += newItem.quantity || 1;
        return updated;
      } else {
        return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
      }
    });

    showToast(`Added "${newItem.title}" to your gym basket!`, 'success');
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  };

  const updateRecipient = (id: string, recipientEmail: string, recipientName?: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, recipientEmail: recipientEmail.trim(), recipientName } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (VALID_COUPONS[clean]) {
      setAppliedCoupon(VALID_COUPONS[clean]);
      showToast(`Coupon applied! ${VALID_COUPONS[clean].description}`, 'success');
      return true;
    } else {
      showToast('Invalid or expired coupon code.', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed.', 'info');
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const total = Math.max(0, subtotal - discountAmount);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const checkout = async (
    paymentMethod: string,
    applyGlobalTargets: boolean = false,
    targetMacroGoals?: any
  ) => {
    if (items.length === 0) {
      return { success: false, message: 'Basket is empty.' };
    }

    try {
      const res = await axios.post(
        '/api/cart/checkout',
        {
          items,
          paymentMethod,
          discountAmount,
          appliedCoupon: appliedCoupon?.code,
          applyGlobalTargets,
          targetMacroGoals,
        },
        {
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        }
      );

      if (res.data?.success) {
        clearCart();
        setIsCartOpen(false);
        return { success: true, data: res.data.data, message: res.data.message };
      }
      return { success: false, message: res.data?.message || 'Checkout failed.' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Payment processing error.',
      };
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateRecipient,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        total,
        itemCount,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
