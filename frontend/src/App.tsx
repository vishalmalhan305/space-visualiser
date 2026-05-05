import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from './components/layout/Navbar';
import { Reveal } from './components/layout/Reveal';
import { ApodHero } from './components/apod/ApodHero';
import { ApodArchive } from './components/apod/ApodArchive';
import { AsteroidTracker } from './components/dashboard/AsteroidTracker';
import { SolarWeatherWidget } from './components/dashboard/SolarWeatherWidget';
import { IssTracker } from './components/dashboard/IssTracker';
import { Toaster } from 'sonner';

const MarsPhotosPage = lazy(() =>
  import('./pages/MarsPhotosPage').then((m) => ({ default: m.MarsPhotosPage }))
);
const AsteroidDetailPage = lazy(() =>
  import('./pages/AsteroidDetailPage').then((m) => ({ default: m.AsteroidDetailPage }))
);
const SolarMissionPage = lazy(() =>
  import('./pages/SolarMissionPage').then((m) => ({ default: m.SolarMissionPage }))
);
const ExoplanetExplorer = lazy(() =>
  import('./pages/ExoplanetExplorer').then((m) => ({ default: m.ExoplanetExplorer }))
);

function PageLoader({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-electric-blue/30 border-t-electric-blue motion-safe:animate-spin" />
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray-600">{label}</p>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
      className="flex items-center gap-4 my-8"
    >
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[10px] uppercase tracking-[0.25em] text-gray-600 font-mono whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </motion.div>
  );
}

function Dashboard() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* ── APOD Hero ─────────────────────────────────────── */}
      <motion.section
        id="apod"
        aria-label="Astronomy Picture of the Day"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <ApodHero />
      </motion.section>

      <SectionDivider label="Live Space Intelligence" />

      {/* ── Real-Time Data Grid ───────────────────────────── */}
      <section id="intel" aria-label="Live space intelligence">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            className="lg:col-span-2"
            id="asteroids"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
          >
            <AsteroidTracker />
          </motion.div>

          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.215, 0.61, 0.355, 1] }}
          >
            <div id="solar">
              <SolarWeatherWidget />
            </div>
            <div id="iss">
              <IssTracker />
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider label="Mission Archive" />

      {/* ── APOD Archive ──────────────────────────────────── */}
      <motion.section
        id="archive"
        aria-label="APOD mission archive"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <ApodArchive />
      </motion.section>
    </main>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-space-dark">
        {/* Skip to main content — visible on focus for keyboard/screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-space-navy focus:border focus:border-electric-blue focus:text-electric-blue focus:text-sm focus:font-mono"
        >
          Skip to main content
        </a>
        <Navbar />

        <Routes>
          <Route path="/" element={<Reveal><Dashboard /></Reveal>} />
          <Route
            path="/mars"
            element={
              <Suspense fallback={<PageLoader label="Loading Mars Gallery…" />}>
                <Reveal><MarsPhotosPage /></Reveal>
              </Suspense>
            }
          />
          <Route
            path="/asteroids"
            element={
              <Suspense fallback={<PageLoader label="Loading NEO Ledger…" />}>
                <Reveal><AsteroidDetailPage /></Reveal>
              </Suspense>
            }
          />
          <Route
            path="/solar"
            element={
              <Suspense fallback={<PageLoader label="Loading Solar Mission…" />}>
                <Reveal><SolarMissionPage /></Reveal>
              </Suspense>
            }
          />
          <Route
            path="/exoplanets"
            element={
              <Suspense fallback={<PageLoader label="Loading Exoplanet Explorer…" />}>
                <Reveal><ExoplanetExplorer /></Reveal>
              </Suspense>
            }
          />
        </Routes>

      <footer className="py-8 px-6 border-t border-white/5 bg-space-dark">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-gray-600 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 motion-safe:animate-pulse" />
            <p>© 2026 SPACE CTRL · ALL SYSTEMS NOMINAL</p>
          </div>
          <div className="flex gap-6">
            <a href="/solar" className="hover:text-electric-blue transition-colors">PROTOCOLS</a>
            <a href="/asteroids" className="hover:text-electric-blue transition-colors">NEO LEDGER</a>
            <a href="https://api.nasa.gov" target="_blank" rel="noopener noreferrer" className="hover:text-electric-blue transition-colors">NASA OPEN DATA</a>
          </div>
        </div>
      </footer>
      </div>

      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(10,14,26,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e5e7eb',
            fontFamily: 'monospace',
            fontSize: '12px',
            borderRadius: '12px',
          },
        }}
      />
    </Router>
  );
}

export default App;
