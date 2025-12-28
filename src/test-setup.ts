import '@testing-library/jest-dom';
import { vi } from 'vitest';

// DOM-Setup für Testing Library
Object.defineProperty(document, 'body', {
  value: document.createElement('div'),
  writable: true,
});

// Mock für window.URL mit erweiterten Fehlerszenarien
if (!window.URL) {
  const mockURL = {
    createObjectURL: vi.fn((object: Blob | File) => {
      if (mockURL.shouldFailCreation) {
        throw new Error('URL creation failed');
      }
      if (mockURL.shouldFailOnLargeBlob && object.size > 50 * 1024 * 1024) {
        throw new Error('Blob too large for URL creation');
      }
      return `blob:mock-url-${Date.now()}`;
    }),
    revokeObjectURL: vi.fn(() => {
      if (mockURL.shouldFailRevocation) {
        throw new Error('URL revocation failed');
      }
      // Simulate successful revocation
    }),
    shouldFailCreation: false,
    shouldFailRevocation: false,
    shouldFailOnLargeBlob: false,
  };
  
  Object.defineProperty(window, 'URL', {
    value: mockURL,
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

// Mock für FileReader mit erweiterten Fehlerszenarien
if (!window.FileReader) {
  Object.defineProperty(window, 'FileReader', {
    value: class MockFileReader {
      onload: ((event: { target: { result: string } }) => void) | null = null;
      onerror: ((event: { target: { error: Error } }) => void) | null = null;
      onprogress: ((event: { loaded: number; total: number }) => void) | null = null;
      result: string | null = null;
      error: Error | null = null;
      readyState: number = 0; // 0 = EMPTY, 1 = LOADING, 2 = DONE
      
      // Static properties for configuring mock behavior
      static shouldFail = false;
      static failureReason = 'File read error';
      static shouldTimeout = false;
      static timeoutDuration = 5000;
      static shouldSimulateProgress = false;
      static progressDelay = 100;
      static mockResult = '{"test": "data"}';
      static shouldSimulateMemoryError = false;
      static shouldSimulateCorruptedFile = false;
      
      readAsText(file: File) {
        this.readyState = 1; // LOADING
        
        // Simulate corrupted file content
        if (MockFileReader.shouldSimulateCorruptedFile) {
          setTimeout(() => {
            this.result = '\0\0\0invalid\uFFFD\uFFFE';
            this.readyState = 2; // DONE
            this.onload?.({ target: { result: this.result } });
          }, 0);
          return;
        }
        
        // Simulate memory exhaustion for large files
        if (MockFileReader.shouldSimulateMemoryError || file.size > 50 * 1024 * 1024) {
          setTimeout(() => {
            this.error = new Error('Out of memory');
            this.readyState = 2; // DONE
            this.onerror?.({ target: { error: this.error } });
          }, 0);
          return;
        }
        
        // Simulate general failure
        if (MockFileReader.shouldFail) {
          setTimeout(() => {
            this.error = new Error(MockFileReader.failureReason);
            this.readyState = 2; // DONE
            this.onerror?.({ target: { error: this.error } });
          }, 0);
          return;
        }
        
        // Simulate timeout
        if (MockFileReader.shouldTimeout) {
          setTimeout(() => {
            this.error = new Error('Operation timed out');
            this.readyState = 2; // DONE
            this.onerror?.({ target: { error: this.error } });
          }, MockFileReader.timeoutDuration);
          return;
        }
        
        // Simulate progress events for large files
        if (MockFileReader.shouldSimulateProgress || file.size > 1024 * 1024) {
          let loaded = 0;
          const total = file.size;
          const progressInterval = setInterval(() => {
            loaded = Math.min(loaded + Math.random() * (total / 10), total);
            this.onprogress?.({ loaded, total });
            
            if (loaded >= total) {
              clearInterval(progressInterval);
              this.result = MockFileReader.mockResult;
              this.readyState = 2; // DONE
              this.onload?.({ target: { result: this.result } });
            }
          }, MockFileReader.progressDelay);
        } else {
          // Normal operation
          setTimeout(() => {
            this.result = MockFileReader.mockResult;
            this.readyState = 2; // DONE
            this.onload?.({ target: { result: this.result } });
          }, 0);
        }
      }
      
      readAsArrayBuffer(file: File) {
        this.readAsText(file);
      }
      
      readAsDataURL(file: File) {
        this.readAsText(file);
      }
      
      abort() {
        this.readyState = 2; // DONE
        this.error = new Error('Operation aborted');
        this.onerror?.({ target: { error: this.error } });
      }
    },
    writable: true,
  });
}

// Mock für Blob mit erweiterten Fehlerszenarien
if (!window.Blob) {
  Object.defineProperty(window, 'Blob', {
    value: class MockBlob {
      parts: unknown[];
      options: BlobPropertyBag;
      size: number;
      type: string;
      
      // Static properties for configuring mock behavior
      static shouldFailConstruction = false;
      static shouldFailOnLargeSize = false;
      static maxSizeBeforeFailure = 100 * 1024 * 1024; // 100MB
      
      constructor(parts: unknown[], options: BlobPropertyBag = {}) {
        if (MockBlob.shouldFailConstruction) {
          throw new Error('Blob construction failed');
        }
        
        this.parts = parts;
        this.options = options;
        this.type = options.type || 'application/octet-stream';
        
        // Calculate size
        this.size = parts.reduce((acc: number, part) => {
          if (typeof part === 'string') {
            return acc + part.length;
          } else if (part instanceof ArrayBuffer) {
            return acc + part.byteLength;
          }
          return acc + JSON.stringify(part).length;
        }, 0);
        
        // Simulate failure for large blobs
        if (MockBlob.shouldFailOnLargeSize && this.size > MockBlob.maxSizeBeforeFailure) {
          throw new Error('Blob size exceeds maximum limit');
        }
      }
      
      slice(start?: number, end?: number, contentType?: string) {
        return new MockBlob(this.parts.slice(start, end), { type: contentType });
      }
      
      stream() {
        throw new Error('Stream API not implemented in mock');
      }
      
      text() {
        return Promise.resolve(this.parts.join(''));
      }
      
      arrayBuffer() {
        return Promise.resolve(new ArrayBuffer(this.size));
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
      // Create a proper style mock with all required properties
      const styleStorage: Record<string, string> = {
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
      };
      
      const styleMock = {
        setProperty: vi.fn(),
        getPropertyValue: vi.fn((prop: string) => styleStorage[prop] || ''),
        removeProperty: vi.fn(),
      };
      
      // Make all style properties writable
      Object.keys(styleStorage).forEach(key => {
        Object.defineProperty(styleMock, key, {
          get: () => styleStorage[key],
          set: (value: string) => {
            styleStorage[key] = value;
          },
          enumerable: true,
          configurable: true,
        });
      });
      
      return {
        href: '',
        download: '',
        style: styleMock,
        click: vi.fn(),
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

// Mock für window.open
if (!window.open) {
  const mockOpen = vi.fn().mockImplementation((url: string) => {
    // Simulate popup blocker or other failures
    if ((mockOpen as unknown as { shouldFail: boolean }).shouldFail) {
      return null;
    }
    
    // Return a mock window object
    return {
      focus: vi.fn(),
      close: vi.fn(),
      closed: false,
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      location: {
        href: url,
      },
    } as unknown as Window;
  });
  
  // Add a property to control failure behavior
  (mockOpen as unknown as { shouldFail: boolean }).shouldFail = false;
  
  Object.defineProperty(window, 'open', {
    value: mockOpen,
    writable: true,
  });
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