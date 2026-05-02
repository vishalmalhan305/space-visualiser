import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { MarsFilters as MarsFiltersType, MarsPhoto } from '../types/mars';
import { useMarsPhotos } from '../hooks/useMarsPhotos';
import { MarsFilters } from '../components/mars/MarsFilters';
import { MarsMissionBanner } from '../components/mars/MarsMissionBanner';
import { MarsMasonryGrid } from '../components/mars/MarsMasonryGrid';
import { MarsPhotoDetailPanel } from '../components/mars/MarsPhotoDetailPanel';
import { Database } from 'lucide-react';

export const MarsPhotosPage: React.FC = () => {
  const [filters, setFilters] = useState<MarsFiltersType>({ rover: 'curiosity' });
  const [selectedPhoto, setSelectedPhoto] = useState<MarsPhoto | null>(null);

  const { data: photos, isLoading, isError } = useMarsPhotos(filters);

  function handleRoverChange(newFilters: MarsFiltersType) {
    setFilters(newFilters);
    setSelectedPhoto(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.215, 0.61, 0.355, 1] }}
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 flex items-center gap-4">
          <Database className="w-10 h-10 text-electric-blue" />
          Mars Rover Archives
        </h1>
        <p className="text-gray-400 max-w-2xl text-lg font-sans">
          Explore the red planet through the lenses of NASA's robotic explorers.
          Select a mission to browse its image archive and learn about the science behind each photo.
        </p>
      </div>

      <MarsFilters filters={filters} onFilterChange={handleRoverChange} />
      <MarsMissionBanner rover={filters.rover} />

      {isError ? (
        <div className="flex flex-col items-center justify-center p-12 mt-8 text-center border border-red-500/20 rounded-2xl bg-red-500/5 min-h-[400px]">
          <h3 className="text-xl font-display text-red-400 mb-2">Connection Error</h3>
          <p className="text-gray-400 max-w-md">
            Unable to reach the interplanetary network. The Mars photo archive is currently unavailable.
          </p>
        </div>
      ) : (
        <div
          className={`transition-all duration-300 ${
            selectedPhoto ? 'grid gap-6 items-start' : 'block'
          }`}
          style={selectedPhoto ? { gridTemplateColumns: '1fr 380px' } : undefined}
        >
          <MarsMasonryGrid
            photos={photos}
            isLoading={isLoading}
            onPhotoClick={setSelectedPhoto}
            selectedPhotoId={selectedPhoto?.photoId}
          />
          <MarsPhotoDetailPanel
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
          />
        </div>
      )}
    </motion.div>
  );
};
