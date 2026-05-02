import type { ExoplanetSummary } from '../types/exoplanet';

interface Props {
  planets: ExoplanetSummary[];
}

function mostFrequent<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  const freq = new Map<T, number>();
  for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1);
  return [...freq.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

export function ExoplanetStatsBar({ planets }: Props) {
  const topMethod = mostFrequent(
    planets.map((p) => p.discoverymethod).filter((m): m is string => m != null)
  );
  const peakYear = mostFrequent(
    planets.map((p) => p.discYear).filter((y): y is number => y != null)
  );

  return (
    <div
      className="flex items-center gap-3 px-6 py-2 shrink-0"
      style={{ borderBottom: '1px solid #43465633', background: '#1c1b1b' }}
    >
      <StatChip label="Confirmed Planets" value={planets.length.toLocaleString()} />
      <div className="w-px h-4" style={{ background: '#43465666' }} />
      <StatChip label="Top Method" value={topMethod ?? '—'} />
      <div className="w-px h-4" style={{ background: '#43465666' }} />
      <StatChip label="Peak Discovery Year" value={peakYear?.toString() ?? '—'} />
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#8d90a2' }}>
        {label}
      </span>
      <span className="text-sm font-semibold" style={{ color: '#00f0ff' }}>
        {value}
      </span>
    </div>
  );
}
