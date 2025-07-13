/**
 * Tests für das strukturierte Logging-System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  logger, 
  loggers, 
  createLogger, 
  configureLogging, 
  LogLevel,
  extractErrorInfo 
} from '../logger';

describe('Logger System', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    log: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Console-Methoden mocken
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    // Spies zurücksetzen
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('Grundlegende Logging-Funktionen', () => {
    it('sollte Debug-Nachrichten korrekt loggen', () => {
      logger.debug('Test debug message', { testData: 'value' });
      
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('Test debug message'),
        { testData: 'value' },
        undefined
      );
    });

    it('sollte Info-Nachrichten korrekt loggen', () => {
      logger.info('Test info message', { testData: 'value' });
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('Test info message'),
        { testData: 'value' },
        undefined
      );
    });

    it('sollte Warn-Nachrichten korrekt loggen', () => {
      logger.warn('Test warn message', { testData: 'value' });
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Test warn message'),
        { testData: 'value' },
        undefined
      );
    });

    it('sollte Error-Nachrichten korrekt loggen', () => {
      const testError = new Error('Test error');
      logger.error('Test error message', { testData: 'value' }, testError);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error message'),
        { testData: 'value' },
        {
          name: 'Error',
          message: 'Test error',
          stack: undefined // Stack wird in Test-Umgebung deaktiviert
        }
      );
    });

    it('sollte Critical-Nachrichten korrekt loggen', () => {
      const testError = new Error('Critical error');
      logger.critical('Test critical message', { testData: 'value' }, testError);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Test critical message'),
        { testData: 'value' },
        {
          name: 'Error',
          message: 'Critical error',
          stack: undefined // Stack wird in Test-Umgebung deaktiviert
        }
      );
    });
  });

  describe('Kontext-spezifische Logger', () => {
    it('sollte Logger mit spezifischem Kontext erstellen', () => {
      const customLogger = createLogger('TestContext');
      customLogger.info('Test message');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext]'),
        undefined,
        undefined
      );
    });

    it('sollte vordefinierte Logger verwenden', () => {
      loggers.configStore.error('Config store error', { context: 'test' });
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ConfigStore]'),
        { context: 'test' },
        undefined
      );
    });

    it('sollte Child-Logger erstellen', () => {
      const childLogger = logger.createChild('Child');
      childLogger.info('Child message');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[DepartureMonitor:Child]'),
        undefined,
        undefined
      );
    });
  });

  describe('Log-Level-Konfiguration', () => {
    it('sollte Log-Level respektieren', () => {
      // Logger auf WARN-Level setzen
      configureLogging({ level: LogLevel.WARN });
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      
      // Zurücksetzen auf DEBUG
      configureLogging({ level: LogLevel.DEBUG });
    });

    it('sollte Console-Output deaktivieren können', () => {
      configureLogging({ enableConsoleOutput: false });
      
      logger.info('Test message');
      
      expect(consoleSpy.info).not.toHaveBeenCalled();
      
      // Zurücksetzen
      configureLogging({ enableConsoleOutput: true });
    });
  });

  describe('Error-Handling', () => {
    it('sollte extractErrorInfo für Error-Objekte korrekt funktionieren', () => {
      const testError = new Error('Test error message');
      const result = extractErrorInfo(testError);
      
      expect(result.message).toBe('Test error message');
      expect(result.data).toEqual({
        name: 'Error',
        stack: expect.any(String)
      });
    });

    it('sollte extractErrorInfo für Strings korrekt funktionieren', () => {
      const result = extractErrorInfo('String error');
      
      expect(result.message).toBe('String error');
      expect(result.data).toBeUndefined();
    });

    it('sollte extractErrorInfo für unbekannte Fehler korrekt funktionieren', () => {
      const result = extractErrorInfo(null);
      
      expect(result.message).toBe('Unknown error occurred');
      expect(result.data).toEqual({ error: 'null' });
    });
  });

  describe('Strukturierte Ausgabe', () => {
    it('sollte strukturierte Logs in der Entwicklungsumgebung ausgeben', () => {
      // NODE_ENV auf development setzen
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      configureLogging({ enableStructuredOutput: true });
      
      logger.info('Structured test message', { testData: 'value' });
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'STRUCTURED_LOG:',
        expect.stringContaining('Structured test message')
      );
      
      // Zurücksetzen
      process.env.NODE_ENV = originalEnv;
      configureLogging({ enableStructuredOutput: false });
    });
  });

  describe('Import/Export-spezifische Logger', () => {
    it('sollte Import/Export-Logger korrekt verwenden', () => {
      loggers.importExport.error('Import failed', {
        context: 'importUtils.readConfigFile',
        fileName: 'test.json',
        fileSize: 1024
      });
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ImportExport]'),
        {
          context: 'importUtils.readConfigFile',
          fileName: 'test.json',
          fileSize: 1024
        },
        undefined
      );
    });

    it('sollte Validation-Logger korrekt verwenden', () => {
      loggers.validation.warn('Validation warning', {
        context: 'configValidation.validateConfig',
        validationCode: 'MISSING_FIELD'
      });
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Validation]'),
        {
          context: 'configValidation.validateConfig',
          validationCode: 'MISSING_FIELD'
        },
        undefined
      );
    });
  });
});