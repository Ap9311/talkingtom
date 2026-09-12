import React from 'react';
import { ChatMessage } from '../types';
import { X, Volume2, Trash2, MessageSquare, Sparkles } from 'lucide-react';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onClear: () => void;
  onReplay: (text: string) => void;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onClear,
  onReplay,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Conversation Log</h3>
              <p className="text-[11px] text-slate-500">{messages.length} messages shared</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={onClear}
                title="Clear conversation"
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Sparkles className="w-10 h-10 mb-3 text-amber-300" />
              <p className="font-semibold text-slate-600 text-sm">No messages yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Speak to Tom via the microphone or type any question to start an empathetic conversation!
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {m.sender === 'user' ? 'You' : 'Tom'}
                  </span>
                  {m.emotion && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100/70 text-amber-800 font-medium">
                      {m.emotion}
                    </span>
                  )}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-amber-500 text-white rounded-br-xs shadow-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.sender === 'tom' && (
                    <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex justify-end">
                      <button
                        onClick={() => onReplay(m.text)}
                        className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-medium cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay audio</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
