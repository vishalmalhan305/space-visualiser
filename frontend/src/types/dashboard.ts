// Asteroid / NeoWs types (Mirrors Backend Asteroid entity)
export interface Asteroid {
  neoId: string;
  name: string;
  estDiameterKmMin: number;
  estDiameterKmMax: number;
  potentiallyHazardous: boolean;
  closeApproachDate: string; // ISO Date yyyy-MM-dd
  velocity_kmh: number;
  missDistanceKm: number;
  semi_major_axis?: number;
  eccentricity?: number;
  inclination?: number;
  ingestedAt?: string;
}

// Space Weather Event (Mirrors Backend SpaceWeatherEvent entity)
export type SpaceWeatherEventType = 'FLARE' | 'CME' | 'GST' | 'SEP';

export interface SpaceWeatherEvent {
  eventId: string;
  type: SpaceWeatherEventType;
  startTime: string;
  peakTime?: string;
  endTime?: string;
  classType?: string;
  sourceLocation?: string;
  link?: string;
  ingestedAt?: string;
}

// Stats / Aggregates
export interface MonthlyWeatherStats {
  month: string;
  count: number;
  type?: SpaceWeatherEventType;
}

// ISS Position (Kept for telemetry feature)
export interface IssPosition {
  latitude: number;
  longitude: number;
  altitude_km: number;
  velocity_km_h: number;
  timestamp: string;
}
