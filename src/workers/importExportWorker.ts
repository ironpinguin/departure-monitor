/**
 * Enhanced Web Worker for import/export operations with advanced memory management
 * Handles CPU-intensive operations in background with memory vulnerability protection
 */

import type { ConfigExport } from '../types/configExport';
import { loggers } from '../utils/logger';

// Worker-Message-Typen
interface WorkerMessage {
  id: string;
  type: 'parseJSON' | 'validateConfig' | 'processChunks' | 'generateExport' | 'getMemoryStats' | 'forceCleanup';
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
  memoryAlert?: MemoryAlert;
}

// Memory Alert Interface
interface MemoryAlert {
  level: 'warning' | 'critical' | 'emergency';
  usage: number;
  threshold: number;
  pressure: MemoryPressureLevel;
  trend: 'increasing' | 'decreasing' | 'stable';
  timestamp: number;
}

// Performance-Metriken mit erweiterten Memory-Informationen
interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  memoryUsage?: number;
  processingTime?: number;
  chunkCount?: number;
  peakMemoryUsage?: number;
  memoryPressure?: MemoryPressureLevel;
  cleanupCount?: number;
  emergencyCleanupCount?: number;
  gcCount?: number;
}

// Memory Pressure Levels
const MemoryPressureLevel = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency'
} as const;

type MemoryPressureLevel = typeof MemoryPressureLevel[keyof typeof MemoryPressureLevel];

// Enhanced Security and Performance Limits with adaptive thresholds
const MEMORY_LIMITS = {
  LOW_THRESHOLD: 15 * 1024 * 1024,      // 15MB - normal operation
  MODERATE_THRESHOLD: 30 * 1024 * 1024, // 30MB - increased monitoring
  HIGH_THRESHOLD: 50 * 1024 * 1024,     // 50MB - aggressive cleanup
  CRITICAL_THRESHOLD: 80 * 1024 * 1024, // 80MB - emergency mode
  EMERGENCY_THRESHOLD: 100 * 1024 * 1024, // 100MB - terminate operations
  MAX_HEAP_USAGE_RATIO: 0.85,           // 85% of available heap
  ALLOCATION_GUARD_SIZE: 10 * 1024 * 1024 // 10MB buffer for new allocations
};

const TIMING_LIMITS = {
  MAX_PROCESSING_TIME: 30 * 1000,       // 30 seconds
  BASE_MEMORY_CHECK_INTERVAL: 1000,     // 1 second base interval
  BASE_CLEANUP_INTERVAL: 5000,          // 5 seconds base cleanup
  ADAPTIVE_INTERVAL_MIN: 250,           // Minimum check interval
  ADAPTIVE_INTERVAL_MAX: 5000,          // Maximum check interval
  CLEANUP_INTERVAL_MIN: 1000,           // Minimum cleanup interval
  CLEANUP_INTERVAL_MAX: 15000,          // Maximum cleanup interval
  EMERGENCY_CLEANUP_INTERVAL: 500       // Emergency cleanup interval
};

const OPERATION_LIMITS = {
  MAX_CONCURRENT_OPERATIONS: 3,
  MAX_CHUNK_COUNT: 100,
  CHUNK_SIZE: 1024 * 1024,              // 1MB chunks
  MEMORY_HISTORY_SIZE: 20,              // Keep 20 memory samples
  GC_FORCE_THRESHOLD: 5                 // Force GC after 5 cleanups
};

// Worker-Kontext
const ctx = self as unknown as Worker;

// Enhanced Memory Monitoring State
interface MemoryMonitoringState {
  isActive: boolean;
  memoryInterval: ReturnType<typeof setInterval> | null;
  adaptiveCleanupInterval: ReturnType<typeof setInterval> | null;
  emergencyCleanupInterval: ReturnType<typeof setInterval> | null;
  currentPressure: MemoryPressureLevel;
  memoryHistory: Array<{
    timestamp: number;
    usage: number;
    pressure: MemoryPressureLevel;
  }>;
  peakMemoryUsage: number;
  cleanupCount: number;
  emergencyCleanupCount: number;
  gcCount: number;
  lastCleanupTime: number;
  lastGcTime: number;
  allocationFailures: number;
}

// Memory monitoring state
const memoryState: MemoryMonitoringState = {
  isActive: false,
  memoryInterval: null,
  adaptiveCleanupInterval: null,
  emergencyCleanupInterval: null,
  currentPressure: MemoryPressureLevel.LOW,
  memoryHistory: [],
  peakMemoryUsage: 0,
  cleanupCount: 0,
  emergencyCleanupCount: 0,
  gcCount: 0,
  lastCleanupTime: Date.now(),
  lastGcTime: Date.now(),
  allocationFailures: 0
};

// Aktuelle Operationen verwalten
const activeOperations = new Map<string, PerformanceMetrics>();

/**
 * Get current memory usage with fallback
 */
function getMemoryUsage(): number {
  const perfWithMemory = performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };
  
  if (typeof perfWithMemory.memory !== 'undefined') {
    return perfWithMemory.memory.usedJSHeapSize;
  }
  return 0;
}

/**
 * Get total heap size limit
 */
function getHeapSizeLimit(): number {
  const perfWithMemory = performance as Performance & {
    memory?: {
      jsHeapSizeLimit: number;
    };
  };
  
  if (typeof perfWithMemory.memory !== 'undefined') {
    return perfWithMemory.memory.jsHeapSizeLimit;
  }
  return 200 * 1024 * 1024; // 200MB fallback
}

/**
 * Calculate memory pressure level based on usage and thresholds
 */
function calculateMemoryPressure(usage: number): MemoryPressureLevel {
  const heapLimit = getHeapSizeLimit();
  const heapUsageRatio = usage / heapLimit;
  
  if (usage >= MEMORY_LIMITS.EMERGENCY_THRESHOLD || heapUsageRatio >= MEMORY_LIMITS.MAX_HEAP_USAGE_RATIO) {
    return MemoryPressureLevel.EMERGENCY;
  } else if (usage >= MEMORY_LIMITS.CRITICAL_THRESHOLD) {
    return MemoryPressureLevel.CRITICAL;
  } else if (usage >= MEMORY_LIMITS.HIGH_THRESHOLD) {
    return MemoryPressureLevel.HIGH;
  } else if (usage >= MEMORY_LIMITS.MODERATE_THRESHOLD) {
    return MemoryPressureLevel.MODERATE;
  } else {
    return MemoryPressureLevel.LOW;
  }
}

/**
 * Update memory history with pressure information
 */
function updateMemoryHistory(usage: number, pressure: MemoryPressureLevel): void {
  memoryState.memoryHistory.push({
    timestamp: Date.now(),
    usage,
    pressure
  });
  
  // Keep only recent history
  if (memoryState.memoryHistory.length > OPERATION_LIMITS.MEMORY_HISTORY_SIZE) {
    memoryState.memoryHistory.shift();
  }
  
  // Update peak usage
  if (usage > memoryState.peakMemoryUsage) {
    memoryState.peakMemoryUsage = usage;
  }
}

/**
 * Get memory trend based on history
 */
function getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
  if (memoryState.memoryHistory.length < 3) return 'stable';
  
  const recent = memoryState.memoryHistory.slice(-3);
  const isIncreasing = recent.every((curr, idx) => 
    idx === 0 || curr.usage > recent[idx - 1].usage
  );
  const isDecreasing = recent.every((curr, idx) => 
    idx === 0 || curr.usage < recent[idx - 1].usage
  );
  
  if (isIncreasing) return 'increasing';
  if (isDecreasing) return 'decreasing';
  return 'stable';
}

/**
 * Calculate adaptive intervals based on memory pressure
 */
function calculateAdaptiveIntervals(pressure: MemoryPressureLevel): {
  memoryCheckInterval: number;
  cleanupInterval: number;
} {
  const pressureMultipliers = {
    [MemoryPressureLevel.LOW]: { check: 2.0, cleanup: 1.5 },
    [MemoryPressureLevel.MODERATE]: { check: 1.0, cleanup: 1.0 },
    [MemoryPressureLevel.HIGH]: { check: 0.5, cleanup: 0.5 },
    [MemoryPressureLevel.CRITICAL]: { check: 0.25, cleanup: 0.25 },
    [MemoryPressureLevel.EMERGENCY]: { check: 0.1, cleanup: 0.1 }
  };
  
  const multiplier = pressureMultipliers[pressure];
  
  return {
    memoryCheckInterval: Math.max(
      TIMING_LIMITS.ADAPTIVE_INTERVAL_MIN,
      Math.min(
        TIMING_LIMITS.ADAPTIVE_INTERVAL_MAX,
        TIMING_LIMITS.BASE_MEMORY_CHECK_INTERVAL * multiplier.check
      )
    ),
    cleanupInterval: Math.max(
      TIMING_LIMITS.CLEANUP_INTERVAL_MIN,
      Math.min(
        TIMING_LIMITS.CLEANUP_INTERVAL_MAX,
        TIMING_LIMITS.BASE_CLEANUP_INTERVAL * multiplier.cleanup
      )
    )
  };
}

/**
 * Memory allocation guard - check if allocation is safe
 */
function checkMemoryAllocationGuard(estimatedSize: number): boolean {
  const currentUsage = getMemoryUsage();
  const heapLimit = getHeapSizeLimit();
  const availableMemory = heapLimit - currentUsage;
  
  // Check if allocation would exceed safe threshold
  if (estimatedSize + MEMORY_LIMITS.ALLOCATION_GUARD_SIZE > availableMemory) {
    memoryState.allocationFailures++;
    return false;
  }
  
  // Check if allocation would push us into emergency territory
  if (currentUsage + estimatedSize > MEMORY_LIMITS.CRITICAL_THRESHOLD) {
    return false;
  }
  
  return true;
}

/**
 * Perform comprehensive memory cleanup
 */
function performMemoryCleanup(isEmergency: boolean = false): void {
  const beforeCleanup = getMemoryUsage();
  
  try {
    // Clear old memory history
    if (memoryState.memoryHistory.length > OPERATION_LIMITS.MEMORY_HISTORY_SIZE) {
      memoryState.memoryHistory = memoryState.memoryHistory.slice(
        -Math.floor(OPERATION_LIMITS.MEMORY_HISTORY_SIZE / 2)
      );
    }
    
    // Clear old entries (keep only last 60 seconds)
    const cutoffTime = Date.now() - 60000;
    memoryState.memoryHistory = memoryState.memoryHistory.filter(
      entry => entry.timestamp > cutoffTime
    );
    
    // Force garbage collection if available and conditions are met
    const timeSinceLastGc = Date.now() - memoryState.lastGcTime;
    const shouldForceGc = isEmergency || 
      memoryState.cleanupCount >= OPERATION_LIMITS.GC_FORCE_THRESHOLD ||
      timeSinceLastGc > 30000; // 30 seconds
    
    if (shouldForceGc && typeof globalThis.gc === 'function') {
      try {
        globalThis.gc();
        memoryState.gcCount++;
        memoryState.lastGcTime = Date.now();
        memoryState.cleanupCount = 0; // Reset cleanup counter after GC
      } catch {
        // GC not available or failed
      }
    }
    
    // Update cleanup counters
    if (isEmergency) {
      memoryState.emergencyCleanupCount++;
    } else {
      memoryState.cleanupCount++;
    }
    
    memoryState.lastCleanupTime = Date.now();
    
    const afterCleanup = getMemoryUsage();
    const freedMemory = beforeCleanup - afterCleanup;

    // Log cleanup results
    loggers.importExport.info(`Memory cleanup completed: ${isEmergency ? 'EMERGENCY' : 'ROUTINE'}`, {
      before: beforeCleanup,
      after: afterCleanup,
      freed: freedMemory,
      gcCount: memoryState.gcCount,
      cleanupCount: memoryState.cleanupCount,
      emergencyCleanupCount: memoryState.emergencyCleanupCount
    });

  } catch (error) {
    loggers.importExport.error('Memory cleanup failed', {}, error as Error);
  }
}

/**
 * Start enhanced memory monitoring with adaptive intervals
 */
function startMemoryMonitoring(): void {
  if (memoryState.isActive) return;
  
  memoryState.isActive = true;
  
  // Main memory monitoring loop
  const startMonitoringLoop = () => {
    const currentUsage = getMemoryUsage();
    const currentPressure = calculateMemoryPressure(currentUsage);
    
    // Update state
    memoryState.currentPressure = currentPressure;
    updateMemoryHistory(currentUsage, currentPressure);
    
    // Handle different pressure levels
    if (currentPressure === MemoryPressureLevel.EMERGENCY) {
      // Emergency: terminate operations and force cleanup
      handleEmergencyMemoryPressure(currentUsage);
    } else if (currentPressure === MemoryPressureLevel.CRITICAL) {
      // Critical: aggressive cleanup and operation throttling
      handleCriticalMemoryPressure(currentUsage);
    } else if (currentPressure === MemoryPressureLevel.HIGH) {
      // High: increased cleanup frequency
      handleHighMemoryPressure(currentUsage);
    } else if (currentPressure === MemoryPressureLevel.MODERATE) {
      // Moderate: warning and preventive cleanup
      handleModerateMemoryPressure(currentUsage);
    }
    
    // Adjust monitoring intervals based on pressure
    const intervals = calculateAdaptiveIntervals(currentPressure);
    
    // Reschedule next check
    if (memoryState.memoryInterval) {
      clearTimeout(memoryState.memoryInterval);
    }
    
    memoryState.memoryInterval = setTimeout(startMonitoringLoop, intervals.memoryCheckInterval);
  };
  
  // Start monitoring
  startMonitoringLoop();
  
  // Set up adaptive cleanup
  setupAdaptiveCleanup();
}

/**
 * Setup adaptive cleanup intervals
 */
function setupAdaptiveCleanup(): void {
  const scheduleAdaptiveCleanup = () => {
    performMemoryCleanup(false);
    
    const intervals = calculateAdaptiveIntervals(memoryState.currentPressure);
    
    if (memoryState.adaptiveCleanupInterval) {
      clearTimeout(memoryState.adaptiveCleanupInterval);
    }
    
    memoryState.adaptiveCleanupInterval = setTimeout(
      scheduleAdaptiveCleanup,
      intervals.cleanupInterval
    );
  };
  
  // Start adaptive cleanup
  scheduleAdaptiveCleanup();
}

/**
 * Handle emergency memory pressure
 */
function handleEmergencyMemoryPressure(usage: number): void {
  loggers.importExport.error('EMERGENCY: Memory usage critical!', {
    usage,
    threshold: MEMORY_LIMITS.EMERGENCY_THRESHOLD,
    heapLimit: getHeapSizeLimit()
  });
  
  // Immediate emergency cleanup
  performMemoryCleanup(true);
  
  // Terminate all non-essential operations
  for (const [operationId] of activeOperations.entries()) {
    terminateOperation(operationId, 'Emergency memory pressure - operation terminated');
  }
  
  // Send emergency alert
  sendMemoryAlert('emergency', usage, MEMORY_LIMITS.EMERGENCY_THRESHOLD);
  
  // Set up emergency cleanup interval
  if (!memoryState.emergencyCleanupInterval) {
    memoryState.emergencyCleanupInterval = setInterval(() => {
      performMemoryCleanup(true);
    }, TIMING_LIMITS.EMERGENCY_CLEANUP_INTERVAL);
  }
}

/**
 * Handle critical memory pressure
 */
function handleCriticalMemoryPressure(usage: number): void {
  loggers.importExport.warn('CRITICAL: Memory usage very high!', {
    usage,
    threshold: MEMORY_LIMITS.CRITICAL_THRESHOLD
  });
  
  // Aggressive cleanup
  performMemoryCleanup(true);
  
  // Terminate operations that are using too much memory
  for (const [operationId, metrics] of activeOperations.entries()) {
    if (metrics.memoryUsage && metrics.memoryUsage > MEMORY_LIMITS.HIGH_THRESHOLD) {
      terminateOperation(operationId, 'Critical memory pressure - high memory operation terminated');
    }
  }
  
  // Send critical alert
  sendMemoryAlert('critical', usage, MEMORY_LIMITS.CRITICAL_THRESHOLD);
}

/**
 * Handle high memory pressure
 */
function handleHighMemoryPressure(usage: number): void {
  loggers.importExport.warn('HIGH: Memory usage elevated', {
    usage,
    threshold: MEMORY_LIMITS.HIGH_THRESHOLD,
    trend: getMemoryTrend()
  });
  
  // Increased cleanup frequency
  performMemoryCleanup(false);
  
  // Send warning alert
  sendMemoryAlert('warning', usage, MEMORY_LIMITS.HIGH_THRESHOLD);
}

/**
 * Handle moderate memory pressure
 */
function handleModerateMemoryPressure(usage: number): void {
  loggers.importExport.info('MODERATE: Memory usage increased', {
    usage,
    threshold: MEMORY_LIMITS.MODERATE_THRESHOLD,
    trend: getMemoryTrend()
  });
  
  // Preventive cleanup
  const timeSinceLastCleanup = Date.now() - memoryState.lastCleanupTime;
  if (timeSinceLastCleanup > 10000) { // 10 seconds
    performMemoryCleanup(false);
  }
}

/**
 * Send memory alert to main thread
 */
function sendMemoryAlert(level: 'warning' | 'critical' | 'emergency', usage: number, threshold: number): void {
  const alert: MemoryAlert = {
    level,
    usage,
    threshold,
    pressure: memoryState.currentPressure,
    trend: getMemoryTrend(),
    timestamp: Date.now()
  };
  
  ctx.postMessage({
    type: 'memoryAlert',
    memoryAlert: alert
  });
}

/**
 * Stop memory monitoring
 */
function stopMemoryMonitoring(): void {
  if (!memoryState.isActive) return;
  
  memoryState.isActive = false;
  
  if (memoryState.memoryInterval) {
    clearTimeout(memoryState.memoryInterval);
    memoryState.memoryInterval = null;
  }
  
  if (memoryState.adaptiveCleanupInterval) {
    clearTimeout(memoryState.adaptiveCleanupInterval);
    memoryState.adaptiveCleanupInterval = null;
  }
  
  if (memoryState.emergencyCleanupInterval) {
    clearInterval(memoryState.emergencyCleanupInterval);
    memoryState.emergencyCleanupInterval = null;
  }
}

/**
 * Terminate operation due to memory pressure
 */
function terminateOperation(operationId: string, reason: string): void {
  const response: WorkerResponse = {
    id: operationId,
    success: false,
    error: `Operation terminated: ${reason}`
  };
  
  ctx.postMessage(response);
  activeOperations.delete(operationId);
}

/**
 * Check operation limits before starting with memory allocation guard
 */
function checkOperationLimits(estimatedMemoryUsage: number = 0): void {
  // Check concurrent operations limit
  if (activeOperations.size >= OPERATION_LIMITS.MAX_CONCURRENT_OPERATIONS) {
    throw new Error('Too many concurrent operations');
  }
  
  // Check current memory usage
  const currentMemory = getMemoryUsage();
  if (currentMemory > MEMORY_LIMITS.HIGH_THRESHOLD) {
    throw new Error('Memory usage too high to start new operation');
  }
  
  // Check memory allocation guard
  if (!checkMemoryAllocationGuard(estimatedMemoryUsage)) {
    throw new Error('Insufficient memory available for operation');
  }
  
  // Check if we're in emergency mode
  if (memoryState.currentPressure === MemoryPressureLevel.EMERGENCY) {
    throw new Error('System in emergency memory mode - operations suspended');
  }
}

// Enhanced message handler with memory management
ctx.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;
  
  try {
    // Estimate memory usage for different operations
    const estimatedMemoryUsage = estimateOperationMemoryUsage(type, payload);
    
    // Security: Check operation limits before starting
    checkOperationLimits(estimatedMemoryUsage);
    
    // Start memory monitoring if not already running
    if (activeOperations.size === 0) {
      startMemoryMonitoring();
    }
    
    // Performance-Tracking starten
    const metrics: PerformanceMetrics = {
      startTime: performance.now(),
      memoryUsage: getMemoryUsage(),
      peakMemoryUsage: memoryState.peakMemoryUsage,
      memoryPressure: memoryState.currentPressure,
      cleanupCount: memoryState.cleanupCount,
      emergencyCleanupCount: memoryState.emergencyCleanupCount,
      gcCount: memoryState.gcCount
    };
    activeOperations.set(id, metrics);
    
    // Check processing time limit
    const timeoutId = setTimeout(() => {
      terminateOperation(id, 'Processing time limit exceeded');
    }, TIMING_LIMITS.MAX_PROCESSING_TIME);
    
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
      case 'getMemoryStats':
        result = getMemoryStats();
        break;
      case 'forceCleanup':
        performMemoryCleanup(true);
        result = { success: true, message: 'Memory cleanup completed' };
        break;
      default:
        throw new Error(`Unbekannter Worker-Operationstyp: ${type}`);
    }
    
    // Clear timeout
    clearTimeout(timeoutId);
    
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
    // Enhanced cleanup
    activeOperations.delete(id);
    
    // Adaptive cleanup after operation
    if (memoryState.currentPressure >= MemoryPressureLevel.MODERATE) {
      performMemoryCleanup(false);
    }
    
    // Stop memory monitoring if no more active operations
    if (activeOperations.size === 0) {
      stopMemoryMonitoring();
      
      // Final cleanup
      performMemoryCleanup(false);
    }
  }
});

/**
 * Estimate memory usage for different operations
 */
function estimateOperationMemoryUsage(type: string, payload: { text?: string; config?: ConfigExport; chunks?: unknown[] }): number {
  switch (type) {
    case 'parseJSON':
      return payload.text ? payload.text.length * 2 : 0; // Rough estimate
    case 'validateConfig':
      return payload.config ? JSON.stringify(payload.config).length * 1.5 : 0;
    case 'processChunks':
      return payload.chunks ? payload.chunks.length * 1024 : 0; // 1KB per chunk estimate
    case 'generateExport':
      return payload.config ? JSON.stringify(payload.config).length * 3 : 0;
    default:
      return 1024 * 1024; // 1MB default estimate
  }
}

/**
 * Get comprehensive memory statistics
 */
function getMemoryStats(): object {
  return {
    current: getMemoryUsage(),
    peak: memoryState.peakMemoryUsage,
    heapLimit: getHeapSizeLimit(),
    pressure: memoryState.currentPressure,
    trend: getMemoryTrend(),
    history: memoryState.memoryHistory,
    cleanupCount: memoryState.cleanupCount,
    emergencyCleanupCount: memoryState.emergencyCleanupCount,
    gcCount: memoryState.gcCount,
    allocationFailures: memoryState.allocationFailures,
    activeOperations: activeOperations.size,
    monitoringActive: memoryState.isActive
  };
}

/**
 * Parst JSON in Chunks für große Dateien mit Memory-Schutz
 */
async function parseJSONChunked(text: string, operationId: string): Promise<ConfigExport> {
  const textSize = text.length;
  
  // Memory allocation guard
  if (!checkMemoryAllocationGuard(textSize * 2)) {
    throw new Error('Insufficient memory for JSON parsing');
  }
  
  // Kleine Dateien direkt parsen
  if (textSize < OPERATION_LIMITS.CHUNK_SIZE) {
    return JSON.parse(text);
  }
  
  // Große Dateien progressiv parsen
  sendProgress(operationId, 10);
  
  // Streaming-JSON-Parser simulieren
  let parsedData;
  const chunkCount = Math.ceil(textSize / OPERATION_LIMITS.CHUNK_SIZE);
  
  try {
    // Validierung der JSON-Struktur vor dem Parsen
    const firstChar = text.trim().charAt(0);
    const lastChar = text.trim().charAt(text.trim().length - 1);
    
    if (firstChar !== '{' || lastChar !== '}') {
      throw new Error('Ungültige JSON-Struktur');
    }
    
    sendProgress(operationId, 30);
    
    // Memory-effizientes Parsen mit Überwachung
    const beforeParsing = getMemoryUsage();
    parsedData = JSON.parse(text);
    const afterParsing = getMemoryUsage();
    
    // Check if parsing caused memory spike
    if (afterParsing - beforeParsing > MEMORY_LIMITS.MODERATE_THRESHOLD) {
      loggers.importExport.warn('JSON parsing caused memory spike', {
        before: beforeParsing,
        after: afterParsing,
        spike: afterParsing - beforeParsing
      });
      
      // Trigger cleanup
      performMemoryCleanup(false);
    }
    
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
 * Validiert Konfiguration in Chunks mit Memory-Management
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
  
  // Stops in Chunks validieren mit Memory-Überwachung
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
      
      // Memory check during validation
      const currentMemory = getMemoryUsage();
      if (currentMemory > MEMORY_LIMITS.HIGH_THRESHOLD) {
        performMemoryCleanup(false);
      }
      
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
 * Verarbeitet Daten in Chunks mit Memory-Management
 */
async function processDataChunks(chunks: unknown[], operationId: string): Promise<unknown[]> {
  const results: unknown[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Memory check before processing each chunk
    const currentMemory = getMemoryUsage();
    if (currentMemory > MEMORY_LIMITS.MODERATE_THRESHOLD) {
      performMemoryCleanup(false);
    }
    
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
 * Generiert Export in Chunks mit Memory-Schutz
 */
async function generateExportChunked(config: ConfigExport, operationId: string): Promise<string> {
  sendProgress(operationId, 10);
  
  // Estimate memory usage for export
  const configSize = JSON.stringify(config).length;
  if (!checkMemoryAllocationGuard(configSize * 3)) {
    throw new Error('Insufficient memory for export generation');
  }
  
  // Metadaten anreichern
  const enrichedConfig: ConfigExport = {
    ...config,
    exportTimestamp: new Date().toISOString(),
    exportedBy: 'departure-monitor-app'
  };
  
  sendProgress(operationId, 50);
  
  // Memory-effiziente JSON-Serialisierung
  const beforeSerialization = getMemoryUsage();
  const jsonString = JSON.stringify(enrichedConfig, null, 2);
  const afterSerialization = getMemoryUsage();
  
  // Check for memory spike during serialization
  if (afterSerialization - beforeSerialization > MEMORY_LIMITS.MODERATE_THRESHOLD) {
    loggers.importExport.warn('Export serialization caused memory spike', {
      before: beforeSerialization,
      after: afterSerialization,
      spike: afterSerialization - beforeSerialization
    });
    
    performMemoryCleanup(false);
  }
  
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
 * Finalisiert Performance-Metriken
 */
function finalizeMetrics(operationId: string): PerformanceMetrics | undefined {
  const metrics = activeOperations.get(operationId);
  if (!metrics) return undefined;
  
  metrics.endTime = performance.now();
  metrics.processingTime = metrics.endTime - metrics.startTime;
  metrics.peakMemoryUsage = memoryState.peakMemoryUsage;
  metrics.memoryPressure = memoryState.currentPressure;
  metrics.cleanupCount = memoryState.cleanupCount;
  metrics.emergencyCleanupCount = memoryState.emergencyCleanupCount;
  metrics.gcCount = memoryState.gcCount;
  
  return metrics;
}

// Worker bereit melden
ctx.postMessage({
  type: 'ready',
  timestamp: new Date().toISOString(),
  memoryLimits: MEMORY_LIMITS,
  capabilities: {
    memoryMonitoring: true,
    adaptiveCleanup: true,
    pressureDetection: true,
    allocationGuards: true
  }
});