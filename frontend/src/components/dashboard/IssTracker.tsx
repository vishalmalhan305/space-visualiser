import { motion } from 'framer-motion';
import { useIssPosition } from '../../hooks/useIssPosition';
import { Satellite, Navigation, Clock, RotateCcw } from 'lucide-react';

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-white/5 rounded-lg px-4 py-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">{label}</p>
      <p className="text-xl font-display font-bold text-white">
        {value}
        {unit && <span className="text-xs text-gray-500 ml-1 font-mono">{unit}</span>}
      </p>
    </div>
  );
}

export function IssTracker() {
  const { data, isLoading, isError, dataUpdatedAt, refetch } = useIssPosition();

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
        className="glass-panel rounded-xl overflow-hidden flex flex-col p-8 items-center justify-center text-center min-h-[300px]"
      >
        <Satellite className="text-red-400 w-12 h-12 mb-4 opacity-50" />
        <h3 className="text-white font-display text-lg mb-2">Telemetry Lost</h3>
        <p className="text-gray-400 text-sm max-w-[200px] mb-4">
          Unable to establish connection with ISS tracking satellite.
        </p>
        {dataUpdatedAt > 0 && (
          <p className="text-gray-600 text-xs font-mono mb-4">
            Last contact: {new Date(dataUpdatedAt).toLocaleTimeString()}
          </p>
        )}
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all text-xs font-mono"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Retry Connection
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
      className="glass-panel rounded-xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: [0.215, 0.61, 0.355, 1] }}
            className="inline-flex"
          >
            <Satellite className="text-electric-blue w-5 h-5" />
          </motion.span>
          <h2 className="font-display text-sm tracking-widest uppercase text-white">
            ISS Live Position
          </h2>
        </div>
        {dataUpdatedAt > 0 && (
          <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {isLoading || !data ? (
        <div className="p-5 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-white/10 animate-pulse-subtle" />
          ))}
        </div>
      ) : (
        <>
          {/* Position visual */ }
          <div className="px-5 py-4 flex items-center justify-center bg-electric-blue/5 border-b border-white/5">
            <Navigation className="text-electric-blue w-6 h-6 mr-3" />
            <div className="font-mono text-sm">
              <span className="text-gray-400">LAT </span>
              <span className="text-white font-semibold">{(data.latitude ?? 0).toFixed(2)}°</span>
              <span className="text-gray-600 mx-3">|</span>
              <span className="text-gray-400">LON </span>
              <span className="text-white font-semibold">{(data.longitude ?? 0).toFixed(2)}°</span>
            </div>
          </div>

          {/* Stats grid */ }
          <div className="p-5 grid grid-cols-2 gap-3">
            <Stat label="Altitude" value={(data.altitude_km ?? 0).toFixed(1)} unit="km" />
            <Stat label="Velocity" value={((data.velocity_km_h ?? 0) / 1000).toFixed(1)} unit="k km/h" />
            <Stat
              label="Latitude"
              value={`${Math.abs(data.latitude ?? 0).toFixed(2)}° ${(data.latitude ?? 0) >= 0 ? 'N' : 'S'}`}
            />
            <Stat
              label="Longitude"
              value={`${Math.abs(data.longitude ?? 0).toFixed(2)}° ${(data.longitude ?? 0) >= 0 ? 'E' : 'W'}`}
            />
          </div>
        </>
      )}

      {/* Live dot indicator */}
      <div className="px-5 pb-4 flex items-center gap-2 text-[10px] font-mono text-gray-500">
        <motion.span
          className="inline-block w-2 h-2 rounded-full bg-green-400"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: [0.215, 0.61, 0.355, 1] }}
        />
        UPDATING EVERY 15 SECONDS
      </div>
    </motion.div>
  );
}
