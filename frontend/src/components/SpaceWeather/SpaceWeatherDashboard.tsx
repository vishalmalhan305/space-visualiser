import { EventTimeline } from './EventTimeline';
import { Sun, Shield, Radio, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SpaceWeatherDashboard() {
  return (
    <div className="min-h-screen bg-space-dark text-white relative overflow-hidden flex flex-col pt-20">
      {/* Background Mission Control Layer */}
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="radar-scan" />
      
      {/* Top Telemetry Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 glass-header z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <h1 className="font-display text-sm tracking-[0.3em] uppercase opacity-80">
              Solar Surveillance Command
            </h1>
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded border border-green-500/30 bg-green-500/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-mono text-green-400 uppercase tracking-widest">Link-Active</span>
            </div>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest hidden md:block">
              Sensor: SDO-ACE-GOES
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-0.5">System Clock</p>
            <p className="text-xs font-mono text-electric-blue">
              {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 p-6 md:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Mission Stats & Radar */}
        <div className="lg:col-span-4 space-y-8">
           <section className="glass-panel p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-electric-blue/50 to-transparent" />
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-4 h-4 text-electric-blue" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-gray-400">
                  Global Defense Status
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-mono text-gray-500 uppercase">Comm Integrity</p>
                    <p className="text-xs font-mono text-green-400">98.4%</p>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '98.4%' }}
                      className="h-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    />
                  </div>
                </div>

                <div>
                   <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-mono text-gray-500 uppercase">Ionosphere Charge</p>
                    <p className="text-xs font-mono text-amber-400">High</p>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '72%' }}
                      className="h-full bg-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-500 uppercase font-mono tracking-widest leading-tight">Solar Wind</p>
                    <p className="text-lg font-display text-white">412 <span className="text-[10px] text-gray-500">km/s</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-500 uppercase font-mono tracking-widest leading-tight">Density</p>
                    <p className="text-lg font-display text-white">4.2 <span className="text-[10px] text-gray-500">p/cm³</span></p>
                  </div>
                </div>
              </div>
           </section>

           <section className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Radio className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-gray-400">
                  Signal Alerts
                </h2>
              </div>
              <div className="space-y-4">
                 <div className="flex gap-4 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
                    <AlertCircle className="w-5 h-5 text-orange-400 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-white mb-1">M-Class Activity Increase</p>
                      <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                        Heightened solar flare activity in Region 3490. Adjust HF frequencies.
                      </p>
                    </div>
                 </div>
                 <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-500 font-mono mb-2 uppercase tracking-widest text-center italic">
                      SYSTEM LOG // SCANNING
                    </p>
                    <div className="space-y-2 opacity-60">
                       <div className="h-1 w-full bg-blue-500/20 rounded-full" />
                       <div className="h-1 w-[80%] bg-blue-500/10 rounded-full" />
                    </div>
                 </div>
              </div>
           </section>
        </div>

        {/* Center/Right Column: Vertical Timeline */}
        <div className="lg:col-span-8">
           <div className="mb-0">
              <EventTimeline />
           </div>
        </div>
      </main>

      {/* Background Decor Elements */}
      <div className="fixed bottom-10 -right-20 pointer-events-none opacity-20">
        <div className="w-96 h-96 rounded-full border border-blue-500/20 flex items-center justify-center animate-spin-slow">
            <div className="w-[80%] h-[80%] rounded-full border border-blue-500/10" />
        </div>
      </div>
    </div>
  );
}
