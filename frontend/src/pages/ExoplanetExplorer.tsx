import { useState, useCallback, useTransition, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useExoplanets } from '../hooks/useExoplanets';
import { ExoplanetChart } from '../visualisers/ExoplanetChart';
import { ExoplanetSidebar } from '../components/ExoplanetSidebar';
import { ExoplanetDetailPanel } from '../components/ExoplanetDetailPanel';
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
      {/* Pulsing rings */}
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

      {/* Counter */}
      <div className="text-center">
        <motion.p className="text-3xl font-display font-bold text-electric-blue tabular-nums">
          {rounded}
        </motion.p>
        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mt-1">
          confirmed exoplanets
        </p>
      </div>

      {/* Phase text */}
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

      {/* Progress bar */}
      <motion.div
        className="w-48 h-px bg-white/10 rounded-full overflow-hidden"
      >
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
        className="px-5 py-2.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-widest transition-all disabled:opacity-50"
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
  const [ingesting, setIngesting] = useState(false);
  const [, startTransition] = useTransition();

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

  return (
    <div className="flex flex-col h-screen bg-space-dark" style={{ color: '#e5e2e1' }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: '1px solid #43465633' }}
      >
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Exoplanet Archive
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#8d90a2' }}>
            {data.length > 0
              ? `${data.length.toLocaleString()} confirmed planets`
              : isLoading
              ? 'Loading stellar catalog…'
              : 'No data loaded'}
          </p>
        </div>

        {data.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse" />
            <span className="text-[10px] font-mono text-electric-blue uppercase tracking-widest">
              Live Archive
            </span>
          </div>
        )}
      </header>

      {/* Main three-column grid */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-56 shrink-0 overflow-y-auto">
          <ExoplanetSidebar
            data={data}
            activeMethods={activeMethods}
            onToggle={handleToggle}
            onIngest={handleIngest}
            ingesting={ingesting}
          />
        </div>

        {/* Center chart */}
        <div className="flex-1 min-w-0 relative bg-space-dark">
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
                className="absolute inset-0 flex items-center justify-center"
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
            />
          )}
        </div>

        {/* Right detail panel */}
        <div className="w-56 shrink-0 overflow-y-auto">
          <ExoplanetDetailPanel plName={hoveredPlanet} />
        </div>
      </div>
    </div>
  );
}
