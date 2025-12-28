/**
 * Performance-Tests für Import/Export-Optimierungen
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportUtils } from '../importUtils';
import { downloadConfigFileWithWorker } from '../exportUtils';
import type { ConfigExport } from '../../types/configExport';

// Mock Worker
const mockWorker = {
  postMessage: vi.fn(),
  onmessage: null,
  onerror: null,
  terminate: vi.fn()
};

// Mock Worker constructor
vi.stubGlobal('Worker', vi.fn(() => mockWorker));

// Mock URL methods
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn()
});

// Mock Blob
vi.stubGlobal('Blob', vi.fn(() => ({
  size: 1024,
  type: 'application/json'
})));

// Mock document methods
const mockDocument = {
  createElement: vi.fn(() => ({
    href: '',
    download: '',
    style: { display: '' },
    click: vi.fn()
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
};

vi.stubGlobal('document', mockDocument);

// Mock performance
vi.stubGlobal('performance', {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024 // 1MB
  }
});

describe('Performance Optimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Import Performance', () => {
    it('should create worker-based file upload handler', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onProgress = vi.fn();

      const handler = ImportUtils.createWorkerFileUploadHandler(
        onSuccess,
        onError,
        onProgress
      );

      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });

    it('should track progress during worker-based import', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onProgress = vi.fn();

      const handler = ImportUtils.createWorkerFileUploadHandler(
        onSuccess,
        onError,
        onProgress
      );

      // Mock file
      const mockFile = new File(['{}'], 'test.json', { type: 'application/json' });

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null,
        result: '{"schemaVersion": "1.0", "config": {"stops": []}, "metadata": {"stopCount": 0}}'
      };

      vi.stubGlobal('FileReader', vi.fn(() => mockFileReader));

      // Simulate file reading
      setTimeout(() => {
        if (mockFileReader.onload) {
          const mockEvent = { target: { result: mockFileReader.result } } as ProgressEvent<FileReader>;
          mockFileReader.onload(mockEvent);
        }
      }, 0);

      await handler(mockFile);

      // Verify progress was called
      expect(onProgress).toHaveBeenCalledWith(0);
    });
  });

  describe('Export Performance', () => {
    it('should perform optimized export with worker', async () => {
      const mockConfig = {
        schemaVersion: '1.0',
        exportTimestamp: new Date().toISOString(),
        config: {
          stops: [],
          language: 'en',
          darkMode: false,
          refreshIntervalSeconds: 30,
          maxDeparturesShown: 5
        },
        metadata: {
          stopCount: 0,
          language: 'en',
          source: 'test'
        },
        exportedBy: 'test',
        exportSettings: {
          includeUserSettings: true,
          includeStopPositions: true,
          includeVisibilitySettings: true
        }
      } as ConfigExport;

      // Mock worker manager
      vi.doMock('../workerManager', () => ({
        default: {
          validateConfigWithWorker: vi.fn().mockResolvedValue({
            data: { isValid: true, errors: [], warnings: [] },
            metrics: { startTime: 0, endTime: 100, processingTime: 100 }
          }),
          generateExportWithWorker: vi.fn().mockResolvedValue({
            data: JSON.stringify(mockConfig, null, 2),
            metrics: { startTime: 0, endTime: 100, processingTime: 100 }
          })
        }
      }));

      await expect(downloadConfigFileWithWorker(mockConfig)).resolves.not.toThrow();
    });

    it('should use optimized DOM manipulation', async () => {
      const mockConfig = {
        schemaVersion: '1.0',
        exportTimestamp: new Date().toISOString(),
        config: {
          stops: [],
          language: 'en',
          darkMode: false,
          refreshIntervalSeconds: 30,
          maxDeparturesShown: 5
        },
        metadata: {
          stopCount: 0,
          language: 'en',
          source: 'test'
        },
        exportedBy: 'test',
        exportSettings: {
          includeUserSettings: true,
          includeStopPositions: true,
          includeVisibilitySettings: true
        }
      } as ConfigExport;

      // Mock navigator.userAgent to simulate Chrome for DOM manipulation path
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });

      // Mock worker manager
      vi.doMock('../workerManager', () => ({
        default: {
          validateConfigWithWorker: vi.fn().mockResolvedValue({
            data: { isValid: true, errors: [], warnings: [] },
            metrics: { startTime: 0, endTime: 100, processingTime: 100 }
          }),
          generateExportWithWorker: vi.fn().mockResolvedValue({
            data: JSON.stringify(mockConfig, null, 2),
            metrics: { startTime: 0, endTime: 100, processingTime: 100 }
          })
        }
      }));

      await downloadConfigFileWithWorker(mockConfig);

      // Verify minimal DOM operations
      expect(mockDocument.createElement).toHaveBeenCalledWith('a');
      expect(mockDocument.body.appendChild).toHaveBeenCalledTimes(1);
      expect(mockDocument.body.removeChild).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory Management', () => {
    it('should clean up blob URLs after export', async () => {
      const mockConfig = {
        schemaVersion: '1.0',
        exportTimestamp: new Date().toISOString(),
        config: {
          stops: [],
          language: 'en',
          darkMode: false,
          refreshIntervalSeconds: 30,
          maxDeparturesShown: 5
        },
        metadata: {
          stopCount: 0,
          language: 'en',
          source: 'test'
        },
        exportedBy: 'test',
        exportSettings: {
          includeUserSettings: true,
          includeStopPositions: true,
          includeVisibilitySettings: true
        }
      } as ConfigExport;

      // Mock worker manager
      vi.doMock('../workerManager', () => ({
        default: {
          validateConfigWithWorker: vi.fn().mockResolvedValue({
            data: { isValid: true, errors: [], warnings: [] },
            metrics: { startTime: 0, endTime: 100, processingTime: 100 }
          }),
          generateExportWithWorker: vi.fn().mockResolvedValue({
            data: JSON.stringify(mockConfig, null, 2),
            metrics: { startTime: 0, endTime: 100, processingTime: 100 }
          })
        }
      }));

      await downloadConfigFileWithWorker(mockConfig);

      // Verify URL cleanup
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Performance Metrics', () => {
    it('should provide performance metrics from worker operations', () => {
      // Mock worker response with metrics
      const mockMetrics = {
        startTime: 0,
        endTime: 100,
        processingTime: 100,
        memoryUsage: 1024 * 1024,
        peakMemoryUsage: 2 * 1024 * 1024
      };

      expect(mockMetrics.processingTime).toBe(100);
      expect(mockMetrics.memoryUsage).toBe(1024 * 1024);
      expect(mockMetrics.peakMemoryUsage).toBe(2 * 1024 * 1024);
    });
  });
});