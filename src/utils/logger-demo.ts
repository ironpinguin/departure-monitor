/**
 * Demo-Datei für das neue strukturierte Logging-System
 * Diese Datei zeigt die wichtigsten Funktionen des Logger-Systems
 */

import { logger, loggers, createLogger, configureLogging, LogLevel, extractErrorInfo } from './logger';

/**
 * Demonstriert die Funktionalität des Logger-Systems
 */
export function demonstrateLoggingSystem(): void {
  console.log('=== Strukturiertes Logging-System Demo ===\n');

  // 1. Grundlegende Logging-Funktionen
  console.log('1. Grundlegende Logging-Funktionen:');
  logger.debug('Debug-Message für Entwicklung', { module: 'demo', step: 1 });
  logger.info('Info-Message für allgemeine Informationen', { module: 'demo', step: 2 });
  logger.warn('Warn-Message für Warnungen', { module: 'demo', step: 3 });
  logger.error('Error-Message für Fehler', { module: 'demo', step: 4 });
  logger.critical('Critical-Message für kritische Fehler', { module: 'demo', step: 5 });

  console.log('\n2. Kontext-spezifische Logger:');
  
  // 2. Import/Export-spezifische Logger
  loggers.importExport.info('Import-Operation gestartet', {
    context: 'demo.importConfig',
    fileName: 'test-config.json',
    fileSize: 1024
  });

  loggers.configStore.error('Konfiguration konnte nicht geladen werden', {
    context: 'demo.loadConfig',
    configVersion: '1.0.0',
    errorCode: 'CONFIG_NOT_FOUND'
  });

  loggers.validation.warn('Validierung fehlgeschlagen', {
    context: 'demo.validateConfig',
    fieldName: 'stops',
    validationRule: 'required'
  });

  // 3. Custom Logger
  console.log('\n3. Custom Logger:');
  const customLogger = createLogger('CustomModule');
  customLogger.info('Custom Logger Message', { customData: 'test' });

  // 4. Child Logger
  console.log('\n4. Child Logger:');
  const childLogger = logger.createChild('ChildModule');
  childLogger.info('Child Logger Message', { childData: 'test' });

  // 5. Error-Handling-Demo
  console.log('\n5. Error-Handling:');
  try {
    throw new Error('Demo-Fehler für Logging-Test');
  } catch (error) {
    const errorInfo = extractErrorInfo(error);
    logger.error('Fehler aufgetreten', {
      context: 'demo.errorHandling',
      ...errorInfo.data
    }, error instanceof Error ? error : new Error(String(error)));
  }

  // 6. Log-Level-Demo
  console.log('\n6. Log-Level-Konfiguration:');
  console.log('Setze Log-Level auf WARN...');
  configureLogging({ level: LogLevel.WARN });
  
  logger.debug('Diese Debug-Message wird nicht angezeigt');
  logger.info('Diese Info-Message wird nicht angezeigt');
  logger.warn('Diese Warn-Message wird angezeigt');
  logger.error('Diese Error-Message wird angezeigt');

  // Zurücksetzen auf DEBUG
  console.log('\nSetze Log-Level zurück auf DEBUG...');
  configureLogging({ level: LogLevel.DEBUG });
  
  logger.debug('Diese Debug-Message wird wieder angezeigt');
  logger.info('Diese Info-Message wird wieder angezeigt');

  console.log('\n=== Demo abgeschlossen ===\n');
}

/**
 * Demonstriert Import/Export-spezifisches Logging
 */
export function demonstrateImportExportLogging(): void {
  console.log('=== Import/Export Logging Demo ===\n');

  // Simuliere Import-Operation
  loggers.importExport.info('Import-Operation gestartet', {
    context: 'importUtils.processImportFile',
    fileName: 'my-config.json',
    fileSize: 2048,
    fileType: 'application/json'
  });

  // Simuliere Validierungsfehler
  loggers.validation.error('Validierung fehlgeschlagen', {
    context: 'configValidation.validateConfig',
    errorCode: 'MISSING_REQUIRED_FIELD',
    fieldName: 'stops',
    expectedType: 'array'
  });

  // Simuliere Export-Operation
  loggers.utils.info('Export-Operation erfolgreich', {
    context: 'exportUtils.downloadConfigFile',
    fileName: 'export-2025-01-07.json',
    fileSize: 1536,
    stopCount: 5
  });

  // Simuliere Worker-Fehler
  loggers.utils.warn('Worker-Initialisierung fehlgeschlagen', {
    context: 'workerManager.initializeWorker',
    workerSupported: false,
    fallbackUsed: true
  });

  console.log('\n=== Import/Export Demo abgeschlossen ===\n');
}

// Für manuelle Tests
if (require.main === module) {
  demonstrateLoggingSystem();
  demonstrateImportExportLogging();
}