import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Satellite } from 'lucide-react';
import { IssStatPanel } from './IssStatPanel';
import type { IssPosition } from '../../types/dashboard';

import 'leaflet/dist/leaflet.css';

const CARTO_DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const TRAIL_COLOR = '#3b82f6';

const issIcon = divIcon({
  className: '',
  html: `<span style="
    display:block;width:14px;height:14px;border-radius:50%;
    background:#3b82f6;border:2px solid #fff;
    box-shadow:0 0 10px #3b82f6;
    animation:pulse 1.5s ease-in-out infinite;
  "></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapUpdater({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lon], { animate: true, duration: 1 });
  }, [map, lat, lon]);
  return null;
}

function MapResizer({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const map = useMap();
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [map, containerRef]);
  return null;
}

interface IssMapModalProps {
  trail: [number, number][];
  current: IssPosition;
  dataUpdatedAt: number;
  refetch: () => void;
  onClose: () => void;
}

export function IssMapModal({ trail, current, dataUpdatedAt, refetch, onClose }: IssMapModalProps) {
  const center: [number, number] = [current.latitude, current.longitude];
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [sheetState, setSheetState] = useState<'collapsed' | 'expanded'>('collapsed');
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const modal = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-stretch"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal panel */}
        <motion.div
          className="relative z-10 flex flex-col md:flex-row w-full h-full bg-[#0a0a0f] overflow-hidden"
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.97, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close ISS map"
            className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Map — desktop: ~70vw, mobile: full width + ~65vh */}
          <div
            ref={mapContainerRef}
            className="flex-1 h-[65vh] md:h-full min-h-0"
          >
            <MapContainer
              center={center}
              zoom={3}
              style={{ height: '100%', width: '100%', background: '#0d0d0d' }}
              zoomControl={true}
              worldCopyJump={true}
              attributionControl={true}
            >
              <TileLayer url={CARTO_DARK_TILE} attribution={CARTO_ATTRIBUTION} />
              {trail.length > 1 && (
                <Polyline positions={trail} color={TRAIL_COLOR} opacity={0.6} weight={2} />
              )}
              <Marker position={center} icon={issIcon} />
              <MapUpdater lat={current.latitude} lon={current.longitude} />
              <MapResizer containerRef={mapContainerRef} />
            </MapContainer>
          </div>

          {/* Stats — desktop: fixed sidebar, mobile: bottom sheet */}
          <>
            {/* Desktop sidebar */}
            <aside className="hidden md:flex flex-col gap-4 w-72 shrink-0 p-6 border-l border-white/10 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Satellite className="text-electric-blue w-4 h-4 motion-safe:animate-pulse" />
                <h2 className="font-display text-sm tracking-widest uppercase text-white">
                  ISS Telemetry
                </h2>
              </div>
              <IssStatPanel data={current} dataUpdatedAt={dataUpdatedAt} refetch={refetch} />
            </aside>

            {/* Mobile bottom sheet */}
            <div
              className="md:hidden absolute bottom-0 left-0 right-0 bg-[#0f0f1a] border-t border-white/10 rounded-t-2xl transition-all duration-300 z-10"
              style={{ height: sheetState === 'expanded' ? '60%' : '80px' }}
              onTouchStart={e => { touchStartY.current = e.touches[0].clientY; }}
              onTouchEnd={e => {
                const delta = touchStartY.current - e.changedTouches[0].clientY;
                if (delta > 60) setSheetState('expanded');
                if (delta < -60) setSheetState('collapsed');
              }}
            >
              {/* Drag handle */}
              <button
                className="w-full flex justify-center pt-3 pb-2"
                onClick={() => setSheetState(s => s === 'collapsed' ? 'expanded' : 'collapsed')}
                aria-label={sheetState === 'collapsed' ? 'Expand stats' : 'Collapse stats'}
              >
                <span className="w-10 h-1 rounded-full bg-white/20" />
              </button>

              {/* Collapsed: minimal lat/lon */}
              {sheetState === 'collapsed' && (
                <p className="px-5 font-mono text-xs text-gray-400 text-center">
                  <span className="text-gray-500">LAT </span>
                  <span className="text-white">{(current.latitude ?? 0).toFixed(2)}°</span>
                  <span className="text-gray-600 mx-2">|</span>
                  <span className="text-gray-500">LON </span>
                  <span className="text-white">{(current.longitude ?? 0).toFixed(2)}°</span>
                </p>
              )}

              {/* Expanded: full stats */}
              {sheetState === 'expanded' && (
                <div className="px-5 pb-5 overflow-y-auto h-full">
                  <IssStatPanel data={current} dataUpdatedAt={dataUpdatedAt} refetch={refetch} />
                </div>
              )}
            </div>
          </>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
