import { Clock, RotateCcw } from 'lucide-react';
import type { IssPosition } from '../../types/dashboard';

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

interface IssStatPanelProps {
  data: IssPosition;
  dataUpdatedAt: number;
  refetch: () => void;
}

export function IssStatPanel({ data, dataUpdatedAt, refetch }: IssStatPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {dataUpdatedAt > 0 && (
        <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(dataUpdatedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Altitude" value={(data.altitude_km ?? 0).toFixed(1)} unit="km" />
        <Stat label="Velocity" value={((data.velocity_km_h ?? 0) / 1000).toFixed(1)} unit="k km/h" />
        <Stat
          label="Latitude"
          value={`${Math.abs(data.latitude ?? 0).toFixed(2)}° ${(data.latitude ?? 0) >= 0 ? 'N' : 'S'}`}
        />
        <Stat
          label="Longitude"
          value={`${Math.abs(data.longitude ?? 0).toFixed(2)}° ${(data.longitude ?? 0) >= 0 ? 'E' : 'W'}`}
        />
      </div>

      <button
        onClick={refetch}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all text-xs font-mono self-start"
      >
        <RotateCcw className="w-3 h-3" /> Refresh
      </button>
    </div>
  );
}
