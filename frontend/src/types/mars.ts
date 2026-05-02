export interface MarsPhoto {
  photoId: number;
  rover: string;
  camera: string | null;
  sol: number | null;
  earthDate: string;
  imgSrc: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
}

export interface MarsFilters {
  rover: 'curiosity' | 'perseverance' | 'opportunity' | 'spirit';
}
