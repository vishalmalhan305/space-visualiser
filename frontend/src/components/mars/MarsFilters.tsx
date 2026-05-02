import React from 'react';
import type { MarsFilters as MarsFiltersType } from '../../types/mars';
import { Flag } from 'lucide-react';

interface Props {
  filters: MarsFiltersType;
  onFilterChange: (filters: MarsFiltersType) => void;
}

const ROVERS = ['curiosity', 'perseverance', 'opportunity', 'spirit'] as const;

export const MarsFilters: React.FC<Props> = ({ filters, onFilterChange }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl mb-8 border border-white/10 shadow-[0_0_20px_rgba(0,240,255,0.05)]">
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-electric-blue">
          <Flag className="w-4 h-4" /> Select Rover
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ROVERS.map((rover) => (
            <button
              key={rover}
              onClick={() => onFilterChange({ rover })}
              className={`py-2 px-3 rounded-lg text-sm font-semibold capitalize transition-all duration-300 border ${
                filters.rover === rover
                  ? 'bg-electric-blue text-space-dark border-electric-blue shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {rover}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
