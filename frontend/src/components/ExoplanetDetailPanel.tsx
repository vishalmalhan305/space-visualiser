import { useExoplanetDetail } from '../hooks/useExoplanetDetail';

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

  return (
    <aside
      className="flex flex-col gap-5 h-full"
      style={{ background: '#1c1b1b', padding: '1.25rem' }}
    >
      <p className="text-xs uppercase tracking-widest" style={{ color: '#8d90a2' }}>
        Selected Planet
      </p>

      {!plName && (
        <p className="text-sm" style={{ color: '#434656' }}>
          Hover a data point to inspect
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
        </>
      )}
    </aside>
  );
}
