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
    PAGE: '/api/asteroids/page',
  },
  WEATHER: {
    RECENT: (days: number) => `/api/weather/recent?days=${days}`,
    PAGE: '/api/weather/page',
  },
  ISS: {
    POSITION: '/api/iss/position', 
  },
  MARS: {
    PHOTOS: (rover: string, camera: string, sol: number) => `/api/mars/photos?rover=${rover}&camera=${camera}&sol=${sol}`,
  },
} as const;
