import React from 'react';
import { Orbit, Sparkles, Gauge, GaugeCircle } from 'lucide-react';
import { useTheme } from '../ThemeContext';

function ThemeToggle() {
  const { theme, setTheme, motionMode, setMotionMode } = useTheme();

  return (
    <div className="flex flex-col gap-2 bg-theme-primary/50 backdrop-blur-md p-1 rounded-xl border border-glass shadow-inner overflow-hidden">
      <div className="flex">
        <button
          onClick={() => setTheme('neon-quantum')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
            theme === 'neon-quantum'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary/30'
          }`}
        >
          <Orbit className="w-4 h-4" />
          <span>Neon Quantum</span>
        </button>
        <button
          onClick={() => setTheme('aurora-frost')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            theme === 'aurora-frost'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-theme-secondary hover:text-theme-primary'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Aurora Frost
        </button>
      </div>
      <button
        onClick={() => setMotionMode(motionMode === 'reduced' ? 'full' : 'reduced')}
        className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
          motionMode === 'reduced'
            ? 'bg-theme-secondary/80 border-glass text-theme-primary'
            : 'bg-brand-600/15 border-brand-500/30 text-brand-100'
        }`}
      >
        {motionMode === 'reduced' ? <Gauge className="w-4 h-4" /> : <GaugeCircle className="w-4 h-4" />}
        Motion: {motionMode === 'reduced' ? 'Reduced' : 'Full'}
      </button>
    </div>
  );
}

export default ThemeToggle;
