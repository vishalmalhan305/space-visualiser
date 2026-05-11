import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { Satellite, Clock, Maximize2 } from 'lucide-react';
import type { IssPosition } from '../../types/dashboard';

import 'leaflet/dist/leaflet.css';

const CARTO_DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const TRAIL_COLOR = '#3b82f6';

const issIcon = divIcon({
  className: '',
  html: `<span style="
    display:block;width:12px;height:12px;border-radius:50%;
    background:#3b82f6;border:2px solid #fff;
    box-shadow:0 0 8px #3b82f6;
    animation:pulse 1.5s ease-in-out infinite;
  "></span>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function MapUpdater({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lon], { animate: true, duration: 1 });
  }, [map, lat, lon]);
  return null;
}

interface IssMapCardProps {
  trail: [number, number][];
  current: IssPosition;
  isLoading: boolean;
  dataUpdatedAt: number;
  onExpand: () => void;
}

export function IssMapCard({ trail, current, isLoading, dataUpdatedAt, onExpand }: IssMapCardProps) {
  const center: [number, number] = [current.latitude, current.longitude];

  return (
    <div
      className="glass-panel rounded-xl overflow-hidden flex flex-col cursor-pointer group"
      onClick={onExpand}
      role="button"
      aria-label="Expand ISS map"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onExpand()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Satellite className="text-electric-blue w-5 h-5 motion-safe:animate-pulse" />
          <h2 className="font-display text-sm tracking-widest uppercase text-white">
            ISS Live Position
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {dataUpdatedAt > 0 && (
            <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(dataUpdatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
          <Maximize2 className="w-3.5 h-3.5 text-gray-600 group-hover:text-electric-blue transition-colors" />
        </div>
      </div>

      {/* Map */}
      <div className="relative h-[220px] w-full">
        {isLoading ? (
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
        ) : (
          <MapContainer
            center={center}
            zoom={3}
            style={{ height: '100%', width: '100%', background: '#0d0d0d' }}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            worldCopyJump={true}
            attributionControl={false}
          >
            <TileLayer url={CARTO_DARK_TILE} attribution={CARTO_ATTRIBUTION} />
            {trail.length > 1 && (
              <Polyline positions={trail} color={TRAIL_COLOR} opacity={0.6} weight={2} />
            )}
            <Marker position={center} icon={issIcon} />
            <MapUpdater lat={current.latitude} lon={current.longitude} />
          </MapContainer>
        )}
      </div>

      {/* Stat strip */}
      <div className="px-5 py-3 flex items-center justify-between border-t border-white/5">
        <span className="font-mono text-xs text-gray-400">
          <span className="text-gray-500">LAT </span>
          <span className="text-white">{(current.latitude ?? 0).toFixed(2)}°</span>
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-500">LON </span>
          <span className="text-white">{(current.longitude ?? 0).toFixed(2)}°</span>
        </span>
      </div>

      {/* Live indicator */}
      <div className="px-5 pb-4 flex items-center gap-2 text-[10px] font-mono text-gray-500">
        <span
          className="inline-block w-2 h-2 rounded-full bg-green-400 motion-safe:animate-pulse"
          aria-hidden="true"
        />
        UPDATING EVERY 15 SECONDS
      </div>
    </div>
  );
}
