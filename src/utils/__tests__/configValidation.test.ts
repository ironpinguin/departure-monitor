/**
 * Unit-Tests für die Konfiguration-Validierung
 * Testet alle Validierungslogik-Funktionen mit verschiedenen Szenarien
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateConfigStructure,
  validateStopConfig,
  validateSettingsConfig,
  createImportPreview
} from '../configValidation';
import type {
  ConfigExport,
  ValidationContext
} from '../../types/configExport';
import type { AppConfig, StopConfig } from '../../models';
import { VALIDATION_RULES, ERROR_CODES, WARNING_CODES } from '../../types/configExport';

describe('configValidation', () => {
  let mockValidationContext: ValidationContext;
  let mockValidConfigExport: ConfigExport;
  let mockAppConfig: AppConfig;
  let mockStopConfig: StopConfig;

  beforeEach(() => {
    mockValidationContext = {
      schemaVersion: '1.0.0',
      strict: true,
      options: {
        checkDuplicates: true,
        validateReferences: true,
        deepValidation: true
      }
    };

    mockStopConfig = {
      id: 'test-stop-1',
      name: 'Test Stop',
      city: 'wue',
      stopId: 'WUE12345',
      walkingTimeMinutes: 5,
      visible: true,
      position: 0
    };

    mockAppConfig = {
      stops: [mockStopConfig],
      darkMode: false,
      refreshIntervalSeconds: 30,
      maxDeparturesShown: 10,
      language: 'de'
    };

    mockValidConfigExport = {
      schemaVersion: '1.0.0',
      exportTimestamp: '2024-01-01T00:00:00.000Z',
      exportedBy: 'test-suite',
      metadata: {
        stopCount: 1,
        language: 'de',
        source: 'test'
      },
      config: mockAppConfig,
      exportSettings: {
        includeUserSettings: true,
        includeStopPositions: true,
        includeVisibilitySettings: true
      }
    };
  });

  describe('validateConfigStructure', () => {
    it('should validate a correct configuration', () => {
      const result = validateConfigStructure(mockValidConfigExport, mockValidationContext);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.isCompatible).toBe(true);
      expect(result.schemaVersion).toBe('1.0.0');
    });

    it('should reject null/undefined input', () => {
      const result = validateConfigStructure(null, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ERROR_CODES.INVALID_SCHEMA);
      expect(result.errors[0].message).toContain('gültiges Objekt');
    });

    it('should reject empty object', () => {
      const result = validateConfigStructure({}, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === ERROR_CODES.MISSING_REQUIRED_FIELD)).toBe(true);
    });

    it('should reject invalid schema version', () => {
      const invalidConfig = {
        ...mockValidConfigExport,
        schemaVersion: '999.0.0'
      };
      
      const result = validateConfigStructure(invalidConfig, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.UNSUPPORTED_VERSION)).toBe(true);
    });

    it('should validate with warnings for performance settings', () => {
      const configWithPerformanceIssues = {
        ...mockValidConfigExport,
        config: {
          ...mockAppConfig,
          refreshIntervalSeconds: 10, // Sehr kurz
          maxDeparturesShown: 30 // Sehr viele
        }
      };
      
      const result = validateConfigStructure(configWithPerformanceIssues, mockValidationContext);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === WARNING_CODES.PERFORMANCE_IMPACT)).toBe(true);
    });

    it('should detect duplicate stops', () => {
      const duplicateStop = { ...mockStopConfig, position: 1 };
      const configWithDuplicates = {
        ...mockValidConfigExport,
        config: {
          ...mockAppConfig,
          stops: [mockStopConfig, duplicateStop]
        },
        metadata: {
          ...mockValidConfigExport.metadata,
          stopCount: 2
        }
      };
      
      const result = validateConfigStructure(configWithDuplicates, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.DUPLICATE_STOP)).toBe(true);
    });

    it('should validate maximum stops limit', () => {
      const tooManyStops = Array.from({ length: VALIDATION_RULES.MAX_STOPS + 1 }, (_, i) => ({
        ...mockStopConfig,
        id: `stop-${i}`,
        position: i
      }));
      
      const configWithTooManyStops = {
        ...mockValidConfigExport,
        config: {
          ...mockAppConfig,
          stops: tooManyStops
        },
        metadata: {
          ...mockValidConfigExport.metadata,
          stopCount: tooManyStops.length
        }
      };
      
      const result = validateConfigStructure(configWithTooManyStops, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.VALUE_OUT_OF_RANGE)).toBe(true);
    });
  });

  describe('validateStopConfig', () => {
    it('should validate a correct stop configuration', () => {
      const result = validateStopConfig(mockStopConfig, mockValidationContext);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject stop with missing required fields', () => {
      const incompleteStop = {
        id: 'test-stop',
        name: 'Test Stop'
        // Missing city, stopId, walkingTimeMinutes, visible, position
      };
      
      const result = validateStopConfig(incompleteStop, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === ERROR_CODES.MISSING_REQUIRED_FIELD)).toBe(true);
    });

    it('should reject stop with invalid data types', () => {
      const invalidStop = {
        id: 123, // Should be string
        name: true, // Should be string
        city: 'invalid', // Should be 'wue' or 'muc'
        stopId: 456, // Should be string
        walkingTimeMinutes: 'five', // Should be number
        visible: 'yes', // Should be boolean
        position: 'first' // Should be number
      };
      
      const result = validateStopConfig(invalidStop, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_DATA_TYPE)).toBe(true);
    });

    it('should reject stop with walking time out of range', () => {
      const stopWithInvalidWalkingTime = {
        ...mockStopConfig,
        walkingTimeMinutes: VALIDATION_RULES.MAX_WALKING_TIME + 1
      };
      
      const result = validateStopConfig(stopWithInvalidWalkingTime, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.VALUE_OUT_OF_RANGE)).toBe(true);
    });

    it('should warn for unusual walking time', () => {
      const stopWithLongWalkingTime = {
        ...mockStopConfig,
        walkingTimeMinutes: 35
      };
      
      const result = validateStopConfig(stopWithLongWalkingTime, mockValidationContext);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === WARNING_CODES.UNUSUAL_CONFIGURATION)).toBe(true);
    });

    it('should validate city values', () => {
      const stopWithValidCity = {
        ...mockStopConfig,
        city: 'muc'
      };
      
      const result = validateStopConfig(stopWithValidCity, mockValidationContext);
      expect(result.isValid).toBe(true);
      
      const stopWithInvalidCity = {
        ...mockStopConfig,
        city: 'ber'
      };
      
      const result2 = validateStopConfig(stopWithInvalidCity, mockValidationContext);
      expect(result2.isValid).toBe(false);
    });
  });

  describe('validateSettingsConfig', () => {
    it('should validate correct settings', () => {
      const result = validateSettingsConfig(mockAppConfig, mockValidationContext);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject settings with invalid refresh interval', () => {
      const invalidSettings = {
        ...mockAppConfig,
        refreshIntervalSeconds: VALIDATION_RULES.MIN_REFRESH_INTERVAL - 1
      };
      
      const result = validateSettingsConfig(invalidSettings, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.VALUE_OUT_OF_RANGE)).toBe(true);
    });

    it('should reject settings with invalid max departures', () => {
      const invalidSettings = {
        ...mockAppConfig,
        maxDeparturesShown: VALIDATION_RULES.MAX_DEPARTURES_SHOWN + 1
      };
      
      const result = validateSettingsConfig(invalidSettings, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.VALUE_OUT_OF_RANGE)).toBe(true);
    });

    it('should reject settings with invalid language', () => {
      const invalidSettings = {
        ...mockAppConfig,
        language: 'fr'
      };
      
      const result = validateSettingsConfig(invalidSettings, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_DATA_TYPE)).toBe(true);
    });

    it('should warn for performance-impacting settings', () => {
      const performanceSettings = {
        ...mockAppConfig,
        refreshIntervalSeconds: 15,
        maxDeparturesShown: 25
      };
      
      const result = validateSettingsConfig(performanceSettings, mockValidationContext);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === WARNING_CODES.PERFORMANCE_IMPACT)).toBe(true);
    });
  });

  describe('createImportPreview', () => {
    it('should create preview for new configuration', () => {
      const currentConfig = {
        ...mockAppConfig,
        stops: []
      };
      
      const preview = createImportPreview(mockValidConfigExport, currentConfig);
      
      expect(preview.stopCount).toBe(1);
      expect(preview.estimatedChanges.stopsAdded).toBe(1);
      expect(preview.estimatedChanges.stopsUpdated).toBe(0);
      expect(preview.conflicts).toHaveLength(0);
    });

    it('should detect conflicts with existing configuration', () => {
      const existingStop = {
        ...mockStopConfig,
        position: 5
      };
      
      const currentConfig = {
        ...mockAppConfig,
        stops: [existingStop]
      };
      
      const preview = createImportPreview(mockValidConfigExport, currentConfig);
      
      expect(preview.conflicts.length).toBeGreaterThan(0);
      expect(preview.conflicts.some(c => c.type === 'position_conflict')).toBe(true);
    });

    it('should detect global settings changes', () => {
      const currentConfig = {
        ...mockAppConfig,
        darkMode: true,
        refreshIntervalSeconds: 60
      };
      
      const preview = createImportPreview(mockValidConfigExport, currentConfig);
      
      expect(preview.globalSettingsChanges.darkMode).toBe(false);
      expect(preview.globalSettingsChanges.refreshIntervalSeconds).toBe(30);
      expect(preview.estimatedChanges.settingsChanged).toBeGreaterThan(0);
    });
  });

  describe('Schema Compatibility', () => {
    it('should validate supported schema versions', () => {
      const validConfig = {
        ...mockValidConfigExport,
        schemaVersion: '1.0.0'
      };
      
      const result = validateConfigStructure(validConfig, mockValidationContext);
      
      expect(result.isValid).toBe(true);
      expect(result.isCompatible).toBe(true);
      expect(result.schemaVersion).toBe('1.0.0');
    });

    it('should reject unsupported schema versions', () => {
      const invalidConfig = {
        ...mockValidConfigExport,
        schemaVersion: '2.0.0'
      };
      
      const result = validateConfigStructure(invalidConfig, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.isCompatible).toBe(false);
    });

    it('should handle missing schema version', () => {
      const configWithoutSchema = {
        ...mockValidConfigExport,
        schemaVersion: undefined
      };
      
      const result = validateConfigStructure(configWithoutSchema, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.schemaVersion).toBe('unknown');
    });
  });

  describe('Edge Cases', () => {
    it('should handle deeply nested validation errors', () => {
      const configWithNestedErrors = {
        ...mockValidConfigExport,
        config: {
          ...mockAppConfig,
          stops: [
            {
              id: 'stop-1',
              // Missing required fields
            },
            {
              id: 'stop-2',
              name: 'Stop 2',
              city: 'invalid',
              // More invalid data
            }
          ]
        }
      };
      
      const result = validateConfigStructure(configWithNestedErrors, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });

    it('should handle validation with disabled options', () => {
      const lenientContext = {
        ...mockValidationContext,
        strict: false,
        options: {
          checkDuplicates: false,
          validateReferences: false,
          deepValidation: false
        }
      };
      
      const duplicateStop = { ...mockStopConfig, position: 1 };
      const configWithDuplicates = {
        ...mockValidConfigExport,
        config: {
          ...mockAppConfig,
          stops: [mockStopConfig, duplicateStop]
        }
      };
      
      const result = validateConfigStructure(configWithDuplicates, lenientContext);
      
      // Should not detect duplicates when checkDuplicates is false
      expect(result.errors.some(e => e.code === ERROR_CODES.DUPLICATE_STOP)).toBe(false);
    });

    it('should handle extremely large configurations', () => {
      const largeStopArray = Array.from({ length: 1000 }, (_, i) => ({
        ...mockStopConfig,
        id: `stop-${i}`,
        position: i
      }));
      
      const largeConfig = {
        ...mockValidConfigExport,
        config: {
          ...mockAppConfig,
          stops: largeStopArray
        }
      };
      
      const result = validateConfigStructure(largeConfig, mockValidationContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.VALUE_OUT_OF_RANGE)).toBe(true);
    });
  });
});