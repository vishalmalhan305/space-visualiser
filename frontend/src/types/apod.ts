export interface ApodEntry {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  mediaType: 'image' | 'video';
  copyright?: string;
  fetchedAt?: string;
}
