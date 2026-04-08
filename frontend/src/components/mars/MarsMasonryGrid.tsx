import React from 'react';
import type { MarsPhoto } from '../../types/mars';
import { ExternalLink } from 'lucide-react';

interface Props {
  photos?: MarsPhoto[];
  isLoading: boolean;
}

export const MarsMasonryGrid: React.FC<Props> = ({ photos, isLoading }) => {
  if (isLoading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid rounded-xl bg-white/5 animate-pulse-subtle border border-white/5"
            style={{ height: `${Math.max(200, Math.random() * 400)}px` }}
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
          The selected rover might not have taken photos with this specific camera on this sol. Try selecting a different camera or sol date.
        </p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {photos.map((photo) => (
        <div 
          key={photo.photoId} 
          className="relative break-inside-avoid group rounded-xl overflow-hidden border border-white/10 bg-space-navy shadow-lg"
        >
          <img
            src={photo.imgSrc}
            alt={`Mars ${photo.rover} - Sol ${photo.sol} - ${photo.camera}`}
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-space-dark/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="font-mono text-electric-blue text-xs tracking-widest mb-1 uppercase">
                  {photo.camera}
                </p>
                <p className="text-white text-sm font-semibold">
                  {photo.earthDate}
                </p>
              </div>
              <a 
                href={photo.imgSrc} 
                target="_blank" 
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-electric-blue hover:text-space-dark text-white transition-colors"
                title="View Full Resolution"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
