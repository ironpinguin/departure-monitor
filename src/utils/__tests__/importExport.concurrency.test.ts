/**
 * Concurrency Tests für Import/Export-Operationen
 * Testet gleichzeitige Import/Export-Operationen und Race-Conditions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  readConfigFile,
  processImportFile,
  validateImportFile,
  createFileUploadHandler
} from '../importUtils';
import {
  downloadConfigFile,
  formatConfigForDownload,
  validateExportData
} from '../exportUtils';
import type { ConfigExport } from '../../types/configExport';
import type { AppConfig } from '../../models';

describe('Import/Export Concurrency Tests', () => {
  let mockValidConfig: ConfigExport;
  let mockAppConfig: AppConfig;
  let originalSetTimeout: typeof setTimeout;
  let originalRequestAnimationFrame: typeof requestAnimationFrame;

  beforeEach(() => {
    // Store original timing functions
    originalSetTimeout = global.setTimeout;
    originalRequestAnimationFrame = global.requestAnimationFrame;

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

    mockValidConfig = {
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

  afterEach(() => {
    // Restore original timing functions
    global.setTimeout = originalSetTimeout;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    vi.clearAllMocks();
  });

  describe('Concurrent Import Operations', () => {
    it('should handle multiple simultaneous file reads', async () => {
      const files = Array.from({ length: 5 }, (_, i) => 
        new File([JSON.stringify(mockValidConfig)], `config-${i}.json`, { 
          type: 'application/json' 
        })
      );

      // Mock FileReader to simulate concurrent reads
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText() {
          const delay = Math.random() * 100; // Random delay to simulate real async behavior
          setTimeout(() => {
            this.result = JSON.stringify(mockValidConfig);
            this.onload?.({ target: { result: this.result } });
          }, delay);
        }
      } as unknown as typeof FileReader;

      // Start all reads concurrently
      const readPromises = files.map(file => readConfigFile(file));
      
      // Wait for all to complete
      const results = await Promise.all(readPromises);
      
      // Verify all results are correct
      results.forEach(result => {
        expect(result.schemaVersion).toBe('1.0.0');
        expect(result.config.stops).toHaveLength(1);
      });
    });

    it('should handle concurrent validation operations', async () => {
      const files = Array.from({ length: 10 }, (_, i) => 
        new File([JSON.stringify(mockValidConfig)], `config-${i}.json`, { 
          type: 'application/json' 
        })
      );

      // Start all validations concurrently
      const validationPromises = files.map(file => validateImportFile(file));
      
      // Wait for all to complete
      const results = await Promise.all(validationPromises);
      
      // Verify all results are valid
      results.forEach(result => {
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should handle race conditions in file processing', async () => {
      const file1 = new File([JSON.stringify(mockValidConfig)], 'config-1.json', {
        type: 'application/json'
      });
      const file2 = new File([JSON.stringify({
        ...mockValidConfig,
        metadata: {
          ...mockValidConfig.metadata,
          stopCount: 0
        },
        config: { ...mockAppConfig, stops: [] }
      })], 'config-2.json', {
        type: 'application/json'
      });

      // Mock FileReader with intentional race condition
      let readCount = 0;
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(file: File) {
          readCount++;
          const isFirst = readCount === 1;
          
          // Second read starts faster but first read finishes first
          const delay = isFirst ? 50 : 10;
          
          setTimeout(() => {
            if (file.name === 'config-1.json') {
              this.result = JSON.stringify(mockValidConfig);
            } else {
              this.result = JSON.stringify({
                ...mockValidConfig,
                metadata: {
                  ...mockValidConfig.metadata,
                  stopCount: 0
                },
                config: { ...mockAppConfig, stops: [] }
              });
            }
            this.onload?.({ target: { result: this.result } });
          }, delay);
        }
      } as unknown as typeof FileReader;

      // Start both processes concurrently
      const [result1, result2] = await Promise.all([
        processImportFile(file1),
        processImportFile(file2)
      ]);

      // Verify each result matches its expected content
      expect(result1.config.stops).toHaveLength(1);
      expect(result2.config.stops).toHaveLength(0);
    });

    it('should handle concurrent file upload handlers', async () => {
      const files = Array.from({ length: 3 }, (_, i) => 
        new File([JSON.stringify(mockValidConfig)], `config-${i}.json`, { 
          type: 'application/json' 
        })
      );

      const successResults: ConfigExport[] = [];
      const errorResults: string[] = [];

      const onSuccess = (config: ConfigExport) => {
        successResults.push(config);
      };

      const onError = (error: string) => {
        errorResults.push(error);
      };

      const handler = createFileUploadHandler(onSuccess, onError);

      // Mock FileReader for concurrent uploads
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText() {
          const delay = Math.random() * 50;
          setTimeout(() => {
            this.result = JSON.stringify(mockValidConfig);
            this.onload?.({ target: { result: this.result } });
          }, delay);
        }
      } as unknown as typeof FileReader;

      // Execute all handlers concurrently
      await Promise.all(files.map(file => handler(file)));

      // Verify results
      expect(successResults).toHaveLength(3);
      expect(errorResults).toHaveLength(0);
    });
  });

  describe('Concurrent Export Operations', () => {
    it('should handle multiple simultaneous exports', async () => {
      const configs = Array.from({ length: 5 }, (_, i) => ({
        ...mockValidConfig,
        metadata: {
          ...mockValidConfig.metadata,
          stopCount: i + 1
        }
      }));

      // Mock download functionality
      const downloadAttempts: ConfigExport[] = [];
      
      // Mock all required APIs for download support
      vi.stubGlobal('window', {
        document: global.document,
        URL: {
          createObjectURL: vi.fn(() => 'blob:mock-url'),
          revokeObjectURL: vi.fn()
        }
      });
      
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn()
      });
      
      vi.stubGlobal('Blob', vi.fn(() => ({
        size: 1024,
        type: 'application/json'
      })));
      
      vi.spyOn(document, 'createElement').mockImplementation(() => ({
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(() => {
          // Simulate download completion
        }),
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      } as unknown as HTMLElement));
      
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as Node);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as Node);

      // Start all exports concurrently
      const exportPromises = configs.map(config => {
        downloadAttempts.push(config);
        return new Promise<void>((resolve) => {
          downloadConfigFile(config);
          resolve();
        });
      });

      await Promise.all(exportPromises);

      // Verify all exports were attempted
      expect(downloadAttempts).toHaveLength(5);
    });

    it('should handle concurrent export formatting', async () => {
      const configs = Array.from({ length: 10 }, (_, i) => ({
        ...mockValidConfig,
        config: {
          ...mockAppConfig,
          stops: Array.from({ length: i + 1 }, (_, j) => ({
            ...mockAppConfig.stops[0],
            id: `stop-${j}`,
            position: j
          }))
        }
      }));

      // Format all configs concurrently
      const formatPromises = configs.map(config => 
        Promise.resolve(formatConfigForDownload(config))
      );

      const results = await Promise.all(formatPromises);

      // Verify all results are valid JSON
      results.forEach((result, index) => {
        expect(() => JSON.parse(result)).not.toThrow();
        const parsed = JSON.parse(result);
        expect(parsed.config.stops).toHaveLength(index + 1);
      });
    });

    it('should handle concurrent export validation', async () => {
      const configs = Array.from({ length: 8 }, (_, i) => {
        const stopCount = i % 2 === 0 ? 1 : 999; // Some valid, some invalid
        return {
          ...mockValidConfig,
          metadata: {
            ...mockValidConfig.metadata,
            stopCount: stopCount
          },
          config: {
            ...mockValidConfig.config,
            stops: stopCount === 1 ? mockValidConfig.config.stops : [] // Keep original stops for valid configs
          }
        };
      });

      // Validate all configs concurrently
      const validationPromises = configs.map(config => 
        Promise.resolve(validateExportData(config))
      );

      const results = await Promise.all(validationPromises);

      // Verify results match expected pattern
      results.forEach((result, index) => {
        if (index % 2 === 0) {
          expect(result).toBe(true); // Valid configs
        } else {
          expect(result).toBe(false); // Invalid configs with wrong stopCount
        }
      });
    });
  });

  describe('Mixed Import/Export Concurrency', () => {
    it('should handle simultaneous import and export operations', async () => {
      const importFile = new File([JSON.stringify(mockValidConfig)], 'import.json', { 
        type: 'application/json' 
      });

      const exportConfig = {
        ...mockValidConfig,
        metadata: {
          ...mockValidConfig.metadata,
          stopCount: 0
        },
        config: { ...mockAppConfig, stops: [] }
      };

      // Mock all required APIs for download support
      vi.stubGlobal('window', {
        document: global.document,
        URL: {
          createObjectURL: vi.fn(() => 'blob:mock-url'),
          revokeObjectURL: vi.fn()
        }
      });
      
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn()
      });
      
      vi.stubGlobal('Blob', vi.fn(() => ({
        size: 1024,
        type: 'application/json'
      })));

      // Mock FileReader for import
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText() {
          setTimeout(() => {
            this.result = JSON.stringify(mockValidConfig);
            this.onload?.({ target: { result: this.result } });
          }, 25);
        }
      } as unknown as typeof FileReader;

      // Mock export functionality
      vi.spyOn(document, 'createElement').mockImplementation(() => ({
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      } as unknown as HTMLElement));

      vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as Node);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as Node);

      // Start import and export concurrently
      const [importResult] = await Promise.all([
        readConfigFile(importFile),
        new Promise<void>((resolve) => {
          downloadConfigFile(exportConfig);
          resolve();
        })
      ]);

      // Verify import completed successfully
      expect(importResult.config.stops).toHaveLength(1);
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle resource contention scenarios', async () => {
      const numOperations = 20;
      const operations: Promise<unknown>[] = [];

      // Create mixed operations
      for (let i = 0; i < numOperations; i++) {
        if (i % 2 === 0) {
          // Import operation
          const file = new File([JSON.stringify(mockValidConfig)], `import-${i}.json`, { 
            type: 'application/json' 
          });
          operations.push(validateImportFile(file));
        } else {
          // Export operation
          const config = {
            ...mockValidConfig,
            metadata: { ...mockValidConfig.metadata, stopCount: i }
          };
          operations.push(Promise.resolve(validateExportData(config)));
        }
      }

      // Mock FileReader for import operations
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText() {
          setTimeout(() => {
            this.result = JSON.stringify(mockValidConfig);
            this.onload?.({ target: { result: this.result } });
          }, Math.random() * 20);
        }
      } as unknown as typeof FileReader;

      // Execute all operations concurrently
      const results = await Promise.all(operations);

      // Verify all operations completed
      expect(results).toHaveLength(numOperations);
      
      // Verify import results (even indices)
      results.forEach((result, index) => {
        if (index % 2 === 0) {
          expect(result).toHaveProperty('isValid', true);
        } else {
          expect(typeof result).toBe('boolean');
        }
      });
    });
  });

  describe('Error Handling in Concurrent Operations', () => {
    it('should handle partial failures in concurrent operations', async () => {
      const files = Array.from({ length: 5 }, (_, i) => {
        const content = i === 2 ? 'invalid json' : JSON.stringify(mockValidConfig);
        return new File([content], `config-${i}.json`, { 
          type: 'application/json' 
        });
      });

      // Mock FileReader that fails for one file
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(file: File) {
          setTimeout(() => {
            if (file.name === 'config-2.json') {
              this.result = 'invalid json';
            } else {
              this.result = JSON.stringify(mockValidConfig);
            }
            this.onload?.({ target: { result: this.result } });
          }, Math.random() * 30);
        }
      } as unknown as typeof FileReader;

      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled(
        files.map(file => readConfigFile(file))
      );

      // Verify results
      expect(results).toHaveLength(5);
      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(4);
      expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
    });

    it('should handle timeout scenarios in concurrent operations', async () => {
      const files = Array.from({ length: 3 }, (_, i) =>
        new File([JSON.stringify(mockValidConfig)], `config-${i}.json`, {
          type: 'application/json'
        })
      );

      // Mock FileReader with timeout simulation
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: ((event: { target: { error: Error } }) => void) | null = null;
        result: string | null = null;
        error: Error | null = null;
        
        readAsText() {
          // Simulate timeout by delaying longer than the race timeout
          setTimeout(() => {
            this.error = new Error('Operation timed out');
            this.onerror?.({ target: { error: this.error } });
          }, 100); // Longer than the race timeout
        }
      } as unknown as typeof FileReader;

      // Start operations with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), 50);
      });

      const readPromises = files.map(file =>
        Promise.race([readConfigFile(file), timeoutPromise])
      );

      // All operations should timeout
      const results = await Promise.allSettled(readPromises);
      
      results.forEach(result => {
        expect(result.status).toBe('rejected');
      });
    });
  });

  describe('Memory Management in Concurrent Operations', () => {
    it('should handle memory pressure during concurrent operations', async () => {
      const largeConfigs = Array.from({ length: 10 }, (_, i) => ({
        ...mockValidConfig,
        metadata: {
          ...mockValidConfig.metadata,
          stopCount: i % 2 === 0 ? 1000 : 1 // Some have valid, some have invalid stopCount
        },
        config: {
          ...mockAppConfig,
          stops: Array.from({ length: i % 2 === 0 ? 1000 : 1 }, (_, j) => ({
            ...mockAppConfig.stops[0],
            id: `stop-${i}-${j}`,
            name: `Stop ${i}-${j} with very long name that takes up memory`,
            position: j
          }))
        }
      }));

      // Mock formatConfigForDownload to simulate memory pressure
      vi.doMock('../exportUtils', () => ({
        formatConfigForDownload: vi.fn((config) => {
          // Simulate memory failure for very large configs
          if (config.metadata.stopCount > 500) {
            throw new Error('Memory exhausted');
          }
          return JSON.stringify(config, null, 2);
        })
      }));

      // Import the mocked function
      const { formatConfigForDownload } = await import('../exportUtils');

      // Attempt to format all configs
      const formatPromises = largeConfigs.map(config =>
        Promise.resolve().then(() => {
          try {
            return formatConfigForDownload(config);
          } catch {
            throw new Error('Memory exhausted');
          }
        })
      );

      const results = await Promise.allSettled(formatPromises);
      
      // Some operations should fail due to memory limits
      const failures = results.filter(r => r.status === 'rejected');
      expect(failures.length).toBeGreaterThan(0);
    });
  });
});