import React, { useState } from 'react';
import { useApodToday } from '../../hooks/useApod';
import { ApodSkeleton } from './ApodSkeleton';
import { Info, Calendar } from 'lucide-react';

export const ApodHero: React.FC = () => {
  const { data, isLoading, isError } = useApodToday();
  const [showInfo, setShowInfo] = useState(false);

  if (isLoading) {
    return <ApodSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="relative w-full h-[400px] bg-space-dark overflow-hidden rounded-2xl border border-white/10 my-6 flex items-center justify-center">
        <div className="text-center p-8">
          <Calendar className="w-12 h-12 text-gray-600 mb-4 mx-auto" />
          <h3 className="text-white font-display text-xl mb-2">Today's View Unavailable</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Our deep space telemetry link is temporarily down. Please check back later for today's Astronomy Picture of the Day.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full h-[600px] md:h-[70vh] max-h-[800px] bg-space-dark overflow-hidden rounded-2xl border border-white/10 my-6 shadow-[0_0_40px_rgba(0,240,255,0.1)] group">
      {/* Media Background */}
      {data.mediaType === 'video' ? (
        <iframe
          src={data.url}
          title={data.title}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          allowFullScreen
          frameBorder="0"
        />
      ) : (
        <img
          src={data.hdurl || data.url}
          alt={data.title}
          className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105"
        />
      )}

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-space-navy via-space-navy/50 to-transparent pointer-events-none" />

      {/* Content Area */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-3 text-electric-blue font-mono text-sm opacity-90">
            <span className="flex items-center gap-1.5 bg-electric-blue/10 px-2.5 py-1 rounded-sm border border-electric-blue/30 text-glow">
              <Calendar className="w-4 h-4" /> {data.date}
            </span>
            <span className="uppercase tracking-widest text-xs">Astronomy Picture of the Day</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold text-white mb-4 leading-tight drop-shadow-xl">
            {data.title}
          </h1>
          
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="md:hidden flex items-center gap-2 text-gray-300 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-md"
          >
            <Info className="w-5 h-5" /> 
            {showInfo ? 'Hide Details' : 'View Mission Data'}
          </button>
        </div>

        {/* Desktop Explanation Panel (or Toggled Mobile Panel) */}
        <div className={`
          glass-panel p-6 rounded-xl max-w-lg transition-all duration-500
          ${showInfo ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'} 
          md:translate-y-0 md:opacity-100 md:pointer-events-auto
        `}>
          <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
            <Info className="w-5 h-5 text-electric-blue" />
            <h3 className="font-display text-lg tracking-wide">Mission Details</h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed font-sans line-clamp-6 hover:line-clamp-none transition-all">
            {data.explanation}
          </p>
          {data.copyright && (
            <p className="text-xs text-gray-500 mt-4 font-mono">
              © {data.copyright}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
