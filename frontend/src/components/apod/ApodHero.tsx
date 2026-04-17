import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApodToday } from '../../hooks/useApod';
import { ApodSkeleton } from './ApodSkeleton';
import { Info, Calendar, Sparkles, X, ExternalLink } from 'lucide-react';
import { useAiExplain } from '../../hooks/useAiExplain';

export const ApodHero: React.FC = () => {
  const { data, isLoading, isError } = useApodToday();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: aiInsight, isLoading: isExplaining } = useAiExplain('apod', data?.date ?? '', !!data);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawerOpen]);

  if (isLoading) return <ApodSkeleton />;

  if (isError || !data) {
    return (
      <section className="relative w-full h-[400px] bg-space-dark overflow-hidden rounded-2xl border border-white/10 my-6 flex items-center justify-center">
        <div className="text-center p-8">
          <Calendar className="w-12 h-12 text-gray-600 mb-4 mx-auto" />
          <h3 className="text-white font-display text-xl mb-2">Today's View Unavailable</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Our deep space telemetry link is temporarily down. Please check back later.
          </p>
        </div>
      </section>
    );
  }

  const isVideoFile = data.mediaType === 'video' &&
    ['mp4', 'webm', 'ogg'].some(ext => data.url.toLowerCase().endsWith(ext));

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.55, ease: [0.215, 0.61, 0.355, 1] }}
        className="relative w-full h-[600px] md:h-[70vh] max-h-[800px] bg-space-dark overflow-hidden rounded-2xl border border-white/10 my-6 shadow-[0_0_40px_rgba(0,240,255,0.1)] group"
        aria-label="Astronomy Picture of the Day"
      >
        {/* Media Background */}
        {data.mediaType === 'video' ? (
          isVideoFile ? (
            <video
              src={data.url}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              controls autoPlay muted loop playsInline
            />
          ) : (
            <iframe
              src={data.url}
              title={`APOD video: ${data.title}`}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              allowFullScreen
              frameBorder="0"
            />
          )
        ) : (
          <img
            src={data.hdurl || data.url}
            alt={data.title}
            className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-space-navy via-space-navy/40 to-transparent pointer-events-none" />

        {/* Bottom content */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.215, 0.61, 0.355, 1] }}
          className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col md:flex-row justify-between items-end gap-6"
        >
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-3 text-electric-blue font-mono text-sm opacity-90">
              <span className="flex items-center gap-1.5 bg-electric-blue/10 px-2.5 py-1 rounded-sm border border-electric-blue/30 text-glow">
                <Calendar className="w-4 h-4" /> {data.date}
              </span>
              <span className="uppercase tracking-widest text-xs hidden sm:inline">Astronomy Picture of the Day</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight drop-shadow-xl">
              {data.title}
            </h1>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-electric-blue/50 text-white hover:text-electric-blue px-5 py-2.5 rounded-full transition-all text-sm font-mono tracking-wide"
              >
                <Info className="w-4 h-4" /> Mission Details
              </motion.button>

              {data.hdurl && (
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  href={data.hdurl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/30 text-gray-400 hover:text-white px-4 py-2.5 rounded-full transition-all text-sm font-mono"
                >
                  <ExternalLink className="w-4 h-4" /> HD Image
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Mission Details Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-space-dark/70 backdrop-blur-sm"
            />

            {/* Drawer panel — slides from right */}
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Mission Details"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-space-dark border-l border-white/10 shadow-2xl flex flex-col overflow-y-auto"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 sticky top-0 bg-space-dark z-10">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-electric-blue" />
                  <h2 className="font-display text-lg text-white tracking-wide">Mission Details</h2>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close mission details"
                  className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-blue"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 px-6 py-6 space-y-6">
                {/* Date + title */}
                <div>
                  <span className="text-[10px] font-mono text-electric-blue uppercase tracking-widest">{data.date}</span>
                  <h3 className="text-2xl font-display font-bold text-white mt-1 leading-tight">{data.title}</h3>
                  {data.copyright && (
                    <p className="text-xs text-gray-500 font-mono mt-1">© {data.copyright}</p>
                  )}
                </div>

                {/* Thumbnail */}
                {data.mediaType === 'image' && (
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={data.url}
                      alt={data.title}
                      className="w-full h-48 object-cover opacity-80"
                    />
                  </div>
                )}

                {/* Explanation */}
                <div>
                  <p className="text-sm text-gray-300 leading-relaxed font-sans">{data.explanation}</p>
                </div>

                {/* AI Insight */}
                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-400/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs text-indigo-400 uppercase tracking-widest font-semibold">AI Insight</span>
                  </div>
                  {isExplaining ? (
                    <div aria-busy="true" aria-label="Loading AI insight" className="space-y-2">
                      <div className="h-2 rounded bg-white/10 motion-safe:animate-pulse w-full" />
                      <div className="h-2 rounded bg-white/10 motion-safe:animate-pulse w-4/5" />
                      <div className="h-2 rounded bg-white/10 motion-safe:animate-pulse w-3/5" />
                    </div>
                  ) : aiInsight ? (
                    <p className="text-sm text-gray-300 leading-relaxed">{aiInsight}</p>
                  ) : (
                    <p className="text-xs text-gray-600 italic">Insight unavailable.</p>
                  )}
                </div>

                {/* HD link */}
                {data.hdurl && (
                  <a
                    href={data.hdurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 hover:border-electric-blue/50 text-gray-400 hover:text-electric-blue transition-all text-sm font-mono"
                  >
                    <ExternalLink className="w-4 h-4" /> View Full Resolution
                  </a>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
