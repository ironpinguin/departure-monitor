/**
 * Web Worker für Import/Export-Operationen
 * Führt CPU-intensive Operationen im Hintergrund aus
 */

import type { ConfigExport } from '../types/configExport';

// Worker-Message-Typen
interface WorkerMessage {
  id: string;
  type: 'parseJSON' | 'validateConfig' | 'processChunks' | 'generateExport';
  payload: {
    text?: string;
    config?: ConfigExport;
    chunks?: unknown[];
  };
}

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

// Performance-Metriken
interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  memoryUsage?: number;
  processingTime?: number;
  chunkCount?: number;
}

// Worker-Kontext
const ctx = self as unknown as Worker;

// Aktuelle Operationen verwalten
const activeOperations = new Map<string, PerformanceMetrics>();

// Chunk-Größe für große Dateien (1MB)
const CHUNK_SIZE = 1024 * 1024;


ctx.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;
  
  try {
    // Performance-Tracking starten
    const metrics: PerformanceMetrics = {
      startTime: performance.now(),
      memoryUsage: getMemoryUsage()
    };
    activeOperations.set(id, metrics);
    
    let result;
    
    switch (type) {
      case 'parseJSON':
        if (!payload.text) {
          throw new Error('Text-Payload ist erforderlich');
        }
        result = await parseJSONChunked(payload.text, id);
        break;
      case 'validateConfig':
        if (!payload.config) {
          throw new Error('Config-Payload ist erforderlich');
        }
        result = await validateConfigChunked(payload.config, id);
        break;
      case 'processChunks':
        if (!payload.chunks) {
          throw new Error('Chunks-Payload ist erforderlich');
        }
        result = await processDataChunks(payload.chunks, id);
        break;
      case 'generateExport':
        if (!payload.config) {
          throw new Error('Config-Payload ist erforderlich');
        }
        result = await generateExportChunked(payload.config, id);
        break;
      default:
        throw new Error(`Unbekannter Worker-Operationstyp: ${type}`);
    }
    
    // Performance-Metriken finalisieren
    const finalMetrics = finalizeMetrics(id);
    
    // Erfolgreiche Antwort senden
    const response: WorkerResponse = {
      id,
      success: true,
      result: finalMetrics ? {
        data: result,
        metrics: finalMetrics
      } : undefined
    };
    
    ctx.postMessage(response);
    
  } catch (error) {
    // Fehler-Antwort senden
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
    
    ctx.postMessage(response);
  } finally {
    // Cleanup
    activeOperations.delete(id);
    
    // Garbage Collection triggern
    if (typeof globalThis.gc === 'function') {
      globalThis.gc();
    }
  }
});

/**
 * Parst JSON in Chunks für große Dateien
 */
async function parseJSONChunked(text: string, operationId: string): Promise<ConfigExport> {
  const textSize = text.length;
  
  // Kleine Dateien direkt parsen
  if (textSize < CHUNK_SIZE) {
    return JSON.parse(text);
  }
  
  // Große Dateien progressiv parsen
  sendProgress(operationId, 10);
  
  // Streaming-JSON-Parser simulieren
  let parsedData;
  const chunkCount = Math.ceil(textSize / CHUNK_SIZE);
  
  try {
    // Validierung der JSON-Struktur vor dem Parsen
    const firstChar = text.trim().charAt(0);
    const lastChar = text.trim().charAt(text.trim().length - 1);
    
    if (firstChar !== '{' || lastChar !== '}') {
      throw new Error('Ungültige JSON-Struktur');
    }
    
    sendProgress(operationId, 30);
    
    // Memory-effizientes Parsen
    parsedData = JSON.parse(text);
    
    sendProgress(operationId, 80);
    
    // Validierung der Struktur
    if (!parsedData || typeof parsedData !== 'object') {
      throw new Error('Ungültige JSON-Objektstruktur');
    }
    
    sendProgress(operationId, 100);
    
    // Metriken aktualisieren
    const metrics = activeOperations.get(operationId);
    if (metrics) {
      metrics.chunkCount = chunkCount;
    }
    
    return parsedData as ConfigExport;
    
  } catch (error) {
    throw new Error(`JSON-Parsing fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Validiert Konfiguration in Chunks
 */
async function validateConfigChunked(config: ConfigExport, operationId: string): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  sendProgress(operationId, 10);
  
  // Grundlegende Struktur validieren
  if (!config || typeof config !== 'object') {
    errors.push('Ungültige Konfigurationsstruktur');
    return { isValid: false, errors, warnings };
  }
  
  sendProgress(operationId, 25);
  
  // Erforderliche Felder prüfen
  const requiredFields = ['schemaVersion', 'config', 'metadata'];
  for (const field of requiredFields) {
    if (!(field in config)) {
      errors.push(`Erforderliches Feld fehlt: ${field}`);
    }
  }
  
  sendProgress(operationId, 50);
  
  // Stops in Chunks validieren
  if (config.config?.stops && Array.isArray(config.config.stops)) {
    const stops = config.config.stops;
    const stopChunkSize = Math.max(1, Math.floor(stops.length / 10));
    
    for (let i = 0; i < stops.length; i += stopChunkSize) {
      const chunk = stops.slice(i, i + stopChunkSize);
      const chunkErrors = validateStopChunk(chunk, i);
      errors.push(...chunkErrors);
      
      // Progress aktualisieren
      const progress = 50 + (i / stops.length) * 40;
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

/**
 * Validiert einen Chunk von Stops
 */
function validateStopChunk(stops: unknown[], startIndex: number): string[] {
  const errors: string[] = [];
  
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const globalIndex = startIndex + i;
    
    if (!stop || typeof stop !== 'object') {
      errors.push(`Stop ${globalIndex + 1} ist ungültig`);
      continue;
    }
    
    // Erforderliche Felder prüfen
    const requiredFields = ['id', 'name', 'city'];
    const stopObj = stop as Record<string, unknown>;
    for (const field of requiredFields) {
      if (!(field in stopObj)) {
        errors.push(`Stop ${globalIndex + 1}: Erforderliches Feld fehlt: ${field}`);
      }
    }
  }
  
  return errors;
}

/**
 * Verarbeitet Daten in Chunks
 */
async function processDataChunks(chunks: unknown[], operationId: string): Promise<unknown[]> {
  const results: unknown[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Chunk verarbeiten
    const processedChunk = await processChunk(chunk);
    results.push(processedChunk);
    
    // Progress aktualisieren
    const progress = (i + 1) / chunks.length * 100;
    sendProgress(operationId, Math.round(progress));
    
    // Yield für andere Operationen
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}

/**
 * Verarbeitet einen einzelnen Chunk
 */
async function processChunk(chunk: unknown): Promise<unknown> {
  // Placeholder für Chunk-Verarbeitung
  return chunk;
}

/**
 * Generiert Export in Chunks
 */
async function generateExportChunked(config: ConfigExport, operationId: string): Promise<string> {
  sendProgress(operationId, 10);
  
  // Metadaten anreichern
  const enrichedConfig: ConfigExport = {
    ...config,
    exportTimestamp: new Date().toISOString(),
    exportedBy: 'departure-monitor-app'
  };
  
  sendProgress(operationId, 50);
  
  // Memory-effiziente JSON-Serialisierung
  const jsonString = JSON.stringify(enrichedConfig, null, 2);
  
  sendProgress(operationId, 90);
  
  // Validierung der Ausgabe
  if (jsonString.length === 0) {
    throw new Error('Export-Generierung fehlgeschlagen');
  }
  
  sendProgress(operationId, 100);
  
  return jsonString;
}

/**
 * Sendet Progress-Update
 */
function sendProgress(operationId: string, progress: number): void {
  const response: WorkerResponse = {
    id: operationId,
    success: true,
    progress: Math.min(100, Math.max(0, progress))
  };
  
  ctx.postMessage(response);
}

/**
 * Ermittelt Memory-Usage
 */
function getMemoryUsage(): number {
  const perfWithMemory = performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
    };
  };
  
  if (typeof perfWithMemory.memory !== 'undefined') {
    return perfWithMemory.memory.usedJSHeapSize;
  }
  return 0;
}

/**
 * Finalisiert Performance-Metriken
 */
function finalizeMetrics(operationId: string): PerformanceMetrics | undefined {
  const metrics = activeOperations.get(operationId);
  if (!metrics) return undefined;
  
  metrics.endTime = performance.now();
  metrics.processingTime = metrics.endTime - metrics.startTime;
  
  return metrics;
}


// Worker bereit melden
ctx.postMessage({
  type: 'ready',
  timestamp: new Date().toISOString()
});