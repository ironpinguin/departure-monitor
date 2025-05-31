/**
 * Interface for the Würzburg public transport API response
 */

/**
 * Represents a parent location (like a city or locality)
 */
export interface Parent {
  /** Location ID */
  id?: string;
  /** Location name */
  name: string;
  /** Location type (e.g., "locality") */
  type: string;
}

/**
 * Represents location properties
 */
export interface LocationProperties {
  /** Stop ID */
  stopId?: string;
  /** Area information */
  area?: string;
  /** Platform information */
  platform?: string;
  /** Zone information */
  zone?: string;
  /** Platform name */
  platformName?: string;
  /** Planned platform name */
  plannedPlatformName?: string;
  /** Area GID */
  areaGid?: string;
  /** Area niveau DIVA */
  AREA_NIVEAU_DIVA?: string;
  /** Stopping point planned */
  stoppingPointPlanned?: string;
  /** Realtime status */
  realtimeStatus?: string[];
}

/**
 * Represents a location (stop, platform, etc.)
 */
export interface Location {
  /** Location ID */
  id: string;
  /** Whether the ID is global */
  isGlobalId: boolean;
  /** Location name */
  name: string;
  /** Disassembled name */
  disassembledName?: string;
  /** Coordinates [x, y] */
  coord: number[];
  /** Location type (e.g., "stop", "platform") */
  type: string;
  /** Match quality (for search results) */
  matchQuality?: number;
  /** Whether this is the best match */
  isBest?: boolean;
  /** Parent location */
  parent?: Parent;
  /** Assigned stops */
  assignedStops?: Location[];
  /** Product classes */
  productClasses?: number[];
  /** Connecting mode */
  connectingMode?: number;
  /** Location properties */
  properties?: LocationProperties;
  /** Point type */
  pointType?: string;
  /** Niveau */
  niveau?: number;
  /** Arrival time planned */
  arrivalTimePlanned?: string;
  /** Departure time planned */
  departureTimePlanned?: string;
  /** Arrival time estimated */
  arrivalTimeEstimated?: string;
  /** Departure time estimated */
  departureTimeEstimated?: string;
}

/**
 * Represents a product (type of transportation)
 */
export interface Product {
  /** Product ID */
  id: number;
  /** Product class */
  class: number;
  /** Product name (e.g., "Bus") */
  name: string;
  /** Icon ID */
  iconId: number;
}

/**
 * Represents an operator (transport company)
 */
export interface Operator {
  /** Operator ID */
  id: string;
  /** Operator name */
  name: string;
}

/**
 * Represents a destination or origin
 */
export interface Destination {
  /** Destination ID */
  id?: string;
  /** Destination name */
  name: string;
  /** Destination type */
  type: string;
}

/**
 * Represents transportation properties
 */
export interface TransportationProperties {
  /** Trip code */
  tripCode?: number;
  /** Line display type */
  lineDisplay?: string;
  /** Operator URL */
  OperatorURL?: string;
}

/**
 * Represents a transportation method
 */
export interface Transportation {
  /** Transportation ID */
  id: string;
  /** Transportation name (e.g., "Bus 214") */
  name: string;
  /** Disassembled name */
  disassembledName: string;
  /** Line number */
  number: string;
  /** Route description */
  description: string;
  /** Product information */
  product: Product;
  /** Operator information */
  operator: Operator;
  /** Destination information */
  destination: Destination;
  /** Transportation properties */
  properties: TransportationProperties;
  /** Origin information */
  origin: Destination;
}

/**
 * Represents a stop event properties
 */
export interface StopEventProperties {
  /** AVMS Trip ID */
  AVMSTripID: string;
}

/**
 * Represents a stop event (departure/arrival)
 */
export interface StopEvent {
  /** Realtime status */
  realtimeStatus: string[];
  /** Whether this is realtime controlled */
  isRealtimeControlled: boolean;
  /** Location information */
  location: Location;
  /** Planned departure time */
  departureTimePlanned: string;
  /** Base timetable departure time */
  departureTimeBaseTimetable?: string;
  /** Estimated departure time */
  departureTimeEstimated: string;
  /** Transportation information */
  transportation: Transportation;
  /** Previous locations */
  previousLocations?: Location[];
  /** Onward locations */
  onwardLocations?: Location[];
  /** Stop event properties */
  properties: StopEventProperties;
}

/**
 * Main response interface for the Würzburg public transport API
 */
export interface WUEResponse {
  /** API version */
  version: string;
  /** System messages */
  systemMessages: string[];
  /** Locations */
  locations: Location[];
  /** Stop events (departures/arrivals) */
  stopEvents: StopEvent[];
}