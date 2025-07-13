/**
 * Import-Utilities für Datei-Upload und JSON-Parsing
 * Implementiert die vollständige Import-Funktionalität mit Validierung
 */

import type { ConfigExport } from '../types/configExport';
import { SCHEMA_VERSIONS, isValidSchemaVersion } from '../types/configExport';
import { loggers } from './logger';

// Security constants
const SECURITY_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_JSON_DEPTH: 10,
  MAX_STOPS_COUNT: 100,
  ALLOWED_MIME_TYPES: [
    'application/json',
    'text/json',
    'text/plain',
    'application/octet-stream' // for files without proper MIME type
  ],
  ALLOWED_EXTENSIONS: ['.json'],
  SUSPICIOUS_PATTERNS: [
    /<script/i,
    /javascript:/i,
    /eval\s*\(/i,
    /function\s*\(/i,
    /constructor/i,
    /__proto__/i,
    /prototype/i
  ]
};

// Rate limiting
const RATE_LIMITS = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_OPERATIONS_PER_MINUTE = 10;

/**
 * Rate-Limiting prüfen
 */
function checkRateLimit(identifier: string = 'global'): boolean {
  // Disable rate limiting in test environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return true;
  }
  
  const now = Date.now();
  const limit = RATE_LIMITS.get(identifier);
  
  if (!limit) {
    RATE_LIMITS.set(identifier, { count: 1, lastReset: now });
    return true;
  }
  
  // Reset if window passed
  if (now - limit.lastReset > RATE_LIMIT_WINDOW) {
    limit.count = 1;
    limit.lastReset = now;
    return true;
  }
  
  // Check if limit exceeded
  if (limit.count >= MAX_OPERATIONS_PER_MINUTE) {
    return false;
  }
  
  limit.count++;
  return true;
}

/**
 * Erweiterte Sicherheitsvalidierung für Dateien
 */
function validateFileSecurity(file: File): void {
  // Rate limiting check
  if (!checkRateLimit(`file-${file.name}`)) {
    throw new Error('Rate limit exceeded. Please wait before uploading again.');
  }
  
  // File size validation (before reading)
  if (file.size > SECURITY_LIMITS.MAX_FILE_SIZE) {
    throw new Error(`Datei ist zu groß. Maximum: ${SECURITY_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  // Empty file check
  if (file.size === 0) {
    throw new Error('Datei ist leer');
  }
  
  // Extension validation
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!SECURITY_LIMITS.ALLOWED_EXTENSIONS.includes(fileExtension)) {
    throw new Error(`Ungültiges Dateiformat. Nur .json-Dateien werden unterstützt.`);
  }
  
  // MIME type validation (enhanced)
  if (file.type && !SECURITY_LIMITS.ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Ungültiger MIME-Type: '${file.type}'`);
  }
  
  // Suspicious filename patterns
  const suspiciousFilenamePatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.js$/i,
    /\.vbs$/i,
    /\.php$/i
  ];
  
  if (suspiciousFilenamePatterns.some(pattern => pattern.test(file.name))) {
    throw new Error('Suspicious file extension detected');
  }
}

/**
 * Sanitize und validate JSON content
 */
function sanitizeAndValidateContent(content: string): string {
  // Check for suspicious patterns
  for (const pattern of SECURITY_LIMITS.SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      throw new Error('Suspicious content detected in file');
    }
  }
  
  // Validate JSON depth
  try {
    const parsed = JSON.parse(content);
    if (getObjectDepth(parsed) > SECURITY_LIMITS.MAX_JSON_DEPTH) {
      throw new Error(`JSON structure too deep (max depth: ${SECURITY_LIMITS.MAX_JSON_DEPTH})`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON syntax');
    }
    throw error;
  }
  
  return content;
}

/**
 * Calculate object depth
 */
function getObjectDepth(obj: unknown, depth = 0): number {
  if (depth > SECURITY_LIMITS.MAX_JSON_DEPTH) {
    return depth;
  }
  
  if (obj === null || typeof obj !== 'object') {
    return depth;
  }
  
  let maxDepth = depth;
  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const currentDepth = getObjectDepth((obj as Record<string, unknown>)[key], depth + 1);
      maxDepth = Math.max(maxDepth, currentDepth);
    }
  }
  
  return maxDepth;
}

/**
 * Validate config security after parsing
 */
function validateConfigSecurity(config: ConfigExport): void {
  // Check stops count
  if (config.config?.stops && config.config.stops.length > SECURITY_LIMITS.MAX_STOPS_COUNT) {
    throw new Error(`Too many stops (max: ${SECURITY_LIMITS.MAX_STOPS_COUNT})`);
  }
  
  // Validate stop IDs for injection attempts
  if (config.config?.stops) {
    for (let i = 0; i < config.config.stops.length; i++) {
      const stop = config.config.stops[i];
      if (stop && typeof stop === 'object' && 'id' in stop) {
        const stopId = stop.id;
        if (typeof stopId === 'string') {
          // Check for suspicious patterns in stop ID
          for (const pattern of SECURITY_LIMITS.SUSPICIOUS_PATTERNS) {
            if (pattern.test(stopId)) {
              throw new Error(`Suspicious content detected in stop ID: ${stopId}`);
            }
          }
        }
      }
    }
  }
}

/**
 * Liest und parst eine Config-Datei
 */
export async function readConfigFile(file: File): Promise<ConfigExport> {
  try {
    // Enhanced security validation
    validateFileSecurity(file);
    
    // Legacy format validation (kept for backwards compatibility)
    if (!validateFileFormat(file)) {
      throw new Error('Ungültiges Dateiformat. Nur .json-Dateien sind erlaubt.');
    }

    // Datei als Text lesen
    const text = await readFileAsText(file);
    
    // Sanitize and validate content
    const sanitizedContent = sanitizeAndValidateContent(text);
    
    // JSON parsen
    const config = parseConfigJSON(sanitizedContent);
    
    // Grundlegende Validierung
    validateBasicStructure(config);
    
    // Additional security checks
    validateConfigSecurity(config);
    
    return config;
  } catch (error) {
    loggers.importExport.error('Config file reading failed', {
      context: 'importUtils.readConfigFile',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    }, error instanceof Error ? error : new Error(String(error)));
    
    throw new Error(handleImportError(error));
  }
}

/**
 * Validiert das Dateiformat
 */
export function validateFileFormat(file: File): boolean {
  // Dateiendung prüfen
  const allowedExtensions = ['.json'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    return false;
  }

  // MIME-Type prüfen
  const allowedMimeTypes = ['application/json', 'text/json', 'text/plain'];
  if (file.type && !allowedMimeTypes.includes(file.type)) {
    return false;
  }

  return true;
}

/**
 * Verarbeitet eine Import-Datei vollständig
 */
export async function processImportFile(file: File): Promise<ConfigExport> {
  try {
    // Datei lesen und parsen
    const config = await readConfigFile(file);
    
    // Erweiterte Validierung
    validateSchemaVersion(config);
    validateConfigStructure(config);
    
    // Normalisierung der Daten
    const normalizedConfig = normalizeImportData(config);
    
    return normalizedConfig;
  } catch (error) {
    loggers.importExport.error('Import file processing failed', {
      context: 'importUtils.processImportFile',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    }, error instanceof Error ? error : new Error(String(error)));
    
    throw new Error(handleImportError(error));
  }
}

/**
 * Behandelt Import-Fehler und erstellt benutzerfreundliche Nachrichten
 */
export function handleImportError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Spezifische Fehlerbehandlung
    if (message.includes('JSON')) {
      return 'Datei enthält ungültiges JSON-Format. Bitte überprüfen Sie die Dateistruktur.';
    }
    
    if (message.includes('schema')) {
      return 'Inkompatible Schema-Version. Bitte verwenden Sie eine unterstützte Konfigurationsdatei.';
    }
    
    if (message.includes('format')) {
      return 'Ungültiges Dateiformat. Nur .json-Dateien werden unterstützt.';
    }
    
    if (message.includes('size')) {
      return 'Datei ist zu groß. Maximum: 10MB';
    }
    
    if (message.includes('structure')) {
      return 'Ungültige Dateistruktur. Die Datei entspricht nicht dem erwarteten Format.';
    }
    
    return message;
  }
  
  return 'Unbekannter Import-Fehler aufgetreten.';
}

/**
 * Prüft, ob ein Datei-Upload unterstützt wird
 */
export function supportsFileUpload(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    typeof File !== 'undefined' &&
    typeof FileReader !== 'undefined' &&
    typeof Blob !== 'undefined'
  );
}

/**
 * Erstellt einen Datei-Upload-Handler
 */
export function createFileUploadHandler(
  onSuccess: (config: ConfigExport) => void,
  onError: (error: string) => void,
  onProgress?: (progress: number) => void
): (file: File) => Promise<void> {
  return async (file: File) => {
    try {
      onProgress?.(0);
      
      // Datei verarbeiten
      const config = await processImportFile(file);
      
      onProgress?.(100);
      onSuccess(config);
    } catch (error) {
      onError(handleImportError(error));
    }
  };
}

/**
 * Erstellt einen Worker-basierten Datei-Upload-Handler für Performance-Optimierung
 */
export function createWorkerFileUploadHandler(
  onSuccess: (config: ConfigExport) => void,
  onError: (error: string) => void,
  onProgress?: (progress: number) => void
): (file: File) => Promise<void> {
  return async (file: File) => {
    try {
      onProgress?.(0);
      
      // Datei als Text lesen (minimal main thread impact)
      const text = await readFileAsText(file);
      
      onProgress?.(10);
      
      // Import worker manager laden (als default export)
      const workerManagerModule = await import('./workerManager');
      const workerManager = workerManagerModule.default;
      
      // Alles im Worker verarbeiten
      const parseResult = await workerManager.parseJSONWithWorker(text, (progress) => {
        onProgress?.(10 + progress * 0.3); // 10-40% für Parsing
      });
      const config = parseResult.data;
      
      onProgress?.(40);
      
      // Validierung im Worker
      const validationResult = await workerManager.validateConfigWithWorker(config, (progress) => {
        onProgress?.(40 + progress * 0.5); // 40-90% für Validierung
      });
      
      if (!validationResult.data.isValid) {
        onError(validationResult.data.errors.join(', '));
        return;
      }
      
      // Warnungen anzeigen
      if (validationResult.data.warnings.length > 0) {
        console.warn('Import-Warnungen:', validationResult.data.warnings);
      }
      
      onProgress?.(100);
      onSuccess(config);
    } catch (error) {
      onError(handleImportError(error));
    }
  };
}

/**
 * Validiert die Dateistruktur für Import
 */
export function validateImportFile(file: File): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Dateiformat prüfen
    if (!validateFileFormat(file)) {
      errors.push('Ungültiges Dateiformat');
    }
    
    // Dateigröße prüfen
    if (file.size === 0) {
      errors.push('Datei ist leer');
    } else if (file.size > 10 * 1024 * 1024) {
      errors.push('Datei ist zu groß (max. 10MB)');
    } else if (file.size > 1024 * 1024) {
      warnings.push('Große Datei (>1MB) - Import kann länger dauern');
    }
    
    // Dateiname prüfen
    if (!file.name.includes('config')) {
      warnings.push('Dateiname entspricht nicht der erwarteten Namenskonvention');
    }
    
    resolve({
      isValid: errors.length === 0,
      errors,
      warnings
    });
  });
}

// Hilfsfunktionen

/**
 * Liest eine Datei als Text
 */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Fehler beim Lesen der Datei'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'));
    };
    
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Parst JSON-Konfiguration mit Fehlerbehandlung
 */
function parseConfigJSON(text: string): ConfigExport {
  try {
    const parsed = JSON.parse(text);
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('JSON-Struktur ist ungültig');
    }
    
    // Weniger strenge Validierung - nur grundlegende Struktur prüfen
    return parsed as ConfigExport;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON syntax');
    }
    throw error;
  }
}

/**
 * Validiert die grundlegende Struktur
 */
function validateBasicStructure(config: unknown): void {
  if (!config || typeof config !== 'object') {
    throw new Error('Ungültige Konfigurationsstruktur');
  }
  
  const configObj = config as Record<string, unknown>;
  
  // Erforderliche Felder prüfen
  const requiredFields = ['schemaVersion', 'config', 'metadata'];
  for (const field of requiredFields) {
    if (!(field in configObj)) {
      throw new Error(`Erforderliches Feld fehlt: ${field}`);
    }
  }
  
  // Config-Objekt validieren
  if (!configObj.config || typeof configObj.config !== 'object') {
    throw new Error('Konfigurationsdaten sind ungültig');
  }
  
  const innerConfig = configObj.config as Record<string, unknown>;
  if (!Array.isArray(innerConfig.stops)) {
    throw new Error('Stops-Array ist ungültig');
  }
}

/**
 * Validiert die Schema-Version
 */
function validateSchemaVersion(config: ConfigExport): void {
  if (!isValidSchemaVersion(config.schemaVersion)) {
    throw new Error(
      `Unsupported schema version: ${config.schemaVersion}. ` +
      `Supported versions: ${SCHEMA_VERSIONS.SUPPORTED.join(', ')}`
    );
  }
}

/**
 * Validiert die vollständige Konfigurationsstruktur
 */
function validateConfigStructure(config: ConfigExport): void {
  // Metadata validieren
  if (!config.metadata || typeof config.metadata !== 'object') {
    throw new Error('Metadaten sind ungültig');
  }
  
  // Stop-Anzahl konsistenz prüfen
  if (config.metadata.stopCount !== config.config.stops.length) {
    throw new Error('Stop-Anzahl ist inkonsistent');
  }
  
  // Stops validieren
  for (let i = 0; i < config.config.stops.length; i++) {
    const stop = config.config.stops[i];
    if (!stop || typeof stop !== 'object') {
      throw new Error(`Stop ${i + 1} ist ungültig`);
    }
    
    // Erforderliche Stop-Felder prüfen
    const requiredStopFields = ['id', 'name', 'city'];
    for (const field of requiredStopFields) {
      if (!(field in stop)) {
        throw new Error(`Stop ${i + 1}: Erforderliches Feld fehlt: ${field}`);
      }
    }
  }
}

/**
 * Normalisiert Import-Daten
 */
function normalizeImportData(config: ConfigExport): ConfigExport {
  return {
    ...config,
    // Zeitstempel aktualisieren
    exportTimestamp: config.exportTimestamp || new Date().toISOString(),
    // Metadaten sicherstellen
    metadata: {
      ...config.metadata,
      stopCount: config.config.stops.length,
      language: config.config.language || 'en',
      source: config.metadata.source || 'unknown'
    },
    // Stops normalisieren
    config: {
      ...config.config,
      stops: config.config.stops.map((stop, index) => ({
        ...stop,
        position: stop.position ?? index,
        visible: stop.visible ?? true
      }))
    }
  };
}

/**
 * Export aller Funktionen als Namespace
 */
export const ImportUtils = {
  readConfigFile,
  validateFileFormat,
  processImportFile,
  handleImportError,
  supportsFileUpload,
  createFileUploadHandler,
  createWorkerFileUploadHandler,
  validateImportFile
};