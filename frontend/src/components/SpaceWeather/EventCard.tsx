import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Flame, Activity, Wind, Globe2, Cpu,
  ChevronDown, Sparkles, ExternalLink, Clock,
} from 'lucide-react';
import type { SpaceWeatherEvent } from '../../types/dashboard';
import { useAiExplain } from '../../hooks/useAiExplain';

type SeverityConfig = {
  label: string;
  color: string;
  bg: string;
  border: string;
  dotColor: string;
  glow: string;
  Icon: React.ElementType;
};

function getSeverity(event: SpaceWeatherEvent): SeverityConfig {
  const { type, classType } = event;

  if (type === 'FLARE') {
    if (classType?.startsWith('X'))
      return { label: 'EXTREME', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dotColor: 'bg-red-500', glow: 'shadow-[0_0_14px_rgba(239,68,68,0.5)]', Icon: Zap };
    if (classType?.startsWith('M'))
      return { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dotColor: 'bg-orange-500', glow: 'shadow-[0_0_10px_rgba(249,115,22,0.4)]', Icon: Flame };
    if (classType?.startsWith('C'))
      return { label: 'ELEVATED', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dotColor: 'bg-amber-400', glow: 'shadow-[0_0_8px_rgba(251,191,36,0.3)]', Icon: Flame };
    return { label: 'NOMINAL', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', dotColor: 'bg-green-400', glow: '', Icon: Activity };
  }
  if (type === 'CME')
    return { label: 'CME', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', dotColor: 'bg-purple-500', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.4)]', Icon: Wind };
  if (type === 'GST')
    return { label: 'STORM', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dotColor: 'bg-orange-400', glow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]', Icon: Globe2 };
  if (type === 'SEP')
    return { label: 'PARTICLES', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dotColor: 'bg-yellow-400', glow: 'shadow-[0_0_8px_rgba(250,204,21,0.3)]', Icon: Cpu };

  return { label: 'EVENT', color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10', dotColor: 'bg-gray-500', glow: '', Icon: Activity };
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + 'Z';
}

interface Props {
  event: SpaceWeatherEvent;
  isLast: boolean;
}

export function EventCard({ event, isLast }: Props) {
  const [expanded, setExpanded] = useState(false);
  const sev = getSeverity(event);
  const { Icon } = sev;

  const { data: aiInsight, isLoading: isExplaining } = useAiExplain(
    event.type,
    event.eventId,
    expanded,
  );

  return (
    <div className="flex gap-5">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0 pt-5">
        <div className={`w-3 h-3 rounded-full ${sev.dotColor} ${sev.glow} shrink-0 ring-4 ring-space-dark`} />
        {!isLast && <div className="w-px flex-1 mt-2 bg-gradient-to-b from-white/20 to-white/5 min-h-[3rem]" />}
      </div>

      {/* Card */}
      <motion.div
        layout
        className={`flex-1 mb-5 rounded-xl border overflow-hidden glass-panel ${sev.border} transition-all duration-300`}
      >
        {/* Always-visible header */}
        <button
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} event: ${event.classType || event.type}`}
          className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-blue rounded-xl"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className={`p-2 rounded-lg ${sev.bg} border ${sev.border} shrink-0`}>
              <Icon className={`w-4 h-4 ${sev.color}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className={`text-sm font-bold font-mono ${sev.color} tracking-wider`}>
                  {event.classType || event.type}
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${sev.bg} ${sev.color} border ${sev.border} uppercase tracking-widest`}>
                  {sev.label}
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/10 uppercase">
                  {event.type}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono truncate">
                {event.sourceLocation || 'Remote Sensor Array'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-mono text-gray-400">{fmtDate(event.startTime)}</p>
              <p className="text-[9px] font-mono text-gray-600">{fmtTime(event.startTime)}</p>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
              className="text-gray-500 group-hover:text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </button>

        {/* Expandable body */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="px-5 py-4 space-y-4 bg-white/[0.02]">
                {/* Time grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/[0.03] rounded-lg px-3 py-2.5 border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono mb-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Start
                    </p>
                    <p className="text-xs font-mono text-white">{fmtDate(event.startTime)}</p>
                    <p className="text-[10px] font-mono text-gray-500">{fmtTime(event.startTime)}</p>
                  </div>
                  {event.peakTime && (
                    <div className={`rounded-lg px-3 py-2.5 border ${sev.bg} ${sev.border}`}>
                      <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono mb-1 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Peak
                      </p>
                      <p className={`text-xs font-mono ${sev.color}`}>{fmtDate(event.peakTime)}</p>
                      <p className={`text-[10px] font-mono ${sev.color} opacity-70`}>{fmtTime(event.peakTime)}</p>
                    </div>
                  )}
                  {event.endTime && (
                    <div className="bg-white/[0.03] rounded-lg px-3 py-2.5 border border-white/5">
                      <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono mb-1">End</p>
                      <p className="text-xs font-mono text-white">{fmtDate(event.endTime)}</p>
                      <p className="text-[10px] font-mono text-gray-500">{fmtTime(event.endTime)}</p>
                    </div>
                  )}
                </div>

                {/* AI Mission Briefing */}
                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-400/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold">
                      AI Mission Briefing
                    </span>
                  </div>
                  {isExplaining ? (
                    <div aria-busy="true" aria-label="Loading AI briefing" className="space-y-1.5">
                      <div className="h-2 rounded bg-white/10 motion-safe:animate-pulse w-full" />
                      <div className="h-2 rounded bg-white/10 motion-safe:animate-pulse w-5/6" />
                      <div className="h-2 rounded bg-white/10 motion-safe:animate-pulse w-4/6" />
                    </div>
                  ) : aiInsight ? (
                    <p className="text-sm text-gray-300 leading-relaxed">{aiInsight}</p>
                  ) : (
                    <p className="text-xs text-gray-600 italic">
                      Mission briefing unavailable for this event window.
                    </p>
                  )}
                </div>

                {event.link && (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] font-mono text-gray-500 hover:text-amber-400 transition-colors uppercase tracking-widest"
                  >
                    <ExternalLink className="w-3 h-3" /> NASA DONKI Official Record
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
