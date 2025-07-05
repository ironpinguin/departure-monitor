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

// Export-Typen für bessere Typsicherheit
export type ExportFormat = 'json' | 'compressed';
export type ImportSource = 'file' | 'url' | 'clipboard';

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