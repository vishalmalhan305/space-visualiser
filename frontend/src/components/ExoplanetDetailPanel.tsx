import { Sparkles } from 'lucide-react';
import { useExoplanetDetail } from '../hooks/useExoplanetDetail';
import { useAiExplain } from '../hooks/useAiExplain';

interface Props {
  plName: string | null;
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-widest" style={{ color: '#8d90a2' }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: '#e5e2e1' }}>
        {value != null ? String(value) : '—'}
      </span>
    </div>
  );
}

export function ExoplanetDetailPanel({ plName }: Props) {
  const { data: planet, isFetching } = useExoplanetDetail(plName);
  const { data: aiInsight, isFetching: isExplaining } = useAiExplain(
    'exoplanet',
    planet?.plName ?? '',
    planet != null
  );

  return (
    <aside
      className="flex flex-col gap-5 h-full overflow-y-auto"
      style={{ background: '#1c1b1b', padding: '1.25rem' }}
    >
      <p className="text-xs uppercase tracking-widest" style={{ color: '#8d90a2' }}>
        Selected Planet
      </p>

      {!plName && (
        <p className="text-sm" style={{ color: '#434656' }}>
          Click a data point to inspect
        </p>
      )}

      {plName && isFetching && (
        <p className="text-sm" style={{ color: '#434656' }}>
          Fetching…
        </p>
      )}

      {planet && !isFetching && (
        <>
          <h2
            className="text-xl font-bold leading-tight"
            style={{ color: '#e5e2e1', letterSpacing: '-0.02em' }}
          >
            {planet.plName}
          </h2>
          <div className="flex flex-col gap-4">
            <Row label="Star System" value={planet.hostname} />
            <Row label="Discovery Year" value={planet.discYear} />
            <Row label="Discovery Method" value={planet.discoverymethod} />
            <Row
              label="Orbital Period (days)"
              value={planet.plOrbper != null ? planet.plOrbper.toFixed(3) : null}
            />
            <Row
              label="Radius (Earth Radii)"
              value={planet.plRade != null ? planet.plRade.toFixed(2) : null}
            />
            <Row
              label="Mass (Earth Mass)"
              value={planet.plMasse != null ? planet.plMasse.toFixed(2) : null}
            />
            <Row
              label="Stellar Temp (K)"
              value={planet.stTeff != null ? Math.round(planet.stTeff) : null}
            />
          </div>

          <div style={{ borderTop: '1px solid #43465633', paddingTop: '1rem' }}>
            <div
              className="p-3 rounded-xl"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
                <span
                  className="text-xs uppercase tracking-widest font-semibold"
                  style={{ color: '#818cf8' }}
                >
                  AI Planet Briefing
                </span>
              </div>
              {isExplaining ? (
                <div className="flex flex-col gap-1.5">
                  <div className="h-2 rounded animate-pulse" style={{ background: '#ffffff1a', width: '100%' }} />
                  <div className="h-2 rounded animate-pulse" style={{ background: '#ffffff1a', width: '83%' }} />
                  <div className="h-2 rounded animate-pulse" style={{ background: '#ffffff1a', width: '67%' }} />
                </div>
              ) : aiInsight ? (
                <p className="text-xs leading-relaxed" style={{ color: '#c3c5d9' }}>{aiInsight}</p>
              ) : (
                <p className="text-xs italic" style={{ color: '#434656' }}>Briefing unavailable.</p>
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
