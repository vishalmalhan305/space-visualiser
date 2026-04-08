// Asteroid / NeoWs types
export interface Asteroid {
  id: string;
  name: string;
  estimated_diameter_km: number;
  is_potentially_hazardous: boolean;
  close_approach_date: string;
  relative_velocity_km_h: number;
  miss_distance_km: number;
}

export interface AsteroidSummary {
  element_count: number;
  hazardous_count: number;
  asteroids: Asteroid[];
}

// DONKI / Solar Weather types
export type SolarFlareClass = 'A' | 'B' | 'C' | 'M' | 'X';

export interface SolarFlare {
  flrID: string;
  beginTime: string;
  peakTime: string;
  classType: string;        // e.g. "M1.0", "X2.5"
  sourceLocation: string;
  activeRegionNum: number;
}

export interface SolarWeatherSummary {
  status: 'Nominal' | 'Elevated' | 'High' | 'Extreme';
  flareClass: SolarFlareClass;
  flares: SolarFlare[];
  lastUpdated: string;
}

// ISS Position type
export interface IssPosition {
  latitude: number;
  longitude: number;
  altitude_km: number;
  velocity_km_h: number;
  timestamp: string;
}
