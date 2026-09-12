import React from 'react';
import { CharacterAction, EmotionType } from '../types';
import { Sparkles, Heart, Fish, Hand, Music, Mic, MicOff, Send, MessageSquare, Sliders, Volume2, VolumeX } from 'lucide-react';

interface InteractionBarProps {
  emotion: EmotionType;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  inputText: string;
  onInputChange: (val: string) => void;
  onSubmitMessage: (text?: string) => void;
  onToggleMic: () => void;
  onTriggerAction: (action: CharacterAction) => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  soundMuted: boolean;
  onToggleMute: () => void;
  disabled?: boolean;
}

export const InteractionBar: React.FC<InteractionBarProps> = ({
  emotion,
  isListening,
  isSpeaking,
  isThinking,
  inputText,
  onInputChange,
  onSubmitMessage,
  onToggleMic,
  onTriggerAction,
  onOpenSettings,
  onOpenHistory,
  soundMuted,
  onToggleMute,
  disabled = false,
}) => {
  const suggestions = [
    { label: '💭 Tell me something comforting', text: "I've had a stressful day today, could you offer some comforting thoughts?" },
    { label: '✨ Why do stars twinkle?', text: 'Why do stars twinkle in the night sky?' },
    { label: '💡 Creative inspiration', text: 'Give me a creative idea inspired by curiosity and compassion!' },
    { label: '🐱 Tell me a funny cat joke', text: 'Tell me a funny and witty joke!' },
  ];

  const actions: { id: CharacterAction; icon: React.ReactNode; label: string }[] = [
    { id: 'pet_head', icon: <Heart className="w-3.5 h-3.5" />, label: 'Pet Head' },
    { id: 'scratch_chin', icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Scratch Chin' },
    { id: 'give_treat', icon: <Fish className="w-3.5 h-3.5" />, label: 'Snack' },
    { id: 'high_five', icon: <Hand className="w-3.5 h-3.5" />, label: 'High Five' },
    { id: 'sing_song', icon: <Music className="w-3.5 h-3.5" />, label: 'Sing' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmitMessage();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-4 sm:pb-6 flex flex-col items-center gap-3 z-30 select-none">
      {/* 1. Interactive Action Buttons (Pet, Scratch, Treat, High Five, Sing) */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-slate-200/80 overflow-x-auto max-w-full">
        {actions.map((act) => (
          <button
            key={act.id}
            onClick={() => onTriggerAction(act.id)}
            disabled={disabled || isSpeaking}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 active:scale-95 transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer"
          >
            <span className="text-amber-500">{act.icon}</span>
            <span>{act.label}</span>
          </button>
        ))}

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button
          onClick={onToggleMute}
          title={soundMuted ? 'Unmute voice' : 'Mute voice'}
          className="p-1.5 text-slate-500 hover:text-amber-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          {soundMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenSettings}
          title="Voice and Companion settings"
          className="p-1.5 text-slate-500 hover:text-amber-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenHistory}
          title="View conversation log"
          className="p-1.5 text-slate-500 hover:text-amber-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Quick empathetic & curiosity conversation pills */}
      <div className="w-full flex items-center justify-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSubmitMessage(s.text)}
            disabled={disabled || isSpeaking || isThinking}
            className="px-3 py-1 bg-white/80 hover:bg-white text-slate-600 hover:text-amber-800 text-[11px] font-medium rounded-full border border-slate-200/70 shadow-2xs whitespace-nowrap transition-all active:scale-95 hover:border-amber-300 cursor-pointer"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 3. Main Input Bar with Voice Mic & Text Input */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 p-1.5 flex items-center gap-2">
        {/* Voice Chat Microphone Button */}
        <button
          onClick={onToggleMic}
          disabled={disabled || isSpeaking}
          title={isListening ? 'Click to stop listening' : 'Speak to Tom (Microphone)'}
          className={`relative p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
            isListening
              ? 'bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse'
              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
            </>
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Text Input Field */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? 'Listening to you speak...'
              : isThinking
              ? 'Tom is thinking with care...'
              : isSpeaking
              ? 'Tom is talking...'
              : 'Ask Tom a question, share how you feel...'
          }
          disabled={disabled || isSpeaking || isThinking}
          className="flex-1 bg-transparent px-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden disabled:opacity-60"
        />

        {/* Send Button */}
        <button
          onClick={() => onSubmitMessage()}
          disabled={disabled || !inputText.trim() || isSpeaking || isThinking}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-amber-600 text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
