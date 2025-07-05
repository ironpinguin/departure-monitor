import '@testing-library/jest-dom';
import { vi } from 'vitest';

// DOM-Setup für Testing Library
Object.defineProperty(document, 'body', {
  value: document.createElement('div'),
  writable: true,
});

// Mock für window.URL.createObjectURL
if (!window.URL) {
  Object.defineProperty(window, 'URL', {
    value: {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    },
    writable: true,
  });
}

// Mock für File API
if (!window.File) {
  Object.defineProperty(window, 'File', {
    value: class MockFile {
      name: string;
      size: number;
      type: string;
      
      constructor(parts: unknown[], name: string, options: { type?: string } = {}) {
        this.name = name;
        this.size = JSON.stringify(parts).length;
        this.type = options.type || 'application/octet-stream';
      }
    },
    writable: true,
  });
}

// Mock für FileReader
if (!window.FileReader) {
  Object.defineProperty(window, 'FileReader', {
    value: class MockFileReader {
      onload: ((event: { target: { result: string } }) => void) | null = null;
      onerror: (() => void) | null = null;
      result: string | null = null;
      
      readAsText(_file: File) { // eslint-disable-line @typescript-eslint/no-unused-vars
        setTimeout(() => {
          this.result = '{"test": "data"}';
          this.onload?.({ target: { result: this.result } });
        }, 0);
      }
    },
    writable: true,
  });
}

// Mock für Blob
if (!window.Blob) {
  Object.defineProperty(window, 'Blob', {
    value: class MockBlob {
      parts: unknown[];
      options: BlobPropertyBag;
      
      constructor(parts: unknown[], options: BlobPropertyBag = {}) {
        this.parts = parts;
        this.options = options;
      }
    },
    writable: true,
  });
}

// Mock für document.createElement (nur wenn nicht bereits definiert)
const originalCreateElement = document.createElement;
if (!vi.isMockFunction(document.createElement)) {
  document.createElement = vi.fn((tagName: string) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        style: {},
        click: vi.fn(),
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      } as unknown as HTMLElement;
    }
    return originalCreateElement.call(document, tagName);
  }) as typeof document.createElement;
}

// Mock für DOM-Methoden
if (!document.body.appendChild) {
  document.body.appendChild = vi.fn();
}
if (!document.body.removeChild) {
  document.body.removeChild = vi.fn();
}

// Performance-Monitor Mock
vi.mock('../utils/performanceMonitor', () => ({
  default: {
    startTiming: vi.fn(),
    endTiming: vi.fn(),
    recordMetric: vi.fn(),
    getMetrics: vi.fn(() => ({})),
    clearMetrics: vi.fn(),
    generateReport: vi.fn(() => 'Mock Performance Report'),
  },
}));