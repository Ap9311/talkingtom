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
        <div className="relative w-full h-full bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]">
          {/* Radiant warm sunbeam lighting in the background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[750px] aspect-square bg-gradient-radial from-amber-200/40 via-orange-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[85vw] max-w-[650px] h-[220px] bg-blue-900/5 rounded-full blur-2xl pointer-events-none" />

          {/* Gentle school accent watermarks in corners */}
          <div className="hidden lg:block absolute bottom-4 left-6 opacity-30 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            New Era Global School
          </div>
          <div className="hidden lg:block absolute bottom-4 right-6 opacity-30 text-xs font-semibold tracking-wider text-amber-700">
            Curiosity • Creativity • Compassion
          </div>
        </div>
      )}

      {/* 2. NEGS Campus Study Room */}
      {theme === 'negs-room' && (
        <div className="relative w-full h-full">
          {/* Campus Room Image */}
          <img
            src="/src/assets/images/avatar_room_bg_1789204803753.jpg"
            alt="NEGS Campus Room"
            className={`w-full h-full object-cover object-center ${blur ? 'filter blur-xs' : ''}`}
            referrerPolicy="no-referrer"
          />

          {/* Soft warm environmental vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-slate-900/15" />
        </div>
      )}

      {/* 3. Clean Modern Studio */}
      {theme === 'clean-studio' && (
        <div className="relative w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900">
          {/* Studio spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] max-w-[800px] h-[500px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80vw] max-w-[600px] h-[220px] bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      )}
    </div>
  );
};

