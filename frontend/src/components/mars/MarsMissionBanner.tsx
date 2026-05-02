import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Activity, Clock, Star } from 'lucide-react';
import type { MarsFilters } from '../../types/mars';

interface RoverData {
  landing: string;
  location: string;
  status: string;
  sols: string;
  achievement: string;
  active: boolean;
}

const ROVER_DATA: Record<MarsFilters['rover'], RoverData> = {
  curiosity: {
    landing: 'Aug 6, 2012',
    location: 'Gale Crater',
    status: 'Active',
    sols: '4,500+',
    achievement: 'Confirmed ancient habitable lake environment (2013)',
    active: true,
  },
  perseverance: {
    landing: 'Feb 18, 2021',
    location: 'Jezero Crater',
    status: 'Active',
    sols: '1,500+',
    achievement: 'First powered flight on another planet — Ingenuity helicopter (2021)',
    active: true,
  },
  opportunity: {
    landing: 'Jan 25, 2004',
    location: 'Meridiani Planum',
    status: 'Ended Feb 2019',
    sols: '5,111',
    achievement: 'Operated 55× its planned 90-day mission lifetime',
    active: false,
  },
  spirit: {
    landing: 'Jan 4, 2004',
    location: 'Gusev Crater',
    status: 'Ended Mar 2010',
    sols: '2,208',
    achievement: 'Discovered silica deposits from ancient hydrothermal activity',
    active: false,
  },
};

interface Props {
  rover: MarsFilters['rover'];
}

export const MarsMissionBanner: React.FC<Props> = ({ rover }) => {
  const data = ROVER_DATA[rover];

  return (
    <motion.div
      key={rover}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.215, 0.61, 0.355, 1] }}
      className="glass-panel p-5 rounded-2xl mb-6 border border-white/10"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display text-sm uppercase tracking-[0.2em] text-electric-blue">
            Mission Briefing — {rover}
          </h2>
          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase tracking-widest border ${
              data.active
                ? 'text-green-400 bg-green-500/10 border-green-500/30'
                : 'text-gray-500 bg-white/5 border-white/10'
            }`}
          >
            {data.active && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 motion-safe:animate-pulse" />
            )}
            {data.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat icon={<Calendar className="w-3.5 h-3.5" />} label="Landing" value={data.landing} />
          <Stat icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={data.location} />
          <Stat icon={<Clock className="w-3.5 h-3.5" />} label="Sols Active" value={data.sols} />
          <Stat icon={<Activity className="w-3.5 h-3.5" />} label="Mission" value="NASA JPL" />
        </div>

        <div className="flex items-start gap-2 pt-1 border-t border-white/5">
          <Star className="w-3.5 h-3.5 text-electric-blue shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-white font-semibold">Key achievement: </span>
            {data.achievement}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/5">
      <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-electric-blue font-mono mb-1">
        {icon} {label}
      </p>
      <p className="text-sm text-white font-semibold truncate">{value}</p>
    </div>
  );
}
