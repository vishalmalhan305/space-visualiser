import React from 'react';

export const ApodSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-[600px] md:h-[70vh] max-h-[800px] bg-space-navy animate-pulse-subtle rounded-2xl border border-white/5 my-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 space-y-4">
        <div className="h-6 w-48 bg-white/10 rounded-sm" />
        <div className="h-12 md:h-20 w-3/4 bg-white/20 rounded-md" />
        <div className="h-4 w-1/3 bg-white/5 rounded-sm" />
      </div>
      
      <div className="absolute bottom-12 right-12 hidden md:block">
        <div className="h-48 w-80 bg-white/10 rounded-xl border border-white/5" />
      </div>
    </div>
  );
};
