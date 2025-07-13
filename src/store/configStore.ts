import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppConfig, StopConfig } from '../models';
import type {
  ConfigExport,
  ImportOptions,
  ImportResult,
  ValidationResult,
  ImportPreview
} from '../types/configExport';
import { validateConfigStructure, createImportPreview } from '../utils/configValidation';
import { createConfigExport, createImportOptions, createValidationContext } from '../utils/configExportUtils';
import { loggers } from '../utils/logger';
import { isValidConfigExport, isValidObject } from '../types/configExport';

interface ConfigState extends AppConfig {
  // Bestehende Setter
  setStops: (stops: StopConfig[]) => void;
  setDarkMode: (darkMode: boolean) => void;
  setRefreshIntervalSeconds: (seconds: number) => void;
  setMaxDeparturesShown: (count: number) => void;
  setLanguage: (language: string) => void;
  
  // Export/Import-Funktionalität
  exportConfig: () => ConfigExport;
  importConfig: (config: ConfigExport, options?: Partial<ImportOptions>) => Promise<ImportResult>;
  validateConfig: (config: ConfigExport) => ValidationResult;
  previewImport: (config: ConfigExport) => ImportPreview;
  mergeStops: (existingStops: StopConfig[], importedStops: StopConfig[], strategy?: 'replace' | 'merge') => StopConfig[];
  
  // Backup/Restore-Funktionalität
  createBackup: () => { timestamp: string; config: AppConfig };
  restoreFromBackup: (backup: { timestamp: string; config: AppConfig }) => boolean;
  
  // Interne Hilfsfunktionen
  _getState: () => AppConfig;
  _setState: (config: AppConfig) => void;
  
  // Extracted import helper functions for reduced complexity
  _validateImportPreConditions: (config: ConfigExport, importOptions: ImportOptions) => ImportResult | null;
  _createBackupIfRequested: (importOptions: ImportOptions) => { timestamp: string; config: AppConfig } | undefined;
  _processMergeStrategy: (currentState: AppConfig, config: ConfigExport, importOptions: ImportOptions) => StopConfig[];
  _buildNewConfiguration: (currentState: AppConfig, config: ConfigExport, mergedStops: StopConfig[], importOptions: ImportOptions) => AppConfig;
  _buildSuccessResult: (config: ConfigExport, newConfig: AppConfig, backup: { timestamp: string; config: AppConfig } | undefined, importOptions: ImportOptions) => ImportResult;
  _handleImportError: (error: unknown, config: ConfigExport) => ImportResult;
  _createValidationErrorResult: (code: string, message: string, config: ConfigExport) => ImportResult;
}

// Load initial state from localStorage if available
const getInitialState = (): AppConfig => {
  const defaultState: AppConfig = {
    stops: [],
    darkMode: false,
    refreshIntervalSeconds: 60, // default 1 minute
    maxDeparturesShown: 10, // default number of departures to show
    language: 'en', // default language is English
  };
  
  return defaultState;
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),
      
      // Bestehende Setter
      setStops: (stops: StopConfig[]) => set({ stops }),
      setDarkMode: (darkMode: boolean) => set({ darkMode }),
      setRefreshIntervalSeconds: (seconds: number) => {
        if (seconds < 60) seconds = 60;
        set({ refreshIntervalSeconds: seconds });
      },
      setMaxDeparturesShown: (count: number) => {
        if (count < 1) count = 1;
        set({ maxDeparturesShown: count });
      },
      setLanguage: (language: string) => set({ language }),
      
      // Export-Funktionalität
      exportConfig: (): ConfigExport => {
        const currentState = get()._getState();
        return createConfigExport(currentState, {
          includeUserSettings: true,
          includeStopPositions: true,
          includeVisibilitySettings: true,
          source: 'departure-monitor-app'
        });
      },
      
      // Import-Funktionalität - Refactored for reduced complexity
      importConfig: async (config: ConfigExport, options: Partial<ImportOptions> = {}): Promise<ImportResult> => {
        const importOptions = createImportOptions(options);
        const currentState = get()._getState();
        
        // Early validation - extract complex validation logic
        const validationResult = get()._validateImportPreConditions(config, importOptions);
        if (validationResult) {
          return validationResult;
        }
        
        try {
          // Process import with extracted helper functions
          const backup = get()._createBackupIfRequested(importOptions);
          const mergedStops = get()._processMergeStrategy(currentState, config, importOptions);
          const newConfig = get()._buildNewConfiguration(currentState, config, mergedStops, importOptions);
          
          // Apply configuration
          get()._setState(newConfig);
          
          // Build success result
          return get()._buildSuccessResult(config, newConfig, backup, importOptions);
          
        } catch (error) {
          return get()._handleImportError(error, config);
        }
      },
      
      // Extracted validation logic for better maintainability
      _validateImportPreConditions: (config: ConfigExport, importOptions: ImportOptions) => {
        // Type validation with early return
        if (!isValidConfigExport(config)) {
          return get()._createValidationErrorResult(
            'INVALID_CONFIG',
            'Invalid configuration object - does not match ConfigExport schema',
            config
          );
        }
        
        // Security validation with early return
        if (config.config?.stops && config.config.stops.length > 100) {
          return get()._createValidationErrorResult(
            'TOO_MANY_STOPS',
            'Configuration contains too many stops (max: 100)',
            config
          );
        }
        
        // Pre-import validation with early return
        if (importOptions.validateBeforeImport) {
          const validation = get().validateConfig(config);
          if (!validation.isValid) {
            return {
              success: false,
              importedConfig: null,
              importedStopsCount: 0,
              validation,
              messages: ['import.validation.import_cancelled']
            };
          }
        }
        
        // Return null for success case (no error)
        return null;
      },
      
      // Extracted backup creation logic
      _createBackupIfRequested: (importOptions: ImportOptions) => {
        if (!importOptions.createBackup) {
          return undefined;
        }
        return get().createBackup();
      },
      
      // Extracted merge strategy logic
      _processMergeStrategy: (currentState: AppConfig, config: ConfigExport, importOptions: ImportOptions) => {
        return get().mergeStops(
          currentState.stops,
          config.config.stops,
          importOptions.overwriteExisting ? 'replace' : 'merge'
        );
      },
      
      // Extracted configuration building logic
      _buildNewConfiguration: (currentState: AppConfig, config: ConfigExport, mergedStops: StopConfig[], importOptions: ImportOptions): AppConfig => {
        let finalStops = importOptions.importOnlyVisible
          ? mergedStops.filter(stop => stop.visible)
          : mergedStops;
          
        // Apply position preservation if requested
        if (importOptions.preserveStopPositions) {
          finalStops = finalStops.map((stop, index) => ({
            ...stop,
            position: index
          }));
        }
        
        return {
          stops: finalStops,
          darkMode: importOptions.importGlobalSettings ? config.config.darkMode : currentState.darkMode,
          refreshIntervalSeconds: importOptions.importGlobalSettings ? config.config.refreshIntervalSeconds : currentState.refreshIntervalSeconds,
          maxDeparturesShown: importOptions.importGlobalSettings ? config.config.maxDeparturesShown : currentState.maxDeparturesShown,
          language: importOptions.importGlobalSettings ? config.config.language : currentState.language,
        };
      },
      
      // Extracted success result building
      _buildSuccessResult: (config: ConfigExport, newConfig: AppConfig, backup: { timestamp: string; config: AppConfig } | undefined, importOptions: ImportOptions) => {
        const messages: string[] = [];
        const importedStopsCount = config.config.stops.length;
        
        messages.push('import.validation.stops_imported');
        
        if (backup) {
          messages.push('import.validation.backup_created');
        }
        
        if (importOptions.importGlobalSettings) {
          messages.push('import.validation.global_settings_applied');
        }
        
        return {
          success: true,
          importedConfig: newConfig,
          importedStopsCount,
          validation: get().validateConfig(config),
          backup,
          messages
        };
      },
      
      // Extracted error handling logic
      _handleImportError: (error: unknown, config: ConfigExport) => {
        loggers.configStore.error('Import operation failed', {
          context: 'configStore.importConfig',
          configSchemaVersion: config.schemaVersion,
          errorCode: 'IMPORT_ERROR'
        }, error instanceof Error ? error : new Error(String(error)));
        
        return {
          success: false,
          importedConfig: null,
          importedStopsCount: 0,
          validation: {
            isValid: false,
            errors: [{
              code: 'IMPORT_ERROR',
              message: error instanceof Error ? error.message : 'import.validation.unknown_import_error',
              severity: 'critical' as const
            }],
            warnings: [],
            schemaVersion: config.schemaVersion,
            isCompatible: false
          },
          messages: ['import.validation.import_failed']
        };
      },
      
      // Extracted validation error result creation
      _createValidationErrorResult: (code: string, message: string, config: ConfigExport) => {
        return {
          success: false,
          importedConfig: null,
          importedStopsCount: 0,
          validation: {
            isValid: false,
            errors: [{
              code,
              message,
              severity: 'error' as const
            }],
            warnings: [],
            schemaVersion: isValidObject(config) ? String((config as Record<string, unknown>).schemaVersion) : 'unknown',
            isCompatible: false
          },
          messages: [`import.validation.${code.toLowerCase()}`]
        };
      },
      
      // Validierungs-Funktionalität
      validateConfig: (config: ConfigExport): ValidationResult => {
        const context = createValidationContext({
          schemaVersion: config.schemaVersion,
          strict: false,
          options: {
            checkDuplicates: true,
            validateReferences: true,
            deepValidation: true
          }
        });
        
        return validateConfigStructure(config, context);
      },
      
      // Import-Vorschau
      previewImport: (config: ConfigExport): ImportPreview => {
        const currentState = get()._getState();
        return createImportPreview(config, currentState);
      },
      
      // Merge-Logik für Stops
      mergeStops: (existingStops: StopConfig[], importedStops: StopConfig[], strategy: 'replace' | 'merge' = 'merge'): StopConfig[] => {
        // Null/undefined checks für Input-Parameter
        if (!Array.isArray(existingStops)) {
          loggers.configStore.warn('mergeStops: existingStops is not an array', { existingStops });
          existingStops = [];
        }
        
        if (!Array.isArray(importedStops)) {
          loggers.configStore.warn('mergeStops: importedStops is not an array', { importedStops });
          return existingStops;
        }

        if (strategy === 'replace') {
          return importedStops
            .filter(stop => stop != null) // Null-safe filtering
            .map((stop, index) => ({
              ...stop,
              position: index
            }));
        }
        
        // Merge-Strategie: Intelligente Zusammenführung
        const merged = [...existingStops];
        
        importedStops.forEach(importedStop => {
          // Kritische Null-Checks für importedStop
          if (!importedStop || typeof importedStop !== 'object') {
            loggers.configStore.warn('mergeStops: Invalid importedStop detected', { importedStop });
            return; // Skip invalid stops
          }
          
          // Null-safe ID-Vergleich
          if (!importedStop.id) {
            loggers.configStore.warn('mergeStops: importedStop missing ID', { importedStop });
            return; // Skip stops without ID
          }
          
          const existingIndex = merged.findIndex(s => s?.id === importedStop.id);
          
          if (existingIndex >= 0) {
            // Stop existiert bereits - Update mit importierten Daten
            merged[existingIndex] = {
              ...merged[existingIndex],
              ...importedStop,
              // Position beibehalten es sei denn explizit überschrieben
              position: merged[existingIndex]?.position ?? merged.length
            };
          } else {
            // Neuer Stop - am Ende hinzufügen
            merged.push({
              ...importedStop,
              position: merged.length
            });
          }
        });
        
        return merged;
      },
      
      // Backup-Funktionalität
      createBackup: (): { timestamp: string; config: AppConfig } => {
        const currentState = get()._getState();
        return {
          timestamp: new Date().toISOString(),
          config: { ...currentState }
        };
      },
      
      // Restore-Funktionalität
      restoreFromBackup: (backup: { timestamp: string; config: AppConfig }): boolean => {
        try {
          get()._setState(backup.config);
          return true;
        } catch (error) {
          loggers.configStore.error('Backup restore operation failed', {
            context: 'configStore.restoreFromBackup',
            backupTimestamp: backup.timestamp,
            errorCode: 'RESTORE_ERROR'
          }, error instanceof Error ? error : new Error(String(error)));
          return false;
        }
      },
      
      // Interne Hilfsfunktionen
      _getState: (): AppConfig => {
        const state = get();
        return {
          stops: state.stops,
          darkMode: state.darkMode,
          refreshIntervalSeconds: state.refreshIntervalSeconds,
          maxDeparturesShown: state.maxDeparturesShown,
          language: state.language,
        };
      },
      
      _setState: (config: AppConfig): void => {
        set({
          stops: config.stops,
          darkMode: config.darkMode,
          refreshIntervalSeconds: config.refreshIntervalSeconds,
          maxDeparturesShown: config.maxDeparturesShown,
          language: config.language,
        });
      },
    }),
    {
      name: 'departure-monitor-config',
      storage: createJSONStorage(() => localStorage),
    }
  )
);