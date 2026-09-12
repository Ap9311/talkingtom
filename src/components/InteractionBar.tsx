import React from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

interface InteractionBarProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  inputText: string;
  onInputChange: (val: string) => void;
  onSubmitMessage: (text?: string) => void;
  onToggleMic: () => void;
  disabled?: boolean;
}

export const InteractionBar: React.FC<InteractionBarProps> = ({
  isListening,
  isSpeaking,
  isThinking,
  inputText,
  onInputChange,
  onSubmitMessage,
  onToggleMic,
  disabled = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmitMessage();
    }
  };

  return (
    <div
      className="w-full max-w-xl mx-auto px-2 sm:px-4 pb-2 sm:pb-4 flex flex-col items-center z-30 select-none"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Chatting Bar with Voice Mic & Text Input */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 p-1 sm:p-1.5 flex items-center gap-1.5 sm:gap-2">
        {/* Voice Chat Microphone Button */}
        <button
          onClick={onToggleMic}
          disabled={disabled || isSpeaking}
          title={isListening ? 'Click to stop listening' : 'Talk to Tom (Microphone)'}
          aria-label={isListening ? 'Stop listening' : 'Talk to Tom'}
          className={`relative p-2.5 sm:p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer min-w-[42px] min-h-[42px] sm:min-w-[46px] sm:min-h-[46px] shrink-0 ${
            isListening
              ? 'bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse'
              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-600"></span>
              </span>
            </>
          ) : (
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Input field */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? 'Listening to you speak...'
              : isThinking
              ? 'Tom is reacting...'
              : isSpeaking
              ? 'Tom is talking...'
              : 'Say or type something to Tom...'
          }
          disabled={disabled || isSpeaking || isThinking}
          className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden disabled:opacity-60 min-w-0"
        />

        {/* Send Button */}
        <button
          onClick={() => onSubmitMessage()}
          disabled={disabled || !inputText.trim() || isSpeaking || isThinking}
          title="Send"
          aria-label="Send"
          className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-amber-600 text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] flex items-center justify-center shrink-0"
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};



