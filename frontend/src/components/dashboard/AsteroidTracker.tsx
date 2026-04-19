import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAsteroidsWeek } from '../../hooks/useAsteroids';
import { AlertTriangle, Radar, ArrowRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Asteroid } from '../../types/dashboard';
import { OrbitModal } from './OrbitModal';

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

export function AsteroidTracker() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useAsteroidsWeek();
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);

  const elementCount = summary?.length ?? 0;
  const hazardousCount = summary?.filter(a => a.potentiallyHazardous).length ?? 0;

  const getHazardTier = (ast: Asteroid) => {
    if (!ast.potentiallyHazardous) return 'safe';
    if (ast.missDistanceKm < RED_HAZARD_THRESHOLD_KM) return 'critical';
    return 'warning';
  };

  return (
    <>
      <motion.div className="glass-panel rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Radar className="text-electric-blue w-5 h-5" />
            <h2 className="font-display text-sm tracking-widest uppercase text-white">
              Near-Earth Objects
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-6 w-16 rounded-full bg-white/10 motion-safe:animate-pulse-subtle" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  7D: {elementCount}
                </span>
                {hazardousCount > 0 && (
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {hazardousCount} RISK
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summary Table */}
        <div className="overflow-x-auto min-h-[220px] max-h-[320px] overflow-y-auto">
          {isLoading ? (
            <div className="p-2">
              {[...Array(4)].map((_, i) => <RowSkeleton key={i} />)}
            </div>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-space-dark/95 backdrop-blur-md z-10">
                <tr className="text-gray-500 uppercase text-[9px] tracking-widest border-b border-white/5">
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-right font-semibold">Ø km</th>
                  <th className="px-4 py-3 text-right font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Miss Dist.</th>
                  <th className="px-4 py-3 text-right font-semibold">Velocity</th>
                  <th className="px-4 py-3 text-center font-semibold">Threat</th>
                  <th className="px-4 py-3 text-center font-semibold">Track</th>
                </tr>
              </thead>
              <tbody>
                {summary?.slice(0, 5).map((ast) => (
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
                        onClick={(e) => { e.stopPropagation(); setSelectedAsteroid(ast); }}
                        aria-label={`Track ${ast.name}`}
                        className="p-1 px-2 hover:bg-electric-blue/20 hover:text-white rounded border border-transparent hover:border-electric-blue/30 text-electric-blue/50 group-hover:text-electric-blue transition-all flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && (!summary || summary.length === 0) && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-600 font-mono text-xs uppercase tracking-widest">
                      No objects detected this week
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-white/5 bg-white/[0.01]">
          <button
            onClick={() => navigate('/asteroids')}
            className="flex items-center gap-2 text-[10px] font-mono font-bold text-electric-blue hover:text-glow transition-all uppercase tracking-widest"
          >
            Intelligence Ledger <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

      <OrbitModal asteroid={selectedAsteroid} onClose={() => setSelectedAsteroid(null)} />
    </>
  );
}
