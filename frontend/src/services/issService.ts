import axios from 'axios';
import type { IssPosition } from '../types/dashboard';

const MOCK: IssPosition = {
  latitude: 28.61,
  longitude: 77.21,
  altitude_km: 408.2,
  velocity_km_h: 27_600,
  timestamp: new Date().toISOString(),
};

export const issService = {
  getPosition: async (): Promise<IssPosition> => {
    try {
      const response = await axios.get<IssPosition>('/api/iss/position');
      return response.data;
    } catch {
      // Live ISS position fluctuates – add slight jitter to mock
      return new Promise((r) =>
        setTimeout(
          () =>
            r({
              ...MOCK,
              latitude: MOCK.latitude + (Math.random() - 0.5) * 2,
              longitude: MOCK.longitude + (Math.random() - 0.5) * 4,
              timestamp: new Date().toISOString(),
            }),
          500,
        ),
      );
    }
  },
};
