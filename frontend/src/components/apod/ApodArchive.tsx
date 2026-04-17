import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApodArchive } from '../../hooks/useApod';
import { ChevronLeft, ChevronRight, Play, X, ExternalLink, Sparkles } from 'lucide-react';
import type { ApodEntry } from '../../types/apod';
import { useAiExplain } from '../../hooks/useAiExplain';

const CARDS_PER_PAGE = 3;

const archiveVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.215, 0.61, 0.355, 1],
      staggerChildren: 0.06,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.215, 0.61, 0.355, 1] } },
};

function ApodLightbox({ entry, onClose }: { entry: ApodEntry; onClose: () => void }) {
  const { data: aiInsight, isLoading: isExplaining } = useAiExplain('apod', entry.date, true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-space-dark/85 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={entry.title}
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          className="relative w-full max-w-4xl glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
        >
          {/* Image side */}
          <div className="md:w-1/2 bg-space-dark flex-shrink-0">
            {entry.mediaType === 'video' ? (
              <div className="w-full h-64 md:h-full flex items-center justify-center bg-black/40">
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 text-gray-400 hover:text-electric-blue transition-colors"
                >
                  <Play className="w-16 h-16" />
                  <span className="text-xs font-mono uppercase tracking-widest">Watch Video</span>
                </a>
              </div>
            ) : (
              <img
                src={entry.hdurl || entry.url}
                alt={entry.title}
                className="w-full h-64 md:h-full object-cover"
              />
            )}
          </div>

          {/* Details side */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/40 text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-blue"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-mono text-electric-blue uppercase tracking-widest mb-2">{entry.date}</span>
            <h2 className="text-xl font-display font-bold text-white leading-tight mb-1">{entry.title}</h2>
            {entry.copyright && (
              <p className="text-xs text-gray-500 font-mono mb-4">© {entry.copyright}</p>
            )}

            <p className="text-sm text-gray-300 leading-relaxed font-sans flex-1 mb-4">{entry.explanation}</p>

            {/* AI Insight */}
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-400/30 mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold">AI Insight</span>
              </div>
              {isExplaining ? (
                <div aria-busy="true" className="space-y-1.5">
                  <div className="h-2 rounded bg-white/10 motion-safe:animate-pulse w-full" />
                  <div className="h-2 rounded bg-white/10 motion-safe:animate-pulse w-4/5" />
                </div>
              ) : aiInsight ? (
                <p className="text-xs text-gray-300 leading-relaxed">{aiInsight}</p>
              ) : (
                <p className="text-xs text-gray-600 italic">Insight unavailable.</p>
              )}
            </div>

            {entry.hdurl && (
              <a
                href={entry.hdurl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 hover:border-electric-blue/50 text-gray-400 hover:text-electric-blue transition-all text-xs font-mono"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Full Resolution
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export const ApodArchive: React.FC = () => {
  const { data: entries, isLoading, isError } = useApodArchive(30);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ApodEntry | null>(null);

  if (isError) return null;

  if (isLoading || !entries) {
    return (
      <div className="py-12">
        <h2 className="font-display text-2xl mb-6 text-white tracking-tight">Mission History</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 glass-panel rounded-xl motion-safe:animate-pulse-subtle" />
          ))}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(entries.length / CARDS_PER_PAGE);
  const visible = entries.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE);

  return (
    <>
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={archiveVariants}
        aria-label="APOD mission history archive"
        className="py-12"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl text-white tracking-tight mb-2">Mission History</h2>
            <p className="text-gray-400 font-sans">Browse previous astronomical captures. Click any card for full details.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-gray-600 hidden sm:inline">
              {page + 1} / {totalPages}
            </span>
            <motion.button
              whileHover={{ scale: page === 0 ? 1 : 1.05 }}
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              aria-label="Previous page"
              className="p-2 glass-panel rounded-full text-gray-400 hover:text-electric-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-blue"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: page >= totalPages - 1 ? 1 : 1.05 }}
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
              className="p-2 glass-panel rounded-full text-gray-400 hover:text-electric-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-blue"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visible.map((entry) => (
            <motion.button
              key={entry.date}
              variants={cardVariants}
              onClick={() => setSelected(entry)}
              aria-label={`View details for ${entry.title}`}
              className="group text-left glass-panel rounded-xl overflow-hidden hover:border-electric-blue/50 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-blue"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={entry.url}
                  alt={entry.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                />
                {entry.mediaType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-electric-blue/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-electric-blue/50">
                      <Play className="w-6 h-6 text-electric-blue fill-electric-blue" />
                    </div>
                  </div>
                )}
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-electric-blue/0 group-hover:bg-electric-blue/5 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-electric-blue uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    View Details
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <span className="text-[10px] font-mono text-electric-blue tracking-tighter uppercase">{entry.date}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-display text-sm font-semibold text-white tracking-wide truncate group-hover:text-electric-blue transition-colors mb-1">
                  {entry.title}
                </h3>
                <p className="text-xs text-gray-400 font-sans line-clamp-2 leading-relaxed">
                  {entry.explanation}
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </motion.section>

      {selected && <ApodLightbox entry={selected} onClose={() => setSelected(null)} />}
    </>
  );
};
