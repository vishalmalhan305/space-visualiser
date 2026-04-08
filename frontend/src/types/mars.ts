export interface MarsPhoto {
  photoId: number;
  rover: string;
  camera: string;
  sol: number;
  earthDate: string;
  imgSrc: string;
}

export interface MarsFilters {
  rover: 'curiosity' | 'perseverance' | 'opportunity' | 'spirit';
  camera: string;
  sol: number;
}
