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
  isValidSchemaVersion,
  isPartialConfigExport,
  isValidPartialStopConfig,
  isValidPartialAppConfig
} from '../types/configExport';

// Security patterns to detect malicious content
const SECURITY_PATTERNS = {
  XSS_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi
  ],
  INJECTION_PATTERNS: [
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /constructor/gi,
    /__proto__/gi,
    /prototype\.constructor/gi
  ],
  SUSPICIOUS_PROTOCOLS: [
    /file:\/\//gi,
    /ftp:\/\//gi,
    /ldap:\/\//gi
  ]
};

/**
 * Enhanced security validation for import data
 */
function validateContentSecurity(data: unknown, path = 'root'): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (typeof data === 'string') {
    // Check for XSS patterns
    for (const pattern of SECURITY_PATTERNS.XSS_PATTERNS) {
      if (pattern.test(data)) {
        errors.push(createValidationError(
          ERROR_CODES.INVALID_DATA_TYPE,
          'import.validation.xss_pattern_detected',
          path,
          data.substring(0, 50)
        ));
        break;
      }
    }
    
    // Check for injection patterns
    for (const pattern of SECURITY_PATTERNS.INJECTION_PATTERNS) {
      if (pattern.test(data)) {
        errors.push(createValidationError(
          ERROR_CODES.INVALID_DATA_TYPE,
          'import.validation.injection_pattern_detected',
          path,
          data.substring(0, 50)
        ));
        break;
      }
    }
    
    // Check for suspicious protocols
    for (const pattern of SECURITY_PATTERNS.SUSPICIOUS_PROTOCOLS) {
      if (pattern.test(data)) {
        errors.push(createValidationError(
          ERROR_CODES.INVALID_DATA_TYPE,
          'import.validation.suspicious_protocol_detected',
          path,
          data.substring(0, 50)
        ));
        break;
      }
    }
  } else if (Array.isArray(data)) {
    data.forEach((item, index) => {
      errors.push(...validateContentSecurity(item, `${path}[${index}]`));
    });
  } else if (data && typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      // Check key for suspicious patterns
      errors.push(...validateContentSecurity(key, `${path}.${key}[key]`));
      // Check value
      errors.push(...validateContentSecurity(value, `${path}.${key}`));
    });
  }
  
  return errors;
}

/**
 * Hauptvalidierungsfunktion für exportierte Konfigurationen - Refactored for reduced complexity
 */
export function validateConfigStructure(
  input: ConfigExportInput,
  context: ValidationContext = getDefaultValidationContext()
): ValidationResult {
  // Basic structure validation with early returns
  const basicValidationResult = validateBasicStructure(input);
  if (!basicValidationResult.isValid) {
    return basicValidationResult;
  }

  const configExport = input as ConfigExport;

  // Security validation with early return
  const securityValidationResult = validateSecurityConstraints(configExport);
  if (!securityValidationResult.isValid) {
    return securityValidationResult;
  }

  // Comprehensive validation with extracted functions
  return performComprehensiveValidation(configExport, context);
}

/**
 * Basic structure validation with early returns
 */
function validateBasicStructure(input: ConfigExportInput): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isValidObject(input)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_SCHEMA,
      'import.validation.invalid_object',
      'root'
    ));
    return createValidationResult(false, errors, warnings, 'unknown', false);
  }

  if (!isPartialConfigExport(input)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_SCHEMA,
      'import.validation.invalid_config_export_format',
      'root'
    ));
    return createValidationResult(false, errors, warnings, 'unknown', false);
  }

  return createValidationResult(true, errors, warnings, 'unknown', true);
}

/**
 * Security validation with early return
 */
function validateSecurityConstraints(configExport: ConfigExport): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const securityErrors = validateContentSecurity(configExport);
  if (securityErrors.length > 0) {
    errors.push(...securityErrors);
    return createValidationResult(
      false,
      errors,
      warnings,
      configExport.schemaVersion || 'unknown',
      false
    );
  }

  return createValidationResult(true, errors, warnings, configExport.schemaVersion || 'unknown', true);
}

/**
 * Comprehensive validation with extracted helper functions
 */
function performComprehensiveValidation(
  configExport: ConfigExport,
  context: ValidationContext
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate schema version
  const schemaValidation = validateSchemaVersion(configExport.schemaVersion);
  errors.push(...schemaValidation.errors);
  warnings.push(...schemaValidation.warnings);

  // Validate main configuration
  if (configExport.config) {
    const configValidation = validateAppConfig(configExport.config, context);
    errors.push(...configValidation.errors);
    warnings.push(...configValidation.warnings);
  } else {
    errors.push(createValidationError(
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      'import.errors.missing_configuration',
      'config'
    ));
  }

  // Validate metadata
  const metadataValidation = validateMetadata(configExport.metadata);
  errors.push(...metadataValidation.errors);
  warnings.push(...metadataValidation.warnings);

  // Validate export settings
  const exportSettingsValidation = validateExportSettings(configExport.exportSettings);
  warnings.push(...exportSettingsValidation.warnings);

  const isValid = errors.length === 0;
  const isCompatible = schemaValidation.isCompatible && isValid;

  return createValidationResult(
    isValid,
    errors,
    warnings,
    configExport.schemaVersion || 'unknown',
    isCompatible
  );
}

/**
 * Helper function to create validation results consistently
 */
function createValidationResult(
  isValid: boolean,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  schemaVersion: string,
  isCompatible: boolean
): ValidationResult {
  return {
    isValid,
    errors,
    warnings,
    schemaVersion,
    isCompatible
  };
}

/**
 * Validierung einer einzelnen Stop-Konfiguration - Refactored for reduced complexity
 */
export function validateStopConfig(
  stopConfig: unknown,
  context: ValidationContext = getDefaultValidationContext()
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Early validation with guard clauses
  const basicValidationResult = validateStopConfigBasics(stopConfig, context);
  if (!basicValidationResult.isValid) {
    return basicValidationResult;
  }

  const stop = stopConfig as Partial<StopConfig>;

  // Validate required fields with extracted function
  errors.push(...validateStopRequiredFields(stop));

  // Validate data types with extracted functions
  errors.push(...validateStopDataTypes(stop));

  // Validate business rules with extracted function
  warnings.push(...validateStopBusinessRules(stop));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    schemaVersion: context.schemaVersion,
    isCompatible: true
  };
}

/**
 * Basic validation with early returns
 */
function validateStopConfigBasics(
  stopConfig: unknown,
  context: ValidationContext
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isValidObject(stopConfig)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_STOP_CONFIG,
      'import.validation.invalid_stop_config',
      'stopConfig'
    ));
    return { isValid: false, errors, warnings, schemaVersion: context.schemaVersion, isCompatible: false };
  }

  if (!isValidPartialStopConfig(stopConfig)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'import.validation.invalid_stop_config_type',
      'stopConfig'
    ));
    return { isValid: false, errors, warnings, schemaVersion: context.schemaVersion, isCompatible: false };
  }

  return { isValid: true, errors, warnings, schemaVersion: context.schemaVersion, isCompatible: true };
}

/**
 * Validate required fields with clear logic
 */
function validateStopRequiredFields(stop: Partial<StopConfig>): ValidationError[] {
  const errors: ValidationError[] = [];
  const requiredFields = ['id', 'name', 'city', 'stopId', 'walkingTimeMinutes', 'visible', 'position'];
  
  for (const field of requiredFields) {
    if (!(field in stop) || stop[field as keyof StopConfig] === undefined) {
      errors.push(createValidationError(
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        'import.validation.required_field_missing',
        `stopConfig.${field}`
      ));
    }
  }
  
  return errors;
}

/**
 * Validate data types with extracted helper functions
 */
function validateStopDataTypes(stop: Partial<StopConfig>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Use validation strategies for cleaner code
  const validationStrategies = [
    () => validateStringField(stop.id, 'stopConfig.id', 'stop_id_must_be_string'),
    () => validateStringField(stop.name, 'stopConfig.name', 'stop_name_must_be_string'),
    () => validateStringField(stop.stopId, 'stopConfig.stopId', 'stop_id_must_be_string'),
    () => validateCityField(stop.city),
    () => validateWalkingTimeField(stop.walkingTimeMinutes),
    () => validateBooleanField(stop.visible, 'stopConfig.visible', 'visible_must_be_boolean'),
    () => validateNumberField(stop.position, 'stopConfig.position', 'position_must_be_number')
  ];
  
  for (const validate of validationStrategies) {
    const error = validate();
    if (error) {
      errors.push(error);
    }
  }
  
  return errors;
}

/**
 * Validate business rules
 */
function validateStopBusinessRules(stop: Partial<StopConfig>): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  if (stop.walkingTimeMinutes !== undefined && stop.walkingTimeMinutes > 30) {
    warnings.push(createValidationWarning(
      WARNING_CODES.UNUSUAL_CONFIGURATION,
      'import.validation.walking_time_unusual',
      'stopConfig.walkingTimeMinutes',
      stop.walkingTimeMinutes,
      'import.validation.check_walking_time'
    ));
  }
  
  return warnings;
}

/**
 * Validation helper functions using Strategy Pattern
 */
function validateStringField(
  value: unknown,
  field: string,
  messageKey: string
): ValidationError | null {
  if (value !== undefined) {
    if (typeof value !== 'string') {
      return createValidationError(
        ERROR_CODES.INVALID_DATA_TYPE,
        `import.validation.${messageKey}`,
        field,
        value,
        'string'
      );
    }
    
    // Special validation for name field - check length
    if (field === 'stopConfig.name' && value.length > 255) {
      return createValidationError(
        ERROR_CODES.VALUE_OUT_OF_RANGE,
        'import.validation.name_too_long',
        field,
        value,
        'maximum 255 characters'
      );
    }
    
    // SQL injection detection for stop fields
    const sqlInjectionPatterns = [
      /'; DROP TABLE/gi,
      /' OR '1'='1/gi,
      /--/g,
      /\/\*/g,
      /\*\//g,
      /union\s+select/gi,
      /delete\s+from/gi,
      /insert\s+into/gi,
      /update\s+set/gi
    ];
    
    if (field.includes('stopConfig.') && (field.includes('id') || field.includes('name'))) {
      for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(value)) {
          return createValidationError(
            ERROR_CODES.INVALID_DATA_TYPE,
            'import.validation.sql_injection_detected',
            field,
            value,
            'safe string without SQL injection patterns'
          );
        }
      }
    }
  }
  return null;
}

function validateCityField(city: unknown): ValidationError | null {
  if (city !== undefined && typeof city === 'string' && !isValidCity(city)) {
    return createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'import.validation.city_must_be_valid',
      'stopConfig.city',
      city,
      'wue | muc'
    );
  }
  return null;
}

function validateWalkingTimeField(walkingTime: unknown): ValidationError | null {
  if (walkingTime !== undefined) {
    if (typeof walkingTime !== 'number' ||
        walkingTime < VALIDATION_RULES.MIN_WALKING_TIME ||
        walkingTime > VALIDATION_RULES.MAX_WALKING_TIME) {
      return createValidationError(
        ERROR_CODES.VALUE_OUT_OF_RANGE,
        'import.validation.walking_time_out_of_range',
        'stopConfig.walkingTimeMinutes',
        walkingTime,
        `${VALIDATION_RULES.MIN_WALKING_TIME}-${VALIDATION_RULES.MAX_WALKING_TIME}`
      );
    }
  }
  return null;
}

function validateBooleanField(
  value: unknown,
  field: string,
  messageKey: string
): ValidationError | null {
  if (value !== undefined && typeof value !== 'boolean') {
    return createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      `import.validation.${messageKey}`,
      field,
      value,
      'boolean'
    );
  }
  return null;
}

function validateNumberField(
  value: unknown,
  field: string,
  messageKey: string
): ValidationError | null {
  if (value !== undefined) {
    if (typeof value !== 'number') {
      return createValidationError(
        ERROR_CODES.INVALID_DATA_TYPE,
        `import.validation.${messageKey}`,
        field,
        value,
        'number'
      );
    }
    
    // Special validation for position field - must be non-negative
    if (field === 'stopConfig.position' && value < 0) {
      return createValidationError(
        ERROR_CODES.VALUE_OUT_OF_RANGE,
        'import.validation.position_out_of_range',
        field,
        value,
        '0 or greater'
      );
    }
  }
  return null;
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
      'import.validation.settings_invalid_object',
      'settings'
    ));
    return { isValid: false, errors, warnings, schemaVersion: context.schemaVersion, isCompatible: false };
  }

  // Enhanced type validation with proper guards
  if (!isValidPartialAppConfig(settings)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'import.validation.invalid_settings_config_type',
      'settings'
    ));
    return {
      errors,
      warnings,
      isValid: false,
      schemaVersion: 'unknown',
      isCompatible: false
    };
  }

  const config = settings as Partial<AppConfig>;

  // Refresh-Intervall validieren
  if (config.refreshIntervalSeconds !== undefined) {
    if (typeof config.refreshIntervalSeconds !== 'number' ||
        config.refreshIntervalSeconds < VALIDATION_RULES.MIN_REFRESH_INTERVAL ||
        config.refreshIntervalSeconds > VALIDATION_RULES.MAX_REFRESH_INTERVAL) {
      errors.push(createValidationError(
        ERROR_CODES.VALUE_OUT_OF_RANGE,
        'import.validation.refresh_interval_out_of_range',
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
        'import.validation.max_departures_out_of_range',
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
      'import.validation.invalid_language',
      'settings.language',
      config.language,
      VALIDATION_RULES.SUPPORTED_LANGUAGES.join(' | ')
    ));
  }

  // Dark Mode validieren
  if (config.darkMode !== undefined && typeof config.darkMode !== 'boolean') {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'import.validation.dark_mode_must_be_boolean',
      'settings.darkMode',
      config.darkMode,
      'boolean'
    ));
  }

  // Warnungen für Performance-Einstellungen
  if (config.refreshIntervalSeconds !== undefined && config.refreshIntervalSeconds < 30) {
    warnings.push(createValidationWarning(
      WARNING_CODES.PERFORMANCE_IMPACT,
      'import.validation.short_refresh_interval_warning',
      'settings.refreshIntervalSeconds',
      config.refreshIntervalSeconds,
      'import.validation.use_minimum_seconds'
    ));
  }

  if (config.maxDeparturesShown !== undefined && config.maxDeparturesShown > 20) {
    warnings.push(createValidationWarning(
      WARNING_CODES.PERFORMANCE_IMPACT,
      'import.validation.many_departures_warning',
      'settings.maxDeparturesShown',
      config.maxDeparturesShown,
      'import.validation.use_maximum_departures'
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

  // Stops analysieren - mit Null-Safe-Operationen
  const currentStops = Array.isArray(currentConfig?.stops) ? currentConfig.stops : [];
  const importedStops = Array.isArray(configExport?.config?.stops) ? configExport.config.stops : [];
  
  // Null-safe ID-Mapping
  const existingStopIds = new Set(
    currentStops
      .filter(s => s?.id != null) // Null/undefined IDs ausfiltern
      .map(s => s.id)
  );
  
  const newStops = importedStops.filter(s => s?.id != null && !existingStopIds.has(s.id));
  const updatedStops = importedStops.filter(s => s?.id != null && existingStopIds.has(s.id));

  estimatedChanges.stopsAdded = newStops.length;
  estimatedChanges.stopsUpdated = updatedStops.length;

  // Konflikte identifizieren - mit Null-Checks
  updatedStops.forEach(stop => {
    if (!stop?.id) return; // Skip stops without valid ID
    
    const existingStop = currentStops.find(s => s?.id === stop.id);
    if (existingStop && existingStop.position !== stop.position) {
      conflicts.push({
        type: 'position_conflict',
        description: 'import.validation.stop_position_conflict',
        stopId: stop.id,
        suggestedResolution: 'import.validation.use_imported_position',
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
      'import.validation.app_config_invalid_object',
      'config'
    ));
    return { errors, warnings };
  }

  // Enhanced type validation with proper guards
  if (!isValidPartialAppConfig(config)) {
    errors.push(createValidationError(
      ERROR_CODES.INVALID_DATA_TYPE,
      'import.validation.invalid_app_config_type',
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
        'import.validation.stops_must_be_array',
        'config.stops',
        appConfig.stops,
        'Array'
      ));
    } else {
      if (appConfig.stops.length > VALIDATION_RULES.MAX_STOPS) {
        errors.push(createValidationError(
          ERROR_CODES.VALUE_OUT_OF_RANGE,
          'import.validation.too_many_stops',
          'config.stops',
          appConfig.stops.length,
          `max. ${VALIDATION_RULES.MAX_STOPS}`
        ));
      }

      // Duplikate prüfen
      if (context.options.checkDuplicates) {
        const stopIds = new Set<string>();
        appConfig.stops.forEach((stop, index) => {
          // Null-safe check für stop und stop.id
          if (typeof stop === 'object' && stop !== null && 'id' in stop && stop.id != null) {
            const stopId = String(stop.id); // Sicherstellen, dass es ein String ist
            if (stopIds.has(stopId)) {
              errors.push(createValidationError(
                ERROR_CODES.DUPLICATE_STOP,
                'import.validation.duplicate_stop_id',
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
        // Null-safe check für stop
        if (stop == null) {
          errors.push(createValidationError(
            ERROR_CODES.INVALID_STOP_CONFIG,
            'import.validation.null_stop_found',
            `config.stops[${index}]`,
            stop
          ));
          return;
        }
        
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
      'import.validation.schema_version_must_be_string',
      'schemaVersion',
      version,
      'string'
    ));
    return { isValid: false, errors, warnings, isCompatible: false };
  }

  if (!isValidSchemaVersion(version)) {
    errors.push(createValidationError(
      ERROR_CODES.UNSUPPORTED_VERSION,
      'import.validation.unsupported_schema_version',
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
      'import.validation.schema_version_outdated',
      'schemaVersion',
      version,
      'import.validation.update_configuration'
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
      'import.validation.metadata_invalid_object',
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
      'import.validation.export_settings_missing',
      'exportSettings',
      exportSettings,
      'import.validation.use_default_export_settings'
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
      'import.validation.schema_migration_required',
      'schemaVersion',
      sourceVersion,
      'import.validation.perform_schema_migration'
    ));
  }

  return { isCompatible, migrationRequired, warnings };
}