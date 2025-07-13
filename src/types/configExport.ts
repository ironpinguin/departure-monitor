/**
 * Schema-Definition für das Import/Export-System
 * Definiert alle Typen für Export, Import und Validierung von Konfigurationen
 */

import type { AppConfig, StopConfig } from '../models';

// Schema-Version-Konstanten
export const SCHEMA_VERSIONS = {
  CURRENT: '1.0.0',
  SUPPORTED: ['1.0.0'],
  MINIMUM: '1.0.0'
} as const;

// Validierungsregeln-Konstanten
export const VALIDATION_RULES = {
  MAX_STOPS: 50,
  MIN_REFRESH_INTERVAL: 10,
  MAX_REFRESH_INTERVAL: 3600,
  MAX_DEPARTURES_SHOWN: 50,
  MIN_WALKING_TIME: 0,
  MAX_WALKING_TIME: 60,
  SUPPORTED_CITIES: ['wue', 'muc'] as const,
  SUPPORTED_LANGUAGES: ['de', 'en'] as const
} as const;

// Hauptstruktur für exportierte Konfigurationen
export interface ConfigExport {
  /** Schema-Version für Kompatibilitätsprüfung */
  schemaVersion: string;
  /** Zeitstempel des Exports */
  exportTimestamp: string;
  /** Exportierte Anwendung */
  exportedBy: string;
  /** Metadaten über die exportierte Konfiguration */
  metadata: {
    /** Anzahl der exportierten Stops */
    stopCount: number;
    /** Verwendete Sprache */
    language: string;
    /** Quelle der Konfiguration */
    source: string;
  };
  /** Die eigentliche Konfiguration */
  config: AppConfig;
  /** Zusätzliche Einstellungen für Import/Export */
  exportSettings: {
    /** Ob Benutzerdefinierte Einstellungen enthalten sind */
    includeUserSettings: boolean;
    /** Ob Stop-Positionen enthalten sind */
    includeStopPositions: boolean;
    /** Ob Sichtbarkeitseinstellungen enthalten sind */
    includeVisibilitySettings: boolean;
  };
}

// Optionen für den Import-Prozess
export interface ImportOptions {
  /** Bestehende Konfiguration überschreiben */
  overwriteExisting: boolean;
  /** Nur sichtbare Stops importieren */
  importOnlyVisible: boolean;
  /** Stop-Positionen beibehalten */
  preserveStopPositions: boolean;
  /** Globale Einstellungen übernehmen */
  importGlobalSettings: boolean;
  /** Validierung vor Import durchführen */
  validateBeforeImport: boolean;
  /** Backup der aktuellen Konfiguration erstellen */
  createBackup: boolean;
}

// Ergebnis des Import-Vorgangs
export interface ImportResult {
  /** Erfolgreich importiert */
  success: boolean;
  /** Importierte Konfiguration */
  importedConfig: AppConfig | null;
  /** Anzahl der importierten Stops */
  importedStopsCount: number;
  /** Validierungsergebnis */
  validation: ValidationResult;
  /** Backup-Informationen falls erstellt */
  backup?: {
    timestamp: string;
    config: AppConfig;
  };
  /** Zusätzliche Nachrichten */
  messages: string[];
}

// Ergebnis der Validierung
export interface ValidationResult {
  /** Validierung erfolgreich */
  isValid: boolean;
  /** Gefundene Fehler */
  errors: ValidationError[];
  /** Gefundene Warnungen */
  warnings: ValidationWarning[];
  /** Validierte Schema-Version */
  schemaVersion: string;
  /** Kompatibilität mit aktueller Version */
  isCompatible: boolean;
}

// Vorschau für den Import
export interface ImportPreview {
  /** Anzahl der zu importierenden Stops */
  stopCount: number;
  /** Zu importierende Stops */
  stops: StopConfig[];
  /** Änderungen an globalen Einstellungen */
  globalSettingsChanges: {
    darkMode?: boolean | undefined;
    refreshIntervalSeconds?: number | undefined;
    maxDeparturesShown?: number | undefined;
    language?: string | undefined;
  };
  /** Konflikte mit bestehender Konfiguration */
  conflicts: ImportConflict[];
  /** Geschätzte Änderungen */
  estimatedChanges: {
    stopsAdded: number;
    stopsUpdated: number;
    stopsRemoved: number;
    settingsChanged: number;
  };
}

// Konflikte beim Import
export interface ImportConflict {
  /** Typ des Konflikts */
  type: 'stop_exists' | 'position_conflict' | 'setting_conflict';
  /** Beschreibung des Konflikts */
  description: string;
  /** Betroffene Stop-ID (falls zutreffend) */
  stopId?: string;
  /** Vorgeschlagene Lösung */
  suggestedResolution: string;
  /** Schweregrad */
  severity: 'low' | 'medium' | 'high';
}

// Validierungsfehler
export interface ValidationError {
  /** Fehlercode */
  code: string;
  /** Fehlernachricht */
  message: string;
  /** Pfad zum fehlerhaften Feld */
  field?: string;
  /** Aktueller Wert */
  value?: unknown;
  /** Erwarteter Wert oder Format */
  expected?: string;
  /** Schweregrad */
  severity: 'error' | 'critical';
}

// Validierungswarnung
export interface ValidationWarning {
  /** Warnungscode */
  code: string;
  /** Warnungsnachricht */
  message: string;
  /** Pfad zum Feld */
  field?: string;
  /** Aktueller Wert */
  value?: unknown;
  /** Empfohlene Aktion */
  recommendation?: string;
}

// Typen für Schema-Version-Verwaltung
export interface SchemaVersionInfo {
  /** Aktuelle Version */
  current: string;
  /** Unterstützte Versionen */
  supported: string[];
  /** Minimale unterstützte Version */
  minimum: string;
}

// Typ-Guards für Validierung
export type ConfigExportInput = unknown;
export type ValidationContext = {
  /** Aktuelle Schema-Version */
  schemaVersion: string;
  /** Strict-Mode für Validierung */
  strict: boolean;
  /** Zusätzliche Validierungsoptionen */
  options: {
    /** Duplikate-Prüfung */
    checkDuplicates: boolean;
    /** Referenz-Validierung */
    validateReferences: boolean;
    /** Tiefe Validierung */
    deepValidation: boolean;
  };
};

// Hilfsfunktionen für Typen
export const isValidCity = (city: string): city is 'wue' | 'muc' => {
  return (VALIDATION_RULES.SUPPORTED_CITIES as readonly string[]).includes(city);
};

export const isValidLanguage = (language: string): language is string => {
  return (VALIDATION_RULES.SUPPORTED_LANGUAGES as readonly string[]).includes(language);
};

export const isValidSchemaVersion = (version: string): boolean => {
  return (SCHEMA_VERSIONS.SUPPORTED as readonly string[]).includes(version);
};

// Comprehensive Type Guard Functions for Runtime Type Safety

/**
 * Type guard to check if a value is a valid object
 */
export function isValidObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Enhanced type guard for partial StopConfig validation
 */
export function isValidPartialStopConfig(value: unknown): value is Partial<StopConfig> {
  if (!isValidObject(value)) {
    return false;
  }
  
  const config = value as Record<string, unknown>;
  
  // Check types for present fields
  const typeChecks = {
    id: (v: unknown) => typeof v === 'string' && v.length > 0,
    name: (v: unknown) => typeof v === 'string' && v.length > 0,
    city: (v: unknown) => typeof v === 'string' && isValidCity(v),
    stopId: (v: unknown) => typeof v === 'string' && v.length > 0,
    walkingTimeMinutes: (v: unknown) => typeof v === 'number', // Remove range check, let detailed validation handle it
    visible: (v: unknown) => typeof v === 'boolean',
    position: (v: unknown) => typeof v === 'number' // Remove range check, let detailed validation handle it
  };
  
  for (const [field, checker] of Object.entries(typeChecks)) {
    if (field in config && !checker(config[field])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Enhanced type guard for partial AppConfig validation
 */
export function isValidPartialAppConfig(value: unknown): value is Partial<AppConfig> {
  if (!isValidObject(value)) {
    return false;
  }
  
  const config = value as Record<string, unknown>;
  
  // Check stops array if present
  if ('stops' in config && config.stops !== undefined) {
    if (!Array.isArray(config.stops)) {
      return false;
    }
    
    // Validate each stop with partial validation
    for (const stop of config.stops) {
      if (!isValidPartialStopConfig(stop)) {
        return false;
      }
    }
  }
  
  // Check optional fields with proper type validation
  const optionalFields = {
    language: (v: unknown) => typeof v === 'string' && isValidLanguage(v),
    theme: (v: unknown) => typeof v === 'string',
    refreshInterval: (v: unknown) => typeof v === 'number' && v > 0,
    showWalkingTime: (v: unknown) => typeof v === 'boolean',
    maxDepartures: (v: unknown) => typeof v === 'number' && v > 0,
    compactView: (v: unknown) => typeof v === 'boolean'
  };
  
  for (const [field, checker] of Object.entries(optionalFields)) {
    if (field in config && config[field] !== undefined && !checker(config[field])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Type guard to check if a value is a valid string
 */
export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a value is a valid number within range
 */
export function isValidNumber(value: unknown, min?: number, max?: number): value is number {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  if (min !== undefined && value < min) {
    return false;
  }
  if (max !== undefined && value > max) {
    return false;
  }
  return true;
}

/**
 * Type guard to check if a value is a valid boolean
 */
export function isValidBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is a valid array
 */
export function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a valid ISO timestamp
 */
export function isValidTimestamp(value: unknown): value is string {
  if (!isValidString(value)) {
    return false;
  }
  
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
}

/**
 * Enhanced type guard to check if a value is a valid stop configuration
 */
export function isValidStopConfig(value: unknown): value is import('../models').StopConfig {
  if (!isValidObject(value)) {
    return false;
  }
  
  const stop = value as Record<string, unknown>;
  
  // Check required fields with null/undefined checks
  const requiredFields = ['id', 'name', 'city', 'stopId', 'walkingTimeMinutes', 'visible', 'position'];
  for (const field of requiredFields) {
    if (!(field in stop) || stop[field] === undefined || stop[field] === null) {
      return false;
    }
  }
  
  // Enhanced type validation with proper runtime checks
  if (!isValidString(stop.id) || (stop.id as string).length === 0) return false;
  if (!isValidString(stop.name) || (stop.name as string).length === 0) return false;
  if (!isValidString(stop.city) || !isValidCity(stop.city)) return false;
  if (!isValidString(stop.stopId) || (stop.stopId as string).length === 0) return false;
  if (!isValidNumber(stop.walkingTimeMinutes, VALIDATION_RULES.MIN_WALKING_TIME, VALIDATION_RULES.MAX_WALKING_TIME)) return false;
  if (!isValidBoolean(stop.visible)) return false;
  if (!isValidNumber(stop.position, 0)) return false;
  
  // Additional security checks to prevent XSS
  const stringFields = ['id', 'name', 'stopId'];
  for (const field of stringFields) {
    const value = stop[field] as string;
    if (typeof value === 'string' && value.includes('<script>')) return false;
  }
  
  return true;
}

/**
 * Enhanced type guard to check if a value is a valid app configuration
 */
export function isValidAppConfig(value: unknown): value is import('../models').AppConfig {
  if (!isValidObject(value)) {
    return false;
  }
  
  const config = value as Record<string, unknown>;
  
  // Enhanced validation - only require 'stops' as truly required field
  if (!('stops' in config) || config.stops === undefined || config.stops === null) {
    return false;
  }
  
  // Enhanced type validation with proper null/undefined checks
  if (!isValidArray(config.stops)) return false;
  if (!Array.isArray(config.stops) || !config.stops.every(stop => isValidStopConfig(stop))) return false;
  
  // Check optional fields with proper validation
  if ('refreshIntervalSeconds' in config && config.refreshIntervalSeconds !== undefined) {
    if (!isValidNumber(config.refreshIntervalSeconds, VALIDATION_RULES.MIN_REFRESH_INTERVAL, VALIDATION_RULES.MAX_REFRESH_INTERVAL)) return false;
  }
  
  if ('maxDeparturesShown' in config && config.maxDeparturesShown !== undefined) {
    if (!isValidNumber(config.maxDeparturesShown, 1, VALIDATION_RULES.MAX_DEPARTURES_SHOWN)) return false;
  }
  
  if ('darkMode' in config && config.darkMode !== undefined) {
    if (!isValidBoolean(config.darkMode)) return false;
  }
  
  if ('language' in config && config.language !== undefined) {
    if (!isValidString(config.language) || !isValidLanguage(config.language)) return false;
  }
  
  // Additional validation for other optional fields
  if ('theme' in config && config.theme !== undefined) {
    if (!isValidString(config.theme)) return false;
  }
  
  if ('showWalkingTime' in config && config.showWalkingTime !== undefined) {
    if (!isValidBoolean(config.showWalkingTime)) return false;
  }
  
  if ('compactView' in config && config.compactView !== undefined) {
    if (!isValidBoolean(config.compactView)) return false;
  }
  
  return true;
}

/**
 * Type guard to check if a value is valid metadata
 */
export function isValidMetadata(value: unknown): value is ConfigExport['metadata'] {
  if (!isValidObject(value)) {
    return false;
  }
  
  const metadata = value as Record<string, unknown>;
  
  // Check required fields
  const requiredFields = ['stopCount', 'language', 'source'];
  for (const field of requiredFields) {
    if (!(field in metadata)) {
      return false;
    }
  }
  
  // Type validation
  if (!isValidNumber(metadata.stopCount, 0)) return false;
  if (!isValidString(metadata.language)) return false;
  if (!isValidString(metadata.source)) return false;
  
  return true;
}

/**
 * Type guard to check if a value is valid export settings
 */
export function isValidExportSettings(value: unknown): value is ConfigExport['exportSettings'] {
  if (!isValidObject(value)) {
    return false;
  }
  
  const settings = value as Record<string, unknown>;
  
  // Check required fields
  const requiredFields = ['includeUserSettings', 'includeStopPositions', 'includeVisibilitySettings'];
  for (const field of requiredFields) {
    if (!(field in settings)) {
      return false;
    }
  }
  
  // Type validation
  if (!isValidBoolean(settings.includeUserSettings)) return false;
  if (!isValidBoolean(settings.includeStopPositions)) return false;
  if (!isValidBoolean(settings.includeVisibilitySettings)) return false;
  
  return true;
}

/**
 * Type guard to check if a value is a valid config export
 */
export function isValidConfigExport(value: unknown): value is ConfigExport {
  if (!isValidObject(value)) {
    return false;
  }
  
  const config = value as Record<string, unknown>;
  
  // Check required fields
  const requiredFields = ['schemaVersion', 'exportTimestamp', 'exportedBy', 'metadata', 'config', 'exportSettings'];
  for (const field of requiredFields) {
    if (!(field in config)) {
      return false;
    }
  }
  
  // Type validation
  if (!isValidString(config.schemaVersion) || !isValidSchemaVersion(config.schemaVersion)) return false;
  if (!isValidTimestamp(config.exportTimestamp)) return false;
  if (!isValidString(config.exportedBy)) return false;
  if (!isValidMetadata(config.metadata)) return false;
  if (!isValidAppConfig(config.config)) return false;
  if (!isValidExportSettings(config.exportSettings)) return false;
  
  return true;
}

/**
 * Type guard to check if a value is a partial config export (for imports)
 */
export function isPartialConfigExport(value: unknown): value is Partial<ConfigExport> {
  if (!isValidObject(value)) {
    return false;
  }
  
  const config = value as Record<string, unknown>;
  
  // At least schemaVersion should be present
  if (!('schemaVersion' in config)) {
    return false;
  }
  
  // Optional validation for present fields
  if ('schemaVersion' in config && !isValidString(config.schemaVersion)) return false;
  if ('exportTimestamp' in config && !isValidTimestamp(config.exportTimestamp)) return false;
  if ('exportedBy' in config && !isValidString(config.exportedBy)) return false;
  if ('metadata' in config && !isValidMetadata(config.metadata)) return false;
  if ('config' in config && !isValidAppConfig(config.config)) return false;
  if ('exportSettings' in config && !isValidExportSettings(config.exportSettings)) return false;
  
  return true;
}

/**
 * Type guard to check if a value is a valid validation result
 */
export function isValidValidationResult(value: unknown): value is ValidationResult {
  if (!isValidObject(value)) {
    return false;
  }
  
  const result = value as Record<string, unknown>;
  
  // Check required fields
  const requiredFields = ['isValid', 'errors', 'warnings', 'schemaVersion', 'isCompatible'];
  for (const field of requiredFields) {
    if (!(field in result)) {
      return false;
    }
  }
  
  // Type validation
  if (!isValidBoolean(result.isValid)) return false;
  if (!isValidArray(result.errors)) return false;
  if (!isValidArray(result.warnings)) return false;
  if (!isValidString(result.schemaVersion)) return false;
  if (!isValidBoolean(result.isCompatible)) return false;
  
  return true;
}

/**
 * Type guard to check if a value is a valid import result
 */
export function isValidImportResult(value: unknown): value is ImportResult {
  if (!isValidObject(value)) {
    return false;
  }
  
  const result = value as Record<string, unknown>;
  
  // Check required fields
  const requiredFields = ['success', 'importedConfig', 'importedStopsCount', 'validation', 'messages'];
  for (const field of requiredFields) {
    if (!(field in result)) {
      return false;
    }
  }
  
  // Type validation
  if (!isValidBoolean(result.success)) return false;
  if (result.importedConfig !== null && !isValidAppConfig(result.importedConfig)) return false;
  if (!isValidNumber(result.importedStopsCount, 0)) return false;
  if (!isValidValidationResult(result.validation)) return false;
  if (!isValidArray(result.messages)) return false;
  
  return true;
}

/**
 * Safe JSON parser with type checking
 */
export function safeJSONParse<T>(
  jsonString: string,
  typeGuard: (value: unknown) => value is T,
  errorMessage?: string
): T {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!typeGuard(parsed)) {
      throw new Error(errorMessage || 'Parsed JSON does not match expected type');
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON syntax: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Safe type assertion with runtime checking
 */
export function safeTypeAssertion<T>(
  value: unknown,
  typeGuard: (value: unknown) => value is T,
  errorMessage?: string
): T {
  if (!typeGuard(value)) {
    throw new Error(errorMessage || 'Value does not match expected type');
  }
  return value;
}

// Branded types für kritische Datenstrukturen
export type ValidatedStopId = string & { readonly __brand: 'ValidatedStopId' };
export type ValidatedStopName = string & { readonly __brand: 'ValidatedStopName' };
export type ValidatedCity = string & { readonly __brand: 'ValidatedCity' };
export type ValidatedSchemaVersion = string & { readonly __brand: 'ValidatedSchemaVersion' };

// Discriminated unions für verschiedene Validierungsresultate
export type ValidationResultType =
  | { type: 'success'; data: ConfigExport }
  | { type: 'error'; errors: ValidationError[]; warnings: ValidationWarning[] }
  | { type: 'warning'; data: ConfigExport; warnings: ValidationWarning[] };

// Discriminated unions für Import-Operationen
export type ImportOperationType =
  | { type: 'full'; replaceExisting: true; data: ConfigExport }
  | { type: 'merge'; replaceExisting: false; data: Partial<ConfigExport> }
  | { type: 'selective'; fields: (keyof ConfigExport)[]; data: Partial<ConfigExport> };

// Export-Typen für bessere Typsicherheit
export type ExportFormat = 'json' | 'compressed';
export type ImportSource = 'file' | 'url' | 'clipboard';

// Type Guards für branded types
export function createValidatedStopId(value: string): ValidatedStopId | null {
  if (!isValidString(value) || value.length === 0 || value.includes('<script>')) {
    return null;
  }
  return value as ValidatedStopId;
}

export function createValidatedStopName(value: string): ValidatedStopName | null {
  if (!isValidString(value) || value.length === 0 || value.includes('<script>')) {
    return null;
  }
  return value as ValidatedStopName;
}

export function createValidatedCity(value: string): ValidatedCity | null {
  if (!isValidString(value) || !isValidCity(value)) {
    return null;
  }
  return value as ValidatedCity;
}

export function createValidatedSchemaVersion(value: string): ValidatedSchemaVersion | null {
  if (!isValidString(value) || !isValidSchemaVersion(value)) {
    return null;
  }
  return value as ValidatedSchemaVersion;
}

// Enhanced type-safe validation result creators
export function createSuccessResult(data: ConfigExport): ValidationResultType {
  return { type: 'success', data };
}

export function createErrorResult(errors: ValidationError[], warnings: ValidationWarning[] = []): ValidationResultType {
  return { type: 'error', errors, warnings };
}

export function createWarningResult(data: ConfigExport, warnings: ValidationWarning[]): ValidationResultType {
  return { type: 'warning', data, warnings };
}

// Type guard für ValidationResultType
export function isValidationResultType(value: unknown): value is ValidationResultType {
  if (!isValidObject(value)) {
    return false;
  }
  
  const result = value as Record<string, unknown>;
  
  if (!('type' in result) || typeof result.type !== 'string') {
    return false;
  }
  
  switch (result.type) {
    case 'success':
      return 'data' in result && isValidConfigExport(result.data);
    case 'error':
      return 'errors' in result && Array.isArray(result.errors) &&
             'warnings' in result && Array.isArray(result.warnings);
    case 'warning':
      return 'data' in result && isValidConfigExport(result.data) &&
             'warnings' in result && Array.isArray(result.warnings);
    default:
      return false;
  }
}

// Konstanten für Fehlercodes
export const ERROR_CODES = {
  INVALID_SCHEMA: 'INVALID_SCHEMA',
  UNSUPPORTED_VERSION: 'UNSUPPORTED_VERSION',
  INVALID_STOP_CONFIG: 'INVALID_STOP_CONFIG',
  INVALID_SETTINGS: 'INVALID_SETTINGS',
  DUPLICATE_STOP: 'DUPLICATE_STOP',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_TYPE: 'INVALID_DATA_TYPE',
  VALUE_OUT_OF_RANGE: 'VALUE_OUT_OF_RANGE',
  INVALID_REFERENCE: 'INVALID_REFERENCE'
} as const;

export const WARNING_CODES = {
  DEPRECATED_FIELD: 'DEPRECATED_FIELD',
  PERFORMANCE_IMPACT: 'PERFORMANCE_IMPACT',
  COMPATIBILITY_ISSUE: 'COMPATIBILITY_ISSUE',
  UNUSUAL_CONFIGURATION: 'UNUSUAL_CONFIGURATION'
} as const;