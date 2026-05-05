import { Sparkles } from 'lucide-react';
import { useExoplanetDetail } from '../hooks/useExoplanetDetail';
import { useAiExplain } from '../hooks/useAiExplain';

interface Props {
  plName: string | null;
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: '#8d90a2' }}>
        {label}
      </span>
      <span className="text-sm font-semibold" style={{ color: '#e5e2e1' }}>
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
      <p className="text-[10px] uppercase tracking-widest font-mono" style={{ color: '#8d90a2' }}>
        Selected Planet
      </p>

      {!plName && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <svg className="w-8 h-8 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
            <path d="M2 12h4M18 12h4M12 2v4M12 18v4" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-xs font-mono" style={{ color: '#434656' }}>
            Click a data point to inspect
          </p>
        </div>
      )}

      {plName && isFetching && (
        <div className="flex flex-col gap-3 pt-2">
          <div className="h-5 rounded" style={{ background: '#ffffff0d', width: '70%' }} />
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="h-2 rounded" style={{ background: '#ffffff0d', width: '60%' }} />
                <div className="h-3 rounded" style={{ background: '#ffffff12', width: '80%' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {planet && !isFetching && (
        <>
          <div>
            <h2
              className="text-xl font-bold leading-tight mb-1"
              style={{ color: '#e5e2e1', letterSpacing: '-0.02em' }}
            >
              {planet.plName}
            </h2>
            <p className="text-xs font-mono" style={{ color: '#8d90a2' }}>
              {planet.hostname ?? '—'} system
            </p>
          </div>

          {/* Stats grid — 2 columns to use the wider panel */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <Row label="Discovery Year" value={planet.discYear} />
            <Row label="Method" value={planet.discoverymethod} />
            <Row
              label="Orbital Period"
              value={planet.plOrbper != null ? `${planet.plOrbper.toFixed(2)} d` : null}
            />
            <Row
              label="Radius"
              value={planet.plRade != null ? `${planet.plRade.toFixed(2)} R⊕` : null}
            />
            <Row
              label="Mass"
              value={planet.plMasse != null ? `${planet.plMasse.toFixed(2)} M⊕` : null}
            />
            <Row
              label="Stellar Temp"
              value={planet.stTeff != null ? `${Math.round(planet.stTeff)} K` : null}
            />
          </div>

          <div style={{ borderTop: '1px solid #43465633', paddingTop: '1rem' }}>
            <div
              className="p-4 rounded-xl"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-3">
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
                  <div className="h-2 rounded motion-safe:animate-pulse" style={{ background: '#ffffff1a', width: '100%' }} />
                  <div className="h-2 rounded motion-safe:animate-pulse" style={{ background: '#ffffff1a', width: '83%' }} />
                  <div className="h-2 rounded motion-safe:animate-pulse" style={{ background: '#ffffff1a', width: '67%' }} />
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
