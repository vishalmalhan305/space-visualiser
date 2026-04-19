export interface ExoplanetSummary {
  plName: string;
  plOrbper: number | null;
  plRade: number | null;
  discoverymethod: string | null;
  discYear: number | null;
}

export interface ExoplanetDetail {
  plName: string;
  hostname: string | null;
  plOrbper: number | null;
  plRade: number | null;
  plMasse: number | null;
  discoverymethod: string | null;
  discYear: number | null;
  stTeff: number | null;
}
