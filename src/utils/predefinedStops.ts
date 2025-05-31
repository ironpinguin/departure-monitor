import type { PredefinedStopsConfig } from '../models';
import predefinedStopsData from '../config/predefinedStops.json';

/**
 * Returns the predefined stops configuration loaded from JSON.
 * This is integrated during the build process.
 */
export function getPredefinedStops(): PredefinedStopsConfig {
  return predefinedStopsData as PredefinedStopsConfig;
}