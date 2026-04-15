import { motion } from 'framer-motion';
import { useAsteroidsWeek } from '../../hooks/useAsteroids';
import { AlertTriangle, Radar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Asteroid } from '../../types/dashboard';

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
      <div className="h-3 w-3 rounded-full bg-white/10 animate-pulse-subtle" />
      <div className="h-3 flex-1 rounded bg-white/10 animate-pulse-subtle" />
      <div className="h-3 w-20 rounded bg-white/10 animate-pulse-subtle" />
    </div>
  );
}

const RED_HAZARD_THRESHOLD_KM = 7_500_000; // 0.05 AU

export function AsteroidTracker() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useAsteroidsWeek();

  const elementCount = summary?.length ?? 0;
  const hazardousCount = summary?.filter(a => a.potentiallyHazardous).length ?? 0;

  const getHazardTier = (ast: Asteroid) => {
    if (!ast.potentiallyHazardous) return 'safe';
    if (ast.missDistanceKm < RED_HAZARD_THRESHOLD_KM) return 'critical';
    return 'warning';
  };

  return (
    <motion.div layout className="glass-panel rounded-xl overflow-hidden flex flex-col transition-all duration-500">
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
            <div className="h-6 w-16 rounded-full bg-white/10 animate-pulse-subtle" />
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
      <div className="overflow-x-auto flex-1 max-h-[250px]">
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
              </tr>
            </thead>
            <tbody>
              {summary?.slice(0, 5).map((ast) => (
                <tr
                  key={`${ast.neoId}-${ast.closeApproachDate}`}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-default"
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
                      <span className="text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full text-[9px]">
                        NOMINAL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
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
  );
}
