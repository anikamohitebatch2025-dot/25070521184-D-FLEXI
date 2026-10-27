import React from 'react';
import { X, Printer, Download, CheckCircle, Shield, Dumbbell } from 'lucide-react';

export interface PaymentReceiptData {
  _id: string;
  invoiceNumber: string;
  transactionId: string;
  memberName: string;
  memberEmail: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'refunded';
  paymentMethod: string;
  invoiceDate: string;
  paidAt?: string;
  items?: { description: string; amount: number }[];
  subtotal?: number;
  taxAmount?: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentReceiptData | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, payment }) => {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const lineItems = payment.items && payment.items.length > 0 
    ? payment.items 
    : [{ description: `${payment.planName} Access Fee`, amount: payment.amount }];

  const subtotal = payment.subtotal || payment.amount;
  const tax = payment.taxAmount || 0;
  const total = payment.amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 print:bg-white print:p-0">
      <div className="relative w-full max-w-xl bg-[#161618] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Top Controls (Hidden during print) */}
        <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg font-black tracking-wider uppercase text-white">
              Official Payment Receipt
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Paid
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors border border-neutral-700"
            >
              <Printer className="w-3.5 h-3.5 text-[#ff6a00]" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-8 print:p-6 space-y-6">
          
          {/* Header Brand */}
          <div className="flex items-start justify-between border-b border-neutral-800 print:border-neutral-300 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#ff6a00] flex items-center justify-center text-white font-bold shadow-lg shadow-[#ff6a00]/30 print:bg-black">
                <Dumbbell className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-black tracking-wider text-white print:text-black">
                  FLEXI ATHLETIC CLUB
                </h2>
                <p className="text-xs text-neutral-400 print:text-neutral-600">
                  742 Evergreen Fitness Blvd, Metro West
                </p>
                <p className="text-xs text-neutral-400 print:text-neutral-600">
                  GST / Tax ID: FLX-9941-US-2026
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff6a00] block mb-1">
                Tax Invoice
              </span>
              <p className="font-mono text-sm font-bold text-white print:text-black">
                {payment.invoiceNumber}
              </p>
              <p className="text-xs text-neutral-400 print:text-neutral-600">
                Date: {new Date(payment.invoiceDate).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Member & Transaction Meta */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-neutral-400 print:text-neutral-600 uppercase font-bold text-[10px] tracking-wider mb-1">
                Billed To
              </p>
              <p className="font-bold text-white print:text-black text-sm">{payment.memberName}</p>
              <p className="text-neutral-400 print:text-neutral-600">{payment.memberEmail}</p>
            </div>
            <div className="text-right">
              <p className="text-neutral-400 print:text-neutral-600 uppercase font-bold text-[10px] tracking-wider mb-1">
                Payment Info
              </p>
              <p className="font-mono text-white print:text-black">{payment.transactionId}</p>
              <p className="text-neutral-400 print:text-neutral-600">
                Method: {payment.paymentMethod}
              </p>
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-neutral-800 print:border-neutral-300 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-900 print:bg-neutral-100 text-neutral-400 print:text-neutral-700 uppercase font-bold text-[10px] border-b border-neutral-800 print:border-neutral-300">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 print:divide-neutral-200">
                {lineItems.map((item, idx) => (
                  <tr key={idx} className="text-neutral-300 print:text-black">
                    <td className="py-3 px-4 font-medium">{item.description}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400 print:text-neutral-600">
                <span>Subtotal:</span>
                <span className="font-mono text-white print:text-black">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400 print:text-neutral-600">
                <span>Sales Tax (0% Member Pass):</span>
                <span className="font-mono text-white print:text-black">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white print:text-black pt-2 border-t border-neutral-800 print:border-neutral-300">
                <span>Total Paid:</span>
                <span className="font-mono text-[#ff6a00] print:text-black">${total.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* Authorized Seal */}
          <div className="pt-4 border-t border-neutral-800 print:border-neutral-300 flex items-center justify-between text-[11px] text-neutral-500 print:text-neutral-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Electronically Verified & Audited Receipt</span>
            </div>
            <div className="text-right italic font-serif">
              Authorized Signature • FLEXI Accounts
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
