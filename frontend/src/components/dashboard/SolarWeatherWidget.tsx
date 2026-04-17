import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRecentWeather } from '../../hooks/useWeather';
import { useWeatherPaginated } from '../../hooks/useWeatherPaginated';
import { Sun, Flame, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, Activity } from 'lucide-react';
import type { SpaceWeatherEvent, SpaceWeatherEventType } from '../../types/dashboard';

const statusColors = {
  Nominal:  { bg: 'bg-green-500/15',  border: 'border-green-500/40',  text: 'text-green-400'  },
  Elevated: { bg: 'bg-amber-500/15',  border: 'border-amber-500/40',  text: 'text-amber-400'  },
  High:     { bg: 'bg-orange-500/15', border: 'border-orange-500/40', text: 'text-orange-400' },
  Extreme:  { bg: 'bg-red-500/15',    border: 'border-red-500/40',    text: 'text-red-400'    },
} as const;

type StatusKey = keyof typeof statusColors;

function getStatusFromEvents(events: SpaceWeatherEvent[] = []): { status: StatusKey; peakFlare: string } {
  if (events.length === 0) return { status: 'Nominal', peakFlare: 'Quiet' };

  let maxClass = 'Quiet';
  let status: StatusKey = 'Nominal';

  events.forEach(e => {
    if (e.classType?.startsWith('X')) {
      status = 'Extreme';
      maxClass = e.classType;
    } else if (e.classType?.startsWith('M') && status !== 'Extreme') {
      status = 'High';
      maxClass = e.classType;
    } else if (e.classType?.startsWith('C') && status === 'Nominal') {
      status = 'Elevated';
      maxClass = e.classType;
    }
  });

  return { status, peakFlare: maxClass };
}

export function SolarWeatherWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<SpaceWeatherEventType | undefined>(undefined);

  const { data: recentEvents, isLoading: isRecentLoading } = useRecentWeather(7);
  const { data: paginated, isLoading: isPaginatedLoading } = useWeatherPaginated(page, 10, typeFilter);

  const { status, peakFlare } = getStatusFromEvents(recentEvents);
  const colors = statusColors[status];

  return (
    <motion.div layout className="glass-panel rounded-xl overflow-hidden flex flex-col transition-all duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Sun className="text-amber-400 w-5 h-5" />
          <h2 className="font-display text-sm tracking-widest uppercase text-white">
            Solar Observation
          </h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-white/5 rounded transition-colors text-gray-500 hover:text-white"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Main Status Display */}
      <div className="px-5 py-5 flex items-center gap-4">
        {isRecentLoading ? (
          <div className="h-20 w-full rounded-xl bg-white/10 animate-pulse-subtle" />
        ) : (
          <>
            <div className={`flex-1 rounded-xl border px-4 py-4 ${colors.bg} ${colors.border} transition-colors duration-700`}>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Atmospheric Index
              </p>
              <div className="flex items-center gap-3">
                <Activity className={`w-5 h-5 ${colors.text} animate-pulse`} />
                <p className={`text-2xl font-display font-bold ${colors.text}`}>
                  {status}
                </p>
              </div>
            </div>
            <div className="text-center bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4 min-w-[100px]">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Max Class
              </p>
              <p className={`text-3xl font-display font-black ${colors.text}`}>
                {peakFlare === 'Quiet' ? 'N/A' : peakFlare.split('.')[0]}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Expanded Controls: Filters & Pagination */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.215, 0.61, 0.355, 1] }}
            className="overflow-hidden bg-white/[0.02] border-t border-b border-white/5 px-5 py-3 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <select
                value={typeFilter || ''}
                onChange={(e) => {
                  setTypeFilter(e.target.value === '' ? undefined : e.target.value as SpaceWeatherEventType);
                  setPage(0);
                }}
                className="bg-white/5 border border-white/10 text-gray-300 text-[10px] font-mono rounded-md px-2 py-1.5 focus:outline-none focus:border-electric-blue/50 uppercase tracking-widest"
              >
                <option value="">ALL EVENTS</option>
                <option value="FLARE">SOLAR FLARES</option>
                <option value="CME">EJECTIONS (CME)</option>
                <option value="GST">STORM (GST)</option>
                <option value="SEP">PARTICLES (SEP)</option>
              </select>
              {paginated && (
                 <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wide">
                   {paginated.totalElements} Records
                 </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: page === 0 || isPaginatedLoading ? 1 : 1.03 }}
                whileTap={{ scale: page === 0 || isPaginatedLoading ? 1 : 0.98 }}
                disabled={page === 0 || isPaginatedLoading}
                onClick={() => setPage(p => p - 1)}
                className="p-1 hover:bg-white/10 disabled:opacity-30 rounded transition-colors text-amber-400"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                LOG {page + 1}/{paginated?.totalPages || 1}
              </span>
              <motion.button
                whileHover={{ scale: (paginated && page >= paginated.totalPages - 1) || isPaginatedLoading ? 1 : 1.03 }}
                whileTap={{ scale: (paginated && page >= paginated.totalPages - 1) || isPaginatedLoading ? 1 : 0.98 }}
                disabled={(paginated && page >= paginated.totalPages - 1) || isPaginatedLoading}
                onClick={() => setPage(p => p + 1)}
                className="p-1 hover:bg-white/10 disabled:opacity-30 rounded transition-colors text-amber-400"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      <div className={`px-5 py-2 space-y-2 flex-1 transition-all duration-500 ${isExpanded ? 'max-h-[500px]' : 'max-h-[160px]'} overflow-y-auto custom-scrollbar`}>
        {!isExpanded && (
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-3 sticky top-0 bg-space-dark/80 backdrop-blur-sm py-1">
            Real-Time Feed
          </p>
        )}
        
        {(isExpanded ? isPaginatedLoading : isRecentLoading) ? (
          <>
            <div className="h-10 rounded-lg bg-white/5 animate-pulse-subtle" />
            <div className="h-10 rounded-lg bg-white/5 animate-pulse-subtle" />
            <div className="h-10 rounded-lg bg-white/5 animate-pulse-subtle" />
          </>
        ) : (
          (isExpanded ? paginated?.content : recentEvents?.slice(0, 3))?.map((e) => (
            <div
              key={e.eventId}
              className="flex items-center justify-between bg-white/[0.04] border border-white/5 hover:border-white/20 rounded-lg px-4 py-3 group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-md ${e.classType?.startsWith('X') ? 'bg-red-500/20' : 'bg-white/5'} group-hover:scale-110 transition-transform`}>
                  <Flame className={`w-3.5 h-3.5 ${e.classType?.startsWith('X') ? 'text-red-400' : 'text-amber-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-mono font-bold tracking-wider">
                      {e.classType || e.type}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 font-mono tracking-tighter">
                      {e.type}
                    </span>
                  </div>
                  <p className="text-gray-500 text-[9px] font-mono truncate max-w-[150px]">
                    {e.sourceLocation || 'Remote Sensor'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-[10px] font-mono">
                  {new Date(e.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-gray-600 text-[9px] font-mono">
                   {new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}Z
                </p>
              </div>
            </div>
          ))
        )}

        {!isExpanded && recentEvents && recentEvents.length > 3 && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="w-full py-2 text-[9px] font-mono text-gray-600 hover:text-amber-400 transition-colors uppercase tracking-[0.2em]"
            >
              Expand Detailed Archive ({recentEvents.length - 3} More)
            </button>
        )}
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-white/[0.01]">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] font-mono font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
        >
          {isExpanded ? 'Minimize Log' : 'Event Archive'}
        </button>
        <a
          href="/#solar"
          className="flex items-center gap-2 text-[10px] font-mono font-bold text-amber-400/80 hover:text-amber-400 transition-all uppercase tracking-widest"
        >
          Detailed Telemetry <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}
