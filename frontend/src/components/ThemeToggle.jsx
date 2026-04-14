import React from 'react';
import { Moon, Briefcase } from 'lucide-react';
import { useTheme } from '../ThemeContext';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex bg-theme-primary/50 backdrop-blur-md p-1 rounded-xl border border-glass shadow-inner overflow-hidden">
      <button
        onClick={() => setTheme('deep-space')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
          theme === 'deep-space'
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary/30'
        }`}
      >
        <Moon className="w-4 h-4" />
        <span>Deep Space</span>
      </button>
      <button
        onClick={() => setTheme('corporate-clean')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
          theme === 'corporate-clean'
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-theme-secondary hover:text-theme-primary'
        }`}
      >
        <Briefcase className="w-4 h-4" />
        Corporate Clean
      </button>
    </div>
  );
}

export default ThemeToggle;
