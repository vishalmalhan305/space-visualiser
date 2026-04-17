import { motion } from 'framer-motion';
import { Terminal, AlertTriangle, RotateCcw } from 'lucide-react';
import type { SpaceWeatherEvent } from '../../types/dashboard';
import { EventCard } from './EventCard';

function CardSkeleton() {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center shrink-0 pt-5">
        <div className="w-3 h-3 rounded-full bg-white/10 motion-safe:animate-pulse-subtle ring-4 ring-space-dark" />
        <div className="w-px flex-1 mt-2 bg-white/5 min-h-[4rem]" />
      </div>
      <div className="flex-1 mb-5 glass-panel rounded-xl border border-white/5 p-5 space-y-3 motion-safe:animate-pulse-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-32 rounded bg-white/10" />
            <div className="h-2 w-20 rounded bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  events?: SpaceWeatherEvent[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function EventTimeline({ events, isLoading, isError, onRetry }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-0">
        {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 glass-panel rounded-2xl border border-red-500/20 text-center px-8">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-4 opacity-70" />
        <h3 className="text-white font-display text-lg mb-2 uppercase tracking-widest">Signal Loss</h3>
        <p className="text-gray-400 font-mono text-sm mb-6 max-w-xs">
          Unable to synchronize with NASA DONKI sensors.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono hover:bg-red-500/20 transition-all uppercase tracking-widest"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Re-establish Link
          </button>
        )}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-20 text-center glass-panel rounded-2xl border border-white/5">
        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-4">
          <Terminal className="w-5 h-5 text-gray-700" />
        </div>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em]">
          No solar events detected in this window.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {events.map((event, i) => (
        <EventCard
          key={event.eventId}
          event={event}
          isLast={i === events.length - 1}
        />
      ))}
    </motion.div>
  );
}
