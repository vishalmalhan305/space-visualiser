import React from 'react';
import { motion } from 'framer-motion';
import type { MarsPhoto } from '../../types/mars';

interface Props {
  photos?: MarsPhoto[];
  isLoading: boolean;
  onPhotoClick?: (photo: MarsPhoto) => void;
  selectedPhotoId?: number;
}

const gridVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.215, 0.61, 0.355, 1],
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.215, 0.61, 0.355, 1] } },
};

const SKELETON_HEIGHTS = Array.from({ length: 12 }, () => Math.max(200, Math.random() * 400));

export const MarsMasonryGrid: React.FC<Props> = ({
  photos,
  isLoading,
  onPhotoClick,
  selectedPhotoId,
}) => {
  if (isLoading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid rounded-xl bg-white/5 animate-pulse-subtle border border-white/5"
            style={{ height: `${SKELETON_HEIGHTS[i]}px` }}
          />
        ))}
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-white/10 rounded-2xl bg-white/5 border-dashed min-h-[400px]">
        <h3 className="text-xl font-display text-white mb-2">No Images Found</h3>
        <p className="text-gray-400 max-w-md">
          No photos found for this rover yet. Try selecting a different mission.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      key={photos[0]?.imgSrc ?? 'empty'}
      initial="hidden"
      animate="visible"
      variants={gridVariants}
      className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
    >
      {photos.map((photo) => {
        const isSelected = photo.photoId === selectedPhotoId;
        return (
          <motion.div
            key={photo.imgSrc}
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            onClick={() => onPhotoClick?.(photo)}
            className={`relative break-inside-avoid group rounded-xl overflow-hidden border bg-space-navy shadow-lg cursor-pointer transition-all duration-300 ${
              isSelected
                ? 'border-electric-blue ring-2 ring-electric-blue shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            <img
              src={photo.imgSrc}
              alt={`Mars ${photo.rover} rover image from ${photo.earthDate}`}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-space-dark/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <p className="text-white text-sm font-semibold">{photo.earthDate}</p>
              <p className="text-[10px] font-mono text-electric-blue uppercase tracking-widest mt-0.5">
                Tap to explore
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
