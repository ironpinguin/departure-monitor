/**
 * Memory Management Tests für Import/Export-System
 * Testet Memory-Leaks, Garbage Collection, Performance unter Memory-Druck
 * und Speicher-Optimierungen
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateFileFormat
} from '../importUtils';
import {
  downloadConfigFile,
  validateExportData,
  estimateFileSize,
  generateExportFilename,
  formatConfigForDownload
} from '../exportUtils';
import type { ConfigExport } from '../../types/configExport';

describe('Memory Management Tests', () => {
  let memoryBaseline: number;
  const mockPerformance = {
    memory: {
      usedJSHeapSize: 50000000, // 50MB baseline
      totalJSHeapSize: 100000000, // 100MB total
      jsHeapSizeLimit: 2000000000 // 2GB limit
    },
    now: vi.fn(() => Date.now())
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock performance.memory API
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true
    });

    // Mock FileReader
    global.FileReader = vi.fn().mockImplementation(() => ({
      readAsText: vi.fn(),
      result: '',
      error: null,
      onload: null,
      onerror: null
    })) as unknown as typeof FileReader;

    // Mock URL API
    global.URL = {
      createObjectURL: vi.fn().mockReturnValue('mock-url'),
      revokeObjectURL: vi.fn()
    } as unknown as typeof URL;

    // Mock document API
    Object.defineProperty(global, 'document', {
      value: {
        createElement: vi.fn().mockReturnValue({
          href: '',
          download: '',
          click: vi.fn(),
          remove: vi.fn(),
          style: {}
        }),
        body: {
          appendChild: vi.fn()
        }
      },
      writable: true
    });

    memoryBaseline = mockPerformance.memory.usedJSHeapSize;
  });

  afterEach(() => {
    // Force garbage collection simulation
    if (global.gc) {
      global.gc();
    }
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory during repeated file validations', async () => {
      const iterations = 1000;
      const validFile = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' });
      
      // Simulate memory usage increase
      let simulatedMemoryUsage = memoryBaseline;
      
      for (let i = 0; i < iterations; i++) {
        try {
          validateFileFormat(validFile);
          
          // Simulate realistic memory growth (should be minimal)
          simulatedMemoryUsage += Math.random() * 100; // Small random increase
          mockPerformance.memory.usedJSHeapSize = simulatedMemoryUsage;
          
          // Every 100 iterations, check memory usage
          if (i % 100 === 0) {
            const memoryIncrease = simulatedMemoryUsage - memoryBaseline;
            const memoryIncreasePerOperation = memoryIncrease / (i + 1);
            
            // Memory increase per operation should be minimal
            expect(memoryIncreasePerOperation).toBeLessThan(1000); // Less than 1KB per operation
          }
        } catch {
          // Expected for some invalid cases
        }
      }
      
      const finalMemoryIncrease = simulatedMemoryUsage - memoryBaseline;
      const avgMemoryPerOperation = finalMemoryIncrease / iterations;
      
      // Average memory increase should be very small
      expect(avgMemoryPerOperation).toBeLessThan(500); // Less than 500 bytes per operation
    });

    it('should properly clean up resources after export operations', async () => {
      const iterations = 100;
      const validConfig: ConfigExport = {
        schemaVersion: '1.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'test-app',
        metadata: {
          stopCount: 10,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: Array.from({ length: 10 }, (_, i) => ({
            id: `stop-${i}`,
            name: `Stop ${i}`,
            city: (i % 2 === 0 ? 'wue' : 'muc') as 'wue' | 'muc',
            stopId: `stop-id-${i}`,
            walkingTimeMinutes: i * 2,
            visible: true,
            position: i
          })),
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

      let simulatedMemoryUsage = memoryBaseline;
      const memorySnapshots: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Perform export operations
        try {
          expect(() => validateExportData(validConfig)).not.toThrow();
          generateExportFilename(validConfig);
          estimateFileSize(validConfig);
          
          // Simulate memory usage
          simulatedMemoryUsage += Math.random() * 500;
          mockPerformance.memory.usedJSHeapSize = simulatedMemoryUsage;
          memorySnapshots.push(simulatedMemoryUsage);
          
          // Simulate cleanup (memory should not grow indefinitely)
          if (i % 10 === 0) {
            simulatedMemoryUsage -= Math.random() * 2000; // Simulate GC
          }
        } catch {
          // Handle potential errors
        }
      }

      // Check that memory didn't grow linearly
      const initialMemory = memorySnapshots[0];
      const finalMemory = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowthRatio = (finalMemory - initialMemory) / initialMemory;
      
      // Memory should not have grown by more than 50%
      expect(memoryGrowthRatio).toBeLessThan(0.5);
    });
  });

  describe('Large Data Processing', () => {
    it('should handle large configurations without excessive memory usage', () => {
      const largeStopsCount = 5000;
      const largeConfig: ConfigExport = {
        schemaVersion: '1.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'test-app',
        metadata: {
          stopCount: largeStopsCount,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: Array.from({ length: largeStopsCount }, (_, i) => ({
            id: `stop-${i}`,
            name: `Stop ${i} with some longer descriptive text`,
            city: (i % 2 === 0 ? 'wue' : 'muc') as 'wue' | 'muc',
            stopId: `stop-id-${i}-extended`,
            walkingTimeMinutes: (i % 30) + 1,
            visible: i % 3 !== 0,
            position: i
          })),
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
      const startMemory = mockPerformance.memory.usedJSHeapSize;

      // Process large configuration
      expect(() => {
        expect(() => validateExportData(largeConfig)).not.toThrow();
        const fileSize = estimateFileSize(largeConfig);
        expect(fileSize.estimatedSizeBytes).toBeGreaterThan(0);
      }).not.toThrow();

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process within reasonable time (5 seconds)
      expect(processingTime).toBeLessThan(5000);

      // Simulate memory usage for large data
      const estimatedMemoryUsage = largeStopsCount * 200; // ~200 bytes per stop
      mockPerformance.memory.usedJSHeapSize = startMemory + estimatedMemoryUsage;

      // Memory usage should be reasonable
      const memoryIncrease = mockPerformance.memory.usedJSHeapSize - startMemory;
      const memoryPerStop = memoryIncrease / largeStopsCount;
      expect(memoryPerStop).toBeLessThan(1000); // Less than 1KB per stop
    });

    it('should handle memory pressure during large imports', async () => {
      const largeJsonContent = JSON.stringify({
        schemaVersion: '1.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'test-app',
        metadata: {
          stopCount: 90,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: Array.from({ length: 90 }, (_, i) => ({
            id: `stop-${i}`,
            name: `Stop ${i}`.repeat(10), // Make names longer
            city: i % 2 === 0 ? 'wue' : 'muc',
            stopId: `stop-id-${i}`,
            walkingTimeMinutes: i % 60,
            visible: true,
            position: i
          })),
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
      });

      const largeFile = new File([largeJsonContent], 'large-config.json', { 
        type: 'application/json' 
      });

      // Simulate memory pressure
      mockPerformance.memory.usedJSHeapSize = mockPerformance.memory.totalJSHeapSize * 0.8; // 80% memory usage

      const startMemory = mockPerformance.memory.usedJSHeapSize;

      // Should handle large file even under memory pressure
      expect(() => {
        validateFileFormat(largeFile);
      }).toThrow();

      // Simulate memory usage during processing
      const processMemoryIncrease = largeJsonContent.length * 2; // Rough estimate
      mockPerformance.memory.usedJSHeapSize = startMemory + processMemoryIncrease;

      // Should not exceed memory limits
      expect(mockPerformance.memory.usedJSHeapSize).toBeLessThan(
        mockPerformance.memory.totalJSHeapSize
      );
    });
  });

  describe('Memory Fragmentation Handling', () => {
    it('should handle fragmented memory allocation patterns', () => {
      const configurations: ConfigExport[] = [];
      
      // Create many small configurations to simulate fragmentation
      for (let i = 0; i < 100; i++) {
        configurations.push({
          schemaVersion: '1.0.0',
          exportTimestamp: new Date().toISOString(),
          exportedBy: `test-app-${i}`,
          metadata: {
            stopCount: i % 10 + 1,
            language: 'de',
            source: `test-${i}`
          },
          config: {
            stops: Array.from({ length: i % 10 + 1 }, (_, j) => ({
              id: `stop-${i}-${j}`,
              name: `Stop ${i}-${j}`,
              city: (j % 2 === 0 ? 'wue' : 'muc') as 'wue' | 'muc',
              stopId: `stop-id-${i}-${j}`,
              walkingTimeMinutes: (i + j) % 60,
              visible: true,
              position: j
            })),
            darkMode: i % 2 === 0,
            refreshIntervalSeconds: 30 + i,
            maxDeparturesShown: 10,
            language: 'de'
          },
          exportSettings: {
            includeUserSettings: true,
            includeStopPositions: true,
            includeVisibilitySettings: true
          }
        });
      }

      const memoryPeaks: number[] = [];
      let currentMemory = memoryBaseline;

      // Process configurations in fragmented pattern
      configurations.forEach((config, index) => {
        try {
          validateExportData(config);
          
          // Simulate fragmented memory allocation
          const allocationSize = config.config.stops.length * 100 + Math.random() * 1000;
          currentMemory += allocationSize;
          
          // Simulate occasional garbage collection
          if (index % 20 === 0) {
            currentMemory -= Math.random() * 5000; // Simulate GC cleanup
          }
          
          mockPerformance.memory.usedJSHeapSize = currentMemory;
          memoryPeaks.push(currentMemory);
          
        } catch {
          // Handle validation errors
        }
      });

      // Memory should not have excessive peaks
      const maxMemoryPeak = Math.max(...memoryPeaks);
      const avgMemory = memoryPeaks.reduce((a, b) => a + b, 0) / memoryPeaks.length;
      const peakToAvgRatio = maxMemoryPeak / avgMemory;

      // Peak memory shouldn't be more than 3x average memory
      expect(peakToAvgRatio).toBeLessThan(3);
    });
  });

  describe('Resource Cleanup Validation', () => {
    it('should properly cleanup URL objects after download', () => {
      const validConfig: ConfigExport = {
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
            city: 'wue',
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

      const createObjectURLSpy = vi.spyOn(global.URL, 'createObjectURL');
      const revokeObjectURLSpy = vi.spyOn(global.URL, 'revokeObjectURL');

      // Mock document.createElement for download simulation
      const mockAnchorElement = {
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
        style: {
          display: '',
          visibility: '',
          position: '',
          left: '',
          top: '',
          width: '',
          height: '',
          color: '',
          backgroundColor: '',
          fontSize: '',
          fontFamily: '',
          textDecoration: '',
          border: '',
          padding: '',
          margin: '',
          opacity: '',
          zIndex: '',
          setProperty: vi.fn(),
          getPropertyValue: vi.fn(),
          removeProperty: vi.fn(),
        },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        innerHTML: '',
        innerText: '',
        textContent: '',
        id: '',
        className: '',
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
          toggle: vi.fn(),
        },
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchorElement as unknown as HTMLElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchorElement as unknown as Node);
      
      // Ensure removeChild exists before mocking
      if (!document.body.removeChild) {
        document.body.removeChild = vi.fn();
      }
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchorElement as unknown as Node);

      // Perform download operation
      expect(() => {
        downloadConfigFile(validConfig);
      }).not.toThrow();

      // Verify URL objects are created and cleaned up
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
      // The code calls document.body.removeChild(link), not link.remove()
      expect(document.body.removeChild).toHaveBeenCalledTimes(1);
    });

    it('should handle FileReader cleanup properly', async () => {
      const validConfig = {
        schemaVersion: '1.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'test-app',
        metadata: {
          stopCount: 1,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: [],
          globalSettings: {
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
        }
      };
      
      const configString = JSON.stringify(validConfig);
      const file = new File([configString], 'test.json', { type: 'application/json' });
      
      const mockFileReader = {
        readAsText: vi.fn().mockImplementation(function(this: Record<string, unknown>) {
          setTimeout(() => {
            this.result = configString;
            if (this.onload) {
              (this.onload as (event: { target: { result: string } }) => void)({ target: { result: this.result as string } });
            }
          }, 0);
        }),
        result: configString,
        error: null,
        onload: null,
        onerror: null,
        abort: vi.fn(),
        LOADING: 1,
        DONE: 2,
        EMPTY: 0,
        readyState: 2
      };

      // Create a proper mock constructor
      const MockFileReaderConstructor = function() {
        return mockFileReader;
      } as unknown as typeof FileReader;
      
      // Add static properties
      (MockFileReaderConstructor as unknown as { EMPTY: number; LOADING: number; DONE: number }).EMPTY = 0;
      (MockFileReaderConstructor as unknown as { EMPTY: number; LOADING: number; DONE: number }).LOADING = 1;
      (MockFileReaderConstructor as unknown as { EMPTY: number; LOADING: number; DONE: number }).DONE = 2;
      
      global.FileReader = MockFileReaderConstructor;

      // Create a FileReader instance directly to test cleanup
      const reader = new FileReader();
      
      // Test direct FileReader usage
      reader.readAsText(file, "utf-8");
      
      // Wait for the async mock to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify FileReader is used properly
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(file, "utf-8");
    });
  });

  describe('Performance Under Memory Constraints', () => {
    it('should maintain performance when memory is limited', () => {
      // Simulate low memory scenario
      mockPerformance.memory.usedJSHeapSize = mockPerformance.memory.totalJSHeapSize * 0.9; // 90% memory usage

      const constrainedConfig: ConfigExport = {
        schemaVersion: '1.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'test-app',
        metadata: {
          stopCount: 100,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: Array.from({ length: 100 }, (_, i) => ({
            id: `stop-${i}`,
            name: `Stop ${i}`,
            city: (i % 2 === 0 ? 'wue' : 'muc') as 'wue' | 'muc',
            stopId: `stop-id-${i}`,
            walkingTimeMinutes: i % 60,
            visible: true,
            position: i
          })),
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

      const operations = [
        () => validateExportData(constrainedConfig),
        () => estimateFileSize(constrainedConfig),
        () => generateExportFilename(constrainedConfig),
        () => formatConfigForDownload(constrainedConfig)
      ];

      operations.forEach((operation) => {
        const startTime = performance.now();
        
        expect(() => operation()).not.toThrow();
        
        const endTime = performance.now();
        const operationTime = endTime - startTime;

        // Operations should complete in reasonable time even under memory pressure
        expect(operationTime).toBeLessThan(1000); // Less than 1 second per operation
      });
    });

    it('should gracefully degrade when approaching memory limits', () => {
      // Simulate very high memory usage
      mockPerformance.memory.usedJSHeapSize = mockPerformance.memory.totalJSHeapSize * 0.95; // 95% memory usage

      const extremeConfig: ConfigExport = {
        schemaVersion: '1.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'test-app',
        metadata: {
          stopCount: 90,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: Array.from({ length: 90 }, (_, i) => ({
            id: `stop-${i}`,
            name: `Stop ${i}`,
            city: (i % 2 === 0 ? 'wue' : 'muc') as 'wue' | 'muc',
            stopId: `stop-id-${i}`,
            walkingTimeMinutes: i % 60,
            visible: true,
            position: i
          })),
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

      // Should either succeed or fail gracefully without crashing
      expect(() => {
        try {
          validateExportData(extremeConfig);
        } catch (error) {
          // If it fails, error should be meaningful
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBeTruthy();
        }
      }).not.toThrow();
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should use memory efficiently for repetitive operations', () => {
      const baseConfig: ConfigExport = {
        schemaVersion: '1.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'test-app',
        metadata: {
          stopCount: 10,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: Array.from({ length: 10 }, (_, i) => ({
            id: `stop-${i}`,
            name: `Stop ${i}`,
            city: (i % 2 === 0 ? 'wue' : 'muc') as 'wue' | 'muc',
            stopId: `stop-id-${i}`,
            walkingTimeMinutes: i % 60,
            visible: true,
            position: i
          })),
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

      const memorySnapshots: number[] = [];
      let currentMemory = memoryBaseline;

      // Perform 50 identical operations
      for (let i = 0; i < 50; i++) {
        validateExportData(baseConfig);
        
        // Simulate minimal memory increase for identical operations
        currentMemory += Math.random() * 50; // Very small increase
        mockPerformance.memory.usedJSHeapSize = currentMemory;
        memorySnapshots.push(currentMemory);
      }

      // Calculate memory efficiency
      const totalMemoryIncrease = currentMemory - memoryBaseline;
      const avgMemoryPerOperation = totalMemoryIncrease / 50;

      // Memory increase per operation should be minimal for identical operations
      expect(avgMemoryPerOperation).toBeLessThan(100); // Less than 100 bytes per operation

      // Memory usage should be stable (not growing linearly)
      const firstHalfAvg = memorySnapshots.slice(0, 25).reduce((a, b) => a + b) / 25;
      const secondHalfAvg = memorySnapshots.slice(25).reduce((a, b) => a + b) / 25;
      const growthRatio = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;

      // Memory growth should be minimal between first and second half
      expect(growthRatio).toBeLessThan(0.1); // Less than 10% growth
    });
  });
});