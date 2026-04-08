import axios from 'axios';
import type { SolarWeatherSummary } from '../types/dashboard';

const MOCK: SolarWeatherSummary = {
  status: 'Elevated',
  flareClass: 'M',
  lastUpdated: new Date().toISOString(),
  flares: [
    {
      flrID: 'FL-2026-04-08-001',
      beginTime: '2026-04-08T06:14Z',
      peakTime: '2026-04-08T06:28Z',
      classType: 'M2.4',
      sourceLocation: 'N18W12',
      activeRegionNum: 13682,
    },
    {
      flrID: 'FL-2026-04-07-003',
      beginTime: '2026-04-07T21:05Z',
      peakTime: '2026-04-07T21:19Z',
      classType: 'C7.1',
      sourceLocation: 'S09E05',
      activeRegionNum: 13680,
    },
  ],
};

export const solarService = {
  getSummary: async (): Promise<SolarWeatherSummary> => {
    try {
      const response = await axios.get<SolarWeatherSummary>('/api/solar/summary');
      return response.data;
    } catch {
      return new Promise((r) => setTimeout(() => r(MOCK), 700));
    }
  },
};
