import axios from 'axios';
import type { ApodEntry } from '../types/apod';

// Mock data uses real NASA APOD entries with verified-working image URLs
const MOCK_DATA: ApodEntry = {
  date: '2024-06-27',
  explanation:
    "Jets of material blasting from newborn stars are captured in this James Webb Space Telescope close-up of the Serpens Nebula. The powerful protostellar outflows are bipolar, twin jets spewing in opposite directions. Their directions are perpendicular to accretion disks formed around the spinning, collapsing stellar infants. The sharp image shows for the first time that individual outflows detected in the Serpens Nebula are generally aligned along the same direction.",
  hdurl: 'https://apod.nasa.gov/apod/image/2406/STScI-SerpNorth.png',
  media_type: 'image',
  service_version: 'v1',
  title: 'Protostellar Outflows in Serpens',
  url: 'https://apod.nasa.gov/apod/image/2406/STScI-SerpNorth1024.png',
};

const PAST_MOCK_DATA: ApodEntry[] = [
  MOCK_DATA,
  {
    date: '2020-01-03',
    explanation:
      "Named for a forgotten constellation, the Quadrantid Meteor Shower is an annual event for planet Earth's northern hemisphere skygazers. The shower's radiant on the sky lies within the old, astronomically obsolete constellation Quadrans Muralis. Quadrantid meteors streak through this night skyscape composed of digital frames recorded in the hours around the shower's peak on January 4, 2013. The last quarter moon illuminates rugged terrain and a section of the Great Wall in Hebei Province, China.",
    hdurl: 'https://apod.nasa.gov/apod/image/2001/QuadrantidsChineseGreatWall.jpg',
    media_type: 'image',
    service_version: 'v1',
    title: 'Quadrantids over the Great Wall',
    url: 'https://apod.nasa.gov/apod/image/2001/QuadrantidsChineseGreatWall_1067.jpg',
    copyright: 'Cheng Luo',
  },
  {
    date: '2013-06-16',
    explanation:
      "The first APOD appeared eighteen years ago today. Although garnering only 14 pageviews on that day, APOD has now served over one billion space-related images. That early beginning, along with a nearly unchanging format, has allowed APOD to be a consistent and familiar site on a web frequently filled with change.",
    hdurl: 'https://apod.nasa.gov/apod/image/1306/apod18_letian_2480.jpg',
    media_type: 'image',
    service_version: 'v1',
    title: 'APOD Turns Eighteen',
    url: 'https://apod.nasa.gov/apod/image/1306/apod18_letian_960.jpg',
    copyright: 'Wang Letian',
  },
];

export const apodService = {
  getToday: async (): Promise<ApodEntry> => {
    try {
      const response = await axios.get<ApodEntry>('/api/apod/today');
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, using mock data for APOD Today');
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
  },
};
