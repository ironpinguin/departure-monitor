export type Cities = 'wue' | 'muc';

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

export interface BasicStop {
  id: string;
  name: string;
  city: Cities;
  longName: string;
}

export interface Line {
  name: string;
  direction: string;
  type: string;
}

export type { PredefinedStop, PredefinedStopsConfig } from './PredefinedStops';
export type { MUCResponse, MUCStopResponse, Departure as MucDeparture, Line as MUCLine, MUCLinesResponse, MUCStop } from './MUCResponse';
export type { WUEResponse } from './WUEResponse';
export type { StylesConfig } from './StopStyles';