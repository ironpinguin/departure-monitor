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
      
      // Import-Funktionalität
      importConfig: async (config: ConfigExport, options: Partial<ImportOptions> = {}): Promise<ImportResult> => {
        const importOptions = createImportOptions(options);
        const currentState = get()._getState();
        const messages: string[] = [];
        
        try {
          // Enhanced Security: Additional checks before import with proper type guards
          if (!isValidConfigExport(config)) {
            return {
              success: false,
              importedConfig: null,
              importedStopsCount: 0,
              validation: {
                isValid: false,
                errors: [{
                  code: 'INVALID_CONFIG',
                  message: 'Invalid configuration object - does not match ConfigExport schema',
                  severity: 'critical' as const
                }],
                warnings: [],
                schemaVersion: isValidObject(config) ? String((config as Record<string, unknown>).schemaVersion) : 'unknown',
                isCompatible: false
              },
              messages: ['import.validation.invalid_config_object']
            };
          }

          // Security: Validate stops count doesn't exceed limits
          if (config.config?.stops && config.config.stops.length > 100) {
            return {
              success: false,
              importedConfig: null,
              importedStopsCount: 0,
              validation: {
                isValid: false,
                errors: [{
                  code: 'TOO_MANY_STOPS',
                  message: 'Configuration contains too many stops (max: 100)',
                  severity: 'error' as const
                }],
                warnings: [],
                schemaVersion: config.schemaVersion || 'unknown',
                isCompatible: false
              },
              messages: ['import.validation.too_many_stops']
            };
          }

          // Validierung vor Import
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
          
          // Backup erstellen
          let backup;
          if (importOptions.createBackup) {
            backup = get().createBackup();
            messages.push('import.validation.backup_created');
          }
          
          // Merge-Strategie anwenden
          const mergedStops = get().mergeStops(
            currentState.stops,
            config.config.stops,
            importOptions.overwriteExisting ? 'replace' : 'merge'
          );
          
          // Neue Konfiguration zusammenstellen
          const newConfig: AppConfig = {
            stops: importOptions.importOnlyVisible
              ? mergedStops.filter(stop => stop.visible)
              : mergedStops,
            darkMode: importOptions.importGlobalSettings ? config.config.darkMode : currentState.darkMode,
            refreshIntervalSeconds: importOptions.importGlobalSettings ? config.config.refreshIntervalSeconds : currentState.refreshIntervalSeconds,
            maxDeparturesShown: importOptions.importGlobalSettings ? config.config.maxDeparturesShown : currentState.maxDeparturesShown,
            language: importOptions.importGlobalSettings ? config.config.language : currentState.language,
          };
          
          // Stop-Positionen beibehalten wenn gewünscht
          if (importOptions.preserveStopPositions) {
            newConfig.stops = newConfig.stops.map((stop, index) => ({
              ...stop,
              position: index
            }));
          }
          
          // Konfiguration anwenden
          get()._setState(newConfig);
          
          const importedStopsCount = config.config.stops.length;
          messages.push(`import.validation.stops_imported`);
          
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
          
        } catch (error) {
          // Rollback bei Fehler
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
        }
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
        if (strategy === 'replace') {
          return importedStops.map((stop, index) => ({
            ...stop,
            position: index
          }));
        }
        
        // Merge-Strategie: Intelligente Zusammenführung
        const merged = [...existingStops];
        
        importedStops.forEach(importedStop => {
          const existingIndex = merged.findIndex(s => s.id === importedStop.id);
          
          if (existingIndex >= 0) {
            // Stop existiert bereits - Update mit importierten Daten
            merged[existingIndex] = {
              ...merged[existingIndex],
              ...importedStop,
              // Position beibehalten es sei denn explizit überschrieben
              position: merged[existingIndex].position
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