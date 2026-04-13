import React from 'react';
import type { MarsFilters as MarsFiltersType } from '../../types/mars';
import { Camera, Calendar, Flag } from 'lucide-react';

interface Props {
  filters: MarsFiltersType;
  onFilterChange: (filters: MarsFiltersType) => void;
}

const ROVERS = ['curiosity', 'perseverance', 'opportunity', 'spirit'] as const;
const CAMERAS = [
  { id: 'FHAZ', name: 'Front Hazard Avoidance Camera' },
  { id: 'RHAZ', name: 'Rear Hazard Avoidance Camera' },
  { id: 'MAST', name: 'Mast Camera' },
  { id: 'CHEMCAM', name: 'Chemistry and Camera Complex' },
  { id: 'MAHLI', name: 'Mars Hand Lens Imager' },
  { id: 'MARDI', name: 'Mars Descent Imager' },
  { id: 'NAVCAM', name: 'Navigation Camera' },
  { id: 'PANCAM', name: 'Panoramic Camera' },
  { id: 'MINITES', name: 'Miniature Thermal Emission Spectrometer (Mini-TES)' },
];

export const MarsFilters: React.FC<Props> = ({ filters, onFilterChange }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl mb-8 border border-white/10 shadow-[0_0_20px_rgba(0,240,255,0.05)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Rover Selection */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-electric-blue">
            <Flag className="w-4 h-4" /> Select Rover
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ROVERS.map((rover) => (
              <button
                key={rover}
                onClick={() => onFilterChange({ ...filters, rover })}
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

        {/* Camera Selection */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-electric-blue">
            <Camera className="w-4 h-4" /> Camera
          </label>
          <div className="relative">
            <select
              value={filters.camera}
              onChange={(e) => onFilterChange({ ...filters, camera: e.target.value })}
              className="w-full bg-space-navy border border-white/20 rounded-xl px-4 py-3 appearance-none text-white focus:outline-none focus:border-electric-blue transition-colors cursor-pointer text-sm"
            >
              {CAMERAS.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.id} - {cam.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
              ▼
            </div>
          </div>
        </div>

        {/* Sol Date Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-electric-blue">
              <Calendar className="w-4 h-4" /> Martian Sol
            </label>
            <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded text-sm">
              Sol {filters.sol}
            </span>
          </div>
          <div className="pt-2">
            <input
              type="range"
              min="0"
              max="4000"
              step="10"
              value={filters.sol}
              onChange={(e) => onFilterChange({ ...filters, sol: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-space-navy rounded-lg appearance-none cursor-pointer accent-electric-blue"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2">
              <span>0 (Landing)</span>
              <span>4000+</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
