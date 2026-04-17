import { motion } from 'framer-motion';
import { useAsteroidsWeek } from '../../hooks/useAsteroids';
import { useRecentWeather } from '../../hooks/useWeather';
import { AlertTriangle, Sun, Satellite, Zap, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { SpaceWeatherEvent } from '../../types/dashboard';

const solarColors = {
  Nominal: 'text-green-400',
  Elevated: 'text-amber-400',
  High: 'text-orange-400',
  Extreme: 'text-red-400',
} as const;

function Badge({
  icon,
  label,
  value,
  accent,
  loading,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
  loading: boolean;
  href?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    if (!href) return;
    
    const [path, hash] = href.split('#');
    
    // If we're on a different page, navigate first
    if (path !== location.pathname && path !== '') {
      navigate(href);
      return;
    }

    // If we're on the same page (or current is dashboard and path is /), smooth scroll to hash
    if (hash) {
      e.preventDefault();
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      navigate(`${location.pathname}#${hash}`);
    }
  };

  return (
    <motion.div 
      onClick={handleClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.18, ease: [0.215, 0.61, 0.355, 1] }}
      className="shrink-0 flex items-center gap-2 bg-space-navy/70 border border-white/10 px-3 py-1.5 rounded-full text-xs font-mono cursor-pointer hover:border-electric-blue/45 transition-all group whitespace-nowrap"
    >
      <motion.span
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        className="text-gray-400 group-hover:text-electric-blue transition-colors"
      >
        {icon}
      </motion.span>
      <span className="text-gray-400 hidden sm:inline">{label}:</span>
      {loading ? (
        <span className="w-10 h-3 bg-white/10 rounded animate-pulse-subtle inline-block" />
      ) : (
        <span className={accent ?? 'text-white'}>{value}</span>
      )}
    </motion.div>
  );
}

function getStatusFromEvents(events: SpaceWeatherEvent[] = []) {
  if (events.length === 0) return { status: 'Nominal' as const, peak: 'Quiet' };

  let status: keyof typeof solarColors = 'Nominal';
  let peak = 'Quiet';

  events.forEach(e => {
    if (e.classType?.startsWith('X')) {
      status = 'Extreme';
      peak = e.classType;
    } else if (e.classType?.startsWith('M') && status !== 'Extreme') {
      status = 'High';
      peak = e.classType;
    } else if (e.classType?.startsWith('C') && status === 'Nominal') {
      status = 'Elevated';
      peak = e.classType;
    }
  });

  return { status, peak };
}

export function StatusBar() {
  const { data: neo, isLoading: neoLoading } = useAsteroidsWeek();
  const { data: weather, isLoading: weatherLoading } = useRecentWeather(7);

  const neoCount = neo?.length ?? 0;
  const hazardous = neo?.filter(a => a.potentiallyHazardous).length ?? 0;
  const { status: solarStatus, peak: peakFlare } = getStatusFromEvents(weather);

  return (
    <div className="flex items-center gap-2 min-w-max">
      {/* System heartbeat */}
      <Badge
        icon={<Activity className="w-3.5 h-3.5" />}
        label="SYS"
        value="NOMINAL"
        accent="text-green-400"
        loading={false}
        href="/#apod"
      />

      {/* Asteroid count */}
      <Badge
        icon={<Zap className="w-3.5 h-3.5" />}
        label="NEO"
        value={`${neoCount} this week`}
        loading={neoLoading}
        href="/#asteroids"
      />

      {/* Hazardous badge – red when > 0 */}
      <Badge
        icon={<AlertTriangle className="w-3.5 h-3.5" />}
        label="PHO"
        value={hazardous === 0 ? 'None' : `${hazardous} detected`}
        accent={hazardous > 0 ? 'text-red-400' : 'text-green-400'}
        loading={neoLoading}
        href="/#asteroids"
      />

      {/* Solar weather */}
      <Badge
        icon={<Sun className="w-3.5 h-3.5" />}
        label="SOLAR"
        value={`${solarStatus} (${(peakFlare || 'Quiet').split('.')[0]})`}
        accent={solarColors[solarStatus]}
        loading={weatherLoading}
        href="/#solar"
      />

      {/* ISS live dot */}
      <Badge
        icon={<Satellite className="w-3.5 h-3.5" />}
        label="ISS"
        value="LIVE"
        accent="text-electric-blue"
        loading={false}
        href="/#iss"
      />
    </div>
  );
}
