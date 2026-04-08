import React from 'react';
import { Rocket, Satellite, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="glass-header sticky top-0 z-50 w-full h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <Rocket className="text-electric-blue w-6 h-6" />
        <span className="font-display font-bold text-xl tracking-wider text-white">SPACE VISUALISER</span>
      </div>
      
      <nav className="hidden md:flex items-center gap-8 font-sans text-sm font-medium">
        <a href="/" className="text-electric-blue border-b-2 border-electric-blue pb-1 text-glow">Dashboard</a>
        <a href="#celestial" className="text-gray-400 hover:text-gray-200 transition-colors">Celestial Bodies</a>
        <a href="#missions" className="text-gray-400 hover:text-gray-200 transition-colors">Active Missions</a>
      </nav>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-space-navy/80 border border-white/10 px-3 py-1.5 rounded-full text-xs font-mono">
          <Activity className="text-green-400 w-3.5 h-3.5" />
          <span className="text-gray-300">SYSTEM: <span className="text-green-400">NOMINAL</span></span>
        </div>
        <div className="w-8 h-8 rounded-full bg-electric-blue/20 flex items-center justify-center border border-electric-blue/50">
          <Satellite className="text-electric-blue w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
