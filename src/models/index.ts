export interface Departure {
  id: string;
  line: string;
  direction: string;
  scheduledDeparture: Date;
  actualDeparture: Date | null;
  delayMinutes: number | null;
  platform: string | null;
  transportType: string;
  notifications: string[];
}

export interface StopConfig {
  id: string;
  name: string;
  city: 'wue' | 'muc';
  stopId: string;
  walkingTimeMinutes: number;
  visible: boolean;
  position: number;
}

export interface AppConfig {
  stops: StopConfig[];
  darkMode: boolean;
  refreshIntervalSeconds: number;
  maxDeparturesShown: number;
  language: string;
}

export type { PredefinedStop, PredefinedStopsConfig } from './PredefinedStops';
export type { MUCResponse, Departure as MucDeparture } from './MUCResponse';
export type { WUEResponse } from './WUEResponse';
export type { StylesConfig } from './StopStyles';