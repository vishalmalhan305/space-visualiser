import { useState, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAsteroidsPaginated } from '../hooks/useAsteroidsPaginated';
import { OrbitModal } from '../components/dashboard/OrbitModal';
import {
  AlertTriangle, Radar, Filter, ArrowLeft, ArrowRight,
  Calendar, ArrowUpDown, Eye, ChevronLeft, X, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Asteroid } from '../types/dashboard';

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
      <div className="h-3 w-3 rounded-full bg-white/10 motion-safe:animate-pulse-subtle" />
      <div className="h-3 flex-1 rounded bg-white/10 motion-safe:animate-pulse-subtle" />
      <div className="h-3 w-20 rounded bg-white/10 motion-safe:animate-pulse-subtle" />
    </div>
  );
}

const RED_HAZARD_THRESHOLD_KM = 7_500_000;

export function AsteroidDetailPage() {
  const navigate = useNavigate();
  const jumpRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState('closeApproachDate');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hazardousOnly, setHazardousOnly] = useState(false);
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);
  const [jumpInput, setJumpInput] = useState('');

  const hasFilters = !!(startDate || endDate || hazardousOnly);

  const dateError = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    if (end < start) return 'End date must be after start date.';
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) return 'Date range cannot exceed 7 days.';
    return null;
  }, [startDate, endDate]);

  const filters = useMemo(() => ({
    start: (!dateError && startDate) ? startDate : undefined,
    end: (!dateError && endDate) ? endDate : undefined,
    hazardous: hazardousOnly || undefined,
    sortBy,
    sortDir,
  }), [startDate, endDate, dateError, hazardousOnly, sortBy, sortDir]);

  const { data: paginated, isLoading } = useAsteroidsPaginated(page, 10, filters);
  const totalPages = paginated?.totalPages ?? 1;

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(field); setSortDir('DESC'); }
    setPage(0);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setHazardousOnly(false);
    setPage(0);
  };

  const handleJump = () => {
    const n = parseInt(jumpInput, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      setPage(n - 1);
      setJumpInput('');
    }
  };

  const getHazardTier = (ast: Asteroid) => {
    if (!ast.potentiallyHazardous) return 'safe';
    if (ast.missDistanceKm < RED_HAZARD_THRESHOLD_KM) return 'critical';
    return 'warning';
  };

  const SortHeader = ({ field, label, align = 'right' }: { field: string; label: string; align?: 'left' | 'right' }) => (
    <th
      className={`px-4 py-3 text-${align} font-semibold cursor-pointer hover:text-white transition-colors`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : ''} gap-1.5`}>
        {label}
        <ArrowUpDown className={`w-2.5 h-2.5 ${sortBy === field ? 'text-electric-blue' : ''}`} />
      </div>
    </th>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.215, 0.61, 0.355, 1] }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Page Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </button>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 flex items-center gap-4">
          <Radar className="w-10 h-10 text-electric-blue" />
          NEO Intelligence Ledger
        </h1>
        <p className="text-gray-400 max-w-2xl text-lg font-sans">
          Query the near-Earth object database. Filter by date range, hazard status, and sort by any orbital parameter.
        </p>
      </div>

      {/* Filters Bar */}
      <div
        className="glass-panel rounded-xl px-5 py-4 mb-6"
        aria-busy={isLoading}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-start gap-4">
            {/* Date Controls */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest pl-1">
                Date Range <span className="text-amber-500/80">(max 7 days)</span>
              </label>
              <div className={`flex items-center gap-2 bg-white/5 border p-1 rounded-lg transition-colors ${dateError ? 'border-red-500/40' : 'border-white/10'}`}>
                <Calendar className="w-3.5 h-3.5 text-gray-500 ml-2 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  disabled={isLoading}
                  aria-label="Start date"
                  onChange={e => { setStartDate(e.target.value); setPage(0); }}
                  className="bg-transparent text-[10px] font-mono text-white border-none focus:ring-0 w-28 p-1 disabled:opacity-50"
                />
                <span className="text-gray-600 text-[10px]">→</span>
                <input
                  type="date"
                  value={endDate}
                  disabled={isLoading}
                  aria-label="End date"
                  aria-describedby={dateError ? 'date-error' : undefined}
                  onChange={e => { setEndDate(e.target.value); setPage(0); }}
                  className="bg-transparent text-[10px] font-mono text-white border-none focus:ring-0 w-28 p-1 disabled:opacity-50"
                />
              </div>
              <AnimatePresence>
                {dateError && (
                  <motion.p
                    id="date-error"
                    role="alert"
                    aria-live="assertive"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-red-400 text-[10px] font-mono font-semibold pl-1"
                  >
                    {dateError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Hazardous filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest pl-1">
                Hazard Filter
              </label>
              <button
                disabled={isLoading}
                onClick={() => { setHazardousOnly(!hazardousOnly); setPage(0); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all disabled:opacity-50 ${
                  hazardousOnly
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <Filter className="w-3 h-3" />
                {hazardousOnly ? 'HAZARDOUS ONLY' : 'ALL OBJECTS'}
              </button>
            </div>

            {/* Clear filters */}
            <AnimatePresence>
              {hasFilters && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col gap-1.5"
                >
                  <label className="text-[9px] font-mono text-transparent uppercase tracking-widest pl-1 select-none">
                    &nbsp;
                  </label>
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    <X className="w-3 h-3" /> Clear Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-3 self-end">
            {paginated && (
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest hidden sm:block">
                {paginated.totalElements} Matches
              </span>
            )}
            <button
              disabled={page === 0 || isLoading}
              onClick={() => setPage(p => p - 1)}
              aria-label="Previous page"
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-md transition-colors text-electric-blue"
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
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-md transition-colors text-electric-blue"
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
                  className="w-12 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-electric-blue/50 text-center"
                />
                <button
                  onClick={handleJump}
                  className="flex items-center px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 hover:text-white hover:border-white/20 transition-all"
                  aria-label="Go to page"
                >
                  <Zap className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-2">
              {[...Array(10)].map((_, i) => <RowSkeleton key={i} />)}
            </div>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-space-dark/95 backdrop-blur-md z-10">
                <tr className="text-gray-500 uppercase text-[9px] tracking-widest border-b border-white/5">
                  <SortHeader field="name" label="Name" align="left" />
                  <SortHeader field="size" label="Ø km" />
                  <SortHeader field="closeApproachDate" label="Date" />
                  <SortHeader field="missDistance" label="Miss Dist." />
                  <SortHeader field="velocity" label="Velocity" />
                  <th className="px-4 py-3 text-center font-semibold">
                    <span title={`CRITICAL: within ${(RED_HAZARD_THRESHOLD_KM / 1_000_000).toFixed(1)}M km · HAZARD: potentially hazardous · NOMINAL: safe`}>
                      Threat ⓘ
                    </span>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">Track</th>
                </tr>
              </thead>
              <tbody>
                {paginated?.content?.map((ast) => (
                  <tr
                    key={`${ast.neoId}-${ast.closeApproachDate}`}
                    onClick={() => setSelectedAsteroid(ast)}
                    className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-200 font-medium group-hover:text-electric-blue transition-colors">
                      {ast.name}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {((ast.estDiameterKmMin + ast.estDiameterKmMax) / 2).toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 font-sans">
                      {ast.closeApproachDate}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 uppercase">
                      {(ast.missDistanceKm / 1_000_000).toFixed(2)}M km
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 uppercase">
                      {Math.round(ast.velocity_kmh).toLocaleString()} km/h
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getHazardTier(ast) === 'critical' ? (
                        <span className="inline-flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> CRITICAL
                        </span>
                      ) : getHazardTier(ast) === 'warning' ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> HAZARD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full text-[9px]">
                          NOMINAL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedAsteroid(ast); }}
                        aria-label={`Track ${ast.name}`}
                        className="p-1 px-2 hover:bg-electric-blue/20 hover:text-white rounded border border-transparent hover:border-electric-blue/30 text-electric-blue/50 group-hover:text-electric-blue transition-all flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated?.content?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500 font-mono text-xs uppercase tracking-widest">
                      No objects detected in this window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <OrbitModal asteroid={selectedAsteroid} onClose={() => setSelectedAsteroid(null)} />
    </motion.div>
  );
}
