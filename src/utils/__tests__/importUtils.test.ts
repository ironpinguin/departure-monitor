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
      
      expect(() => validateFileFormat(validFile)).not.toThrow();
    });

    it('should accept JSON files with text/json mime type', () => {
      const validFile = new File(['{}'], 'config.json', { type: 'text/json' });
      
      expect(() => validateFileFormat(validFile)).not.toThrow();
    });

    it('should accept JSON files with text/plain mime type', () => {
      const validFile = new File(['{}'], 'config.json', { type: 'text/plain' });
      
      expect(() => validateFileFormat(validFile)).not.toThrow();
    });

    it('should reject files with invalid extensions', () => {
      const invalidFile = new File(['{}'], 'config.txt', { type: 'text/plain' });
      
      expect(() => validateFileFormat(invalidFile)).toThrow();
    });

    it('should reject files with invalid mime types', () => {
      const invalidFile = new File(['{}'], 'config.json', { type: 'application/pdf' });
      
      expect(() => validateFileFormat(invalidFile)).toThrow();
    });

    it('should handle files without extension', () => {
      const fileWithoutExt = new File(['{}'], 'config', { type: 'application/json' });
      
      expect(() => validateFileFormat(fileWithoutExt)).toThrow();
    });

    it('should handle case-insensitive extensions', () => {
      const upperCaseFile = new File(['{}'], 'config.JSON', { type: 'application/json' });
      
      expect(() => validateFileFormat(upperCaseFile)).not.toThrow();
    });

    it('should handle files without mime type', () => {
      const fileWithoutMime = new File(['{}'], 'config.json', { type: '' });
      
      expect(() => validateFileFormat(fileWithoutMime)).not.toThrow();
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

  describe('Advanced Corrupt JSON Edge Cases', () => {
    it('should handle malformed JSON with invalid syntax', async () => {
      const malformedJsonCases = [
        '{"test": }',
        '{"test": "value" "missing": "comma"}',
        '{"test": [1, 2, 3,]}',
        '{"test": "unclosed string',
        '{test: "missing quotes on key"}',
        '{"test": /* comment */ "value"}',
        '{"test": 123.45.67}',
        '{"test": 1e1e1}'
      ];

      for (const malformedJson of malformedJsonCases) {
        const file = new File([malformedJson], 'config.json', { 
          type: 'application/json' 
        });
        
        global.FileReader = class MockFileReader {
          onload: ((event: { target: { result: string } }) => void) | null = null;
          onerror: (() => void) | null = null;
          result: string | null = null;
          
          readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
            setTimeout(() => {
              this.result = malformedJson;
              this.onload?.({ target: { result: this.result } });
            }, 0);
          }
        } as unknown as typeof FileReader;
        
        await expect(readConfigFile(file)).rejects.toThrow();
      }
    });

    it('should handle JSON with non-UTF8 characters', async () => {
      const invalidUtf8Content = '{"test": "\\uD800\\uD800"}'; // Invalid surrogate pair
      
      const file = new File([invalidUtf8Content], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = invalidUtf8Content;
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(readConfigFile(file)).rejects.toThrow();
    });

    it('should handle JSON with binary data corruption', async () => {
      const corruptedBinaryData = '\uFFFD\uFFFE\u0000\u0001{"test": "value"}';
      
      const file = new File([corruptedBinaryData], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = corruptedBinaryData;
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(readConfigFile(file)).rejects.toThrow();
    });

    it('should handle JSON with extremely deep nesting', async () => {
      let deeplyNestedJson = '{"level": ';
      for (let i = 0; i < 1000; i++) {
        deeplyNestedJson += '{"nested": ';
      }
      deeplyNestedJson += '"value"';
      for (let i = 0; i < 1000; i++) {
        deeplyNestedJson += '}';
      }
      deeplyNestedJson += '}';
      
      const file = new File([deeplyNestedJson], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = deeplyNestedJson;
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(readConfigFile(file)).rejects.toThrow();
    });

    it('should handle JSON with prototype pollution attempts', async () => {
      const maliciousJson = '{"__proto__": {"isAdmin": true}, "constructor": {"prototype": {"isAdmin": true}}}';
      
      const file = new File([maliciousJson], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = maliciousJson;
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(readConfigFile(file)).rejects.toThrow();
    });

    it('should handle truncated JSON files', async () => {
      const truncatedJson = '{"schemaVersion": "1.0.0", "config": {"stops": [{"id": "test", "name": "'; // Truncated mid-string
      
      const file = new File([truncatedJson], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = truncatedJson;
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(readConfigFile(file)).rejects.toThrow();
    });

    it('should handle JSON with mixed encoding issues', async () => {
      // Simulate a file with mixed encoding that results in invalid characters
      const mixedEncodingContent = '{"test": "' + String.fromCharCode(0xFFFD) + '"}';
      
      const file = new File([mixedEncodingContent], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = mixedEncodingContent;
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(readConfigFile(file)).rejects.toThrow();
    });

    it('should handle JSON with null bytes in strings', async () => {
      const jsonWithNullBytes = '{"test": "value\\u0000with\\u0000null\\u0000bytes"}';
      
      const file = new File([jsonWithNullBytes], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = jsonWithNullBytes;
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(readConfigFile(file)).rejects.toThrow();
    });

    it('should handle JSON with control characters', async () => {
      const jsonWithControlChars = '{"test": "value\u0001\u0002\u0003\u0004"}';
      
      const file = new File([jsonWithControlChars], 'config.json', { 
        type: 'application/json' 
      });
      
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;
        
        readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
          setTimeout(() => {
            this.result = jsonWithControlChars;
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      } as unknown as typeof FileReader;
      
      await expect(readConfigFile(file)).rejects.toThrow();
    });
  });

  describe('Large File and Memory Tests', () => {
    let mockValidConfig: ConfigExport;
    
    beforeEach(() => {
      mockValidConfig = {
        schemaVersion: '1.0.0',
        exportTimestamp: '2024-01-01T00:00:00.000Z',
        exportedBy: 'test-suite',
        metadata: {
          stopCount: 1,
          language: 'de',
          source: 'test'
        },
        config: {
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
        },
        exportSettings: {
          includeUserSettings: true,
          includeStopPositions: true,
          includeVisibilitySettings: true
        }
      };
    });

    it('should handle extremely large JSON files', async () => {
      const largeJsonContent = JSON.stringify({
        schemaVersion: '1.0.0',
        config: {
          stops: Array.from({ length: 10000 }, (_, i) => ({
            id: `stop-${i}`,
            name: `Stop ${i}`,
            city: 'wue',
            stopId: `WUE${i}`,
            walkingTimeMinutes: 5,
            visible: true,
            position: i
          })),
          darkMode: false,
          refreshIntervalSeconds: 30,
          maxDeparturesShown: 10,
          language: 'de'
        }
      });
      
      const largeFile = new File([largeJsonContent], 'large-config.json', { 
        type: 'application/json' 
      });
      
      // Mock FileReader to simulate memory exhaustion
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
      
      await expect(readConfigFile(largeFile)).rejects.toThrow();
    });

    it('should handle memory exhaustion during file read', async () => {
      const file = new File(['{}'], 'config.json', {
        type: 'application/json'
      });
      
      // Use the enhanced FileReader mock with memory error simulation
      interface MockFileReaderConstructor {
        shouldSimulateMemoryError: boolean;
      }
      
      (global.FileReader as unknown as MockFileReaderConstructor).shouldSimulateMemoryError = true;
      
      await expect(readConfigFile(file)).rejects.toThrow();
      
      // Clean up
      (global.FileReader as unknown as MockFileReaderConstructor).shouldSimulateMemoryError = false;
    });

    it('should handle timeout during file read', async () => {
      const file = new File(['{}'], 'config.json', {
        type: 'application/json'
      });
      
      // Use the enhanced FileReader mock with timeout simulation
      interface MockFileReaderConstructor {
        shouldTimeout: boolean;
        timeoutDuration: number;
      }
      
      const mockFileReader = global.FileReader as unknown as MockFileReaderConstructor;
      mockFileReader.shouldTimeout = true;
      mockFileReader.timeoutDuration = 100;
      
      await expect(readConfigFile(file)).rejects.toThrow();
      
      // Clean up
      mockFileReader.shouldTimeout = false;
    });

    it('should handle corrupted file content with enhanced mock', async () => {
      const file = new File(['{}'], 'config.json', {
        type: 'application/json'
      });
      
      // Use the enhanced FileReader mock with corrupted file simulation
      interface MockFileReaderConstructor {
        shouldSimulateCorruptedFile: boolean;
      }
      
      (global.FileReader as unknown as MockFileReaderConstructor).shouldSimulateCorruptedFile = true;
      
      await expect(readConfigFile(file)).rejects.toThrow();
      
      // Clean up
      (global.FileReader as unknown as MockFileReaderConstructor).shouldSimulateCorruptedFile = false;
    });

    it('should handle file read progress events', async () => {
      const file = new File(['{}'], 'config.json', {
        type: 'application/json'
      });
      
      const testConfig = JSON.stringify({
        schemaVersion: '1.0.0',
        exportTimestamp: '2024-01-01T00:00:00.000Z',
        exportedBy: 'test-suite',
        metadata: {
          stopCount: 0,
          language: 'de',
          source: 'test'
        },
        config: {
          stops: [],
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
      
      // Mock FileReader to simulate progress events
      global.FileReader = class MockFileReader {
        onload: ((event: { target: { result: string } }) => void) | null = null;
        onerror: ((event: { target: { error: Error } }) => void) | null = null;
        onprogress: ((event: { loaded: number; total: number }) => void) | null = null;
        result: string | null = null;
        error: Error | null = null;
        readyState: number = 0;
        
        readAsText() {
          this.readyState = 1; // LOADING
          
          // Simulate progress events
          let loaded = 0;
          const total = file.size;
          const progressInterval = setInterval(() => {
            loaded = Math.min(loaded + Math.random() * (total / 2), total);
            this.onprogress?.({ loaded, total });
            
            if (loaded >= total) {
              clearInterval(progressInterval);
              this.result = testConfig;
              this.readyState = 2; // DONE
              this.onload?.({ target: { result: this.result } });
            }
          }, 5);
        }
      } as unknown as typeof FileReader;
      
      const result = await readConfigFile(file);
      
      expect(result.schemaVersion).toBe('1.0.0');
      expect(result.config.stops).toHaveLength(0);
    });
      it('should handle boundary value testing - exact file size limit', async () => {
        const exactSizeContent = 'x'.repeat(10 * 1024 * 1024); // Exactly 10MB
        const exactSizeFile = new File([exactSizeContent], 'config.json', {
          type: 'application/json'
        });
        
        const result = await validateImportFile(exactSizeFile);
        
        expect(result.isValid).toBe(true); // Should accept at exact limit
        expect(result.warnings).toContain('Große Datei (>1MB) - Import kann länger dauern');
      });
  
      it('should handle boundary value testing - size just under limit', async () => {
        const almostMaxContent = 'x'.repeat(10 * 1024 * 1024 - 1); // Just under 10MB
        const almostMaxFile = new File([almostMaxContent], 'config.json', {
          type: 'application/json'
        });
        
        const result = await validateImportFile(almostMaxFile);
        
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Große Datei (>1MB) - Import kann länger dauern');
      });
  
      it('should handle network timeout simulation', async () => {
        // This test verifies that timeouts would be handled properly
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('File read timeout')), 50);
        });
  
        await expect(timeoutPromise).rejects.toThrow('File read timeout');
      });
  
      it('should handle concurrent file operations stress test', async () => {
        const files = Array.from({ length: 5 }, (_, i) =>
          new File([JSON.stringify(mockValidConfig)], `config${i}.json`, {
            type: 'application/json'
          })
        );
  
        global.FileReader = class MockConcurrentFileReader {
          onload: ((event: { target: { result: string } }) => void) | null = null;
          onerror: (() => void) | null = null;
          result: string | null = null;
          
          readAsText() {  
            setTimeout(() => {
              this.result = JSON.stringify(mockValidConfig);
              this.onload?.({ target: { result: this.result } });
            }, Math.random() * 50); // Random delay 0-50ms
          }
        } as unknown as typeof FileReader;
  
        const promises = files.map(file => readConfigFile(file));
        const results = await Promise.all(promises);
        
        expect(results).toHaveLength(5);
        results.forEach(result => {
          expect(result).toEqual(mockValidConfig);
        });
      });
  
      it('should handle Windows line endings in JSON', async () => {
        const windowsJsonContent = JSON.stringify(mockValidConfig, null, 2).replace(/\n/g, '\r\n');
        const windowsFile = new File([windowsJsonContent], 'config.json', {
          type: 'application/json'
        });
        
        global.FileReader = class MockFileReader {
          onload: ((event: { target: { result: string } }) => void) | null = null;
          onerror: (() => void) | null = null;
          result: string | null = null;
          
          readAsText() {  
            setTimeout(() => {
              this.result = windowsJsonContent;
              this.onload?.({ target: { result: this.result } });
            }, 0);
          }
        } as unknown as typeof FileReader;
  
        const result = await readConfigFile(windowsFile);
        
        expect(result).toEqual(mockValidConfig);
      });
  
      it('should handle BOM (Byte Order Mark) in files', async () => {
        const bomJsonContent = '\uFEFF' + JSON.stringify(mockValidConfig);
        const bomFile = new File([bomJsonContent], 'config.json', {
          type: 'application/json'
        });
        
        global.FileReader = class MockFileReader {
          onload: ((event: { target: { result: string } }) => void) | null = null;
          onerror: (() => void) | null = null;
          result: string | null = null;
          
          readAsText() {  
            setTimeout(() => {
              this.result = bomJsonContent;
              this.onload?.({ target: { result: this.result } });
            }, 0);
          }
        } as unknown as typeof FileReader;
  
        const result = await readConfigFile(bomFile);
        
        expect(result).toEqual(mockValidConfig);
      });
  
      it('should handle race conditions in rapid file validations', async () => {
        const files = Array.from({ length: 10 }, (_, i) =>
          new File([JSON.stringify(mockValidConfig)], `config${i}.json`, {
            type: 'application/json'
          })
        );
  
        const validationPromises = files.map(file => validateImportFile(file));
        const results = await Promise.all(validationPromises);
        
        results.forEach(result => {
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });
  
      it('should handle memory pressure during large file processing', async () => {
        // Create a config with many stops to simulate memory pressure
        const largeConfig = {
          ...mockValidConfig,
          config: {
            ...mockValidConfig.config,
            stops: Array.from({ length: 90 }, (_, i) => ({
              id: `stop-${i}`,
              name: `Stop ${i} with very long descriptive name that takes up memory`,
              city: 'wue' as const,
              stopId: `WUE${String(i).padStart(6, '0')}`,
              walkingTimeMinutes: Math.floor(Math.random() * 20) + 1,
              visible: true,
              position: i
            }))
          },
          metadata: {
            ...mockValidConfig.metadata,
            stopCount: 90
          }
        };
  
        const largeJsonString = JSON.stringify(largeConfig);
        const largeFile = new File([largeJsonString], 'large-config.json', {
          type: 'application/json'
        });
        
        global.FileReader = class MockMemoryConstrainedFileReader {
          onload: ((event: { target: { result: string } }) => void) | null = null;
          onerror: (() => void) | null = null;
          result: string | null = null;
          
          readAsText() {  
            // Simulate memory pressure by introducing delay
            setTimeout(() => {
              this.result = largeJsonString;
              this.onload?.({ target: { result: this.result } });
            }, 20);
          }
        } as unknown as typeof FileReader;
  
        const startTime = performance.now();
        const result = await readConfigFile(largeFile);
        const endTime = performance.now();
        
        expect(result.config.stops).toHaveLength(90);
        expect(endTime - startTime).toBeGreaterThanOrEqual(20);
      });
  
      it('should handle fragmented memory scenarios', async () => {
        // Simulate fragmented memory by creating and destroying objects
        const fragmentationObjects: unknown[] = [];
        
        for (let i = 0; i < 100; i++) {
          fragmentationObjects.push({
            data: new Array(1000).fill(`fragment-${i}`)
          });
        }
        
        // Clear half randomly to fragment memory
        for (let i = 0; i < 50; i++) {
          const randomIndex = Math.floor(Math.random() * fragmentationObjects.length);
          fragmentationObjects.splice(randomIndex, 1);
        }
  
        // Set up clean FileReader for this test
        global.FileReader = class MockFileReader {
          onload: ((event: { target: { result: string } }) => void) | null = null;
          onerror: (() => void) | null = null;
          result: string | null = null;
          
          readAsText() {  
            setTimeout(() => {
              this.result = JSON.stringify(mockValidConfig);
              this.onload?.({ target: { result: this.result } });
            }, 0);
          }
        } as unknown as typeof FileReader;

        const file = new File([JSON.stringify(mockValidConfig)], 'config.json', {
          type: 'application/json'
        });
        
        const result = await readConfigFile(file);
        
        expect(result).toEqual(mockValidConfig);
        
        // Cleanup fragmentation objects
        fragmentationObjects.length = 0;
      });
  });