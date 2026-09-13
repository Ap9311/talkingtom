import React, { useState } from 'react';
import { Mic, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MicPermissionModalProps {
  isOpen: boolean;
  onEnableMic: () => Promise<boolean>;
  onDismiss: () => void;
}

export const MicPermissionModal: React.FC<MicPermissionModalProps> = ({
  isOpen,
  onEnableMic,
  onDismiss,
}) => {
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnable = async () => {
    setIsRequesting(true);
    setPermissionError(null);
    try {
      const granted = await onEnableMic();
      if (!granted) {
        setPermissionError(
          'Microphone permission was not granted. You can still chat by typing below, or allow microphone access in your browser settings!'
        );
      }
    } catch (err: any) {
      setPermissionError(
        'Unable to access microphone. Please check your browser permissions.'
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mic-dialog-title"
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-6 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200"
      >
        {/* Animated Microphone Icon */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200/80 shadow-inner">
          <Mic className="w-8 h-8 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
          </span>
        </div>

        {/* Text Content */}
        <div className="space-y-1.5">
          <h2 id="mic-dialog-title" className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Talk to Tom with Your Voice
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs">
            Ask any question out loud! Tom listens to your voice and answers with intelligent, spoken dialogue powered by Gemini.
          </p>
        </div>

        {/* Error Warning if Denied */}
        {permissionError && (
          <div className="w-full text-left p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="flex-1">{permissionError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-1">
          {!permissionError ? (
            <button
              onClick={handleEnable}
              disabled={isRequesting}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Mic className="w-4 h-4" />
              {isRequesting ? 'Enabling Microphone...' : 'Turn On Microphone'}
            </button>
          ) : (
            <button
              onClick={handleEnable}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              Retry Microphone
            </button>
          )}

          <button
            onClick={onDismiss}
            className="w-full py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            {permissionError ? 'Continue with Keyboard' : 'Type With Keyboard Instead'}
          </button>
        </div>

        {/* Subtle Footnote */}
        <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>You can toggle your microphone on or off anytime</span>
        </div>
      </div>
    </div>
  );
};
