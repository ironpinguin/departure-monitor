/**
 * Export-Utilities für Browser-Download und Datei-Export
 * Implementiert die vollständige Export-Funktionalität mit Browser-Download
 */

import type { ConfigExport } from '../types/configExport';
import { estimateExportSize } from './configExportUtils';

/**
 * Browser-Download-Funktionalität für JSON-Dateien
 * Erstellt einen Download-Link und löst den Download automatisch aus
 */
export function downloadConfigFile(config: ConfigExport, filename?: string): void {
  try {
    // Dateiname generieren falls nicht angegeben
    const exportFilename = filename || generateExportFilename(config);
    
    // Konfiguration für Download formatieren
    const formattedContent = formatConfigForDownload(config);
    
    // Blob erstellen
    const blob = new Blob([formattedContent], { 
      type: 'application/json;charset=utf-8' 
    });
    
    // Browser-Kompatibilität prüfen und Download ausführen
    if (supportsDownloadAPI()) {
      // Moderne Browser: Download API verwenden
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportFilename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // URL-Objekt wieder freigeben
      URL.revokeObjectURL(url);
    } else {
      // Fallback für ältere Browser
      downloadWithFallback(formattedContent, exportFilename);
    }
  } catch (error) {
    console.error('Download-Fehler:', error);
    throw new Error(`Download fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Generiert einen Dateinamen für den Export mit Zeitstempel
 */
export function generateExportFilename(config: ConfigExport): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '-');
  
  const stopCount = config.config.stops.length;
  const language = config.config.language;
  
  return `departure-monitor-config-${stopCount}stops-${language}-${timestamp}.json`;
}

/**
 * Formatiert die Konfiguration für den Download
 * Pretty-Print mit 2-Space-Indentation und Metadaten-Anreicherung
 */
export function formatConfigForDownload(config: ConfigExport): string {
  try {
    // Metadaten anreichern
    const enrichedConfig: ConfigExport = {
      ...config,
      exportTimestamp: new Date().toISOString(),
      exportedBy: 'departure-monitor-app'
    };
    
    // JSON mit Pretty-Print formatieren
    return JSON.stringify(enrichedConfig, null, 2);
  } catch (error) {
    console.error('Formatierungsfehler:', error);
    throw new Error(`Formatierung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

/**
 * Validiert Export-Daten vor dem Download
 */
export function validateExportData(config: ConfigExport): boolean {
  try {
    // Grundlegende Struktur prüfen
    if (!config || typeof config !== 'object') {
      return false;
    }
    
    // Erforderliche Felder prüfen
    const requiredFields = ['schemaVersion', 'exportTimestamp', 'config', 'metadata'];
    for (const field of requiredFields) {
      if (!(field in config)) {
        console.warn(`Fehlendes Feld: ${field}`);
        return false;
      }
    }
    
    // Konfiguration validieren
    if (!config.config || typeof config.config !== 'object') {
      return false;
    }
    
    // Stops validieren
    if (!Array.isArray(config.config.stops)) {
      return false;
    }
    
    // Metadaten validieren
    if (!config.metadata || typeof config.metadata !== 'object') {
      return false;
    }
    
    // Stop-Anzahl konsistenz prüfen
    if (config.metadata.stopCount !== config.config.stops.length) {
      console.warn('Stop-Anzahl inkonsistent');
      return false;
    }
    
    // JSON-Serialisierung testen
    JSON.stringify(config);
    
    return true;
  } catch (error) {
    console.error('Validierungsfehler:', error);
    return false;
  }
}

/**
 * Schätzt die Dateigröße vor dem Export
 */
export function estimateFileSize(config: ConfigExport): {
  estimatedSizeBytes: number;
  estimatedSizeFormatted: string;
  estimatedSizeHuman: string;
} {
  const { estimatedSizeBytes, estimatedSizeFormatted } = estimateExportSize(config, 'json');
  
  return {
    estimatedSizeBytes,
    estimatedSizeFormatted,
    estimatedSizeHuman: formatBytesHuman(estimatedSizeBytes)
  };
}

/**
 * Prüft Browser-Kompatibilität für Download-API
 */
export function supportsDownloadAPI(): boolean {
  // Prüfe ob moderne Download-APIs verfügbar sind
  return !!(
    typeof window !== 'undefined' &&
    window.document &&
    typeof document.createElement === 'function' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function' &&
    typeof Blob !== 'undefined'
  );
}

/**
 * Fallback-Mechanismus für ältere Browser
 */
function downloadWithFallback(content: string, filename: string): void {
  try {
    // Versuche mit msSaveBlob (Internet Explorer)
    const navigatorWithMsSave = navigator as Navigator & {
      msSaveBlob?: (blob: Blob, filename: string) => void;
    };
    
    if (typeof navigatorWithMsSave.msSaveBlob !== 'undefined') {
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
      navigatorWithMsSave.msSaveBlob(blob, filename);
      return;
    }
    
    // Fallback: Öffne neues Fenster mit Inhalt
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(content);
    const newWindow = window.open(dataUri, '_blank');
    
    if (!newWindow) {
      throw new Error('Popup wurde blockiert');
    }
    
    // Zeige Anweisungen für manuellen Download
    setTimeout(() => {
      alert(
        'Bitte speichern Sie die Datei manuell:\n' +
        '1. Rechtsklick auf die Seite\n' +
        '2. "Speichern unter..." wählen\n' +
        `3. Dateiname: ${filename}`
      );
    }, 1000);
  } catch (error) {
    console.error('Fallback-Download fehlgeschlagen:', error);
    throw new Error('Download in diesem Browser nicht unterstützt');
  }
}

/**
 * Formatiert Bytes in menschenlesbare Form
 */
function formatBytesHuman(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const value = bytes / Math.pow(k, i);
  const formatted = value < 10 ? value.toFixed(1) : Math.round(value);
  
  return `${formatted} ${sizes[i]}`;
}

/**
 * Erstellt eine Export-Zusammenfassung für das UI
 */
export function createExportSummary(config: ConfigExport): {
  filename: string;
  size: string;
  stopCount: number;
  language: string;
  timestamp: string;
} {
  const filename = generateExportFilename(config);
  const { estimatedSizeHuman } = estimateFileSize(config);
  
  return {
    filename,
    size: estimatedSizeHuman,
    stopCount: config.config.stops.length,
    language: config.config.language,
    timestamp: new Date().toLocaleString('de-DE')
  };
}

/**
 * Testet die Export-Funktionalität
 */
export function testExportFunctionality(): {
  downloadAPISupported: boolean;
  blobSupported: boolean;
  urlSupported: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  const downloadAPISupported = supportsDownloadAPI();
  const blobSupported = typeof Blob !== 'undefined';
  const urlSupported = typeof URL !== 'undefined' && !!URL.createObjectURL;
  
  if (!downloadAPISupported) {
    errors.push('Download-API nicht unterstützt');
  }
  
  if (!blobSupported) {
    errors.push('Blob-API nicht unterstützt');
  }
  
  if (!urlSupported) {
    errors.push('URL-API nicht unterstützt');
  }
  
  return {
    downloadAPISupported,
    blobSupported,
    urlSupported,
    errors
  };
}

/**
 * Export aller Funktionen als Namespace
 */
export const ExportUtils = {
  downloadConfigFile,
  generateExportFilename,
  formatConfigForDownload,
  validateExportData,
  estimateFileSize,
  supportsDownloadAPI,
  createExportSummary,
  testExportFunctionality,
  formatBytesHuman
};