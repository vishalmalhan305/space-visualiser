import { useQuery } from '@tanstack/react-query';
import { issService } from '../../services/issService';
import { Satellite, Navigation, Clock } from 'lucide-react';

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-white/5 rounded-lg px-4 py-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">{label}</p>
      <p className="text-xl font-display font-bold text-white">
        {value}
        {unit && <span className="text-xs text-gray-500 ml-1 font-mono">{unit}</span>}
      </p>
    </div>
  );
}

export function IssTracker() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['iss-position'],
    queryFn: issService.getPosition,
    refetchInterval: 15_000, // ISS moves ~7.7 km/s – refresh every 15 s
    staleTime: 10_000,
  });

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Satellite className="text-electric-blue w-5 h-5 animate-pulse" />
          <h2 className="font-display text-sm tracking-widest uppercase text-white">
            ISS Live Position
          </h2>
        </div>
        {dataUpdatedAt > 0 && (
          <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="p-5 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-white/10 animate-pulse-subtle" />
          ))}
        </div>
      ) : (
        <>
          {/* Position visual */}
          <div className="px-5 py-4 flex items-center justify-center bg-electric-blue/5 border-b border-white/5">
            <Navigation className="text-electric-blue w-6 h-6 mr-3" />
            <div className="font-mono text-sm">
              <span className="text-gray-400">LAT </span>
              <span className="text-white font-semibold">{data!.latitude.toFixed(2)}°</span>
              <span className="text-gray-600 mx-3">|</span>
              <span className="text-gray-400">LON </span>
              <span className="text-white font-semibold">{data!.longitude.toFixed(2)}°</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="p-5 grid grid-cols-2 gap-3">
            <Stat label="Altitude" value={data!.altitude_km.toFixed(1)} unit="km" />
            <Stat label="Velocity" value={(data!.velocity_km_h / 1000).toFixed(1)} unit="k km/h" />
            <Stat
              label="Latitude"
              value={`${Math.abs(data!.latitude).toFixed(2)}° ${data!.latitude >= 0 ? 'N' : 'S'}`}
            />
            <Stat
              label="Longitude"
              value={`${Math.abs(data!.longitude).toFixed(2)}° ${data!.longitude >= 0 ? 'E' : 'W'}`}
            />
          </div>
        </>
      )}

      {/* Live dot indicator */}
      <div className="px-5 pb-4 flex items-center gap-2 text-[10px] font-mono text-gray-500">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        UPDATING EVERY 15 SECONDS
      </div>
    </div>
  );
}
