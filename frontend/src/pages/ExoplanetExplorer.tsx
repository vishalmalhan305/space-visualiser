import { useState, useCallback, useTransition, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { SlidersHorizontal, X, ChevronUp } from 'lucide-react';
import { useExoplanets } from '../hooks/useExoplanets';
import { ExoplanetChart } from '../visualisers/ExoplanetChart';
import { ExoplanetSidebar } from '../components/ExoplanetSidebar';
import { ExoplanetDetailPanel } from '../components/ExoplanetDetailPanel';
import { ExoplanetStatsBar } from '../components/ExoplanetStatsBar';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

function CinematicLoader() {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.floor(v).toLocaleString());
  const [dots, setDots] = useState('');
  const [phase, setPhase] = useState(0);

  const phases = [
    'Querying NASA Exoplanet Archive…',
    'Parsing stellar catalog…',
    'Mapping orbital parameters…',
    'Calibrating discovery methods…',
  ];

  useEffect(() => {
    const ctrl = animate(count, 5500, { duration: 2.4, ease: 'easeOut' });
    return ctrl.stop;
  }, [count]);

  useEffect(() => {
    const iv = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 420);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setPhase((p) => (p + 1) % phases.length), 1800);
    return () => clearInterval(iv);
  }, [phases.length]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-space-dark gap-6">
      <div className="relative w-28 h-28 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-electric-blue/40"
            initial={{ width: 40, height: 40, opacity: 0.8 }}
            animate={{ width: 112, height: 112, opacity: 0 }}
            transition={{ duration: 2, delay: i * 0.65, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <motion.div
          className="w-10 h-10 rounded-full bg-electric-blue/20 border border-electric-blue/60 flex items-center justify-center"
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-3 h-3 rounded-full bg-electric-blue" />
        </motion.div>
      </div>

      <div className="text-center">
        <motion.p className="text-3xl font-display font-bold text-electric-blue tabular-nums">
          {rounded}
        </motion.p>
        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mt-1">
          confirmed exoplanets
        </p>
      </div>

      <div className="h-5 flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="text-xs font-mono text-gray-500 tracking-wider"
          >
            {phases[phase]}{dots}
          </motion.p>
        </AnimatePresence>
      </div>

      <motion.div className="w-48 h-px bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-electric-blue rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.4, ease: 'easeOut' }}
        />
      </motion.div>
    </div>
  );
}

function EmptyState({ onIngest, ingesting }: { onIngest: () => void; ingesting: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-space-dark">
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-mono text-gray-400">No planets in database</p>
        <p className="text-xs font-mono text-gray-600 mt-1">Ingest the NASA Exoplanet Archive to begin</p>
      </div>
      <motion.button
        onClick={onIngest}
        disabled={ingesting}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="px-5 py-2.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
        style={{
          background: ingesting ? '#434656' : 'linear-gradient(135deg, #0052ff, #0038b6)',
          color: '#e5e2e1',
          boxShadow: ingesting ? 'none' : '0 0 18px #0052ff44',
        }}
      >
        {ingesting ? 'Loading Dataset…' : 'Load Dataset'}
      </motion.button>
    </div>
  );
}

export function ExoplanetExplorer() {
  const { data = [], isLoading, isError } = useExoplanets();
  const [activeMethods, setActiveMethods] = useState<Set<string>>(new Set());
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [, startTransition] = useTransition();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const handleToggle = useCallback((method: string) => {
    startTransition(() => {
      setActiveMethods((prev) => {
        const next = new Set(prev);
        if (next.has(method)) next.delete(method);
        else next.add(method);
        return next;
      });
    });
  }, []);

  const handleIngest = useCallback(async () => {
    setIngesting(true);
    try {
      await api.post(ENDPOINTS.EXOPLANETS.INGEST);
    } finally {
      setIngesting(false);
    }
  }, []);

  const handleChartSelect = useCallback((plName: string | null) => {
    setSelectedPlanet(plName);
  }, []);

  // Lock body scroll only when an overlay sheet is actually visible.
  // The sidebar sheet is visible below lg (<1024px); the detail sheet below md (<768px).
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const isBelowDesktop = window.matchMedia('(max-width: 1023px)').matches;
    const shouldLock = (sidebarOpen && isBelowDesktop) || (detailSheetOpen && isMobile);
    document.body.style.overflow = shouldLock ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen, detailSheetOpen]);

  const activePlanetName = selectedPlanet ?? hoveredPlanet;

  return (
    <div className="flex flex-col bg-space-dark h-screen" style={{ color: '#e5e2e1' }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shrink-0"
        style={{ borderBottom: '1px solid #43465633' }}
      >
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white truncate">
            Exoplanet Archive
          </h1>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#8d90a2' }}>
            {data.length > 0
              ? `${data.length.toLocaleString()} confirmed planets`
              : isLoading
              ? 'Loading stellar catalog…'
              : 'No data loaded'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {data.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-electric-blue motion-safe:animate-pulse" aria-hidden="true" />
              <span className="text-[10px] font-mono text-electric-blue uppercase tracking-widest">
                Live Archive
              </span>
            </div>
          )}

          {/* Filter button — visible when sidebar is off-canvas (< lg) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-gray-300 hover:text-white border border-white/10 hover:border-white/25 transition-colors cursor-pointer"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Filters</span>
          </button>
        </div>
      </header>

      {/* ── Stats bar ───────────────────────────────────────── */}
      {data.length > 0 && (
        <div className="overflow-x-auto shrink-0">
          <ExoplanetStatsBar planets={data} />
        </div>
      )}

      {/* ── Main three-column grid ──────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Left sidebar — desktop only */}
        <div
          className="hidden lg:block w-60 shrink-0 overflow-y-auto"
          style={{ borderRight: '1px solid #43465633' }}
        >
          <ExoplanetSidebar
            data={data}
            activeMethods={activeMethods}
            onToggle={handleToggle}
            onIngest={handleIngest}
            ingesting={ingesting}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Center chart */}
        <div className="flex-1 min-w-0 min-h-[300px] relative bg-space-dark">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10"
              >
                <CinematicLoader />
              </motion.div>
            )}

            {isError && !isLoading && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center p-6 text-center"
              >
                <p className="text-sm font-mono" style={{ color: '#ffb4ab' }}>
                  Failed to load data. Trigger ingestion first.
                </p>
              </motion.div>
            )}

            {!isLoading && !isError && data.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10"
              >
                <EmptyState onIngest={handleIngest} ingesting={ingesting} />
              </motion.div>
            )}
          </AnimatePresence>

          {data.length > 0 && (
            <ExoplanetChart
              data={data}
              activeMethods={activeMethods}
              onHover={setHoveredPlanet}
              onSelect={handleChartSelect}
              selectedPlName={selectedPlanet}
              activeCategory={activeCategory}
            />
          )}
        </div>

        {/* Right detail panel — tablet and above */}
        <div
          className="hidden md:flex md:w-72 lg:w-80 shrink-0 flex-col overflow-y-auto"
          style={{ borderLeft: '1px solid #43465633' }}
        >
          <ExoplanetDetailPanel plName={activePlanetName} />
        </div>
      </div>

      {/* ── Mobile: "View Planet" floating pill ─────────────── */}
      <AnimatePresence>
        {activePlanetName && !detailSheetOpen && (
          <motion.div
            initial={{ y: 72, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 72, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 md:hidden"
          >
            <button
              onClick={() => setDetailSheetOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-space-dark text-xs font-semibold font-mono uppercase tracking-wider shadow-lg cursor-pointer"
              style={{ background: '#00f0ff', boxShadow: '0 4px 24px rgba(0,240,255,0.4)' }}
            >
              <ChevronUp className="w-4 h-4" />
              View {activePlanetName}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile/Tablet: Sidebar bottom sheet ─────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 lg:hidden"
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[78vh] rounded-t-2xl lg:hidden flex flex-col overflow-hidden"
              style={{ background: '#1c1b1b' }}
            >
              {/* Sheet drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div
                className="flex items-center justify-between px-5 py-3 shrink-0"
                style={{ borderBottom: '1px solid #43465633' }}
              >
                <span className="text-sm font-mono text-white uppercase tracking-widest">Filters</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <ExoplanetSidebar
                  data={data}
                  activeMethods={activeMethods}
                  onToggle={handleToggle}
                  onIngest={() => { void handleIngest(); setSidebarOpen(false); }}
                  ingesting={ingesting}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile: Detail bottom sheet ─────────────────────── */}
      <AnimatePresence>
        {detailSheetOpen && activePlanetName && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailSheetOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 md:hidden"
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Planet details"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[82vh] rounded-t-2xl md:hidden flex flex-col overflow-hidden"
              style={{ background: '#1c1b1b' }}
            >
              {/* Sheet drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div
                className="flex items-center justify-between px-5 py-3 shrink-0"
                style={{ borderBottom: '1px solid #43465633' }}
              >
                <span className="text-sm font-mono text-white uppercase tracking-widest">Planet Details</span>
                <button
                  onClick={() => setDetailSheetOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close planet details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <ExoplanetDetailPanel plName={activePlanetName} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
