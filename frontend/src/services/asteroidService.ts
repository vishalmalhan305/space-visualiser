import axios from 'axios';
import type { AsteroidSummary } from '../types/dashboard';

const MOCK: AsteroidSummary = {
  element_count: 24,
  hazardous_count: 3,
  asteroids: [
    {
      id: '54016033',
      name: '(2020 XR)',
      estimated_diameter_km: 0.32,
      is_potentially_hazardous: true,
      close_approach_date: '2026-04-09',
      relative_velocity_km_h: 47_812,
      miss_distance_km: 1_420_000,
    },
    {
      id: '3701710',
      name: '(2014 XG11)',
      estimated_diameter_km: 0.11,
      is_potentially_hazardous: false,
      close_approach_date: '2026-04-10',
      relative_velocity_km_h: 63_240,
      miss_distance_km: 5_880_000,
    },
    {
      id: '3162386',
      name: '(2002 EM7)',
      estimated_diameter_km: 0.18,
      is_potentially_hazardous: true,
      close_approach_date: '2026-04-11',
      relative_velocity_km_h: 29_600,
      miss_distance_km: 3_100_000,
    },
    {
      id: '2363305',
      name: '(2003 YT1)',
      estimated_diameter_km: 0.62,
      is_potentially_hazardous: true,
      close_approach_date: '2026-04-12',
      relative_velocity_km_h: 91_500,
      miss_distance_km: 6_700_000,
    },
    {
      id: '54309817',
      name: '(2022 BN3)',
      estimated_diameter_km: 0.07,
      is_potentially_hazardous: false,
      close_approach_date: '2026-04-13',
      relative_velocity_km_h: 38_000,
      miss_distance_km: 7_200_000,
    },
  ],
};

export const asteroidService = {
  getWeeklySummary: async (): Promise<AsteroidSummary> => {
    try {
      const response = await axios.get<AsteroidSummary>('/api/neo/weekly');
      return response.data;
    } catch {
      return new Promise((r) => setTimeout(() => r(MOCK), 900));
    }
  },
};
