import { X, Radar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Asteroid } from '../../types/dashboard';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useQuery } from '@tanstack/react-query';
import { OrbitVisualiser, type OrbitData } from '../../visualisers/OrbitVisualiser';

interface OrbitModalProps {
  asteroid: Asteroid | null;
  onClose: () => void;
}

export function OrbitModal({ asteroid, onClose }: OrbitModalProps) {
  const { data: orbit, isLoading } = useQuery({
    queryKey: ['asteroid', 'orbit', asteroid?.neoId],
    queryFn: async () => {
      if (!asteroid) return null;
      const { data } = await api.get<OrbitData>(ENDPOINTS.ASTEROIDS.DETAILS(asteroid.neoId) + '/orbit');
      return data;
    },
    enabled: !!asteroid,
  });

  return (
    <AnimatePresence>
      {asteroid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-space-dark/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[70vh] md:h-[600px]"
          >
            {/* 3D Viewport */}
            <div className="flex-1 min-h-[300px] relative bg-[#020617]">
              <div className="absolute top-4 left-4 z-10">
                <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-mono text-white/70 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Live Orbital Projection
                </div>
              </div>

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Radar className="w-12 h-12 text-electric-blue animate-spin-slow opacity-50" />
                    <span className="text-xs font-mono text-gray-500 tracking-widest uppercase animate-pulse">
                      Calculating Trajectory...
                    </span>
                  </div>
                </div>
              )}

              {orbit && <OrbitVisualiser orbit={orbit} />}
            </div>

            {/* Sidebar Details */}
            <div className="w-full md:w-80 bg-space-dark/50 backdrop-blur-md border-l border-white/5 p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-display text-white mb-1">{asteroid.name}</h3>
                    <code className="text-xs text-electric-blue/70">ID: {asteroid.neoId}</code>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Orbital Profile</span>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <span className="block text-gray-500">Eccentricity</span>
                        <span className="text-white">{orbit?.eccentricity?.toFixed(4) ?? '—'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Inclination</span>
                        <span className="text-white">{orbit?.inclination?.toFixed(2) ?? '—'}°</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Semi-Major Axis</span>
                        <span className="text-white">{orbit?.semi_major_axis?.toFixed(4) ?? '—'} AU</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Node Ω</span>
                        <span className="text-white">{orbit?.ascending_node_longitude?.toFixed(2) ?? '—'}°</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Perihelion ω</span>
                        <span className="text-white">{orbit?.perihelion_argument?.toFixed(2) ?? '—'}°</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Mean Anomaly</span>
                        <span className="text-white">{orbit?.mean_anomaly?.toFixed(2) ?? '—'}°</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Threat Level</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full overflow-hidden bg-white/10">
                        <div
                          className={`h-full rounded-full ${asteroid.potentiallyHazardous ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: asteroid.potentiallyHazardous ? '85%' : '5%' }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${asteroid.potentiallyHazardous ? 'text-red-400' : 'text-green-400'}`}>
                        {asteroid.potentiallyHazardous ? 'HIGH' : 'LOW'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <p className="text-[10px] text-gray-500 leading-relaxed italic">
                  White marker shows computed position for today based on mean anomaly at epoch.
                  Blue ring = 1 AU Earth reference. Distances scaled for display.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
