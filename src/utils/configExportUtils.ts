/**
 * Hilfsfunktionen und Konstanten für das Import/Export-System
 * Zentrale Sammlung aller Export/Import-bezogenen Utilities
 */

import type { 
  ConfigExport, 
  ImportOptions, 
  ExportFormat, 
  ImportSource,
  ValidationContext
} from '../types/configExport';
import type { AppConfig } from '../models';
import { SCHEMA_VERSIONS, VALIDATION_RULES } from '../types/configExport';
import { SchemaVersionManager } from './schemaVersionManager';

/**
 * Default-Werte für Export/Import-Optionen
 */
export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  overwriteExisting: false,
  importOnlyVisible: false,
  preserveStopPositions: true,
  importGlobalSettings: true,
  validateBeforeImport: true,
  createBackup: true
};

export const DEFAULT_VALIDATION_CONTEXT: ValidationContext = {
  schemaVersion: SCHEMA_VERSIONS.CURRENT,
  strict: false,
  options: {
    checkDuplicates: true,
    validateReferences: true,
    deepValidation: true
  }
};

/**
 * Erstellt eine neue Export-Konfiguration
 */
export function createConfigExport(
  config: AppConfig,
  options: {
    includeUserSettings?: boolean;
    includeStopPositions?: boolean;
    includeVisibilitySettings?: boolean;
    source?: string;
  } = {}
): ConfigExport {
  const timestamp = new Date().toISOString();
  const {
    includeUserSettings = true,
    includeStopPositions = true,
    includeVisibilitySettings = true,
    source = 'departure-monitor'
  } = options;

  return {
    schemaVersion: SchemaVersionManager.createForExport(),
    exportTimestamp: timestamp,
    exportedBy: `departure-monitor-${SCHEMA_VERSIONS.CURRENT}`,
    metadata: {
      stopCount: config.stops.length,
      language: config.language,
      source
    },
    config,
    exportSettings: {
      includeUserSettings,
      includeStopPositions,
      includeVisibilitySettings
    }
  };
}

/**
 * Erstellt Import-Optionen basierend auf Benutzerpräferenzen
 */
export function createImportOptions(
  partial: Partial<ImportOptions> = {}
): ImportOptions {
  return {
    ...DEFAULT_IMPORT_OPTIONS,
    ...partial
  };
}

/**
 * Erstellt einen Validierungskontext für spezifische Anforderungen
 */
export function createValidationContext(
  partial: Partial<ValidationContext> = {}
): ValidationContext {
  return {
    ...DEFAULT_VALIDATION_CONTEXT,
    ...partial,
    options: {
      ...DEFAULT_VALIDATION_CONTEXT.options,
      ...partial.options
    }
  };
}

/**
 * Generiert einen Dateinamen für den Export
 */
export function generateExportFilename(
  config: AppConfig,
  format: ExportFormat = 'json',
  includeTimestamp: boolean = true
): string {
  const timestamp = includeTimestamp ? `-${new Date().toISOString().split('T')[0]}` : '';
  const extension = format === 'json' ? 'json' : 'zip';
  const stopCount = config.stops.length;
  
  return `departure-monitor-config-${stopCount}stops${timestamp}.${extension}`;
}

/**
 * Überprüft, ob eine Konfiguration exportierbar ist
 */
export function isConfigExportable(config: AppConfig): {
  exportable: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!config.stops || config.stops.length === 0) {
    reasons.push('Keine Stops zum Exportieren vorhanden');
  }

  if (config.stops && config.stops.length > VALIDATION_RULES.MAX_STOPS) {
    reasons.push(`Zu viele Stops (${config.stops.length}/${VALIDATION_RULES.MAX_STOPS})`);
  }

  // Weitere Exportierbarkeits-Checks
  if (config.refreshIntervalSeconds < VALIDATION_RULES.MIN_REFRESH_INTERVAL) {
    reasons.push('Refresh-Intervall ist zu niedrig');
  }

  return {
    exportable: reasons.length === 0,
    reasons
  };
}

/**
 * Bereitet eine Konfiguration für den Export vor
 */
export function prepareConfigForExport(
  config: AppConfig,
  options: {
    excludeInvisibleStops?: boolean;
    normalizePositions?: boolean;
    validateBeforeExport?: boolean;
  } = {}
): {
  config: AppConfig;
  warnings: string[];
} {
  const warnings: string[] = [];
  let processedConfig = { ...config };

  const {
    excludeInvisibleStops = false,
    normalizePositions = true,
    validateBeforeExport = true
  } = options;

  // Unsichtbare Stops ausschließen
  if (excludeInvisibleStops) {
    const visibleStops = processedConfig.stops.filter(stop => stop.visible);
    if (visibleStops.length !== processedConfig.stops.length) {
      warnings.push(`${processedConfig.stops.length - visibleStops.length} unsichtbare Stops ausgeschlossen`);
      processedConfig = { ...processedConfig, stops: visibleStops };
    }
  }

  // Positionen normalisieren
  if (normalizePositions) {
    const normalizedStops = processedConfig.stops
      .sort((a, b) => a.position - b.position)
      .map((stop, index) => ({
        ...stop,
        position: index
      }));
    processedConfig = { ...processedConfig, stops: normalizedStops };
  }

  // Validierung vor Export
  if (validateBeforeExport) {
    const { exportable, reasons } = isConfigExportable(processedConfig);
    if (!exportable) {
      warnings.push(...reasons);
    }
  }

  return {
    config: processedConfig,
    warnings
  };
}

/**
 * Erstellt eine Zusammenfassung einer Export-Konfiguration
 */
export function createExportSummary(configExport: ConfigExport): {
  summary: string;
  details: Record<string, string | number>;
} {
  const config = configExport.config;
  const visibleStops = config.stops.filter(stop => stop.visible).length;
  const cities = [...new Set(config.stops.map(stop => stop.city))];
  
  const details = {
    'Schema-Version': configExport.schemaVersion,
    'Export-Datum': new Date(configExport.exportTimestamp).toLocaleDateString('de-DE'),
    'Anzahl Stops': config.stops.length,
    'Sichtbare Stops': visibleStops,
    'Städte': cities.join(', '),
    'Sprache': config.language,
    'Refresh-Intervall': `${config.refreshIntervalSeconds}s`,
    'Max. Abfahrten': config.maxDeparturesShown,
    'Dark Mode': config.darkMode ? 'Ja' : 'Nein'
  };

  const summary = `Konfiguration mit ${config.stops.length} Stops (${visibleStops} sichtbar) aus ${cities.length} Stadt${cities.length === 1 ? '' : 'en'}`;

  return { summary, details };
}

/**
 * Konvertiert eine Konfiguration in verschiedene Export-Formate
 */
export function convertConfigToFormat(
  configExport: ConfigExport,
  format: ExportFormat
): string | Uint8Array {
  switch (format) {
    case 'json':
      return JSON.stringify(configExport, null, 2);
    case 'compressed':
      // Für komprimierte Exports würde hier eine Komprimierung implementiert
      return JSON.stringify(configExport);
    default:
      throw new Error(`Nicht unterstütztes Export-Format: ${format}`);
  }
}

/**
 * Schätzt die Größe einer Export-Datei
 */
export function estimateExportSize(
  configExport: ConfigExport,
  format: ExportFormat
): {
  estimatedSizeBytes: number;
  estimatedSizeFormatted: string;
} {
  const jsonString = JSON.stringify(configExport);
  let estimatedSizeBytes = new Blob([jsonString]).size;

  // Geschätzte Komprimierung für komprimierte Formate
  if (format === 'compressed') {
    estimatedSizeBytes = Math.floor(estimatedSizeBytes * 0.3); // ~70% Komprimierung
  }

  const estimatedSizeFormatted = formatBytes(estimatedSizeBytes);

  return {
    estimatedSizeBytes,
    estimatedSizeFormatted
  };
}

/**
 * Validiert eine Import-Quelle
 */
export function validateImportSource(
  source: ImportSource,
  data: unknown
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  switch (source) {
    case 'file':
      if (!data || typeof data !== 'object') {
        errors.push('Datei-Inhalt ist ungültig');
      }
      break;
    case 'url':
      if (!data || typeof data !== 'string') {
        errors.push('URL ist ungültig');
      }
      break;
    case 'clipboard':
      if (!data || typeof data !== 'string') {
        errors.push('Zwischenablage-Inhalt ist ungültig');
      }
      break;
    default:
      errors.push(`Nicht unterstützte Import-Quelle: ${source}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Hilfsfunktion zur Formatierung von Bytes
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Erstellt einen eindeutigen Identifier für eine Konfiguration
 */
export function createConfigIdentifier(configExport: ConfigExport): string {
  const config = configExport.config;
  const stopIds = config.stops.map(s => s.id).sort().join(',');
  const settingsHash = `${config.language}-${config.refreshIntervalSeconds}-${config.maxDeparturesShown}-${config.darkMode}`;
  
  return `${configExport.schemaVersion}-${stopIds.substring(0, 50)}-${settingsHash}`;
}

/**
 * Vergleicht zwei Konfigurationen auf Gleichheit
 */
export function compareConfigs(
  config1: AppConfig,
  config2: AppConfig
): {
  identical: boolean;
  differences: string[];
} {
  const differences: string[] = [];

  // Stops vergleichen
  if (config1.stops.length !== config2.stops.length) {
    differences.push(`Unterschiedliche Anzahl Stops: ${config1.stops.length} vs ${config2.stops.length}`);
  }

  // Einstellungen vergleichen
  if (config1.language !== config2.language) {
    differences.push(`Unterschiedliche Sprache: ${config1.language} vs ${config2.language}`);
  }

  if (config1.refreshIntervalSeconds !== config2.refreshIntervalSeconds) {
    differences.push(`Unterschiedliches Refresh-Intervall: ${config1.refreshIntervalSeconds} vs ${config2.refreshIntervalSeconds}`);
  }

  if (config1.maxDeparturesShown !== config2.maxDeparturesShown) {
    differences.push(`Unterschiedliche max. Abfahrten: ${config1.maxDeparturesShown} vs ${config2.maxDeparturesShown}`);
  }

  if (config1.darkMode !== config2.darkMode) {
    differences.push(`Unterschiedlicher Dark Mode: ${config1.darkMode} vs ${config2.darkMode}`);
  }

  return {
    identical: differences.length === 0,
    differences
  };
}

/**
 * Export aller Utility-Funktionen
 */
export const ConfigExportUtils = {
  createExport: createConfigExport,
  createImportOptions,
  createValidationContext,
  generateFilename: generateExportFilename,
  isExportable: isConfigExportable,
  prepareForExport: prepareConfigForExport,
  createSummary: createExportSummary,
  convertToFormat: convertConfigToFormat,
  estimateSize: estimateExportSize,
  validateSource: validateImportSource,
  createIdentifier: createConfigIdentifier,
  compareConfigs,
  formatBytes
};