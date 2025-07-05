/**
 * Validierungslogik für das Import/Export-System
 * Enthält alle Funktionen zur Validierung von Konfigurationen
 */

import type { 
  ConfigExport, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning, 
  ValidationContext,
  ConfigExportInput,
  ImportConflict,
  ImportPreview
} from '../types/configExport';
import type { AppConfig, StopConfig } from '../models';
import { 
  SCHEMA_VERSIONS, 
  VALIDATION_RULES, 
  ERROR_CODES, 
  WARNING_CODES,
  isValidCity,
  isValidLanguage,
  isValidSchemaVersion
} from '../types/configExport';

/**
 * Hauptvalidierungsfunktion für exportierte Konfigurationen
 */
export function validateConfigStructure(
  input: ConfigExportInput,
  context: ValidationContext = getDefaultValidationContext()
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Grundlegende Struktur-Validierung
  if (!isValidObject(input)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_SCHEMA,
      'Die Eingabe ist kein gültiges Objekt',
      'root'
    ));
    return {
      isValid: false,
      errors,
      warnings,
      schemaVersion: 'unknown',
      isCompatible: false
    };
  }

  const configExport = input as Partial<ConfigExport>;

  // Schema-Version validieren
  const schemaValidation = validateSchemaVersion(configExport.schemaVersion);
  if (!schemaValidation.isValid) {
    errors.push(...schemaValidation.errors);
    warnings.push(...schemaValidation.warnings);
  }

  // Hauptkonfiguration validieren
  if (configExport.config) {
    const configValidation = validateAppConfig(configExport.config, context);
    errors.push(...configValidation.errors);
    warnings.push(...configValidation.warnings);
  } else {
    errors.push(createValidationError(
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      'Konfiguration fehlt',
      'config'
    ));
  }

  // Metadaten validieren
  const metadataValidation = validateMetadata(configExport.metadata);
  errors.push(...metadataValidation.errors);
  warnings.push(...metadataValidation.warnings);

  // Export-Einstellungen validieren
  const exportSettingsValidation = validateExportSettings(configExport.exportSettings);
  warnings.push(...exportSettingsValidation.warnings);

  const isValid = errors.length === 0;
  const isCompatible = schemaValidation.isCompatible && isValid;

  return {
    isValid,
    errors,
    warnings,
    schemaVersion: configExport.schemaVersion || 'unknown',
    isCompatible
  };
}

/**
 * Validierung einer einzelnen Stop-Konfiguration
 */
export function validateStopConfig(
  stopConfig: unknown,
  context: ValidationContext = getDefaultValidationContext()
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isValidObject(stopConfig)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_STOP_CONFIG,
      'Stop-Konfiguration ist kein gültiges Objekt',
      'stopConfig'
    ));
    return { isValid: false, errors, warnings, schemaVersion: context.schemaVersion, isCompatible: false };
  }

  const stop = stopConfig as Partial<StopConfig>;

  // Erforderliche Felder validieren
  const requiredFields = ['id', 'name', 'city', 'stopId', 'walkingTimeMinutes', 'visible', 'position'];
  for (const field of requiredFields) {
    if (!(field in stop) || stop[field as keyof StopConfig] === undefined) {
      errors.push(createValidationError(
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        `Erforderliches Feld '${field}' fehlt`,
        `stopConfig.${field}`
      ));
    }
  }

  // Datentypen validieren
  if (stop.id !== undefined && typeof stop.id !== 'string') {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'Stop-ID muss ein String sein',
      'stopConfig.id',
      stop.id,
      'string'
    ));
  }

  if (stop.name !== undefined && typeof stop.name !== 'string') {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'Stop-Name muss ein String sein',
      'stopConfig.name',
      stop.name,
      'string'
    ));
  }

  if (stop.city !== undefined && !isValidCity(stop.city)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'City muss "wue" oder "muc" sein',
      'stopConfig.city',
      stop.city,
      'wue | muc'
    ));
  }

  if (stop.stopId !== undefined && typeof stop.stopId !== 'string') {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'Stop-ID muss ein String sein',
      'stopConfig.stopId',
      stop.stopId,
      'string'
    ));
  }

  if (stop.walkingTimeMinutes !== undefined) {
    if (typeof stop.walkingTimeMinutes !== 'number' || 
        stop.walkingTimeMinutes < VALIDATION_RULES.MIN_WALKING_TIME || 
        stop.walkingTimeMinutes > VALIDATION_RULES.MAX_WALKING_TIME) {
      errors.push(createValidationError(
        ERROR_CODES.VALUE_OUT_OF_RANGE,
        `Gehzeit muss zwischen ${VALIDATION_RULES.MIN_WALKING_TIME} und ${VALIDATION_RULES.MAX_WALKING_TIME} Minuten liegen`,
        'stopConfig.walkingTimeMinutes',
        stop.walkingTimeMinutes,
        `${VALIDATION_RULES.MIN_WALKING_TIME}-${VALIDATION_RULES.MAX_WALKING_TIME}`
      ));
    }
  }

  if (stop.visible !== undefined && typeof stop.visible !== 'boolean') {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'Visible muss ein Boolean sein',
      'stopConfig.visible',
      stop.visible,
      'boolean'
    ));
  }

  if (stop.position !== undefined && typeof stop.position !== 'number') {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'Position muss eine Zahl sein',
      'stopConfig.position',
      stop.position,
      'number'
    ));
  }

  // Warnungen für ungewöhnliche Konfigurationen
  if (stop.walkingTimeMinutes !== undefined && stop.walkingTimeMinutes > 30) {
    warnings.push(createValidationWarning(
      WARNING_CODES.UNUSUAL_CONFIGURATION,
      'Gehzeit über 30 Minuten ist ungewöhnlich',
      'stopConfig.walkingTimeMinutes',
      stop.walkingTimeMinutes,
      'Überprüfen Sie die Gehzeit'
    ));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    schemaVersion: context.schemaVersion,
    isCompatible: true
  };
}

/**
 * Validierung der App-Einstellungen
 */
export function validateSettingsConfig(
  settings: unknown,
  context: ValidationContext = getDefaultValidationContext()
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isValidObject(settings)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_SETTINGS,
      'Einstellungen sind kein gültiges Objekt',
      'settings'
    ));
    return { isValid: false, errors, warnings, schemaVersion: context.schemaVersion, isCompatible: false };
  }

  const config = settings as Partial<AppConfig>;

  // Refresh-Intervall validieren
  if (config.refreshIntervalSeconds !== undefined) {
    if (typeof config.refreshIntervalSeconds !== 'number' ||
        config.refreshIntervalSeconds < VALIDATION_RULES.MIN_REFRESH_INTERVAL ||
        config.refreshIntervalSeconds > VALIDATION_RULES.MAX_REFRESH_INTERVAL) {
      errors.push(createValidationError(
        ERROR_CODES.VALUE_OUT_OF_RANGE,
        `Refresh-Intervall muss zwischen ${VALIDATION_RULES.MIN_REFRESH_INTERVAL} und ${VALIDATION_RULES.MAX_REFRESH_INTERVAL} Sekunden liegen`,
        'settings.refreshIntervalSeconds',
        config.refreshIntervalSeconds,
        `${VALIDATION_RULES.MIN_REFRESH_INTERVAL}-${VALIDATION_RULES.MAX_REFRESH_INTERVAL}`
      ));
    }
  }

  // Maximale Abfahrten validieren
  if (config.maxDeparturesShown !== undefined) {
    if (typeof config.maxDeparturesShown !== 'number' ||
        config.maxDeparturesShown < 1 ||
        config.maxDeparturesShown > VALIDATION_RULES.MAX_DEPARTURES_SHOWN) {
      errors.push(createValidationError(
        ERROR_CODES.VALUE_OUT_OF_RANGE,
        `Maximale Abfahrten muss zwischen 1 und ${VALIDATION_RULES.MAX_DEPARTURES_SHOWN} liegen`,
        'settings.maxDeparturesShown',
        config.maxDeparturesShown,
        `1-${VALIDATION_RULES.MAX_DEPARTURES_SHOWN}`
      ));
    }
  }

  // Sprache validieren
  if (config.language !== undefined && !isValidLanguage(config.language)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'Ungültige Sprache',
      'settings.language',
      config.language,
      VALIDATION_RULES.SUPPORTED_LANGUAGES.join(' | ')
    ));
  }

  // Dark Mode validieren
  if (config.darkMode !== undefined && typeof config.darkMode !== 'boolean') {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'Dark Mode muss ein Boolean sein',
      'settings.darkMode',
      config.darkMode,
      'boolean'
    ));
  }

  // Warnungen für Performance-Einstellungen
  if (config.refreshIntervalSeconds !== undefined && config.refreshIntervalSeconds < 30) {
    warnings.push(createValidationWarning(
      WARNING_CODES.PERFORMANCE_IMPACT,
      'Kurze Refresh-Intervalle können die Performance beeinträchtigen',
      'settings.refreshIntervalSeconds',
      config.refreshIntervalSeconds,
      'Verwenden Sie mindestens 30 Sekunden'
    ));
  }

  if (config.maxDeparturesShown !== undefined && config.maxDeparturesShown > 20) {
    warnings.push(createValidationWarning(
      WARNING_CODES.PERFORMANCE_IMPACT,
      'Viele Abfahrten können die Performance beeinträchtigen',
      'settings.maxDeparturesShown',
      config.maxDeparturesShown,
      'Verwenden Sie maximal 20 Abfahrten'
    ));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    schemaVersion: context.schemaVersion,
    isCompatible: true
  };
}

/**
 * Erstellt eine Vorschau für den Import
 */
export function createImportPreview(
  configExport: ConfigExport,
  currentConfig: AppConfig
): ImportPreview {
  const conflicts: ImportConflict[] = [];
  const estimatedChanges = {
    stopsAdded: 0,
    stopsUpdated: 0,
    stopsRemoved: 0,
    settingsChanged: 0
  };

  // Stops analysieren
  const existingStopIds = new Set(currentConfig.stops.map(s => s.id));
  const newStops = configExport.config.stops.filter(s => !existingStopIds.has(s.id));
  const updatedStops = configExport.config.stops.filter(s => existingStopIds.has(s.id));

  estimatedChanges.stopsAdded = newStops.length;
  estimatedChanges.stopsUpdated = updatedStops.length;

  // Konflikte identifizieren
  updatedStops.forEach(stop => {
    const existingStop = currentConfig.stops.find(s => s.id === stop.id);
    if (existingStop && existingStop.position !== stop.position) {
      conflicts.push({
        type: 'position_conflict',
        description: `Stop "${stop.name}" hat eine andere Position`,
        stopId: stop.id,
        suggestedResolution: 'Position der importierten Konfiguration verwenden',
        severity: 'low'
      });
    }
  });

  // Einstellungsänderungen prüfen
  const globalSettingsChanges: ImportPreview['globalSettingsChanges'] = {};
  
  if (configExport.config.darkMode !== currentConfig.darkMode) {
    globalSettingsChanges.darkMode = configExport.config.darkMode;
    estimatedChanges.settingsChanged++;
  }
  
  if (configExport.config.refreshIntervalSeconds !== currentConfig.refreshIntervalSeconds) {
    globalSettingsChanges.refreshIntervalSeconds = configExport.config.refreshIntervalSeconds;
    estimatedChanges.settingsChanged++;
  }
  
  if (configExport.config.maxDeparturesShown !== currentConfig.maxDeparturesShown) {
    globalSettingsChanges.maxDeparturesShown = configExport.config.maxDeparturesShown;
    estimatedChanges.settingsChanged++;
  }
  
  if (configExport.config.language !== currentConfig.language) {
    globalSettingsChanges.language = configExport.config.language;
    estimatedChanges.settingsChanged++;
  }

  return {
    stopCount: configExport.config.stops.length,
    stops: configExport.config.stops,
    globalSettingsChanges,
    conflicts,
    estimatedChanges
  };
}

/**
 * Validiert die gesamte App-Konfiguration
 */
function validateAppConfig(
  config: unknown,
  context: ValidationContext
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isValidObject(config)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_SCHEMA,
      'App-Konfiguration ist kein gültiges Objekt',
      'config'
    ));
    return { errors, warnings };
  }

  const appConfig = config as Partial<AppConfig>;

  // Stops validieren
  if (appConfig.stops) {
    if (!Array.isArray(appConfig.stops)) {
      errors.push(createValidationError(
        ERROR_CODES.INVALID_DATA_TYPE,
        'Stops muss ein Array sein',
        'config.stops',
        appConfig.stops,
        'Array'
      ));
    } else {
      if (appConfig.stops.length > VALIDATION_RULES.MAX_STOPS) {
        errors.push(createValidationError(
          ERROR_CODES.VALUE_OUT_OF_RANGE,
          `Zu viele Stops (max. ${VALIDATION_RULES.MAX_STOPS})`,
          'config.stops',
          appConfig.stops.length,
          `max. ${VALIDATION_RULES.MAX_STOPS}`
        ));
      }

      // Duplikate prüfen
      if (context.options.checkDuplicates) {
        const stopIds = new Set<string>();
        appConfig.stops.forEach((stop, index) => {
          if (typeof stop === 'object' && stop !== null && 'id' in stop) {
            const stopId = (stop as { id: string }).id;
            if (stopIds.has(stopId)) {
              errors.push(createValidationError(
                ERROR_CODES.DUPLICATE_STOP,
                `Doppelte Stop-ID: ${stopId}`,
                `config.stops[${index}].id`,
                stopId
              ));
            }
            stopIds.add(stopId);
          }
        });
      }

      // Einzelne Stops validieren
      appConfig.stops.forEach((stop, index) => {
        const stopValidation = validateStopConfig(stop, context);
        stopValidation.errors.forEach(error => {
          errors.push({
            ...error,
            field: `config.stops[${index}].${error.field?.replace('stopConfig.', '') || ''}`
          });
        });
        warnings.push(...stopValidation.warnings);
      });
    }
  }

  // Einstellungen validieren
  const settingsValidation = validateSettingsConfig(appConfig, context);
  errors.push(...settingsValidation.errors);
  warnings.push(...settingsValidation.warnings);

  return { errors, warnings };
}

/**
 * Validiert die Schema-Version
 */
function validateSchemaVersion(
  version: unknown
): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[]; isCompatible: boolean } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (typeof version !== 'string') {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_SCHEMA,
      'Schema-Version muss ein String sein',
      'schemaVersion',
      version,
      'string'
    ));
    return { isValid: false, errors, warnings, isCompatible: false };
  }

  if (!isValidSchemaVersion(version)) {
    errors.push(createValidationError(
      ERROR_CODES.UNSUPPORTED_VERSION,
      `Nicht unterstützte Schema-Version: ${version}`,
      'schemaVersion',
      version,
      SCHEMA_VERSIONS.SUPPORTED.join(' | ')
    ));
    return { isValid: false, errors, warnings, isCompatible: false };
  }

  // Versionskompatibilität prüfen
  const isCompatible = version === SCHEMA_VERSIONS.CURRENT;
  if (!isCompatible) {
    warnings.push(createValidationWarning(
      WARNING_CODES.COMPATIBILITY_ISSUE,
      `Schema-Version ${version} ist nicht die aktuelle Version ${SCHEMA_VERSIONS.CURRENT}`,
      'schemaVersion',
      version,
      'Aktualisieren Sie die Konfiguration'
    ));
  }

  return { isValid: true, errors, warnings, isCompatible };
}

/**
 * Validiert die Metadaten
 */
function validateMetadata(
  metadata: unknown
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isValidObject(metadata)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_SCHEMA,
      'Metadaten sind kein gültiges Objekt',
      'metadata'
    ));
    return { errors, warnings };
  }

  // Weitere Metadaten-Validierung hier hinzufügen

  return { errors, warnings };
}

/**
 * Validiert die Export-Einstellungen
 */
function validateExportSettings(
  exportSettings: unknown
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isValidObject(exportSettings)) {
    warnings.push(createValidationWarning(
      WARNING_CODES.DEPRECATED_FIELD,
      'Export-Einstellungen fehlen oder sind ungültig',
      'exportSettings',
      exportSettings,
      'Verwenden Sie Standard-Export-Einstellungen'
    ));
  }

  return { errors, warnings };
}

/**
 * Hilfsfunktionen
 */
function isValidObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createValidationError(
  code: string,
  message: string,
  field?: string,
  value?: unknown,
  expected?: string
): ValidationError {
  return {
    code,
    message,
    field,
    value,
    expected,
    severity: 'error'
  };
}

function createValidationWarning(
  code: string,
  message: string,
  field?: string,
  value?: unknown,
  recommendation?: string
): ValidationWarning {
  return {
    code,
    message,
    field,
    value,
    recommendation
  };
}

function getDefaultValidationContext(): ValidationContext {
  return {
    schemaVersion: SCHEMA_VERSIONS.CURRENT,
    strict: false,
    options: {
      checkDuplicates: true,
      validateReferences: true,
      deepValidation: true
    }
  };
}

/**
 * Versionsspezifische Validierung
 */
export function validateSchemaCompatibility(
  sourceVersion: string,
  targetVersion: string = SCHEMA_VERSIONS.CURRENT
): { isCompatible: boolean; migrationRequired: boolean; warnings: ValidationWarning[] } {
  const warnings: ValidationWarning[] = [];
  const isCompatible = sourceVersion === targetVersion;
  const migrationRequired = !isCompatible && 
    (SCHEMA_VERSIONS.SUPPORTED as readonly string[]).includes(sourceVersion);

  if (!isCompatible && migrationRequired) {
    warnings.push(createValidationWarning(
      WARNING_CODES.COMPATIBILITY_ISSUE,
      `Schema-Migration von ${sourceVersion} zu ${targetVersion} erforderlich`,
      'schemaVersion',
      sourceVersion,
      'Führen Sie eine Schema-Migration durch'
    ));
  }

  return { isCompatible, migrationRequired, warnings };
}