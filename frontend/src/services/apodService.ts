import axios from 'axios';
import type { ApodEntry } from '../types/apod';

// Use a real backend endpoint if available, but for now we fallback to mock data
// if the local backend is not serving this yet.
const MOCK_DATA: ApodEntry = {
  date: '2026-04-08',
  explanation: 'Why does this galaxy have such a long tail? In this stunning image from the Hubble Space Telescope, the Tadpole Galaxy stands out against a backdrop of distant galaxies. Its long tail of stars, gas, and dust stretches out for some 280,000 light-years. The tail was likely created when a smaller intruder galaxy passed too close to the Tadpole, its gravitational pull drawing out a long ribbon of stars.',
  hdurl: 'https://apod.nasa.gov/apod/image/2404/Tadpole_Hubble_3467.jpg',
  media_type: 'image',
  service_version: 'v1',
  title: 'The Tadpole Galaxy from Hubble',
  url: 'https://apod.nasa.gov/apod/image/2404/Tadpole_Hubble_1080.jpg',
  copyright: 'NASA, ESA, Hubble Heritage Team'
};

const PAST_MOCK_DATA: ApodEntry[] = [
  MOCK_DATA,
  {
    date: '2026-04-07',
    explanation: 'A cosmic bubble...',
    media_type: 'image',
    service_version: 'v1',
    title: 'Bubble Nebula',
    url: 'https://apod.nasa.gov/apod/image/1604/Bubble_Hubble_1080.jpg',
  },
  {
    date: '2026-04-06',
    explanation: 'A great explosion...',
    media_type: 'video',
    service_version: 'v1',
    title: 'Crab Nebula Expansion',
    url: 'https://www.youtube.com/embed/9X2O0hPz82Q',
  }
];

export const apodService = {
  getToday: async (): Promise<ApodEntry> => {
    try {
      const response = await axios.get<ApodEntry>('/api/apod');
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, using mock data for APOD Today');
      // Simulate network delay for skeleton testing
      return new Promise((resolve) => setTimeout(() => resolve(MOCK_DATA), 1200));
    }
  },
  
  getArchive: async (): Promise<ApodEntry[]> => {
    try {
      const response = await axios.get<ApodEntry[]>('/api/apod/archive');
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, using mock data for APOD Archive');
      return new Promise((resolve) => setTimeout(() => resolve(PAST_MOCK_DATA), 1500));
    }
  }
};
