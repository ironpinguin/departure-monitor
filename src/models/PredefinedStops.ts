export interface PredefinedStop {
  id: string;
  name: string;
  stopId: string;
  walkingTimeMinutes: number;
}

export interface PredefinedStopsConfig {
  [city: string]: PredefinedStop[];
}