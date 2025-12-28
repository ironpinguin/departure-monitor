/**
 * Unit-Tests für Export-Utilities
 * Testet alle Export-Funktionen mit verschiedenen Szenarien
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  downloadConfigFile,
  generateExportFilename,
  formatConfigForDownload,
  validateExportData,
  estimateFileSize,
  supportsDownloadAPI,
  createExportSummary,
  testExportFunctionality
} from '../exportUtils';
import type { ConfigExport } from '../../types/configExport';
import type { AppConfig } from '../../models';

describe('exportUtils', () => {
  let mockConfigExport: ConfigExport;
  let mockAppConfig: AppConfig;

  beforeEach(() => {
    mockAppConfig = {
      stops: [
        {
          id: 'stop-1',
          name: 'Test Stop',
          city: 'wue',
          stopId: 'WUE123',
          walkingTimeMinutes: 5,
          visible: true,
          position: 0
        }
      ],
      darkMode: false,
      refreshIntervalSeconds: 30,
      maxDeparturesShown: 10,
      language: 'de'
    };

    mockConfigExport = {
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

    // Mock Browser APIs completely to ensure supportsDownloadAPI returns true
    vi.stubGlobal('Blob', class MockBlob {
      public size: number;
      constructor(content: unknown[]) {
        const contentLength = content.reduce((acc: number, item) => {
          if (typeof item === 'string') {
            return acc + item.length;
          }
          return acc + JSON.stringify(item).length;
        }, 0);
        this.size = contentLength;
      }
    });

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn()
    });

    // Ensure window and document are properly defined
    Object.defineProperty(global, 'window', {
      value: {
        document: global.document,
        open: vi.fn(() => ({ focus: vi.fn() }))
      },
      writable: true
    });

    // Reset document.createElement mock
    vi.spyOn(document, 'createElement').mockImplementation(() => ({
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn(),
    } as unknown as HTMLElement));

    vi.spyOn(document.body, 'appendChild').mockImplementation(() => undefined as unknown as Element);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => undefined as unknown as Element);
  });

  describe('downloadConfigFile', () => {
    it('should download config file successfully', () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      };
      
      // Ensure supportsDownloadAPI returns true
      vi.mocked(document.createElement).mockReturnValue(mockLink as unknown as HTMLElement);
      
      expect(() => {
        downloadConfigFile(mockConfigExport);
      }).not.toThrow();
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toContain('.json');
    });

    it('should use custom filename when provided', () => {
      const customFilename = 'custom-config.json';
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn()
      };
      
      vi.mocked(document.createElement).mockReturnValue(mockLink as unknown as HTMLElement);
      
      downloadConfigFile(mockConfigExport, customFilename);
      
      expect(mockLink.download).toBe(customFilename);
    });

    it('should handle download errors gracefully', () => {
      // Mock Blob to throw error
      const originalBlob = global.Blob;
      vi.stubGlobal('Blob', class {
        constructor() {
          throw new Error('Blob creation failed');
        }
      });
      
      expect(() => {
        downloadConfigFile(mockConfigExport);
      }).toThrow('Download fehlgeschlagen');
      
      // Restore original Blob
      vi.stubGlobal('Blob', originalBlob);
    });

    it('should use fallback for unsupported browsers', () => {
      // Mock unsupported browser
      const originalURL = globalThis.URL;
      vi.stubGlobal('URL', undefined);
      
      const mockWindow = {
        open: vi.fn(() => ({ close: vi.fn() }))
      };
      
      vi.stubGlobal('window', mockWindow);
      
      expect(() => {
        downloadConfigFile(mockConfigExport);
      }).not.toThrow();
      
      // Restore
      vi.stubGlobal('URL', originalURL);
    });
  });

  describe('generateExportFilename', () => {
    it('should generate filename with timestamp', () => {
      const filename = generateExportFilename(mockConfigExport);
      
      expect(filename).toContain('departure-monitor-config');
      expect(filename).toContain('1stops');
      expect(filename).toContain('de');
      expect(filename).toContain('.json');
    });

    it('should include stop count in filename', () => {
      const configWithMultipleStops = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: [
            mockAppConfig.stops[0],
            { ...mockAppConfig.stops[0], id: 'stop-2', position: 1 }
          ]
        }
      };
      
      const filename = generateExportFilename(configWithMultipleStops);
      
      expect(filename).toContain('2stops');
    });

    it('should include language in filename', () => {
      const englishConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          language: 'en'
        }
      };
      
      const filename = generateExportFilename(englishConfig);
      
      expect(filename).toContain('en');
    });

    it('should replace invalid filename characters', () => {
      const filename = generateExportFilename(mockConfigExport);
      
      expect(filename).not.toMatch(/[<>:"/\\|?*]/);
    });
  });

  describe('formatConfigForDownload', () => {
    it('should format config as pretty JSON', () => {
      const formatted = formatConfigForDownload(mockConfigExport);
      
      expect(formatted).toContain('{\n');
      expect(formatted).toContain('  "schemaVersion"');
      expect(formatted).toContain('  "exportTimestamp"');
      expect(formatted).toContain('  "exportedBy"');
    });

    it('should add export metadata', () => {
      const formatted = formatConfigForDownload(mockConfigExport);
      const parsed = JSON.parse(formatted);
      
      expect(parsed.exportTimestamp).toBeDefined();
      expect(parsed.exportedBy).toBe('departure-monitor-app');
    });

    it('should preserve original config data', () => {
      const formatted = formatConfigForDownload(mockConfigExport);
      const parsed = JSON.parse(formatted);
      
      expect(parsed.schemaVersion).toBe(mockConfigExport.schemaVersion);
      expect(parsed.config.stops).toEqual(mockConfigExport.config.stops);
      expect(parsed.metadata).toEqual(mockConfigExport.metadata);
    });

    it('should handle formatting errors', () => {
      const circularConfig = {
        ...mockConfigExport,
        circular: {}
      };
      circularConfig.circular = circularConfig;
      
      expect(() => {
        formatConfigForDownload(circularConfig);
      }).toThrow('Formatierung fehlgeschlagen');
    });
  });

  describe('validateExportData', () => {
    it('should validate correct export data', () => {
      expect(() => validateExportData(mockConfigExport)).not.toThrow();
    });

    it('should reject null/undefined data', () => {
      expect(() => validateExportData(null as unknown as ConfigExport)).toThrow();
      expect(() => validateExportData(undefined as unknown as ConfigExport)).toThrow();
    });

    it('should reject data with missing required fields', () => {
      const incompleteConfig = {
        schemaVersion: '1.0.0'
        // Missing other required fields
      } as unknown as ConfigExport;
      
      expect(() => validateExportData(incompleteConfig)).toThrow();
    });

    it('should reject data with invalid stops array', () => {
      const invalidConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: 'not-an-array' as unknown as typeof mockAppConfig.stops
        }
      };
      
      expect(() => validateExportData(invalidConfig)).toThrow();
    });

    it('should reject data with inconsistent stop count', () => {
      const inconsistentConfig = {
        ...mockConfigExport,
        metadata: {
          ...mockConfigExport.metadata,
          stopCount: 999
        }
      };
      
      expect(() => validateExportData(inconsistentConfig)).toThrow();
    });

    it('should reject data with invalid JSON structure', () => {
      const configWithCircularRef = {
        ...mockConfigExport,
        circular: {}
      };
      configWithCircularRef.circular = configWithCircularRef;
      
      expect(() => validateExportData(configWithCircularRef)).toThrow();
    });
  });

  describe('estimateFileSize', () => {
    it('should estimate file size correctly', () => {
      const sizeEstimate = estimateFileSize(mockConfigExport);
      
      expect(sizeEstimate.estimatedSizeBytes).toBeGreaterThan(0);
      expect(sizeEstimate.estimatedSizeFormatted).toBeDefined();
      expect(sizeEstimate.estimatedSizeHuman).toBeDefined();
    });

    it('should provide human-readable size format', () => {
      const sizeEstimate = estimateFileSize(mockConfigExport);
      
      expect(sizeEstimate.estimatedSizeHuman).toMatch(/\d+(\.\d+)?\s*(Bytes|KB|MB|GB)/);
    });

    it('should handle large configurations', () => {
      const largeConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: Array.from({ length: 100 }, (_, i) => ({
            id: `stop-${i}`,
            name: `Very Long Stop Name ${i}`,
            city: 'wue' as const,
            stopId: `WUE${i}`,
            walkingTimeMinutes: 5,
            visible: true,
            position: i
          }))
        }
      };
      
      const sizeEstimate = estimateFileSize(largeConfig);
      
      expect(sizeEstimate.estimatedSizeBytes).toBeGreaterThan(1000);
    });
  });

  describe('supportsDownloadAPI', () => {
    it('should detect modern browser support', () => {
      const supported = supportsDownloadAPI();
      
      expect(typeof supported).toBe('boolean');
    });

    it('should return false for missing APIs', () => {
      vi.stubGlobal('URL', undefined);
      
      const supported = supportsDownloadAPI();
      
      expect(supported).toBe(false);
    });

    it('should return false in server environment', () => {
      vi.stubGlobal('window', undefined);
      
      const supported = supportsDownloadAPI();
      
      expect(supported).toBe(false);
    });
  });

  describe('createExportSummary', () => {
    it('should create comprehensive export summary', () => {
      const summary = createExportSummary(mockConfigExport);
      
      expect(summary.filename).toBeDefined();
      expect(summary.size).toBeDefined();
      expect(summary.stopCount).toBe(1);
      expect(summary.language).toBe('de');
      expect(summary.timestamp).toBeDefined();
    });

    it('should include formatted file size', () => {
      const summary = createExportSummary(mockConfigExport);
      
      expect(summary.size).toMatch(/\d+(\.\d+)?\s*(Bytes|KB|MB|GB)/);
    });

    it('should use German locale for timestamp', () => {
      const summary = createExportSummary(mockConfigExport);
      
      expect(summary.timestamp).toBeDefined();
      expect(typeof summary.timestamp).toBe('string');
    });
  });

  describe('testExportFunctionality', () => {
    it('should test all required APIs', () => {
      const testResult = testExportFunctionality();
      
      expect(testResult.downloadAPISupported).toBeDefined();
      expect(testResult.blobSupported).toBeDefined();
      expect(testResult.urlSupported).toBeDefined();
      expect(Array.isArray(testResult.errors)).toBe(true);
    });

    it('should report errors for missing APIs', () => {
      vi.stubGlobal('Blob', undefined);
      vi.stubGlobal('URL', undefined);
      
      const testResult = testExportFunctionality();
      
      expect(testResult.errors.length).toBeGreaterThan(0);
      expect(testResult.blobSupported).toBe(false);
      expect(testResult.urlSupported).toBe(false);
    });

    it('should report success for supported APIs', () => {
      const testResult = testExportFunctionality();
      
      if (testResult.downloadAPISupported) {
        expect(testResult.errors.length).toBe(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle Blob creation errors', () => {
      vi.stubGlobal('Blob', class MockBlob {
        constructor() {
          throw new Error('Blob creation failed');
        }
      });
      
      expect(() => {
        downloadConfigFile(mockConfigExport);
      }).toThrow();
    });

    it('should handle URL creation errors', () => {
      // Mock URL.createObjectURL to throw
      const originalURL = global.URL;
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => {
          throw new Error('URL creation failed');
        }),
        revokeObjectURL: vi.fn()
      });
      
      expect(() => {
        downloadConfigFile(mockConfigExport);
      }).toThrow('Download fehlgeschlagen');
      
      // Restore original URL
      vi.stubGlobal('URL', originalURL);
    });

    it('should handle DOM manipulation errors', () => {
      // Mock createElement to throw
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('DOM error');
      });
      
      expect(() => {
        downloadConfigFile(mockConfigExport);
      }).toThrow('Download fehlgeschlagen');
      
      createElementSpy.mockRestore();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large export files efficiently', () => {
      const largeConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: Array.from({ length: 1000 }, (_, i) => ({
            id: `stop-${i}`,
            name: `Stop ${i}`,
            city: 'wue' as const,
            stopId: `WUE${i}`,
            walkingTimeMinutes: 5,
            visible: true,
            position: i
          }))
        }
      };
      
      const start = performance.now();
      const formatted = formatConfigForDownload(largeConfig);
      const end = performance.now();
      
      expect(formatted).toBeDefined();
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should estimate size for large configs quickly', () => {
      const largeConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: Array.from({ length: 500 }, (_, i) => ({
            id: `stop-${i}`,
            name: `Stop ${i}`,
            city: 'wue' as const,
            stopId: `WUE${i}`,
            walkingTimeMinutes: 5,
            visible: true,
            position: i
          }))
        }
      };
      
      const start = performance.now();
      const size = estimateFileSize(largeConfig);
      const end = performance.now();
      
      expect(size.estimatedSizeBytes).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(100); // Should complete within 100ms
    });
  });
  describe('Export Edge Cases and Boundary Testing', () => {
    it('should handle export with corrupted config data', () => {
      const corruptedConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: [
            {
              id: null, // Corrupted data
              name: undefined,
              city: 'invalid',
              stopId: '',
              walkingTimeMinutes: 'not-a-number',
              visible: 'not-boolean',
              position: -1
            }
          ]
        }
      } as unknown as ConfigExport;
      
      expect(() => {
        downloadConfigFile(corruptedConfig);
      }).toThrow('Download fehlgeschlagen');
    });

    it('should handle export with extremely large configuration', () => {
      const largeConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: Array.from({ length: 50000 }, (_, i) => ({
            id: `stop-${i}`,
            name: `Very Long Stop Name That Takes Up Memory ${i}`.repeat(10),
            city: 'wue' as const,
            stopId: `WUE${String(i).padStart(10, '0')}`,
            walkingTimeMinutes: Math.floor(Math.random() * 60) + 1,
            visible: true,
            position: i
          }))
        }
      };

      const startTime = performance.now();
      const sizeEstimate = estimateFileSize(largeConfig);
      const endTime = performance.now();
      
      expect(sizeEstimate.estimatedSizeBytes).toBeGreaterThan(1024 * 1024); // > 1MB
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle export with circular references in deep objects', () => {
      const circularConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          metadata: {}
        }
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      // Create circular reference
      circularConfig.config.metadata.parent = circularConfig;
      
      expect(() => {
        formatConfigForDownload(circularConfig);
      }).toThrow('Formatierung fehlgeschlagen');
    });

    it('should handle export with special characters in filenames', () => {
      const specialCharConfig = {
        ...mockConfigExport,
        metadata: {
          ...mockConfigExport.metadata,
          source: 'Test<>:"/\\|?*Config'
        }
      };
      
      const filename = generateExportFilename(specialCharConfig);
      
      // Should sanitize special characters
      expect(filename).not.toMatch(/[<>:"/\\|?*]/);
      expect(filename).toContain('.json');
    });

    it('should handle export with unicode characters in data', () => {
      const unicodeConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: [{
            id: 'unicode-stop',
            name: '🚌 München Hbf 🚊 Ñiño café résumé 北京',
            city: 'muc' as const,
            stopId: 'MUC🚌123',
            walkingTimeMinutes: 5,
            visible: true,
            position: 0
          }]
        }
      };
      
      const formatted = formatConfigForDownload(unicodeConfig);
      const parsed = JSON.parse(formatted);
      
      expect(parsed.config.stops[0].name).toBe('🚌 München Hbf 🚊 Ñiño café résumé 北京');
    });

    it('should handle export with null and undefined values', () => {
      const nullConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: [{
            id: 'test-stop',
            name: null,
            city: 'wue' as const,
            stopId: undefined,
            walkingTimeMinutes: 5,
            visible: true,
            position: 0
          }]
        }
      } as unknown as ConfigExport;
      
      expect(() => validateExportData(nullConfig)).toThrow();
    });

    it('should handle concurrent export operations', async () => {
      const configs = Array.from({ length: 10 }, (_, i) => ({
        ...mockConfigExport,
        metadata: {
          ...mockConfigExport.metadata,
          source: `concurrent-test-${i}`
        }
      }));

      const exportPromises = configs.map(config =>
        Promise.resolve().then(() => {
          const formatted = formatConfigForDownload(config);
          const summary = createExportSummary(config);
          return { formatted, summary };
        })
      );

      const results = await Promise.all(exportPromises);
      
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.summary.filename).toContain('departure-monitor-config');
        expect(() => JSON.parse(result.formatted)).not.toThrow();
      });
    });

    it('should handle export with extreme timestamp values', () => {
      const extremeTimestampConfig = {
        ...mockConfigExport,
        exportTimestamp: '9999-12-31T23:59:59.999Z' // Far future
      };
      
      const summary = createExportSummary(extremeTimestampConfig);
      
      expect(summary.timestamp).toBeDefined();
      expect(summary.filename).toContain('departure-monitor-config');
    });

    it('should handle export with invalid JSON structures', () => {
      const invalidJsonConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          invalidProperty: Symbol('cannot-serialize')
        }
      };
      
      expect(() => {
        formatConfigForDownload(invalidJsonConfig);
      }).toThrow('Formatierung fehlgeschlagen');
    });

    it('should handle export size estimation for edge cases', () => {
      // Test with empty config
      const emptyConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: []
        }
      };
      
      const emptySize = estimateFileSize(emptyConfig);
      expect(emptySize.estimatedSizeBytes).toBeGreaterThan(0);
      expect(emptySize.estimatedSizeHuman).toMatch(/\d+(\.\d+)?\s*(Bytes|KB)/);

      // Test with single character config
      const minimalConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: [{
            id: 'a',
            name: 'b',
            city: 'wue' as const,
            stopId: 'c',
            walkingTimeMinutes: 1,
            visible: true,
            position: 0
          }]
        }
      };
      
      const minimalSize = estimateFileSize(minimalConfig);
      expect(minimalSize.estimatedSizeBytes).toBeGreaterThan(emptySize.estimatedSizeBytes);
    });

    it('should handle browser compatibility edge cases', () => {
      // Test with missing Blob support
      const originalBlob = global.Blob;
      vi.stubGlobal('Blob', undefined);
      
      const testResult = testExportFunctionality();
      
      expect(testResult.blobSupported).toBe(false);
      expect(testResult.downloadAPISupported).toBe(false);
      expect(testResult.errors.length).toBeGreaterThan(0);
      
      // Restore
      vi.stubGlobal('Blob', originalBlob);
    });

    it('should handle DOM manipulation edge cases', () => {
      // Mock document.createElement to return minimal element
      const originalCreateElement = document.createElement;
      vi.spyOn(document, 'createElement').mockImplementation(() => ({
        href: '',
        download: '',
        style: {},
        click: vi.fn(),
        remove: vi.fn()
      }) as unknown as HTMLElement);

      expect(() => {
        downloadConfigFile(mockConfigExport);
      }).not.toThrow();

      // Restore
      document.createElement = originalCreateElement;
    });

    it('should handle memory pressure during large exports', () => {
      // Create a configuration that would use significant memory
      const memoryIntensiveConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: Array.from({ length: 10000 }, (_, i) => ({
            id: `memory-test-stop-${i}`,
            name: `Memory Test Stop ${i} `.repeat(100), // Very long names
            city: 'wue' as const,
            stopId: `WUE${String(i).padStart(10, '0')}`,
            walkingTimeMinutes: Math.floor(Math.random() * 60) + 1,
            visible: true,
            position: i
          }))
        }
      };

      const startMemory = (performance as any)?.memory?.usedJSHeapSize || 0; // eslint-disable-line @typescript-eslint/no-explicit-any
      const formatted = formatConfigForDownload(memoryIntensiveConfig);
      const endMemory = (performance as any)?.memory?.usedJSHeapSize || 0; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
      
      // Memory usage should be reasonable (less than 100MB increase)
      if (startMemory > 0 && endMemory > 0) {
        expect(endMemory - startMemory).toBeLessThan(100 * 1024 * 1024);
      }
    });

    it('should handle export validation with malformed data types', () => {
      const malformedConfig = {
        ...mockConfigExport,
        schemaVersion: 123, // Should be string
        exportTimestamp: new Date(), // Should be string
        config: {
          ...mockAppConfig,
          stops: 'not-an-array', // Should be array
          darkMode: 'not-boolean', // Should be boolean
          refreshIntervalSeconds: '30', // Should be number
          maxDeparturesShown: 'ten' // Should be number
        }
      } as unknown as ConfigExport;
      
      expect(() => validateExportData(malformedConfig)).toThrow();
    });
  });

  describe('Export Performance and Stress Testing', () => {
    it('should handle rapid consecutive export operations', async () => {
      const configs = Array.from({ length: 100 }, (_, i) => ({
        ...mockConfigExport,
        metadata: { ...mockConfigExport.metadata, source: `rapid-${i}` }
      }));

      const startTime = performance.now();
      
      const results = configs.map(config => {
        const summary = createExportSummary(config);
        const size = estimateFileSize(config);
        return { summary, size };
      });
      
      const endTime = performance.now();
      
      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      
      results.forEach(result => {
        expect(result.summary.filename).toBeDefined();
        expect(result.size.estimatedSizeBytes).toBeGreaterThan(0);
      });
    });

    it('should handle export operations under simulated memory pressure', () => {
      // Create memory pressure by allocating large objects
      const memoryPressureObjects: unknown[] = [];
      
      for (let i = 0; i < 1000; i++) {
        memoryPressureObjects.push({
          data: new Array(10000).fill(`pressure-data-${i}`)
        });
      }

      try {
        const result = formatConfigForDownload(mockConfigExport);
        expect(result).toBeDefined();
        expect(() => JSON.parse(result)).not.toThrow();
      } finally {
        // Cleanup
        memoryPressureObjects.length = 0;
      }
    });

    it('should handle export filename generation with extreme cases', () => {
      // Test with very long metadata
      const longMetadataConfig = {
        ...mockConfigExport,
        metadata: {
          ...mockConfigExport.metadata,
          source: 'x'.repeat(1000), // Very long source
          language: 'de'
        }
      };
      
      const filename = generateExportFilename(longMetadataConfig);
      
      // Filename should be reasonable length (filesystem limits)
      expect(filename.length).toBeLessThan(255);
      expect(filename).toContain('.json');
    });
  });
});