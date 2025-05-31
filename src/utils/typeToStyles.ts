import type { StylesConfig } from '../models';
import typeToStylesData from '../config/typeToStyles.json';

/**
 * Returns the predefined stops configuration loaded from JSON.
 * This is integrated during the build process.
 */
export function getTypeToStyles(): StylesConfig{
  return typeToStylesData as StylesConfig;
}