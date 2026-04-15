import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from './components/layout/Navbar';
import { Reveal } from './components/layout/Reveal';
import { ApodHero } from './components/apod/ApodHero';
import { ApodArchive } from './components/apod/ApodArchive';
import { AsteroidTracker } from './components/dashboard/AsteroidTracker';
import { SolarWeatherWidget } from './components/dashboard/SolarWeatherWidget';
import { IssTracker } from './components/dashboard/IssTracker';
import { MarsPhotosPage } from './pages/MarsPhotosPage';
import { AsteroidDetailPage } from './pages/AsteroidDetailPage';

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
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* ── APOD Hero ─────────────────────────────────────── */}
      <section id="apod" aria-label="Astronomy Picture of the Day">
        <ApodHero />
      </section>

      <SectionDivider label="Live Space Intelligence" />

      {/* ── Real-Time Data Grid ───────────────────────────── */}
      <section id="intel" aria-label="Live space intelligence">
        {/* Top row: Asteroid tracker (wide) + Solar weather + ISS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asteroid fills 2 columns */}
          <div className="lg:col-span-2" id="asteroids">
            <AsteroidTracker />
          </div>

          {/* Solar + ISS stacked in third column */}
          <div className="flex flex-col gap-6">
            <div id="solar">
              <SolarWeatherWidget />
            </div>
            <div id="iss">
              <IssTracker />
            </div>
          </div>
        </div>
      </section>

      <SectionDivider label="Mission Archive" />

      {/* ── APOD Archive ──────────────────────────────────── */}
      <section id="archive" aria-label="APOD mission archive">
        <ApodArchive />
      </section>
    </main>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-space-dark">
        <Navbar />

        <Routes>
          <Route path="/" element={<Reveal><Dashboard /></Reveal>} />
          <Route path="/mars" element={<Reveal><MarsPhotosPage /></Reveal>} />
          <Route path="/asteroids" element={<Reveal><AsteroidDetailPage /></Reveal>} />
        </Routes>

      <footer className="py-8 px-6 border-t border-white/5 bg-space-dark">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-gray-600 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p>© 2026 SPACE CTRL · ALL SYSTEMS NOMINAL</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-electric-blue transition-colors">PROTOCOLS</a>
            <a href="#" className="hover:text-electric-blue transition-colors">SECURITY</a>
            <a href="#" className="hover:text-electric-blue transition-colors">NASA OPEN DATA</a>
          </div>
        </div>
      </footer>
      </div>
    </Router>
  );
}

export default App;
