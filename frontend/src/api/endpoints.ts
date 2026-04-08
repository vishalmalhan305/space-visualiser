export const ENDPOINTS = {
  APOD: {
    TODAY: '/api/apod/today',
    BY_DATE: (date: string) => `/api/apod?date=${date}`,
    RANGE: (start: string, end: string) => `/api/apod/range?start=${start}&end=${end}`,
    ARCHIVE: (count: number) => `/api/apod/archive?count=${count}`,
  },
  ASTEROIDS: {
    WEEK: '/api/asteroids/week',
    DETAILS: (id: string) => `/api/asteroids/${id}`,
    ORBIT: (id: string) => `/api/asteroids/${id}/orbit`,
  },
  WEATHER: {
    RECENT: (days: number) => `/api/weather/recent?days=${days}`,
  },
  ISS: {
    POSITION: '/api/iss/position', // Assumed from previous spec
  },
} as const;
