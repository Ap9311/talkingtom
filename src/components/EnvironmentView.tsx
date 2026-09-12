import React from 'react';
import { EnvironmentTheme } from '../types';

interface EnvironmentViewProps {
  theme: EnvironmentTheme;
  blur?: boolean;
}

export const EnvironmentView: React.FC<EnvironmentViewProps> = ({ theme, blur = false }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" id="environment-container">
      {/* 1. Official NEGS School Environment */}
      {theme === 'negs-official' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex flex-col items-center justify-between">
          {/* Subtle sunbeam radiant glow in the background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-radial from-amber-200/40 via-orange-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-blue-900/5 rounded-full blur-2xl pointer-events-none" />

          {/* Top Elegant School Crest / Banner */}
          <div className="relative z-10 pt-6 px-6 max-w-2xl w-full flex flex-col items-center text-center">
            <div className="bg-white/85 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 transition-all hover:shadow-md">
              <img
                src="/negs-logo.svg"
                alt="New Era Global School Logo"
                className="h-12 w-auto max-w-[280px] sm:max-w-[340px] object-contain drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* School Values Pill at bottom */}
          <div className="relative z-10 pb-4 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full border border-amber-300/50 shadow-xs flex items-center gap-3 text-xs font-semibold text-slate-700 tracking-wide">
              <span className="text-amber-600">★ Curiosity</span>
              <span className="text-slate-300">•</span>
              <span className="text-red-600">★ Creativity</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-900">★ Compassion</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. NEGS Campus Study Room */}
      {theme === 'negs-room' && (
        <div className="relative w-full h-full">
          {/* Generated 3D Campus Room Image */}
          <img
            src="/src/assets/images/avatar_room_bg_1789204803753.jpg"
            alt="NEGS Campus Room"
            className={`w-full h-full object-cover object-center ${blur ? 'filter blur-xs' : ''}`}
            referrerPolicy="no-referrer"
          />

          {/* Soft warm environmental vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-slate-900/20" />

          {/* Mounted School Crest Wall Sign */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-white/90 backdrop-blur-md px-5 py-2 rounded-xl shadow-md border border-white/60">
              <img
                src="/negs-logo.svg"
                alt="New Era Global School"
                className="h-9 sm:h-11 w-auto max-w-[260px] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Clean Modern Studio */}
      {theme === 'clean-studio' && (
        <div className="relative w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-between">
          {/* Gentle studio spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Modern illuminated top badge */}
          <div className="relative z-10 pt-6">
            <div className="bg-slate-900/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-700/60 shadow-lg flex items-center gap-3">
              <img
                src="/negs-logo.svg"
                alt="New Era Global School"
                className="h-10 w-auto object-contain brightness-105"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="relative z-10 pb-4">
            <span className="text-[11px] uppercase tracking-widest text-indigo-300/80 font-medium">
              New Era Global School • AI Interactive Companion
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
