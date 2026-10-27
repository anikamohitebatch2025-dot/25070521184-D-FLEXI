import React, { useState } from 'react';
import { X, QrCode, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw, Sparkles, Building, User } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface QRPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckinSuccess?: () => void;
}

export const QRPassModal: React.FC<QRPassModalProps> = ({ isOpen, onClose, onCheckinSuccess }) => {
  const { user, activeMembership } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);

  if (!isOpen || !user) return null;

  const qrDataPayload = JSON.stringify({
    userId: user._id,
    name: user.name,
    email: user.email,
    plan: activeMembership?.plan?.name || 'Standard Pass',
    issuedAt: new Date().toISOString(),
  });

  const simulateTurnstileScan = async () => {
    setScanning(true);
    setScanResult(null);

    try {
      const res = await api.post('/attendance/checkin', {
        qrData: qrDataPayload,
        memberId: user._id,
        memberEmail: user.email,
        location: 'Turnstile A (Main Entrance)',
      });

      if (res.data?.success) {
        setScanResult({
          success: true,
          message: res.data.message || 'Access Granted: Welcome to FLEXI!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        if (onCheckinSuccess) onCheckinSuccess();
      } else {
        setScanResult({
          success: false,
          message: res.data.message || 'Access Denied: Please verify your membership.',
        });
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.response?.data?.message || 'Access Denied: Expired or Invalid Pass.',
      });
    } finally {
      setScanning(false);
    }
  };

  const isExpired = activeMembership?.computedStatus === 'Expired';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#161618] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#ff6a00] to-[#e05500] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            <span className="font-heading text-lg font-black tracking-wider uppercase">
              Digital Member Pass
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 flex flex-col items-center text-center">
          
          {/* Member Badge Header */}
          <div className="w-20 h-20 rounded-2xl bg-neutral-900 border-2 border-[#ff6a00] p-1 mb-3 flex items-center justify-center text-white shadow-xl shadow-[#ff6a00]/20">
            <User className="w-10 h-10 text-neutral-300" />
          </div>

          <h3 className="font-heading text-xl font-black text-white tracking-wide">
            {user.name}
          </h3>
          <p className="text-xs text-neutral-400 mb-2">
            {user.email}
          </p>

          {/* Status pill */}
          <div className="mb-5 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isExpired 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isExpired ? 'Membership Expired' : 'Active Member Pass'}
            </span>
            <span className="text-xs text-neutral-400 font-semibold">
              {activeMembership?.plan?.name || 'Standard Pass'}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="relative p-5 bg-white rounded-2xl shadow-xl flex items-center justify-center group mb-4">
            {/* SVG simulated high-density QR code */}
            <svg
              className="w-48 h-48"
              viewBox="0 0 100 100"
              fill="black"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Corner position markers */}
              <rect x="5" y="5" width="25" height="25" fill="black" />
              <rect x="8" y="8" width="19" height="19" fill="white" />
              <rect x="11" y="11" width="13" height="13" fill="black" />

              <rect x="70" y="5" width="25" height="25" fill="black" />
              <rect x="73" y="8" width="19" height="19" fill="white" />
              <rect x="76" y="11" width="13" height="13" fill="black" />

              <rect x="5" y="70" width="25" height="25" fill="black" />
              <rect x="8" y="73" width="19" height="19" fill="white" />
              <rect x="11" y="76" width="13" height="13" fill="black" />

              {/* Data matrix pattern dots */}
              <rect x="35" y="10" width="6" height="6" />
              <rect x="45" y="10" width="6" height="6" />
              <rect x="55" y="15" width="6" height="6" />
              <rect x="35" y="25" width="6" height="6" />
              <rect x="50" y="25" width="6" height="6" />
              <rect x="15" y="38" width="6" height="6" />
              <rect x="25" y="38" width="6" height="6" />
              <rect x="40" y="38" width="6" height="6" />
              <rect x="50" y="38" width="6" height="6" />
              <rect x="65" y="38" width="6" height="6" />
              <rect x="80" y="38" width="6" height="6" />
              <rect x="15" y="50" width="6" height="6" />
              <rect x="35" y="50" width="6" height="6" />
              <rect x="45" y="50" width="6" height="6" />
              <rect x="60" y="50" width="6" height="6" />
              <rect x="75" y="50" width="6" height="6" />
              <rect x="85" y="50" width="6" height="6" />
              <rect x="35" y="65" width="6" height="6" />
              <rect x="45" y="65" width="6" height="6" />
              <rect x="60" y="65" width="6" height="6" />
              <rect x="75" y="65" width="6" height="6" />
              <rect x="35" y="80" width="6" height="6" />
              <rect x="50" y="80" width="6" height="6" />
              <rect x="65" y="80" width="6" height="6" />
              <rect x="80" y="80" width="6" height="6" />
            </svg>

            {/* Glowing scan bar animation */}
            <div className="absolute inset-x-2 top-0 h-1 bg-[#ff6a00] shadow-[0_0_12px_#ff6a00] animate-[bounce_2s_infinite]" />
          </div>

          <div className="text-[11px] font-mono text-neutral-400 mb-5">
            PASS ID: FLX-{user._id.substring(0, 8).toUpperCase()} • NFC READY
          </div>

          {/* Scan result banner */}
          {scanResult && (
            <div className={`w-full p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-start gap-2.5 text-left ${
              scanResult.success
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}>
              {scanResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{scanResult.message}</p>
                {scanResult.timestamp && (
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">
                    Verified at Turnstile: {scanResult.timestamp}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Turnstile Scan Action Button */}
          <button
            onClick={simulateTurnstileScan}
            disabled={scanning}
            className="w-full py-3 px-4 rounded-xl bg-[#ff6a00] hover:bg-[#e05500] disabled:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ff6a00]/25"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Scanning at Turnstile...
              </>
            ) : (
              <>
                <Building className="w-4 h-4" />
                Simulate Turnstile Check-In
              </>
            )}
          </button>
        </div>

        {/* Security Footer */}
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 text-center flex items-center justify-center gap-1.5 text-[10px] text-neutral-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted Anti-Passback Hardware Protocol</span>
        </div>
      </div>
    </div>
  );
};
