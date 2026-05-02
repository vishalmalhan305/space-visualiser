import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import type { MarsPhoto } from '../../types/mars';

interface Props {
  photo: MarsPhoto | null;
  onClose: () => void;
}

export const MarsPhotoDetailPanel: React.FC<Props> = ({ photo, onClose }) => {
  const tags = photo?.keywords
    ? photo.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [];

  return (
    <AnimatePresence>
      {photo && (
        <motion.aside
          key={photo.photoId}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.35, ease: [0.215, 0.61, 0.355, 1] }}
          className="sticky top-4 flex flex-col gap-4 overflow-y-auto rounded-2xl border border-white/10 bg-space-navy/80 backdrop-blur-md p-4"
          style={{ maxHeight: 'calc(100vh - 6rem)' }}
          aria-label="Photo detail panel"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-electric-blue">
              Image Detail
            </span>
            <button
              onClick={onClose}
              aria-label="Close detail panel"
              className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <img
            src={photo.imgSrc}
            alt={photo.title ?? `Mars ${photo.rover} rover image from ${photo.earthDate}`}
            className="w-full rounded-xl object-cover border border-white/10"
          />

          <div className="flex flex-col gap-0.5">
            <p className="font-display text-base text-electric-blue capitalize tracking-wide">
              {photo.rover}
            </p>
            <p className="text-xs font-mono text-gray-400">{photo.earthDate}</p>
          </div>

          {photo.title && (
            <p className="text-sm font-semibold text-white leading-snug">{photo.title}</p>
          )}

          {photo.description && (
            <>
              <div className="border-t border-white/5" />
              <p className="text-sm text-gray-300 leading-relaxed">{photo.description}</p>
            </>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-electric-blue/10 border border-electric-blue/20 text-electric-blue uppercase tracking-wide"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <a
            href={photo.imgSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[10px] font-mono text-gray-500 hover:text-electric-blue transition-colors uppercase tracking-widest mt-auto"
          >
            <ExternalLink className="w-3 h-3" /> View Full Resolution
          </a>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
