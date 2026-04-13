import React from 'react';
import { motion } from 'framer-motion';
import { useApodArchive } from '../../hooks/useApod';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

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

const archiveCardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.215, 0.61, 0.355, 1] } },
};

export const ApodArchive: React.FC = () => {
  const { data: entries, isLoading, isError } = useApodArchive(30);

  if (isError) return null;

  if (isLoading || !entries) {
    return (
      <div className="py-12">
        <h2 className="font-display text-2xl mb-6 text-white text-left tracking-tight">Mission History</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 glass-panel rounded-xl animate-pulse-subtle" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={archiveVariants}
      className="py-12"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl text-white tracking-tight mb-2">Mission History</h2>
          <p className="text-gray-400 font-sans">Browse previous astronomical captures from our deep space monitors.</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.03 }} className="p-2 glass-panel rounded-full text-gray-400 hover:text-electric-blue transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} className="p-2 glass-panel rounded-full text-gray-400 hover:text-electric-blue transition-colors">
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {entries.map((entry) => (
          <motion.div
            key={entry.date}
            variants={archiveCardVariants}
            className="group relative glass-panel rounded-xl overflow-hidden cursor-pointer hover:border-electric-blue/50 transition-all duration-300"
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
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
};
