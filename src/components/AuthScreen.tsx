import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  X,
  UserCheck,
  Lock,
  Clock,
  Ban,
} from 'lucide-react';
import { signInWithGoogle, formatAuthError } from '../lib/firebase';
import { UserProfile } from '../types';
import {
  getGuestUsageSync,
  recordGuestUsageSync,
  syncWithRemoteFirestore,
  GuestUsageStatus,
} from '../utils/deviceFingerprint';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
  onContinueAsGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  onContinueAsGuest,
}) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    code?: string;
  } | null>(null);
  // Synchronous initialization: 0ms delay on first frame
  const [guestStatus, setGuestStatus] = useState<GuestUsageStatus>(() => getGuestUsageSync());

  // Background check for remote sync (non-blocking)
  useEffect(() => {
    syncWithRemoteFirestore((updated) => setGuestStatus(updated));
  }, []);

  // Fast Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setErrorInfo(null);
    setGoogleLoading(true);
    try {
      const profile = await signInWithGoogle();
      onAuthSuccess(profile);
    } catch (err: any) {
      console.warn('Google Sign In notice:', err?.code || err?.message);
      const formatted = formatAuthError(err);
      setErrorInfo(formatted);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Instant zero-delay guest session launch
  const handleGuestClick = () => {
    const updated = recordGuestUsageSync();
    setGuestStatus(updated);
    if (updated.used <= updated.max) {
      onContinueAsGuest?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-gradient-to-br from-slate-950/85 via-slate-900/85 to-amber-950/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100/90 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header Section with Provided Tom AI Logo */}
        <div className="relative pt-6 pb-4 px-6 bg-gradient-to-b from-amber-500/15 via-amber-50/50 to-white text-center border-b border-amber-100/60 shrink-0">
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <img
                src="/tom-ai-logo.png"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://i.ibb.co/dTy1fPd/56073-removebg-preview.png';
                }}
                alt="Tom AI"
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-md mx-auto hover:scale-105 transition-transform select-none pointer-events-none"
              />
              <span className="absolute bottom-2 right-2 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
            Welcome to Tom AI
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
            Your talking 3D companion who remembers your verified name & photo!
          </p>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Error Banner */}
          <AnimatePresence>
            {errorInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs shadow-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span className="flex-1 leading-relaxed font-medium">
                  {errorInfo.message}
                </span>
                <button
                  onClick={() => setErrorInfo(null)}
                  className="text-red-400 hover:text-red-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary Action: Official Google Sign In Button */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full relative flex items-center justify-center gap-3 py-3 px-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-400 text-slate-800 font-bold text-sm shadow-sm hover:shadow-md transition-all duration-150 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none cursor-pointer group"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="group-hover:text-amber-700 transition-colors">
                {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </span>
            </button>

            <p className="text-[11px] text-center text-slate-400 font-medium">
              100% Free • Verified Google Security • No password needed
            </p>
          </div>

          {/* Security & Verification Guarantees */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Real & Verified Authentication</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>No fake accounts:</strong> Authenticated directly with Google.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Name & Photo:</strong> Tom automatically greets you by your verified name.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy first:</strong> Only your name and picture are saved.
                </span>
              </div>
            </div>
          </div>

          {/* Guest / Preview Option (Fingerprint-Limited to 5 times, 2 Minutes each) */}
          {onContinueAsGuest && (
            <div className="pt-2 text-center border-t border-slate-100">
              {guestStatus && !guestStatus.allowed ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center gap-2 text-xs text-amber-900 font-medium text-left">
                  <Ban className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Guest preview limit reached (<strong>{guestStatus.used}/{guestStatus.max}</strong> used on this device). Please sign in with Google to continue playing with Tom!
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGuestClick}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-700 font-semibold transition-colors py-1.5 px-3 rounded-xl hover:bg-amber-50 cursor-pointer active:scale-98"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    {guestStatus
                      ? `Preview as Guest (${guestStatus.remaining} of ${guestStatus.max} left • 2 min each) →`
                      : 'Preview as Guest (5 times max • 2 min each) →'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
