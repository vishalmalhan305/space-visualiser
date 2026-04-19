import type { ExoplanetSummary } from '../types/exoplanet';

const METHOD_COLORS: Record<string, string> = {
  Transit: '#b7c4ff',
  'Radial Velocity': '#38debb',
  'Direct Imaging': '#f3bf26',
  Microlensing: '#ff8fa3',
  Astrometry: '#dfe3ff',
  'Transit Timing Variations': '#a0c4ff',
  'Orbital Brightness Modulation': '#c3f5ff',
};

interface Props {
  data: ExoplanetSummary[];
  activeMethods: Set<string>;
  onToggle: (method: string) => void;
  onIngest: () => void;
  ingesting: boolean;
}

export function ExoplanetSidebar({ data, activeMethods, onToggle, onIngest, ingesting }: Props) {
  const methodCounts = data.reduce<Record<string, number>>((acc, d) => {
    const m = d.discoverymethod ?? 'Unknown';
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {});

  const methods = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]);

  return (
    <aside className="flex flex-col gap-4 h-full" style={{ background: '#1c1b1b', padding: '1.25rem' }}>
      <div>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#8d90a2' }}>
          Discovery Method
        </p>
        <div className="flex flex-col gap-2">
          {methods.map(([method, count]) => {
            const active = activeMethods.size === 0 || activeMethods.has(method);
            const color = METHOD_COLORS[method] ?? '#8d90a2';
            return (
              <button
                key={method}
                onClick={() => onToggle(method)}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded text-left transition-all"
                style={{
                  background: active ? color + '22' : 'transparent',
                  border: `1px solid ${active ? color + '66' : '#434656'}`,
                  boxShadow: active ? `0 0 8px ${color}33` : 'none',
                }}
              >
                <span className="text-xs font-medium truncate" style={{ color: active ? color : '#8d90a2' }}>
                  {method}
                </span>
                <span
                  className="text-xs shrink-0 px-1.5 py-0.5 rounded"
                  style={{ background: color + '33', color }}
                >
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto">
        <button
          onClick={onIngest}
          disabled={ingesting}
          className="w-full py-2 px-4 rounded text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
          style={{
            background: ingesting ? '#434656' : 'linear-gradient(135deg, #0052ff, #0038b6)',
            color: '#e5e2e1',
            boxShadow: ingesting ? 'none' : '0 0 12px #0052ff55',
          }}
        >
          {ingesting ? 'Loading…' : 'Load Dataset'}
        </button>
      </div>
    </aside>
  );
}
