import { useRecentWeather } from '../../hooks/useWeather';
import { Sun, Flame, ArrowRight } from 'lucide-react';
import type { SpaceWeatherEvent } from '../../types/dashboard';

const statusColors = {
  Nominal:  { bg: 'bg-green-500/15',  border: 'border-green-500/40',  text: 'text-green-400'  },
  Elevated: { bg: 'bg-amber-500/15',  border: 'border-amber-500/40',  text: 'text-amber-400'  },
  High:     { bg: 'bg-orange-500/15', border: 'border-orange-500/40', text: 'text-orange-400' },
  Extreme:  { bg: 'bg-red-500/15',    border: 'border-red-500/40',    text: 'text-red-400'    },
} as const;

type StatusKey = keyof typeof statusColors;

function getStatusFromEvents(events: SpaceWeatherEvent[] = []): { status: StatusKey; peakFlare: string } {
  if (events.length === 0) return { status: 'Nominal', peakFlare: 'Quiet' };

  let maxClass = 'Quiet';
  let status: StatusKey = 'Nominal';

  events.forEach(e => {
    if (e.classType?.startsWith('X')) {
      status = 'Extreme';
      maxClass = e.classType;
    } else if (e.classType?.startsWith('M') && status !== 'Extreme') {
      status = 'High';
      maxClass = e.classType;
    } else if (e.classType?.startsWith('C') && status === 'Nominal') {
      status = 'Elevated';
      maxClass = e.classType;
    }
  });

  return { status, peakFlare: maxClass };
}

export function SolarWeatherWidget() {
  const { data: events, isLoading } = useRecentWeather(7);

  const { status, peakFlare } = getStatusFromEvents(events);
  const colors = statusColors[status];

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <Sun className="text-amber-400 w-5 h-5" />
        <h2 className="font-display text-sm tracking-widest uppercase text-white">
          Solar Weather
        </h2>
      </div>

      {/* Status pill */}
      <div className="px-5 py-5 flex items-center gap-4">
        {isLoading ? (
          <div className="h-12 w-full rounded-xl bg-white/10 animate-pulse-subtle" />
        ) : (
          <>
            <div className={`flex-1 rounded-xl border px-4 py-3 ${colors.bg} ${colors.border}`}>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Space Weather Status
              </p>
              <p className={`text-2xl font-display font-bold ${colors.text}`}>
                {status}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Peak Flare
              </p>
              <p className={`text-3xl font-display font-black ${colors.text}`}>
                {peakFlare === 'Quiet' ? 'None' : peakFlare.split('.')[0]}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Recent events */}
      <div className="flex-1 px-5 pb-4 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-3">
          Recent Events
        </p>
        {isLoading ? (
          <>
            <div className="h-10 rounded-lg bg-white/10 animate-pulse-subtle" />
            <div className="h-10 rounded-lg bg-white/10 animate-pulse-subtle" />
          </>
        ) : (
          events?.slice(0, 3).map((e) => (
            <div
              key={e.eventId}
              className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white text-xs font-mono font-semibold">{e.classType || e.type}</span>
                <span className="text-gray-500 text-[10px] truncate max-w-[100px]">{e.sourceLocation}</span>
              </div>
              <span className="text-gray-500 text-[10px] font-mono">
                {new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>

      <a
        href="/solar"
        className="flex items-center justify-center gap-2 py-3 border-t border-white/5
                   text-xs font-mono text-electric-blue hover:bg-electric-blue/5 transition-colors"
      >
        SOLAR ACTIVITY LOG <ArrowRight className="w-3 h-3" />
      </a>
    </div>
  );
}
