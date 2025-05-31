/**
 * Interface for the Munich public transport API response
 */

/**
 * Represents a public transport line
 */
export interface Line {
  /** Line number (e.g., "54", "190", "191") */
  number: string;
  /** Symbol/icon reference for the line (e.g., "24054.svg") */
  symbol: string;
  /** Direction the line is heading */
  direction: string;
  /** Stateless identifier for the line */
  stateless: string;
  /** Type of transport (e.g., "MetroBus", "Bus") */
  name: string;
}

/**
 * Represents a station
 */
export interface Station {
  /** Station ID */
  id: string;
  /** Station name */
  name: string;
}

/**
 * Represents a notification about a line or stop
 */
export interface Notification {
  /** Notification text */
  text: string;
  /** URL with more information */
  link: string;
  /** Type of notification (e.g., "line", "stop") */
  type: string;
}

/**
 * Represents a single departure
 */
export interface Departure {
  /** Line information */
  line: Line;
  /** Direction the vehicle is heading */
  direction: string;
  /** Station information */
  station: Station;
  /** Track information (if applicable) */
  track: string;
  /** Departure date in format YYYYMMDD */
  departureDate: string;
  /** Planned departure time in format HH:MM */
  departurePlanned: string;
  /** Live/actual departure time in format HH:MM (may be empty) */
  departureLive: string;
  /** Whether the departure is on time */
  inTime: boolean;
  /** Notifications related to this departure */
  notifications: Notification[];
}

/**
 * Main response interface for the Munich public transport API
 */
export interface MUCResponse {
  /** Error message (empty if no error) */
  error: string;
  /** List of departures */
  departures: Departure[];
  /** General notifications */
  notifications: Notification[];
}