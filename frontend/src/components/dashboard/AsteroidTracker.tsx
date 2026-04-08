import { useState } from 'react';
import { useAsteroidsWeek } from '../../hooks/useAsteroids';
import { useAsteroidsPaginated } from '../../hooks/useAsteroidsPaginated';
import { AlertTriangle, Radar, ChevronDown, ChevronUp, Filter, ArrowLeft, ArrowRight } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [hazardousOnly, setHazardousOnly] = useState(false);

  const { data: summary, isLoading: isSummaryLoading } = useAsteroidsWeek();
  const { data: paginated, isLoading: isPaginatedLoading } = useAsteroidsPaginated(
    page, 
    10, 
    hazardousOnly ? true : undefined
  );

  const elementCount = summary?.length ?? 0;
  const hazardousCount = summary?.filter(a => a.potentiallyHazardous).length ?? 0;

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col transition-all duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Radar className="text-electric-blue w-5 h-5" />
          <h2 className="font-display text-sm tracking-widest uppercase text-white">
            Near-Earth Objects
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          {isSummaryLoading ? (
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
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/5 rounded transition-colors text-gray-500 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content: Filters & Pagination */}
      {isExpanded && (
        <div className="bg-white/[0.02] border-b border-white/5 px-5 py-3 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setHazardousOnly(!hazardousOnly);
                setPage(0);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${
                hazardousOnly 
                  ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              <Filter className="w-3 h-3" />
              {hazardousOnly ? 'HAZARDOUS ONLY' : 'ALL OBJECTS'}
            </button>
            
            {paginated && (
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                  {paginated.totalElements} Total Matches
                </span>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-3">
            <button
              disabled={page === 0 || isPaginatedLoading}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors text-electric-blue"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-gray-400">
              PAGE {page + 1} / {paginated?.totalPages || 1}
            </span>
            <button
              disabled={(paginated && page >= paginated.totalPages - 1) || isPaginatedLoading}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors text-electric-blue"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table Data */}
      <div className={`overflow-x-auto flex-1 transition-all duration-500 ${isExpanded ? 'max-h-[600px]' : 'max-h-[250px]'}`}>
        {(isExpanded ? isPaginatedLoading : isSummaryLoading) ? (
          <div className="p-2">
            {[...Array(isExpanded ? 10 : 4)].map((_, i) => <RowSkeleton key={i} />)}
          </div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-space-dark/95 backdrop-blur-md z-10">
              <tr className="text-gray-500 uppercase text-[10px] tracking-widest border-b border-white/5">
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-right font-semibold">Ø km</th>
                <th className="px-4 py-3 text-right font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Miss Dist.</th>
                <th className="px-4 py-3 text-right font-semibold">Velocity</th>
                <th className="px-4 py-3 text-center font-semibold">Threat</th>
              </tr>
            </thead>
            <tbody>
              {(isExpanded ? paginated?.content : summary?.slice(0, 5))?.map((ast) => (
                <tr
                  key={`${ast.neoId}-${ast.closeApproachDate}`}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-default"
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
                    {ast.potentiallyHazardous ? (
                      <span className="inline-flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" /> PHO
                      </span>
                    ) : (
                      <span className="text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full text-[10px]">
                        SAFE
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!isExpanded && summary && summary.length > 5 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 bg-gradient-to-t from-space-dark to-transparent">
                    <button 
                      onClick={() => setIsExpanded(true)}
                      className="text-gray-500 hover:text-white transition-colors uppercase text-[10px] tracking-widest font-bold"
                    >
                      + {summary.length - 5} More Detected · Click to Expand
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-white/[0.01]">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] font-mono font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest"
        >
          {isExpanded ? 'Collapse Terminal' : 'Intelligence Ledger'}
        </button>
        <a
          href="/#asteroids"
          className="flex items-center gap-2 text-[10px] font-mono font-bold text-electric-blue hover:text-glow transition-all uppercase tracking-widest"
        >
          Radar Uplink <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
