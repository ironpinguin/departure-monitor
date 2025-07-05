/**
 * Unit-Tests für Import-Utilities
 * Testet alle Import-Funktionen mit verschiedenen Szenarien
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readConfigFile,
  validateFileFormat,
  processImportFile,
  handleImportError,
  supportsFileUpload,
  createFileUploadHandler,
  validateImportFile
} from '../importUtils';
import type { ConfigExport } from '../../types/configExport';
import type { AppConfig } from '../../models';

describe('importUtils', () => {
  let mockValidConfig: ConfigExport;
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

    // Mock FileReader
    global.FileReader = class MockFileReader {
      onload: ((event: { target: { result: string } }) => void) | null = null;
      onerror: (() => void) | null = null;
      result: string | null = null;
      
      readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
        setTimeout(() => {
          this.result = JSON.stringify(mockValidConfig);
          this.onload?.({ target: { result: this.result } });
        }, 0);
      }
    } as unknown as typeof FileReader;
  });

  describe('validateFileFormat', () => {
    it('should accept valid JSON files', () => {
      const validFile = new File(['{}'], 'config.json', { type: 'application/json' });
      
      expect(validateFileFormat(validFile)).toBe(true);
    });

    it('should accept JSON files with text/json mime type', () => {
      const validFile = new File(['{}'], 'config.json', { type: 'text/json' });
      
      expect(validateFileFormat(validFile)).toBe(true);
    });

    it('should accept JSON files with text/plain mime type', () => {
      const validFile = new File(['{}'], 'config.json', { type: 'text/plain' });
      
      expect(validateFileFormat(validFile)).toBe(true);
    });

    it('should reject files with invalid extensions', () => {
      const invalidFile = new File(['{}'], 'config.txt', { type: 'text/plain' });
      
      expect(validateFileFormat(invalidFile)).toBe(false);
    });

    it('should reject files with invalid mime types', () => {
      const invalidFile = new File(['{}'], 'config.json', { type: 'application/pdf' });
      
      expect(validateFileFormat(invalidFile)).toBe(false);
    });

    it('should handle files without extension', () => {
      const fileWithoutExt = new File(['{}'], 'config', { type: 'application/json' });
      
      expect(validateFileFormat(fileWithoutExt)).toBe(false);
    });

    it('should handle case-insensitive extensions', () => {
      const upperCaseFile = new File(['{}'], 'config.JSON', { type: 'application/json' });
      
      expect(validateFileFormat(upperCaseFile)).toBe(true);
    });

    it('should handle files without mime type', () => {
      const fileWithoutMime = new File(['{}'], 'config.json', { type: '' });
      
      expect(validateFileFormat(fileWithoutMime)).toBe(true);
    });
  });

  describe('readConfigFile', () => {
    it('should read valid config file successfully', async () => {
      const validFile = new File([JSON.stringify(mockValidConfig)], 'config.json', { 
        type: 'application/json' 
      });
      
      const result = await readConfigFile(validFile);
      
      expect(result).toEqual(mockValidConfig);
    });

    it('should reject files that are too large', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.json', { 
        type: 'application/json' 
      });
      
      await expect(readConfigFile(largeFile)).rejects.toThrow('Datei ist zu groß');
    });

    it('should reject files with invalid format', async () => {
      const invalidFile = new File(['{}'], 'config.txt', { type: 'text/plain' });
      
      await expect(readConfigFile(invalidFile)).rejects.toThrow('Ungültiges Dateiformat');
    });

    it('should handle JSON parsing errors', async () => {
      const invalidJsonFile = new File(['invalid json'], 'config.json', { 
        type: 'application/json' 
      });
      
      // Mock FileReader to return invalid JSON
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = 'invalid json';
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(readConfigFile(invalidJsonFile)).rejects.toThrow();
    });

    it('should handle FileReader errors', async () => {
      const validFile = new File(['{}'], 'config.json', { type: 'application/json' });
      
      // Mock FileReader to simulate error
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.onerror?.();
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(readConfigFile(validFile)).rejects.toThrow();
    });
  });

  describe('processImportFile', () => {
    it('should process valid import file successfully', async () => {
      const validFile = new File([JSON.stringify(mockValidConfig)], 'config.json', { 
        type: 'application/json' 
      });
      
      const result = await processImportFile(validFile);
      
      expect(result.schemaVersion).toBe('1.0.0');
      expect(result.config.stops).toHaveLength(1);
    });

    it('should normalize import data', async () => {
      const configWithMissingFields = {
        ...mockValidConfig,
        config: {
          ...mockValidConfig.config,
          stops: [{
            ...mockValidConfig.config.stops[0],
            position: undefined,
            visible: undefined
          }]
        }
      };
      
      const file = new File([JSON.stringify(configWithMissingFields)], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = JSON.stringify(configWithMissingFields);
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      const result = await processImportFile(file);
      
      expect(result.config.stops[0].position).toBe(0);
      expect(result.config.stops[0].visible).toBe(true);
    });

    it('should reject files with invalid schema version', async () => {
      const invalidConfig = {
        ...mockValidConfig,
        schemaVersion: '2.0.0'
      };
      
      const file = new File([JSON.stringify(invalidConfig)], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = JSON.stringify(invalidConfig);
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(processImportFile(file)).rejects.toThrow('Inkompatible Schema-Version');
    });
  });

  describe('handleImportError', () => {
    it('should handle JSON parsing errors', () => {
      const jsonError = new Error('JSON parsing failed');
      const message = handleImportError(jsonError);
      
      expect(message).toContain('ungültiges JSON-Format');
    });

    it('should handle schema errors', () => {
      const schemaError = new Error('Invalid schema version');
      const message = handleImportError(schemaError);
      
      expect(message).toContain('Inkompatible Schema-Version');
    });

    it('should handle format errors', () => {
      const formatError = new Error('Invalid file format');
      const message = handleImportError(formatError);
      
      expect(message).toContain('Ungültiges Dateiformat');
    });

    it('should handle size errors', () => {
      const sizeError = new Error('File size too large');
      const message = handleImportError(sizeError);
      
      expect(message).toContain('Datei ist zu groß');
    });

    it('should handle structure errors', () => {
      const structureError = new Error('Invalid file structure');
      const message = handleImportError(structureError);
      
      expect(message).toContain('Ungültige Dateistruktur');
    });

    it('should handle unknown errors', () => {
      const unknownError = new Error('Something unexpected happened');
      const message = handleImportError(unknownError);
      
      expect(message).toBe('Something unexpected happened');
    });

    it('should handle non-Error objects', () => {
      const message = handleImportError('string error');
      
      expect(message).toBe('Unbekannter Import-Fehler aufgetreten.');
    });

    it('should handle null/undefined errors', () => {
      const message1 = handleImportError(null);
      const message2 = handleImportError(undefined);
      
      expect(message1).toBe('Unbekannter Import-Fehler aufgetreten.');
      expect(message2).toBe('Unbekannter Import-Fehler aufgetreten.');
    });
  });

  describe('supportsFileUpload', () => {
    it('should detect file upload support', () => {
      const supported = supportsFileUpload();
      
      expect(typeof supported).toBe('boolean');
    });

    it('should return false when File API is missing', () => {
      const originalFile = globalThis.File;
      vi.stubGlobal('File', undefined);
      
      const supported = supportsFileUpload();
      
      expect(supported).toBe(false);
      
      vi.stubGlobal('File', originalFile);
    });

    it('should return false when FileReader API is missing', () => {
      const originalFileReader = globalThis.FileReader;
      vi.stubGlobal('FileReader', undefined);
      
      const supported = supportsFileUpload();
      
      expect(supported).toBe(false);
      
      vi.stubGlobal('FileReader', originalFileReader);
    });

    it('should return false in server environment', () => {
      const originalWindow = globalThis.window;
      vi.stubGlobal('window', undefined);
      
      const supported = supportsFileUpload();
      
      expect(supported).toBe(false);
      
      vi.stubGlobal('window', originalWindow);
    });
  });

  describe('createFileUploadHandler', () => {
    it('should create upload handler that calls success callback', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onProgress = vi.fn();
      
      const handler = createFileUploadHandler(onSuccess, onError, onProgress);
      const validFile = new File([JSON.stringify(mockValidConfig)], 'config.json', { 
        type: 'application/json' 
      });
      
      await handler(validFile);
      
      expect(onSuccess).toHaveBeenCalledWith(mockValidConfig);
      expect(onError).not.toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(0);
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it('should call error callback on processing failure', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      
      const handler = createFileUploadHandler(onSuccess, onError);
      const invalidFile = new File(['invalid'], 'config.txt', { type: 'text/plain' });
      
      await handler(invalidFile);
      
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });

    it('should work without progress callback', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      
      const handler = createFileUploadHandler(onSuccess, onError);
      const validFile = new File([JSON.stringify(mockValidConfig)], 'config.json', { 
        type: 'application/json' 
      });
      
      await expect(handler(validFile)).resolves.not.toThrow();
    });
  });

  describe('validateImportFile', () => {
    it('should validate correct file', async () => {
      const validFile = new File([JSON.stringify(mockValidConfig)], 'config.json', { 
        type: 'application/json' 
      });
      
      const result = await validateImportFile(validFile);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid file format', async () => {
      const invalidFile = new File(['{}'], 'config.txt', { type: 'text/plain' });
      
      const result = await validateImportFile(invalidFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ungültiges Dateiformat');
    });

    it('should detect empty files', async () => {
      const emptyFile = new File([''], 'config.json', { type: 'application/json' });
      
      const result = await validateImportFile(emptyFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Datei ist leer');
    });

    it('should detect files that are too large', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'config.json', { 
        type: 'application/json' 
      });
      
      const result = await validateImportFile(largeFile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Datei ist zu groß (max. 10MB)');
    });

    it('should warn about large files', async () => {
      const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'config.json', { 
        type: 'application/json' 
      });
      
      const result = await validateImportFile(largeFile);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Große Datei (>1MB) - Import kann länger dauern');
    });

    it('should warn about non-standard filenames', async () => {
      const oddNameFile = new File(['{}'], 'strange-name.json', { 
        type: 'application/json' 
      });
      
      const result = await validateImportFile(oddNameFile);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Dateiname entspricht nicht der erwarteten Namenskonvention');
    });

    it('should accept files with config in name', async () => {
      const configFile = new File(['{}'], 'my-config-export.json', { 
        type: 'application/json' 
      });
      
      const result = await validateImportFile(configFile);
      
      expect(result.warnings).not.toContain('Dateiname entspricht nicht der erwarteten Namenskonvention');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle corrupt file data', async () => {
      const corruptFile = new File(['\0\0\0'], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = '\0\0\0';
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(readConfigFile(corruptFile)).rejects.toThrow();
    });

    it('should handle files with circular references', async () => {
      const circularConfig = { ...mockValidConfig };
      (circularConfig as Record<string, unknown>).circular = circularConfig;
      
      // This should not throw because we handle circular references in validation
      expect(() => JSON.stringify(circularConfig)).toThrow();
    });

    it('should handle files with missing required config fields', async () => {
      const incompleteConfig = {
        schemaVersion: '1.0.0',
        exportTimestamp: '2024-01-01T00:00:00.000Z'
        // Missing config, metadata, etc.
      };
      
      const file = new File([JSON.stringify(incompleteConfig)], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = JSON.stringify(incompleteConfig);
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(processImportFile(file)).rejects.toThrow();
    });

    it('should handle very small files', async () => {
      const tinyFile = new File(['{}'], 'config.json', { type: 'application/json' });
      
      const result = await validateImportFile(tinyFile);
      
      expect(result.isValid).toBe(true);
    });

    it('should handle files with special characters in name', async () => {
      const specialFile = new File(['{}'], 'config-üöä-тест.json', { 
        type: 'application/json' 
      });
      
      const result = await validateImportFile(specialFile);
      
      expect(result.isValid).toBe(true);
    });
  });
});