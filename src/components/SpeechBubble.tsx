import React from 'react';
import { EmotionType } from '../types';
import { Volume2, Heart, Sparkles, HelpCircle, Smile, Coffee } from 'lucide-react';

interface SpeechBubbleProps {
  text: string;
  emotion: EmotionType;
  isSpeaking: boolean;
  isThinking: boolean;
  isListening: boolean;
  onReplay?: () => void;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  emotion,
  isSpeaking,
  isThinking,
  isListening,
  onReplay,
}) => {
  const getEmotionBadge = () => {
    switch (emotion) {
      case 'empathetic':
      case 'comforting':
        return { label: 'Empathetic & Caring', icon: <Heart className="w-3.5 h-3.5 text-rose-500" />, color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'curious':
        return { label: 'Curious & Inquisitive', icon: <HelpCircle className="w-3.5 h-3.5 text-amber-500" />, color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'playful':
      case 'excited':
        return { label: 'Playful & Joyful', icon: <Sparkles className="w-3.5 h-3.5 text-orange-500" />, color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'thinking':
        return { label: 'Deeply Reflecting', icon: <Coffee className="w-3.5 h-3.5 text-indigo-500" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: 'Warm & Friendly', icon: <Smile className="w-3.5 h-3.5 text-emerald-500" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const badge = getEmotionBadge();

  return (
    <div className="w-full max-w-xl mx-auto px-4 z-20 pointer-events-auto select-none transition-all duration-300">
      {/* 1. Emotion & Listening Status Badge */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {isListening ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500 text-white text-xs font-semibold shadow-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Listening to your voice...</span>
          </div>
        ) : isThinking ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold shadow-md">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Reflecting on your words...</span>
          </div>
        ) : (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold backdrop-blur-md shadow-2xs ${badge.color}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        )}

        {/* Real-time Voice Modulation Waveform Visualizer */}
        {isSpeaking && (
          <div className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-amber-100/90 text-amber-800 border border-amber-200 text-xs">
            <span className="w-1 h-2 bg-amber-500 rounded-full animate-bounce" />
            <span className="w-1 h-4 bg-amber-600 rounded-full animate-bounce [animation-delay:0.1s]" />
            <span className="w-1 h-3 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1 h-5 bg-amber-700 rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-1 h-2.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.3s]" />
            <span className="text-[10px] font-medium ml-1">Modulated Voice</span>
          </div>
        )}
      </div>

      {/* 2. Floating Dialogue Cloud */}
      {text && (
        <div className="relative bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-200/80 text-slate-800 transition-all">
          <p className="text-sm sm:text-base leading-relaxed font-medium text-slate-700">
            {text}
          </p>

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span className="text-[11px]">Tom • Your Empathetic AI Friend</span>
            {onReplay && !isSpeaking && (
              <button
                onClick={onReplay}
                className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold cursor-pointer text-xs"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear again</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
