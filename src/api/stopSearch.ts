import type { BasicStop, Cities, Line } from '../models/index';
import { linesForStop as linesForStopMuenchen, stopFinderMuenchen } from './muenchenApi';
import { linesForStop as linesForStopWuerzburg, stopFinderWuerzburg } from './wuerzburgApi';

/**
 * Provider-agnostic entry points for the stop search feature. The UI works
 * with `Cities` and delegates to the matching city API so components never need
 * to know which backend serves a given city.
 */

/**
 * Search stops by name for the given city.
 */
export function searchStops(city: Cities, query: string): Promise<BasicStop[]> {
  return city === 'muc' ? stopFinderMuenchen(query) : stopFinderWuerzburg(query);
}

/**
 * Fetch the lines serving a given stop for the given city.
 */
export function getLinesForStop(city: Cities, stopId: string): Promise<Line[]> {
  return city === 'muc' ? linesForStopMuenchen(stopId) : linesForStopWuerzburg(stopId);
}
