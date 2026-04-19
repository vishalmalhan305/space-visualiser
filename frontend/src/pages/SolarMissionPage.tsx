import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useWeatherPaginated } from '../hooks/useWeatherPaginated';
import { useRecentWeather } from '../hooks/useWeather';
import { EventTimeline } from '../components/SpaceWeather/EventTimeline';
import {
  Sun, Activity, ArrowLeft, ArrowRight, ChevronLeft,
  Zap, Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SpaceWeatherEventType, SpaceWeatherEvent } from '../types/dashboard';

const statusColors = {
  Nominal:  { text: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/40'  },
  Elevated: { text: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/40'  },
  High:     { text: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40' },
  Extreme:  { text: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40'    },
} as const;
type StatusKey = keyof typeof statusColors;

function getStatus(events: SpaceWeatherEvent[] = []): { status: StatusKey; peakFlare: string } {
  if (!events.length) return { status: 'Nominal', peakFlare: 'Quiet' };
  let status: StatusKey = 'Nominal';
  let peakFlare = 'Quiet';
  events.forEach(e => {
    if (e.classType?.startsWith('X')) { status = 'Extreme'; peakFlare = e.classType; }
    else if (e.classType?.startsWith('M') && status !== 'Extreme') { status = 'High'; peakFlare = e.classType; }
    else if (e.classType?.startsWith('C') && status === 'Nominal') { status = 'Elevated'; peakFlare = e.classType; }
  });
  return { status, peakFlare };
}

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages: (number | '…')[] = [0];
  if (current > 2) pages.push('…');
  for (let p = Math.max(1, current - 1); p <= Math.min(total - 2, current + 1); p++) pages.push(p);
  if (current < total - 3) pages.push('…');
  pages.push(total - 1);
  return pages;
}

const EVENT_TYPES: { value: SpaceWeatherEventType | ''; label: string }[] = [
  { value: '', label: 'All Events' },
  { value: 'FLARE', label: 'Solar Flares' },
  { value: 'CME', label: 'CME Ejections' },
  { value: 'GST', label: 'Geomagnetic Storms' },
  { value: 'SEP', label: 'Solar Particles' },
];

export function SolarMissionPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<SpaceWeatherEventType | undefined>();
  const [jumpInput, setJumpInput] = useState('');
  const jumpRef = useRef<HTMLInputElement>(null);

  const { data: recentEvents } = useRecentWeather(7);
  const { data: paginated, isLoading, isError, refetch } = useWeatherPaginated(page, 10, typeFilter);

  const { status, peakFlare } = getStatus(recentEvents);
  const colors = statusColors[status];
  const totalPages = paginated?.totalPages ?? 1;

  const handleJump = () => {
    const n = parseInt(jumpInput, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      setPage(n - 1);
      setJumpInput('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Back nav */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Dashboard
      </button>

      {/* Page header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Sun className="w-9 h-9 text-amber-400" />
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight">
              Solar Mission Control
            </h1>
          </div>
          <p className="text-gray-400 font-sans max-w-xl">
            Real-time DONKI space weather events from NASA. Click any event to expand the AI mission briefing.
          </p>
        </div>

        {/* Live status badge */}
        <div className={`flex-shrink-0 flex items-center gap-4 ${colors.bg} ${colors.border} border rounded-xl px-5 py-4 transition-colors duration-700`}>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-gray-500 font-mono mb-0.5">
              Atmospheric Index
            </p>
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${colors.text} motion-safe:animate-pulse`} />
              <span className={`text-xl font-display font-bold ${colors.text}`}>{status}</span>
            </div>
          </div>
          <div className="border-l border-white/10 pl-4">
            <p className="text-[9px] uppercase tracking-widest text-gray-500 font-mono mb-0.5">
              Peak Class
            </p>
            <p className={`text-2xl font-display font-black ${colors.text}`}>
              {peakFlare === 'Quiet' ? 'N/A' : peakFlare.split('.')[0]}
            </p>
          </div>
          <div className="border-l border-white/10 pl-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 motion-safe:animate-pulse" />
              <span className="text-[9px] font-mono text-green-400 uppercase tracking-widest">Live</span>
            </div>
            <p className="text-[9px] text-gray-600 font-mono mt-0.5">NASA DONKI</p>
          </div>
        </div>
      </div>

      {/* Filter + Pagination bar */}
      <div className="glass-panel rounded-xl px-5 py-3 mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Type filter */}
        <div className="flex items-center gap-3">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setTypeFilter(value === '' ? undefined : value); setPage(0); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all ${
                  (typeFilter ?? '') === value
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-3">
          {paginated && (
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest hidden sm:block">
              {paginated.totalElements} records
            </span>
          )}
          <button
            disabled={page === 0 || isLoading}
            onClick={() => setPage(p => p - 1)}
            aria-label="Previous page"
            className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-md transition-colors text-amber-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-gray-400 w-16 text-center">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={(paginated ? page >= paginated.totalPages - 1 : true) || isLoading}
            onClick={() => setPage(p => p + 1)}
            aria-label="Next page"
            className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-md transition-colors text-amber-400"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          {/* Jump to page */}
          {totalPages > 2 && (
            <div className="flex items-center gap-1 border-l border-white/10 pl-3">
              <input
                ref={jumpRef}
                type="number"
                min={1}
                max={totalPages}
                value={jumpInput}
                onChange={e => setJumpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJump()}
                placeholder="pg"
                aria-label="Jump to page number"
                className="w-12 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-amber-400/50 text-center"
              />
              <button
                onClick={handleJump}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 hover:text-white hover:border-white/20 transition-all"
              >
                <Zap className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mission Control telemetry strip */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-1">
        {[
          { label: 'DATA RELAY', value: 'NOMINAL', color: 'text-green-400' },
          { label: 'SENSOR NET', value: 'NASA DONKI v4', color: 'text-electric-blue' },
          { label: 'WINDOW', value: 'PAGINATED LOG', color: 'text-gray-400' },
          { label: 'AI STATUS', value: 'ONLINE', color: 'text-indigo-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1.5 shrink-0">
            <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">{label}:</span>
            <span className={`text-[9px] font-mono ${color} uppercase tracking-widest`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <EventTimeline
        events={paginated?.content}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
      />

      {/* Bottom pagination mirror */}
      {!isLoading && paginated && paginated.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-white/5">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="p-2 hover:bg-white/10 disabled:opacity-30 rounded-md transition-colors text-amber-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            {getPageNumbers(page, totalPages).map((item, i) =>
              item === '…' ? (
                <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-[10px] font-mono text-gray-600 select-none">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`w-7 h-7 rounded-md text-[10px] font-mono transition-all ${
                    item === page
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                      : 'text-gray-500 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item + 1}
                </button>
              )
            )}
          </div>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="p-2 hover:bg-white/10 disabled:opacity-30 rounded-md transition-colors text-amber-400"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
