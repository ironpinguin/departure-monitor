/**
 * Import-Utilities für Datei-Upload und JSON-Parsing
 * Implementiert die vollständige Import-Funktionalität mit Validierung
 */

import type { ConfigExport } from '../types/configExport';
import { SCHEMA_VERSIONS, isValidSchemaVersion } from '../types/configExport';

/**
 * Liest und parst eine Config-Datei
 */
export async function readConfigFile(file: File): Promise<ConfigExport> {
  try {
    // Dateiformat validieren
    if (!validateFileFormat(file)) {
      throw new Error('Ungültiges Dateiformat. Nur .json-Dateien sind erlaubt.');
    }

    // Dateigröße prüfen (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error('Datei ist zu groß. Maximum: 10MB');
    }

    // Datei als Text lesen
    const text = await readFileAsText(file);
    
    // JSON parsen
    const config = parseConfigJSON(text);
    
    // Grundlegende Validierung
    validateBasicStructure(config);
    
    return config;
  } catch (error) {
    console.error('Fehler beim Lesen der Config-Datei:', error);
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
    console.error('Fehler beim Verarbeiten der Import-Datei:', error);
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
    
    return parsed as ConfigExport;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('JSON-Syntax ist ungültig: ' + error.message);
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
  validateImportFile
};