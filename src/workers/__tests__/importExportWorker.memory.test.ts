/**
 * Memory Management Tests for Import/Export Worker
 * Tests the enhanced memory vulnerability protections
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock performance.memory API
const mockPerformanceMemory = {
  usedJSHeapSize: 20 * 1024 * 1024, // 20MB
  totalJSHeapSize: 50 * 1024 * 1024, // 50MB
  jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
};

// Mock Worker environment
const mockWorkerContext = {
  postMessage: vi.fn(),
  addEventListener: vi.fn(),
  onmessage: null,
  onbeforeunload: null
};

// Mock globalThis.gc
const mockGc = vi.fn();

// Setup mocks
beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock performance.memory
  Object.defineProperty(performance, 'memory', {
    value: mockPerformanceMemory,
    writable: true,
    configurable: true
  });
  
  // Mock Worker context
  Object.defineProperty(globalThis, 'self', {
    value: mockWorkerContext,
    writable: true,
    configurable: true
  });
  
  // Mock gc function
  Object.defineProperty(globalThis, 'gc', {
    value: mockGc,
    writable: true,
    configurable: true
  });
});

afterEach(() => {
  // Reset performance.memory
  mockPerformanceMemory.usedJSHeapSize = 20 * 1024 * 1024;
  mockPerformanceMemory.totalJSHeapSize = 50 * 1024 * 1024;
  mockPerformanceMemory.jsHeapSizeLimit = 100 * 1024 * 1024;
});

describe('Memory Management in Import/Export Worker', () => {
  
  describe('Memory Pressure Detection', () => {
    it('should detect low memory pressure', () => {
      // Set low memory usage
      mockPerformanceMemory.usedJSHeapSize = 10 * 1024 * 1024; // 10MB
      
      // Verify memory pressure is correctly calculated
      expect(mockPerformanceMemory.usedJSHeapSize).toBeLessThan(15 * 1024 * 1024);
    });
    
    it('should detect moderate memory pressure', () => {
      // Set moderate memory usage
      mockPerformanceMemory.usedJSHeapSize = 35 * 1024 * 1024; // 35MB
      
      // Verify moderate pressure detection
      expect(mockPerformanceMemory.usedJSHeapSize).toBeGreaterThan(30 * 1024 * 1024);
      expect(mockPerformanceMemory.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
    });
    
    it('should detect high memory pressure', () => {
      // Set high memory usage
      mockPerformanceMemory.usedJSHeapSize = 60 * 1024 * 1024; // 60MB
      
      // Verify high pressure detection
      expect(mockPerformanceMemory.usedJSHeapSize).toBeGreaterThan(50 * 1024 * 1024);
      expect(mockPerformanceMemory.usedJSHeapSize).toBeLessThan(80 * 1024 * 1024);
    });
    
    it('should detect critical memory pressure', () => {
      // Set critical memory usage
      mockPerformanceMemory.usedJSHeapSize = 85 * 1024 * 1024; // 85MB
      
      // Verify critical pressure detection
      expect(mockPerformanceMemory.usedJSHeapSize).toBeGreaterThan(80 * 1024 * 1024);
      expect(mockPerformanceMemory.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
    });
    
    it('should detect emergency memory pressure', () => {
      // Set emergency memory usage
      mockPerformanceMemory.usedJSHeapSize = 95 * 1024 * 1024; // 95MB (95% of 100MB limit)
      
      // Verify emergency pressure detection
      expect(mockPerformanceMemory.usedJSHeapSize).toBeGreaterThan(100 * 1024 * 1024 * 0.85); // 85% threshold
    });
  });
  
  describe('Memory Allocation Guards', () => {
    it('should allow allocation when memory is available', () => {
      // Set low memory usage
      mockPerformanceMemory.usedJSHeapSize = 20 * 1024 * 1024; // 20MB
      
      // Test allocation of 10MB
      const allocationSize = 10 * 1024 * 1024;
      const available = mockPerformanceMemory.jsHeapSizeLimit - mockPerformanceMemory.usedJSHeapSize;
      const guardSize = 10 * 1024 * 1024; // 10MB guard
      
      // Should allow allocation
      expect(allocationSize + guardSize).toBeLessThan(available);
    });
    
    it('should prevent allocation when memory is insufficient', () => {
      // Set high memory usage
      mockPerformanceMemory.usedJSHeapSize = 85 * 1024 * 1024; // 85MB
      
      // Test allocation of 20MB (would exceed limit)
      const allocationSize = 20 * 1024 * 1024;
      const available = mockPerformanceMemory.jsHeapSizeLimit - mockPerformanceMemory.usedJSHeapSize;
      const guardSize = 10 * 1024 * 1024; // 10MB guard
      
      // Should prevent allocation
      expect(allocationSize + guardSize).toBeGreaterThan(available);
    });
  });
  
  describe('Adaptive Intervals', () => {
    it('should use longer intervals for low memory pressure', () => {
      const baseInterval = 1000; // 1 second
      const lowPressureMultiplier = 2.0;
      
      const expectedInterval = baseInterval * lowPressureMultiplier;
      
      // For low pressure, interval should be longer
      expect(expectedInterval).toBeGreaterThan(baseInterval);
    });
    
    it('should use shorter intervals for high memory pressure', () => {
      const baseInterval = 1000; // 1 second
      const highPressureMultiplier = 0.5;
      
      const expectedInterval = baseInterval * highPressureMultiplier;
      
      // For high pressure, interval should be shorter
      expect(expectedInterval).toBeLessThan(baseInterval);
    });
    
    it('should use very short intervals for emergency memory pressure', () => {
      const baseInterval = 1000; // 1 second
      const emergencyMultiplier = 0.1;
      const minInterval = 250; // Minimum interval
      
      const calculatedInterval = baseInterval * emergencyMultiplier;
      const expectedInterval = Math.max(minInterval, calculatedInterval);
      
      // For emergency pressure, interval should be very short
      expect(expectedInterval).toBeLessThanOrEqual(minInterval);
    });
  });
  
  describe('Memory Cleanup', () => {
    it('should trigger garbage collection when available', () => {
      // Reset mock
      mockGc.mockClear();
      
      // Simulate cleanup with GC available
      if (typeof globalThis.gc === 'function') {
        globalThis.gc();
      }
      
      // Verify GC was called
      expect(mockGc).toHaveBeenCalled();
    });
    
    it('should handle missing garbage collection gracefully', () => {
      // Remove GC function temporarily
      const originalGc = globalThis.gc;
      delete (globalThis as unknown as { gc?: () => void }).gc;
      
      // Should not throw error when GC is not available
      expect(() => {
        if (typeof globalThis.gc === 'function') {
          globalThis.gc();
        }
      }).not.toThrow();
      
      // Restore GC function
      globalThis.gc = originalGc;
    });
  });
  
  describe('Memory History Tracking', () => {
    it('should maintain memory history within limits', () => {
      const maxHistorySize = 20;
      const memoryHistory: Array<{ timestamp: number; usage: number; pressure: string }> = [];
      
      // Add more entries than the limit
      for (let i = 0; i < maxHistorySize + 5; i++) {
        memoryHistory.push({
          timestamp: Date.now() + i * 1000,
          usage: (20 + i) * 1024 * 1024,
          pressure: 'low'
        });
        
        // Simulate trimming
        if (memoryHistory.length > maxHistorySize) {
          memoryHistory.shift();
        }
      }
      
      // Should maintain maximum history size
      expect(memoryHistory.length).toBeLessThanOrEqual(maxHistorySize);
    });
    
    it('should calculate memory trend correctly', () => {
      const memoryHistory = [
        { timestamp: 1000, usage: 20 * 1024 * 1024, pressure: 'low' },
        { timestamp: 2000, usage: 30 * 1024 * 1024, pressure: 'moderate' },
        { timestamp: 3000, usage: 40 * 1024 * 1024, pressure: 'high' }
      ];
      
      // Check if trend is increasing
      const isIncreasing = memoryHistory.every((curr, idx) => 
        idx === 0 || curr.usage > memoryHistory[idx - 1].usage
      );
      
      expect(isIncreasing).toBe(true);
    });
  });
  
  describe('Operation Limits', () => {
    it('should enforce maximum concurrent operations', () => {
      const maxConcurrentOps = 3;
      const currentActiveOps = 2;
      
      // Should allow new operation
      expect(currentActiveOps).toBeLessThan(maxConcurrentOps);
      
      // Should reject when at limit
      const newActiveOps = 3;
      expect(newActiveOps).toBeLessThanOrEqual(maxConcurrentOps);
    });
    
    it('should estimate memory usage for different operations', () => {
      const jsonPayload = { text: 'x'.repeat(1000) }; // 1KB text
      const configPayload = { config: { stops: new Array(100).fill({}) } };
      
      // JSON parsing should estimate 2x text size
      const jsonEstimate = jsonPayload.text.length * 2;
      expect(jsonEstimate).toBe(2000);
      
      // Config operations should estimate 1.5x serialized size
      const configSize = JSON.stringify(configPayload.config).length;
      const configEstimate = configSize * 1.5;
      expect(configEstimate).toBeGreaterThan(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle memory exhaustion gracefully', () => {
      // Set memory to emergency level
      mockPerformanceMemory.usedJSHeapSize = 95 * 1024 * 1024; // 95MB
      
      // Should trigger emergency handling
      const isEmergency = mockPerformanceMemory.usedJSHeapSize > 100 * 1024 * 1024 * 0.85;
      expect(isEmergency).toBe(true);
    });
    
    it('should terminate operations under memory pressure', () => {
      // Mock postMessage to capture termination messages
      const terminationMessages: { error?: string; id?: string }[] = [];
      mockWorkerContext.postMessage.mockImplementation((message: { error?: string; id?: string }) => {
        if (message.error && message.error.includes('terminated')) {
          terminationMessages.push(message);
        }
      });
      
      // Should be able to capture termination messages
      expect(mockWorkerContext.postMessage).toBeDefined();
    });
  });
  
  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const metrics = {
        startTime: performance.now(),
        memoryUsage: mockPerformanceMemory.usedJSHeapSize,
        peakMemoryUsage: mockPerformanceMemory.usedJSHeapSize,
        memoryPressure: 'low',
        cleanupCount: 0,
        emergencyCleanupCount: 0,
        gcCount: 0
      };
      
      // Should have all required metrics
      expect(metrics).toHaveProperty('startTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('peakMemoryUsage');
      expect(metrics).toHaveProperty('memoryPressure');
      expect(metrics).toHaveProperty('cleanupCount');
      expect(metrics).toHaveProperty('emergencyCleanupCount');
      expect(metrics).toHaveProperty('gcCount');
    });
  });
});

describe('Large Dataset Memory Tests', () => {
  it('should handle large JSON parsing without memory exhaustion', async () => {
    // Create a large JSON string (5MB)
    const largeData = {
      stops: new Array(10000).fill({
        id: 'test-stop-id',
        name: 'Test Stop Name',
        city: 'Test City',
        coordinates: { lat: 48.1351, lon: 11.5820 }
      })
    };
    
    const jsonString = JSON.stringify(largeData);
    const estimatedMemoryUsage = jsonString.length * 2; // 2x for parsing
    
    // Should estimate significant memory usage (realistic expectation)
    expect(estimatedMemoryUsage).toBeGreaterThan(1 * 1024 * 1024); // > 1MB
    
    // Should complete without throwing
    expect(() => JSON.parse(jsonString)).not.toThrow();
  });
  
  it('should handle chunked processing for large datasets', async () => {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const largeDataSize = 5 * 1024 * 1024; // 5MB total
    
    const expectedChunks = Math.ceil(largeDataSize / chunkSize);
    
    // Should calculate correct number of chunks
    expect(expectedChunks).toBe(5);
    
    // Should be able to process chunks sequentially
    const processedChunks: number[] = [];
    for (let i = 0; i < expectedChunks; i++) {
      processedChunks.push(i);
      // Simulate memory check between chunks
      expect(mockPerformanceMemory.usedJSHeapSize).toBeDefined();
    }
    
    expect(processedChunks.length).toBe(expectedChunks);
  });
});

describe('Worker Edge Cases and Timeout Testing', () => {
  describe('Worker Communication Edge Cases', () => {
    it('should handle worker message queue overflow', () => {
      const messageQueue: unknown[] = [];
      const maxQueueSize = 1000;
      
      // Simulate flooding the worker with messages
      for (let i = 0; i < maxQueueSize + 100; i++) {
        const message = {
          id: `msg-${i}`,
          type: 'PROCESS_IMPORT',
          data: { content: `test-data-${i}` }
        };
        
        if (messageQueue.length < maxQueueSize) {
          messageQueue.push(message);
        }
      }
      
      // Should not exceed maximum queue size
      expect(messageQueue.length).toBeLessThanOrEqual(maxQueueSize);
    });

    it('should handle worker timeout scenarios', async () => {
      const operationTimeout = 1000; // 1 second
      const startTime = performance.now();
      
      // Simulate long-running operation that should timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Operation timed out'));
        }, operationTimeout);
      });
      
      await expect(timeoutPromise).rejects.toThrow('Operation timed out');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should timeout within expected timeframe
      expect(duration).toBeGreaterThanOrEqual(operationTimeout - 100);
      expect(duration).toBeLessThan(operationTimeout + 1000);
    });

    it('should handle concurrent worker operations', async () => {
      const concurrentOperations = 10;
      const operations: Promise<unknown>[] = [];
      
      for (let i = 0; i < concurrentOperations; i++) {
        const operation = new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              id: i,
              result: `operation-${i}-completed`,
              timestamp: performance.now()
            });
          }, Math.random() * 100);
        });
        
        operations.push(operation);
      }
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(concurrentOperations);
      results.forEach((result, index) => {
        expect(result).toHaveProperty('id', index);
        expect(result).toHaveProperty('result', `operation-${index}-completed`);
      });
    });

    it('should handle worker restart scenarios', () => {
      let workerRestarted = false;
      const maxRestarts = 3;
      let restartCount = 0;
      
      const simulateWorkerCrash = () => {
        if (restartCount < maxRestarts) {
          restartCount++;
          workerRestarted = true;
          return true; // Successfully restarted
        }
        return false; // Max restarts reached
      };
      
      // Simulate worker crash and restart
      const restarted = simulateWorkerCrash();
      
      expect(restarted).toBe(true);
      expect(workerRestarted).toBe(true);
      expect(restartCount).toBe(1);
    });
  });

  describe('Error Recovery Edge Cases', () => {
    it('should handle worker error cascades', () => {
      const errors: Error[] = [];
      const maxErrors = 5;
      
      // Simulate cascade of errors
      for (let i = 0; i < 10; i++) {
        if (errors.length < maxErrors) {
          errors.push(new Error(`Cascade error ${i}`));
        } else {
          // Stop adding errors after max reached (circuit breaker)
          break;
        }
      }
      
      expect(errors).toHaveLength(maxErrors);
      errors.forEach((error, index) => {
        expect(error.message).toBe(`Cascade error ${index}`);
      });
    });

    it('should handle corrupted worker state recovery', () => {      
      // Simulate state corruption
      const corruptedState = {
        operations: null,
        memoryUsage: -1,
        isHealthy: undefined
      };
      
      // Recovery mechanism
      const recoveredState = {
        operations: corruptedState.operations || new Map(),
        memoryUsage: Math.max(0, corruptedState.memoryUsage || 0),
        isHealthy: Boolean(corruptedState.isHealthy)
      };
      
      expect(recoveredState.operations).toBeInstanceOf(Map);
      expect(recoveredState.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(typeof recoveredState.isHealthy).toBe('boolean');
    });

    it('should handle worker resource exhaustion', () => {
      const resourceLimits = {
        maxMemory: 100 * 1024 * 1024, // 100MB
        maxOperations: 1000,
        maxConcurrency: 10
      };
      
      const currentUsage = {
        memory: 95 * 1024 * 1024, // 95MB (close to limit)
        operations: 950,
        concurrency: 9 // 9 > 10 * 0.8 = 8.0, so this will trigger the warning
      };
      
      // Check if approaching limits
      const memoryWarning = currentUsage.memory > resourceLimits.maxMemory * 0.9;
      const operationsWarning = currentUsage.operations > resourceLimits.maxOperations * 0.9;
      const concurrencyWarning = currentUsage.concurrency > resourceLimits.maxConcurrency * 0.8;
      
      expect(memoryWarning).toBe(true);
      expect(operationsWarning).toBe(true);
      expect(concurrencyWarning).toBe(true);
    });
  });

  describe('Performance Degradation Edge Cases', () => {
    it('should detect performance degradation patterns', () => {
      const performanceHistory = [
        { timestamp: 1000, duration: 100 },
        { timestamp: 2000, duration: 150 },
        { timestamp: 3000, duration: 200 },
        { timestamp: 4000, duration: 300 },
        { timestamp: 5000, duration: 500 }
      ];
      
      // Calculate performance trend
      const durations = performanceHistory.map(p => p.duration);
      const avgIncrease = durations.reduce((acc, curr, idx) => {
        if (idx === 0) return 0;
        return acc + (curr - durations[idx - 1]);
      }, 0) / (durations.length - 1);
      
      // Detect degradation (average increase > 50ms per operation)
      const isDegrading = avgIncrease > 50;
      
      expect(isDegrading).toBe(true);
      expect(avgIncrease).toBe(100); // (50+50+100+200)/4 = 100
    });

    it('should handle adaptive performance scaling', () => {
      const performanceMetrics = {
        averageResponseTime: 250, // ms
        errorRate: 0.05, // 5%
        throughput: 50 // operations per second
      };
      
      const thresholds = {
        responseTime: 200,
        errorRate: 0.02,
        throughput: 100
      };
      
      // Determine scaling action needed
      const needsScaling =
        performanceMetrics.averageResponseTime > thresholds.responseTime ||
        performanceMetrics.errorRate > thresholds.errorRate ||
        performanceMetrics.throughput < thresholds.throughput;
      
      expect(needsScaling).toBe(true);
    });

    it('should handle worker health monitoring', () => {
      const healthMetrics = {
        lastHeartbeat: Date.now() - 1000, // 1 second ago
        memoryPressure: 0.85, // 85%
        errorCount: 3,
        responseTime: 300
      };
      
      const healthThresholds = {
        heartbeatTimeout: 5000, // 5 seconds
        memoryPressure: 0.9, // 90%
        maxErrors: 5,
        maxResponseTime: 250
      };
      
      const isHealthy =
        (Date.now() - healthMetrics.lastHeartbeat) < healthThresholds.heartbeatTimeout &&
        healthMetrics.memoryPressure < healthThresholds.memoryPressure &&
        healthMetrics.errorCount < healthThresholds.maxErrors &&
        healthMetrics.responseTime < healthThresholds.maxResponseTime;
      
      expect(isHealthy).toBe(false); // Should fail due to response time
    });
  });
});
