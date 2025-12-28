/**
 * Property-based Tests für Import/Export-Implementierung
 * Testet systematisch verschiedene Eingabekombinationen und Edge Cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateFileFormat } from '../importUtils';
import { generateExportFilename, validateExportData, estimateFileSize } from '../exportUtils';
import type { ConfigExport } from '../../types/configExport';

describe('Property-Based Tests für Import/Export-System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.FileReader = vi.fn().mockImplementation(() => ({
      readAsText: vi.fn(),
      result: '',
      error: null,
      onload: null,
      onerror: null
    })) as unknown as typeof FileReader;
  });

  describe('String Input Property Tests', () => {
    const generateRandomString = (length: number): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
      return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const generateUnicodeString = (length: number): string => {
      const unicodeRanges = [
        [0x0020, 0x007F], // Basic Latin
        [0x00A0, 0x00FF], // Latin-1 Supplement
        [0x0100, 0x017F], // Latin Extended-A
        [0x1F600, 0x1F64F], // Emoticons
        [0x4E00, 0x9FFF], // CJK Unified Ideographs
      ];
      
      return Array.from({ length }, () => {
        const range = unicodeRanges[Math.floor(Math.random() * unicodeRanges.length)];
        const codePoint = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
        return String.fromCodePoint(codePoint);
      }).join('');
    };

    it('should handle arbitrary string lengths in stop names', () => {
      const testCases = [
        { length: 1, description: 'single character' },
        { length: 50, description: 'normal length' },
        { length: 255, description: 'maximum typical length' },
        { length: 1000, description: 'very long string' },
        { length: 10000, description: 'extremely long string' }
      ];

      testCases.forEach(({ length }) => {
        const randomName = generateRandomString(length);
        const config: ConfigExport = {
          schemaVersion: '1.0.0',
          exportTimestamp: new Date().toISOString(),
          exportedBy: "",
          metadata: {
            stopCount: 1,
            language: 'en',
            source: ''
          },
          config: {
            stops: [{
              id: 'test-stop',
              name: randomName,
              city: 'wue' as const,
              stopId: 'test-stop-id',
              walkingTimeMinutes: 5,
              visible: true,
              position: 0
            }],
            darkMode: false,
            refreshIntervalSeconds: 60,
            maxDeparturesShown: 6,
            language: 'en'
          },
          exportSettings: {
            includeUserSettings: false,
            includeStopPositions: true,
            includeVisibilitySettings: true
          }
        };

        expect(() => validateExportData(config)).not.toThrow();
        expect(estimateFileSize(config).estimatedSizeBytes).toBeGreaterThan(0);
      });
    });

    it('should handle unicode characters in all string fields', () => {
      const unicodeStrings = Array.from({ length: 10 }, () => generateUnicodeString(50));
      
      unicodeStrings.forEach((unicodeStr, index) => {
        const config: ConfigExport = {
          schemaVersion: '1.0.0',
          exportTimestamp: new Date().toISOString(),
          exportedBy: 'test-app',
          metadata: {
            stopCount: 1,
            language: 'de',
            source: 'test'
          },
          config: {
            stops: [{
              id: `test-${index}`,
              name: unicodeStr,
              city: 'wue' as const,
              stopId: `test-stop-id-${index}`,
              walkingTimeMinutes: 5,
              visible: true,
              position: index
            }],
            darkMode: false,
            refreshIntervalSeconds: 30,
            maxDeparturesShown: 10,
            language: 'de'
          },
          exportSettings: {
            includeUserSettings: true,
            includeStopPositions: true,
            includeVisibilitySettings: true
          }
        };

        expect(() => validateExportData(config)).not.toThrow();
        const filename = generateExportFilename(config);
        expect(filename).toMatch(/^departure-monitor-config-\d+stops-[a-z]{2}-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.json$/);
      });
    });
  });

  describe('Numeric Input Property Tests', () => {
    it('should handle various city values', () => {
      const cityTestCases = [
        { city: 'wue', valid: true },
        { city: 'muc', valid: true },
        { city: 'invalid', valid: false },
        { city: '', valid: false },
        { city: null, valid: false },
        { city: undefined, valid: false }
      ];

      cityTestCases.forEach(({ city, valid }) => {
        const config: ConfigExport = {
          schemaVersion: '1.0.0',
          exportTimestamp: new Date().toISOString(),
          exportedBy: 'test-app',
          metadata: {
            stopCount: 1,
            language: 'de',
            source: 'test'
          },
          config: {
            stops: [{
              id: 'test-stop',
              name: 'Test Stop',
              city: city as 'wue' | 'muc',
              stopId: 'test-stop-id',
              walkingTimeMinutes: 5,
              visible: true,
              position: 0
            }],
            darkMode: false,
            refreshIntervalSeconds: 30,
            maxDeparturesShown: 10,
            language: 'de'
          },
          exportSettings: {
            includeUserSettings: true,
            includeStopPositions: true,
            includeVisibilitySettings: true
          }
        };

        if (valid) {
          expect(() => validateExportData(config)).not.toThrow();
        } else {
          expect(() => validateExportData(config)).toThrow();
        }
      });
    });

    it('should handle various refresh interval values', () => {
      const intervalTestCases = [
        { interval: 10, valid: true },
        { interval: 30, valid: true },
        { interval: 300, valid: true },
        { interval: 3600, valid: true },
        { interval: 0, valid: false },
        { interval: -10, valid: false },
        { interval: NaN, valid: false },
        { interval: Infinity, valid: false }
      ];

      intervalTestCases.forEach(({ interval, valid }) => {
        const config: ConfigExport = {
          schemaVersion: '1.0.0',
          exportTimestamp: new Date().toISOString(),
          exportedBy: 'test-app',
          metadata: {
            stopCount: 1,
            language: 'de',
            source: 'test'
          },
          config: {
            stops: [{
              id: 'test-stop',
              name: 'Test Stop',
              city: 'wue' as const,
              stopId: 'test-stop-id',
              walkingTimeMinutes: 5,
              visible: true,
              position: 0
            }],
            darkMode: false,
            refreshIntervalSeconds: interval,
            maxDeparturesShown: 10,
            language: 'de'
          },
          exportSettings: {
            includeUserSettings: true,
            includeStopPositions: true,
            includeVisibilitySettings: true
          }
        };

        if (valid) {
          expect(() => validateExportData(config)).not.toThrow();
        } else {
          expect(() => validateExportData(config)).toThrow();
        }
      });
    });
  });

  describe('Array Size Property Tests', () => {
    it('should handle various stop array sizes', () => {
      const sizeTestCases = [
        { size: 0, description: 'empty array' },
        { size: 1, description: 'single stop' },
        { size: 10, description: 'normal size' },
        { size: 100, description: 'large array' },
        { size: 1000, description: 'very large array' }
      ];

      sizeTestCases.forEach(({ size }) => {
        const stops = Array.from({ length: size }, (_, i) => ({
          id: `stop-${i}`,
          name: `Stop ${i}`,
          city: (i % 2 === 0 ? 'wue' : 'muc') as 'wue' | 'muc',
          stopId: `stop-id-${i}`,
          walkingTimeMinutes: Math.floor(Math.random() * 30),
          visible: Math.random() > 0.5,
          position: i
        }));

        const config: ConfigExport = {
          schemaVersion: '1.0.0',
          exportTimestamp: new Date().toISOString(),
          exportedBy: 'test-app',
          metadata: {
            stopCount: size,
            language: 'de',
            source: 'test'
          },
          config: {
            stops,
            darkMode: false,
            refreshIntervalSeconds: 30,
            maxDeparturesShown: 10,
            language: 'de'
          },
          exportSettings: {
            includeUserSettings: true,
            includeStopPositions: true,
            includeVisibilitySettings: true
          }
        };

        expect(() => validateExportData(config)).not.toThrow();
        const fileSize = estimateFileSize(config);
        expect(fileSize.estimatedSizeBytes).toBeGreaterThan(0);
        
        // Test that file size scales roughly with array size
        if (size > 0) {
          expect(fileSize.estimatedSizeBytes).toBeGreaterThan(size * 10); // Rough estimate
        }
      });
    });
  });

  describe('File Format Property Tests', () => {
    it('should handle various JSON formatting styles', () => {
      const baseConfig: ConfigExport = {
        schemaVersion: '1.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'test-app',
        metadata: {
          stopCount: 1,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: [{
            id: 'test-stop',
            name: 'Test Stop',
            city: 'wue' as const,
            stopId: 'test-stop-id',
            walkingTimeMinutes: 5,
            visible: true,
            position: 0
          }],
          darkMode: false,
          refreshIntervalSeconds: 30,
          maxDeparturesShown: 10,
          language: 'de'
        },
        exportSettings: {
          includeUserSettings: true,
          includeStopPositions: true,
          includeVisibilitySettings: true
        }
      };

      const jsonVariations = [
        JSON.stringify(baseConfig), // Compact
        JSON.stringify(baseConfig, null, 2), // Pretty printed with 2 spaces
        JSON.stringify(baseConfig, null, 4), // Pretty printed with 4 spaces
        JSON.stringify(baseConfig, null, '\t'), // Pretty printed with tabs
      ];

      jsonVariations.forEach((jsonStr, index) => {
        const file = new File([jsonStr], `test-${index}.json`, { type: 'application/json' });
        
        expect(() => validateFileFormat(file)).not.toThrow();
      });
    });

    it('should reject malformed JSON with various error types', () => {
      const malformedJsonCases = [
        '{ "version": "1.0.0"', // Missing closing brace
        '{ "version": "1.0.0", }', // Trailing comma
        '{ version: "1.0.0" }', // Unquoted key
        '{ "version": \'1.0.0\' }', // Single quotes instead of double
        '{ "version": "1.0.0"\n"config": {} }', // Missing comma
        '{ "version": undefined }', // Invalid value type
        '{ "version": "1.0.0", "version": "2.0.0" }', // Duplicate keys
        '', // Empty string
        '   ', // Only whitespace
        'null', // Null value
        'undefined', // Undefined
        '[]', // Array instead of object
        '"string"', // String instead of object
        '123', // Number instead of object
        'true', // Boolean instead of object
      ];

      malformedJsonCases.forEach((jsonStr, index) => {
        const file = new File([jsonStr], `malformed-${index}.json`, { type: 'application/json' });
        
        expect(() => {
          validateFileFormat(file);
        }).toThrow();
      });
    });
  });

  describe('Error Recovery Property Tests', () => {
    it('should gracefully handle partial data corruption', () => {
      const baseConfig: ConfigExport = {
        schemaVersion: '1.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'test-app',
        metadata: {
          stopCount: 1,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: [{
            id: 'test-stop',
            name: 'Test Stop',
            city: 'wue' as const,
            stopId: 'test-stop-id',
            walkingTimeMinutes: 5,
            visible: true,
            position: 0
          }],
          darkMode: false,
          refreshIntervalSeconds: 30,
          maxDeparturesShown: 10,
          language: 'de'
        },
        exportSettings: {
          includeUserSettings: true,
          includeStopPositions: true,
          includeVisibilitySettings: true
        }
      };

      // Test with missing optional fields
      const partialConfigs = [
        { ...baseConfig, exportTimestamp: undefined },
        { ...baseConfig, config: { ...baseConfig.config, language: undefined } },
        { ...baseConfig, config: { ...baseConfig.config, stops: [] } },
        {
          ...baseConfig,
          config: {
            ...baseConfig.config,
            stops: [{
              ...baseConfig.config.stops[0],
              city: undefined as unknown as 'wue' | 'muc'
            }]
          }
        }
      ];

      partialConfigs.forEach((config) => {
        try {
          validateExportData(config as unknown as ConfigExport);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBeTruthy();
        }
      });
    });
  });

  describe('Concurrent Operations Property Tests', () => {
    it('should handle multiple simultaneous validations', async () => {
      const configs = Array.from({ length: 10 }, (_, i) => ({
        schemaVersion: '1.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'test-app',
        metadata: {
          stopCount: 1,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: [{
            id: `test-stop-${i}`,
            name: `Test Stop ${i}`,
            city: (i % 2 === 0 ? 'wue' : 'muc') as 'wue' | 'muc',
            stopId: `test-stop-id-${i}`,
            walkingTimeMinutes: 5 + i,
            visible: true,
            position: i
          }],
          darkMode: false,
          refreshIntervalSeconds: 30 + i,
          maxDeparturesShown: 10,
          language: 'de'
        },
        exportSettings: {
          includeUserSettings: true,
          includeStopPositions: true,
          includeVisibilitySettings: true
        }
      }));

      const validationPromises = configs.map(async (config) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            try {
              validateExportData(config);
              resolve(true);
            } catch {
              resolve(false);
            }
          }, Math.random() * 100);
        });
      });

      const results = await Promise.all(validationPromises);
      expect(results.every(result => result === true)).toBe(true);
    });
  });

  describe('Memory Usage Property Tests', () => {
    it('should handle varying memory pressure scenarios', () => {
      const memorySizes = [1, 10, 100, 1000];
      
      memorySizes.forEach(size => {
        const largeData = 'x'.repeat(size * 1024); // KB size data
        
        const config: ConfigExport = {
          schemaVersion: '1.0.0',
          exportTimestamp: new Date().toISOString(),
          exportedBy: 'test-app',
          metadata: {
            stopCount: 1,
            language: 'de',
            source: 'test'
          },
          config: {
            stops: [{
              id: 'test-stop',
              name: largeData,
              city: 'wue' as const,
              stopId: 'test-stop-id',
              walkingTimeMinutes: 5,
              visible: true,
              position: 0
            }],
            darkMode: false,
            refreshIntervalSeconds: 30,
            maxDeparturesShown: 10,
            language: 'de'
          },
          exportSettings: {
            includeUserSettings: true,
            includeStopPositions: true,
            includeVisibilitySettings: true
          }
        };

        const startTime = performance.now();
        try {
          validateExportData(config);
          const endTime = performance.now();
          const processingTime = endTime - startTime;
          
          // Performance should degrade gracefully with size
          expect(processingTime).toBeLessThan(1000); // Should complete within 1s
        } catch (error) {
          // Large data might cause validation errors, which is acceptable
          expect(error).toBeInstanceOf(Error);
        }
      });
    });
  });

  describe('Cross-Platform Compatibility Property Tests', () => {
    it('should handle various line ending formats', () => {
      const baseConfig: ConfigExport = {
        schemaVersion: '1.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'test-app',
        metadata: {
          stopCount: 1,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: [{
            id: 'test-stop',
            name: 'Test Stop',
            city: 'wue' as const,
            stopId: 'test-stop-id',
            walkingTimeMinutes: 5,
            visible: true,
            position: 0
          }],
          darkMode: false,
          refreshIntervalSeconds: 30,
          maxDeparturesShown: 10,
          language: 'de'
        },
        exportSettings: {
          includeUserSettings: true,
          includeStopPositions: true,
          includeVisibilitySettings: true
        }
      };

      const lineEndingVariations = [
        JSON.stringify(baseConfig, null, 2).replace(/\n/g, '\r\n'), // Windows CRLF
        JSON.stringify(baseConfig, null, 2).replace(/\n/g, '\r'), // Classic Mac CR
        JSON.stringify(baseConfig, null, 2), // Unix LF
        JSON.stringify(baseConfig, null, 2).replace(/\n/g, '\n\r'), // Mixed endings
      ];

      lineEndingVariations.forEach((jsonStr, index) => {
        const file = new File([jsonStr], `platform-${index}.json`, { type: 'application/json' });
        
        expect(() => validateFileFormat(file)).not.toThrow();
      });
    });

    it('should handle various character encodings', () => {
      const testStrings = [
        'ASCII only text',
        'UTF-8 with umlauts: äöüß',
        'UTF-8 with emoji: 🚌🚇🚊',
        'UTF-8 with CJK: 東京駅',
        'UTF-8 with RTL: مرحبا',
        'Mixed encoding: Hello 世界 🌍'
      ];

      testStrings.forEach((testStr, index) => {
        const config: ConfigExport = {
          schemaVersion: '1.0.0',
          exportTimestamp: new Date().toISOString(),
          exportedBy: 'test-app',
          metadata: {
            stopCount: 1,
            language: 'de',
            source: 'test'
          },
          config: {
            stops: [{
              id: `test-${index}`,
              name: testStr,
              city: 'wue' as const,
              stopId: `test-stop-id-${index}`,
              walkingTimeMinutes: 5,
              visible: true,
              position: 0
            }],
            darkMode: false,
            refreshIntervalSeconds: 30,
            maxDeparturesShown: 10,
            language: 'de'
          },
          exportSettings: {
            includeUserSettings: true,
            includeStopPositions: true,
            includeVisibilitySettings: true
          }
        };

        expect(() => validateExportData(config)).not.toThrow();
        const jsonStr = JSON.stringify(config);
        expect(jsonStr).toContain(testStr);
      });
    });
  });
});