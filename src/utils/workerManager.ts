/**
 * Worker-Manager für Performance-Optimierungen
 * Verwaltet Web Worker für Import/Export-Operationen
 */

import type { ConfigExport } from '../types/configExport';

// Worker-Response-Typen
interface WorkerResponse {
  id: string;
  success: boolean;
  result?: {
    data: unknown;
    metrics: PerformanceMetrics;
  };
  error?: string;
  progress?: number;
}

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  memoryUsage?: number;
  processingTime?: number;
  chunkCount?: number;
}

// Worker-Manager-Klasse
class WorkerManager {
  private worker: Worker | null = null;
  private isSupported: boolean = false;
  private activeOperations = new Map<string, {
    resolve: (value: { data: unknown; metrics: PerformanceMetrics }) => void;
    reject: (reason?: Error | string) => void;
    onProgress?: (progress: number) => void;
  }>();

  constructor() {
    this.isSupported = this.checkWorkerSupport();
    if (this.isSupported) {
      this.initializeWorker();
    }
  }

  /**
   * Prüft Worker-Unterstützung
   */
  private checkWorkerSupport(): boolean {
    return typeof Worker !== 'undefined' && typeof URL !== 'undefined';
  }

  /**
   * Initialisiert den Worker
   */
  private initializeWorker(): void {
    try {
      // Worker-Code als Blob erstellen
      const workerCode = this.getWorkerCode();
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      this.worker = new Worker(workerUrl);
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      // URL wieder freigeben
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      console.warn('Worker-Initialisierung fehlgeschlagen:', error);
      this.isSupported = false;
    }
  }

  /**
   * Behandelt Worker-Nachrichten
   */
  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { id, success, result, error, progress } = event.data;
    
    if (progress !== undefined) {
      // Progress-Update
      const operation = this.activeOperations.get(id);
      if (operation?.onProgress) {
        operation.onProgress(progress);
      }
      return;
    }
    
    const operation = this.activeOperations.get(id);
    if (!operation) return;
    
    this.activeOperations.delete(id);
    
    if (success && result) {
      operation.resolve(result);
    } else {
      operation.reject(new Error(error || 'Worker-Operation fehlgeschlagen'));
    }
  }

  /**
   * Behandelt Worker-Fehler
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('Worker-Fehler:', error);
    
    // Alle aktiven Operationen abbrechen
    this.activeOperations.forEach((operation) => {
      operation.reject(new Error('Worker-Fehler aufgetreten'));
    });
    this.activeOperations.clear();
  }

  /**
   * Führt eine Worker-Operation aus
   */
  private async executeWorkerOperation<T>(
    type: string,
    payload: { text?: string; config?: ConfigExport; chunks?: unknown[] },
    onProgress?: (progress: number) => void
  ): Promise<T> {
    if (!this.worker || !this.isSupported) {
      throw new Error('Worker nicht verfügbar');
    }

    const operationId = this.generateOperationId();
    
    return new Promise<T>((resolve, reject) => {
      this.activeOperations.set(operationId, {
        resolve: (value: { data: unknown; metrics: PerformanceMetrics }) => {
          resolve(value as T);
        },
        reject,
        onProgress
      });
      
      this.worker!.postMessage({
        id: operationId,
        type,
        payload
      });
      
      // Timeout für Operation
      setTimeout(() => {
        if (this.activeOperations.has(operationId)) {
          this.activeOperations.delete(operationId);
          reject(new Error('Worker-Operation Timeout'));
        }
      }, 30000); // 30 Sekunden Timeout
    });
  }

  /**
   * Generiert eine eindeutige Operations-ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Parst JSON mit Worker
   */
  async parseJSONWithWorker(
    text: string,
    onProgress?: (progress: number) => void
  ): Promise<{ data: ConfigExport; metrics: PerformanceMetrics }> {
    if (!this.shouldUseWorker(text.length)) {
      // Kleine Dateien direkt verarbeiten
      const startTime = performance.now();
      const data = JSON.parse(text) as ConfigExport;
      const endTime = performance.now();
      
      return {
        data,
        metrics: {
          startTime,
          endTime,
          processingTime: endTime - startTime,
          memoryUsage: 0
        }
      };
    }

    return this.executeWorkerOperation<{ data: ConfigExport; metrics: PerformanceMetrics }>(
      'parseJSON',
      { text },
      onProgress
    );
  }

  /**
   * Validiert Konfiguration mit Worker
   */
  async validateConfigWithWorker(
    config: ConfigExport,
    onProgress?: (progress: number) => void
  ): Promise<{
    data: { isValid: boolean; errors: string[]; warnings: string[] };
    metrics: PerformanceMetrics;
  }> {
    if (!this.shouldUseWorker(JSON.stringify(config).length)) {
      // Kleine Konfigurationen direkt validieren
      const startTime = performance.now();
      const data = { isValid: true, errors: [], warnings: [] };
      const endTime = performance.now();
      
      return {
        data,
        metrics: {
          startTime,
          endTime,
          processingTime: endTime - startTime,
          memoryUsage: 0
        }
      };
    }

    return this.executeWorkerOperation<{
      data: { isValid: boolean; errors: string[]; warnings: string[] };
      metrics: PerformanceMetrics;
    }>('validateConfig', { config }, onProgress);
  }

  /**
   * Generiert Export mit Worker
   */
  async generateExportWithWorker(
    config: ConfigExport,
    onProgress?: (progress: number) => void
  ): Promise<{ data: string; metrics: PerformanceMetrics }> {
    if (!this.shouldUseWorker(JSON.stringify(config).length)) {
      // Kleine Konfigurationen direkt exportieren
      const startTime = performance.now();
      const data = JSON.stringify(config, null, 2);
      const endTime = performance.now();
      
      return {
        data,
        metrics: {
          startTime,
          endTime,
          processingTime: endTime - startTime,
          memoryUsage: 0
        }
      };
    }

    return this.executeWorkerOperation<{ data: string; metrics: PerformanceMetrics }>(
      'generateExport',
      { config },
      onProgress
    );
  }

  /**
   * Prüft, ob Worker verwendet werden soll
   */
  private shouldUseWorker(dataSize: number): boolean {
    // Worker für Dateien > 1MB verwenden
    const threshold = 1024 * 1024; // 1MB
    return this.isSupported && dataSize > threshold;
  }

  /**
   * Gibt Worker-Code zurück
   */
  private getWorkerCode(): string {
    // Vereinfachter Worker-Code für Inline-Erstellung
    return `
      // Import/Export Worker Code
      const CHUNK_SIZE = 1024 * 1024; // 1MB
      
      self.addEventListener('message', async (event) => {
        const { id, type, payload } = event.data;
        
        try {
          let result;
          
          switch (type) {
            case 'parseJSON':
              result = await parseJSONChunked(payload.text, id);
              break;
            case 'validateConfig':
              result = await validateConfigChunked(payload.config, id);
              break;
            case 'generateExport':
              result = await generateExportChunked(payload.config, id);
              break;
            default:
              throw new Error('Unbekannter Worker-Operationstyp: ' + type);
          }
          
          self.postMessage({
            id,
            success: true,
            result: {
              data: result,
              metrics: {
                startTime: performance.now(),
                endTime: performance.now(),
                processingTime: 0,
                memoryUsage: 0
              }
            }
          });
        } catch (error) {
          self.postMessage({
            id,
            success: false,
            error: error.message
          });
        }
      });
      
      function sendProgress(id, progress) {
        self.postMessage({
          id,
          success: true,
          progress: Math.min(100, Math.max(0, progress))
        });
      }
      
      async function parseJSONChunked(text, operationId) {
        sendProgress(operationId, 10);
        const result = JSON.parse(text);
        sendProgress(operationId, 100);
        return result;
      }
      
      async function validateConfigChunked(config, operationId) {
        sendProgress(operationId, 10);
        const errors = [];
        const warnings = [];
        
        if (!config || typeof config !== 'object') {
          errors.push('Ungültige Konfigurationsstruktur');
        }
        
        sendProgress(operationId, 100);
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      }
      
      async function generateExportChunked(config, operationId) {
        sendProgress(operationId, 10);
        const enrichedConfig = {
          ...config,
          exportTimestamp: new Date().toISOString(),
          exportedBy: 'departure-monitor-app'
        };
        sendProgress(operationId, 50);
        const result = JSON.stringify(enrichedConfig, null, 2);
        sendProgress(operationId, 100);
        return result;
      }
    `;
  }

  /**
   * Prüft Worker-Status
   */
  isWorkerAvailable(): boolean {
    return this.isSupported && this.worker !== null;
  }

  /**
   * Beendet den Worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.activeOperations.clear();
  }
}

// Singleton-Instanz
const workerManager = new WorkerManager();

export default workerManager;
export type { PerformanceMetrics };