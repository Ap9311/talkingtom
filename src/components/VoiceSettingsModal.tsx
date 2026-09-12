import React from 'react';
import { VoiceSettings, VoiceTone, EnvironmentTheme } from '../types';
import { Volume2, Sliders, X, Sparkles, Image as ImageIcon } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: Partial<VoiceSettings>) => void;
  currentTheme: EnvironmentTheme;
  onChangeTheme: (theme: EnvironmentTheme) => void;
  onTestVoice: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  currentTheme,
  onChangeTheme,
  onTestVoice,
}) => {
  if (!isOpen) return null;

  const tones: { id: VoiceTone; label: string; desc: string }[] = [
    { id: 'warm', label: 'Warm Friend', desc: 'Gentle, affectionate, empathetic pitch' },
    { id: 'playful', label: 'Playful & Animated', desc: 'Bright, energetic, higher pitch' },
    { id: 'mentor', label: 'Thoughtful Mentor', desc: 'Calm, grounded, reassuring pitch' },
    { id: 'natural', label: 'Natural Voice', desc: 'Standard balanced conversational tone' },
  ];

  const environments: { id: EnvironmentTheme; label: string; desc: string }[] = [
    { id: 'negs-official', label: 'Official NEGS Environment', desc: 'Clean sunburst crest & school motto' },
    { id: 'negs-room', label: 'Campus Study Lounge', desc: 'Warm 3D sunlit room with mounted crest' },
    { id: 'clean-studio', label: 'Modern Studio Stage', desc: 'Sleek dark illuminated stage' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Voice & Companion Settings</h3>
              <p className="text-xs text-slate-500">Tune Tom's voice modulation and backdrop</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Voice Tone Presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 block">
              Voice Modulation Preset
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {tones.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ tone: t.id })}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    settings.tone === t.id
                      ? 'border-amber-500 bg-amber-50/60 shadow-xs ring-2 ring-amber-400/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className={`block font-semibold text-xs ${settings.tone === t.id ? 'text-amber-900' : 'text-slate-800'}`}>
                    {t.label}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders for Pitch and Rate */}
          <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Voice Pitch Modulation</span>
                <span className="text-amber-600">{settings.pitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={settings.pitch}
                onChange={(e) => onUpdateSettings({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Deeper</span>
                <span>Default</span>
                <span>Playful / Higher</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Speaking Cadence (Speed)</span>
                <span className="text-amber-600">{settings.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={settings.rate}
                onChange={(e) => onUpdateSettings({ rate: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Relaxed</span>
                <span>Normal</span>
                <span>Brisk</span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">Auto-speak incoming answers</span>
              <button
                onClick={() => onUpdateSettings({ autoSpeak: !settings.autoSpeak })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoSpeak ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoSpeak ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Test Voice Button */}
          <button
            onClick={onTestVoice}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors active:scale-98"
          >
            <Volume2 className="w-4 h-4" />
            <span>Test Tom's Voice</span>
          </button>

          {/* Environment Switcher */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Background Environment</span>
            </label>
            <div className="space-y-2">
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => onChangeTheme(env.id)}
                  className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all ${
                    currentTheme === env.id
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-xs ring-2 ring-indigo-400/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <span className={`block font-semibold text-xs ${currentTheme === env.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {env.label}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">{env.desc}</span>
                  </div>
                  {currentTheme === env.id && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
