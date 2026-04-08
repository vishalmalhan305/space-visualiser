import React, { useState } from 'react';
import type { MarsFilters as MarsFiltersType } from '../types/mars';
import { useMarsPhotos } from '../hooks/useMarsPhotos';
import { MarsFilters } from '../components/mars/MarsFilters';
import { MarsMasonryGrid } from '../components/mars/MarsMasonryGrid';
import { Database } from 'lucide-react';

export const MarsPhotosPage: React.FC = () => {
  const [filters, setFilters] = useState<MarsFiltersType>({
    rover: 'curiosity',
    camera: 'FHAZ',
    sol: 1000,
  });

  const { data: photos, isLoading, isError } = useMarsPhotos(filters);

  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 flex items-center gap-4">
          <Database className="w-10 h-10 text-electric-blue" />
          Mars Rover Archives
        </h1>
        <p className="text-gray-400 max-w-2xl text-lg font-sans">
          Explore the red planet through the lenses of NASA's robotic explorers. 
          Use the mission control filters below to query the database for specific Sol (Martian day) imagery.
        </p>
      </div>

      <MarsFilters filters={filters} onFilterChange={setFilters} />

      {isError ? (
        <div className="flex flex-col items-center justify-center p-12 mt-8 text-center border border-red-500/20 rounded-2xl bg-red-500/5 min-h-[400px]">
          <h3 className="text-xl font-display text-red-400 mb-2">Connection Error</h3>
          <p className="text-gray-400 max-w-md">
            Unable to reach the interplanetary network. The Mars photo archive is currently unavailable.
          </p>
        </div>
      ) : (
        <MarsMasonryGrid photos={photos} isLoading={isLoading} />
      )}

    </div>
  );
};
