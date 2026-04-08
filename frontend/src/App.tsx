import { Navbar } from './components/layout/Navbar';
import { ApodHero } from './components/apod/ApodHero';
import { ApodArchive } from './components/apod/ApodArchive';
import { Cpu, Globe, Zap } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Dashboard Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border-l-4 border-l-electric-blue">
            <div className="p-3 bg-electric-blue/10 rounded-lg">
              <Globe className="text-electric-blue w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Telemetry Status</p>
              <h4 className="text-white font-display font-medium">Earth Orbit / LEO</h4>
            </div>
          </div>
          
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-yellow-400/10 rounded-lg">
              <Cpu className="text-yellow-400 w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Process Load</p>
              <h4 className="text-white font-display font-medium">Core Engined: 14%</h4>
            </div>
          </div>
          
          <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <Zap className="text-red-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Power Reserve</p>
              <h4 className="text-white font-display font-medium">98.4% Efficiency</h4>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <ApodHero />

        {/* Archive Section */}
        <ApodArchive />
      </main>

      <footer className="py-8 px-6 border-t border-white/5 bg-space-dark">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-gray-500 text-xs font-mono">
          <p>© 2026 MISSION CONTROL CORE. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-electric-blue transition-colors">PROTOCOLS</a>
            <a href="#" className="hover:text-electric-blue transition-colors">SECURITY</a>
            <a href="#" className="hover:text-electric-blue transition-colors">MANUALS</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
