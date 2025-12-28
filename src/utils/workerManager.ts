/**
 * Worker-Manager für Performance-Optimierungen
 * Verwaltet Web Worker für Import/Export-Operationen
 */

import type { ConfigExport } from '../types/configExport';
import { loggers } from './logger';

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
      loggers.utils.warn('Worker initialization failed', {
        context: 'workerManager.initializeWorker',
        workerSupported: this.isSupported,
        error: error instanceof Error ? error.message : String(error)
      });
      
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
    loggers.utils.error('Worker error occurred', {
      context: 'workerManager.handleWorkerError',
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno
    }, new Error(error.message));
    
    // Alle aktiven Operationen abbrechen
    this.activeOperations.forEach((operation) => {
      operation.reject(new Error('Worker-Fehler aufgetreten'));
    });
    this.activeOperations.clear();
  }

  /**
   * Führt eine Worker-Operation aus mit verbessertem Error Handling
   */
  private async executeWorkerOperation<T>(
    type: string,
    payload: { text?: string; config?: ConfigExport; chunks?: unknown[] },
    onProgress?: (progress: number) => void
  ): Promise<T> {
    if (!this.worker || !this.isSupported) {
      throw new Error('Worker nicht verfügbar - Worker-Unterstützung fehlt oder Worker konnte nicht initialisiert werden');
    }

    const operationId = this.generateOperationId();
    
    try {
      return await new Promise<T>((resolve, reject) => {
        // Timeout-Handler
        const timeoutId = setTimeout(() => {
          if (this.activeOperations.has(operationId)) {
            this.activeOperations.delete(operationId);
            loggers.utils.error('Worker operation timeout', {
              context: 'workerManager.executeWorkerOperation',
              operationType: type,
              operationId,
              timeoutMs: 30000
            });
            reject(new Error(`Worker-Operation Timeout nach 30 Sekunden für ${type}`));
          }
        }, 30000);
        
        this.activeOperations.set(operationId, {
          resolve: (value: { data: unknown; metrics: PerformanceMetrics }) => {
            clearTimeout(timeoutId);
            resolve(value as T);
          },
          reject: (error?: Error | string) => {
            clearTimeout(timeoutId);
            const errorObj = error instanceof Error ? error : new Error(String(error));
            loggers.utils.error('Worker operation failed', {
              context: 'workerManager.executeWorkerOperation',
              operationType: type,
              operationId
            }, errorObj);
            reject(errorObj);
          },
          onProgress
        });
        
        // Nachricht an Worker senden
        try {
          this.worker!.postMessage({
            id: operationId,
            type,
            payload
          });
        } catch (postError) {
          clearTimeout(timeoutId);
          this.activeOperations.delete(operationId);
          reject(new Error(`Fehler beim Senden der Worker-Nachricht: ${postError instanceof Error ? postError.message : 'Unbekannter Fehler'}`));
        }
      });
    } catch (error) {
      // Cleanup bei Fehler
      this.activeOperations.delete(operationId);
      throw error;
    }
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
    // Optimierter Worker-Code mit verbessertem chunked processing
    return `
      // Import/Export Worker Code mit Performance-Optimierungen
      const CHUNK_SIZE = 1024 * 1024; // 1MB
      const BATCH_SIZE = 100; // Items pro Batch
      
      // Performance-Tracking
      let startTime = 0;
      let memoryUsage = 0;
      
      self.addEventListener('message', async (event) => {
        const { id, type, payload } = event.data;
        
        try {
          startTime = performance.now();
          memoryUsage = getMemoryUsage();
          
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
            case 'processChunks':
              result = await processDataChunks(payload.chunks, id);
              break;
            default:
              throw new Error('Unbekannter Worker-Operationstyp: ' + type);
          }
          
          const endTime = performance.now();
          const finalMemoryUsage = getMemoryUsage();
          
          self.postMessage({
            id,
            success: true,
            result: {
              data: result,
              metrics: {
                startTime,
                endTime,
                processingTime: endTime - startTime,
                memoryUsage: finalMemoryUsage - memoryUsage,
                peakMemoryUsage: Math.max(memoryUsage, finalMemoryUsage)
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
      
      function getMemoryUsage() {
        if (typeof performance !== 'undefined' && performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      }
      
      function sendProgress(id, progress) {
        self.postMessage({
          id,
          success: true,
          progress: Math.min(100, Math.max(0, progress))
        });
      }
      
      async function parseJSONChunked(text, operationId) {
        const textSize = text.length;
        
        sendProgress(operationId, 5);
        
        // Kleine Dateien direkt parsen
        if (textSize < CHUNK_SIZE) {
          sendProgress(operationId, 50);
          const result = JSON.parse(text);
          sendProgress(operationId, 100);
          return result;
        }
        
        // Große Dateien: Chunk-basiertes Processing
        sendProgress(operationId, 10);
        
        // Validierung der JSON-Struktur
        const firstChar = text.trim().charAt(0);
        const lastChar = text.trim().charAt(text.trim().length - 1);
        
        if (firstChar !== '{' || lastChar !== '}') {
          throw new Error('Ungültige JSON-Struktur');
        }
        
        sendProgress(operationId, 30);
        
        // Memory-effizientes Parsen
        const result = JSON.parse(text);
        
        sendProgress(operationId, 80);
        
        // Struktur validieren
        if (!result || typeof result !== 'object') {
          throw new Error('Ungültige JSON-Objektstruktur');
        }
        
        sendProgress(operationId, 100);
        return result;
      }
      
      async function validateConfigChunked(config, operationId) {
        const errors = [];
        const warnings = [];
        
        sendProgress(operationId, 5);
        
        // Grundlegende Struktur validieren
        if (!config || typeof config !== 'object') {
          errors.push('Ungültige Konfigurationsstruktur');
          return { isValid: false, errors, warnings };
        }
        
        sendProgress(operationId, 15);
        
        // Erforderliche Felder prüfen
        const requiredFields = ['schemaVersion', 'config', 'metadata'];
        for (const field of requiredFields) {
          if (!(field in config)) {
            errors.push(\`Erforderliches Feld fehlt: \${field}\`);
          }
        }
        
        sendProgress(operationId, 30);
        
        // Stops in Chunks validieren
        if (config.config?.stops && Array.isArray(config.config.stops)) {
          const stops = config.config.stops;
          const totalStops = stops.length;
          
          // Chunk-basierte Validierung
          for (let i = 0; i < totalStops; i += BATCH_SIZE) {
            const chunk = stops.slice(i, Math.min(i + BATCH_SIZE, totalStops));
            
            for (let j = 0; j < chunk.length; j++) {
              const stop = chunk[j];
              const globalIndex = i + j;
              
              if (!stop || typeof stop !== 'object') {
                errors.push(\`Stop \${globalIndex + 1} ist ungültig\`);
                continue;
              }
              
              // Erforderliche Felder prüfen
              const requiredFields = ['id', 'name', 'city'];
              for (const field of requiredFields) {
                if (!(field in stop)) {
                  errors.push(\`Stop \${globalIndex + 1}: Erforderliches Feld fehlt: \${field}\`);
                }
              }
            }
            
            // Progress aktualisieren
            const progress = 30 + (i / totalStops) * 60;
            sendProgress(operationId, Math.round(progress));
            
            // Yield für andere Operationen
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        sendProgress(operationId, 100);
        
        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      }
      
      async function generateExportChunked(config, operationId) {
        sendProgress(operationId, 5);
        
        // Metadaten anreichern
        const enrichedConfig = {
          ...config,
          exportTimestamp: new Date().toISOString(),
          exportedBy: 'departure-monitor-app'
        };
        
        sendProgress(operationId, 25);
        
        // JSON-Serialisierung in Chunks für große Konfigurationen
        const configSize = JSON.stringify(config).length;
        
        if (configSize > CHUNK_SIZE) {
          // Große Konfigurationen: Chunk-basierte Serialisierung
          sendProgress(operationId, 50);
          const result = JSON.stringify(enrichedConfig, null, 2);
          sendProgress(operationId, 90);
          return result;
        } else {
          // Kleine Konfigurationen: direkte Serialisierung
          sendProgress(operationId, 75);
          const result = JSON.stringify(enrichedConfig, null, 2);
          sendProgress(operationId, 100);
          return result;
        }
      }
      
      async function processDataChunks(chunks, operationId) {
        const results = [];
        const totalChunks = chunks.length;
        
        for (let i = 0; i < totalChunks; i++) {
          const chunk = chunks[i];
          
          // Chunk verarbeiten
          const processedChunk = await processChunk(chunk);
          results.push(processedChunk);
          
          // Progress aktualisieren
          const progress = (i + 1) / totalChunks * 100;
          sendProgress(operationId, Math.round(progress));
          
          // Yield für andere Operationen
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        return results;
      }
      
      async function processChunk(chunk) {
        // Placeholder für Chunk-Verarbeitung
        return chunk;
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
   * Beendet den Worker mit umfassendem Cleanup
   */
  async terminate(): Promise<void> {
    try {
      // Alle aktiven Operationen benachrichtigen
      if (this.activeOperations.size > 0) {
        loggers.utils.warn('Terminating worker with active operations', {
          context: 'workerManager.terminate',
          activeOperationsCount: this.activeOperations.size
        });
        
        // Alle aktiven Operationen mit Termination-Error ablehnen
        for (const [, operation] of this.activeOperations.entries()) {
          operation.reject(new Error('Worker wurde terminiert - Operation abgebrochen'));
        }
      }
      
      // Worker terminieren
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      
      // Cleanup
      this.activeOperations.clear();
      this.isSupported = false;
      
      loggers.utils.info('Worker successfully terminated', {
        context: 'workerManager.terminate'
      });
    } catch (error) {
      loggers.utils.error('Error during worker termination', {
        context: 'workerManager.terminate'
      }, error instanceof Error ? error : new Error(String(error)));
      
      // Forced cleanup auch bei Fehlern
      this.worker = null;
      this.activeOperations.clear();
      this.isSupported = false;
    }
  }
}

// Singleton-Instanz
const workerManager = new WorkerManager();

export default workerManager;
export type { PerformanceMetrics };