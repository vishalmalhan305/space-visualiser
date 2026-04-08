import { useQuery } from '@tanstack/react-query';
import { asteroidService } from '../../services/asteroidService';
import { AlertTriangle, Radar, ArrowRight } from 'lucide-react';

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
      <div className="h-3 w-3 rounded-full bg-white/10 animate-pulse-subtle" />
      <div className="h-3 flex-1 rounded bg-white/10 animate-pulse-subtle" />
      <div className="h-3 w-20 rounded bg-white/10 animate-pulse-subtle" />
    </div>
  );
}

export function AsteroidTracker() {
  const { data, isLoading } = useQuery({
    queryKey: ['asteroids-weekly'],
    queryFn: asteroidService.getWeeklySummary,
    refetchInterval: 5 * 60_000, // refresh every 5 min
  });

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Radar className="text-electric-blue w-5 h-5" />
          <h2 className="font-display text-sm tracking-widest uppercase text-white">
            Near-Earth Objects
          </h2>
        </div>
        {isLoading ? (
          <div className="h-6 w-16 rounded-full bg-white/10 animate-pulse-subtle" />
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full">
              This Week: {data?.element_count ?? 0}
            </span>
            {(data?.hazardous_count ?? 0) > 0 && (
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {data!.hazardous_count} Hazardous
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        {isLoading ? (
          <div>
            {[...Array(4)].map((_, i) => <RowSkeleton key={i} />)}
          </div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-gray-500 uppercase text-[10px] tracking-widest border-b border-white/5">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-right">Ø km</th>
                <th className="px-4 py-2 text-right">Approach</th>
                <th className="px-4 py-2 text-right">Miss Dist.</th>
                <th className="px-4 py-2 text-right">Vel km/h</th>
                <th className="px-4 py-2 text-center">Risk</th>
              </tr>
            </thead>
            <tbody>
              {data?.asteroids.map((ast) => (
                <tr
                  key={ast.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-200">{ast.name}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{ast.estimated_diameter_km.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{ast.close_approach_date}</td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {(ast.miss_distance_km / 1_000_000).toFixed(2)}M
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {ast.relative_velocity_km_h.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ast.is_potentially_hazardous ? (
                      <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> PHO
                      </span>
                    ) : (
                      <span className="text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full">
                        Safe
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
      <a
        href="/asteroids"
        className="flex items-center justify-center gap-2 py-3 border-t border-white/5
                   text-xs font-mono text-electric-blue hover:bg-electric-blue/5 transition-colors"
      >
        OPEN FULL TRACKER <ArrowRight className="w-3 h-3" />
      </a>
    </div>
  );
}
