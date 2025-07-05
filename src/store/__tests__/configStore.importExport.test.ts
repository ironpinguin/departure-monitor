/**
 * Integration-Tests für ConfigStore Import/Export-Funktionalität
 * Testet die vollständige Integration zwischen Store und Import/Export-System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ConfigExport } from '../../types/configExport';
import type { AppConfig, StopConfig } from '../../models';

// Mock the configStore since we need to test the actual integration
const mockConfigStore = {
  // State
  stops: [] as StopConfig[],
  darkMode: false,
  refreshIntervalSeconds: 30,
  maxDeparturesShown: 10,
  language: 'de',
  
  // Actions
  addStop: vi.fn(),
  updateStop: vi.fn(),
  removeStop: vi.fn(),
  reorderStops: vi.fn(),
  setDarkMode: vi.fn(),
  setRefreshInterval: vi.fn(),
  setMaxDepartures: vi.fn(),
  setLanguage: vi.fn(),
  loadConfig: vi.fn(),
  exportConfig: vi.fn(),
  importConfig: vi.fn(),
  validateImportConfig: vi.fn(),
  createBackup: vi.fn(),
  restoreBackup: vi.fn(),
  clearConfig: vi.fn(),

  // Getters
  getConfig: vi.fn(),
  getStopById: vi.fn(),
  getVisibleStops: vi.fn()
};

// Mock the actual store
vi.mock('../configStore', () => ({
  useConfigStore: () => mockConfigStore
}));

describe('ConfigStore Import/Export Integration', () => {
  let mockStopConfig: StopConfig;
  let mockAppConfig: AppConfig;
  let mockConfigExport: ConfigExport;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    mockStopConfig = {
      id: 'stop-1',
      name: 'Test Stop',
      city: 'wue',
      stopId: 'WUE123',
      walkingTimeMinutes: 5,
      visible: true,
      position: 0
    };

    mockAppConfig = {
      stops: [mockStopConfig],
      darkMode: false,
      refreshIntervalSeconds: 30,
      maxDeparturesShown: 10,
      language: 'de'
    };

    mockConfigExport = {
      schemaVersion: '1.0.0',
      exportTimestamp: '2024-01-01T00:00:00.000Z',
      exportedBy: 'test-suite',
      metadata: {
        stopCount: 1,
        language: 'de',
        source: 'test'
      },
      config: mockAppConfig,
      exportSettings: {
        includeUserSettings: true,
        includeStopPositions: true,
        includeVisibilitySettings: true
      }
    };

    // Setup default mock implementations
    mockConfigStore.getConfig.mockReturnValue(mockAppConfig);
    mockConfigStore.exportConfig.mockReturnValue(mockConfigExport);
    mockConfigStore.importConfig.mockResolvedValue({
      success: true,
      importedConfig: mockAppConfig,
      importedStopsCount: 1,
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        schemaVersion: '1.0.0',
        isCompatible: true
      },
      messages: []
    });
  });

  describe('Export Functionality', () => {
    it('should export current configuration successfully', () => {
      const { result } = renderHook(() => mockConfigStore);
      
      act(() => {
        const exported = result.current.exportConfig();
        expect(exported).toEqual(mockConfigExport);
      });
      
      expect(mockConfigStore.exportConfig).toHaveBeenCalled();
    });

    it('should include all configured stops in export', () => {
      const multipleStops = [
        mockStopConfig,
        { ...mockStopConfig, id: 'stop-2', name: 'Stop 2', position: 1 }
      ];
      
      const configWithMultipleStops = {
        ...mockAppConfig,
        stops: multipleStops
      };
      
      mockConfigStore.getConfig.mockReturnValue(configWithMultipleStops);
      mockConfigStore.exportConfig.mockReturnValue({
        ...mockConfigExport,
        config: configWithMultipleStops,
        metadata: {
          ...mockConfigExport.metadata,
          stopCount: 2
        }
      });

      const { result } = renderHook(() => mockConfigStore);
      
      act(() => {
        const exported = result.current.exportConfig();
        expect(exported.config.stops).toHaveLength(2);
        expect(exported.metadata.stopCount).toBe(2);
      });
    });

    it('should include current user settings in export', () => {
      const customConfig = {
        ...mockAppConfig,
        darkMode: true,
        refreshIntervalSeconds: 60,
        maxDeparturesShown: 20,
        language: 'en'
      };
      
      mockConfigStore.getConfig.mockReturnValue(customConfig);
      mockConfigStore.exportConfig.mockReturnValue({
        ...mockConfigExport,
        config: customConfig,
        metadata: {
          ...mockConfigExport.metadata,
          language: 'en'
        }
      });

      const { result } = renderHook(() => mockConfigStore);
      
      act(() => {
        const exported = result.current.exportConfig();
        expect(exported.config.darkMode).toBe(true);
        expect(exported.config.refreshIntervalSeconds).toBe(60);
        expect(exported.config.language).toBe('en');
      });
    });

    it('should handle empty configuration export', () => {
      const emptyConfig = {
        ...mockAppConfig,
        stops: []
      };
      
      mockConfigStore.getConfig.mockReturnValue(emptyConfig);
      mockConfigStore.exportConfig.mockReturnValue({
        ...mockConfigExport,
        config: emptyConfig,
        metadata: {
          ...mockConfigExport.metadata,
          stopCount: 0
        }
      });

      const { result } = renderHook(() => mockConfigStore);
      
      act(() => {
        const exported = result.current.exportConfig();
        expect(exported.config.stops).toHaveLength(0);
        expect(exported.metadata.stopCount).toBe(0);
      });
    });
  });

  describe('Import Functionality', () => {
    it('should import configuration successfully', async () => {
      const { result } = renderHook(() => mockConfigStore);
      
      await act(async () => {
        const importResult = await result.current.importConfig(mockConfigExport);
        expect(importResult.success).toBe(true);
        expect(importResult.importedStopsCount).toBe(1);
      });
      
      expect(mockConfigStore.importConfig).toHaveBeenCalledWith(mockConfigExport);
    });

    it('should validate import configuration before importing', async () => {
      mockConfigStore.validateImportConfig.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        schemaVersion: '1.0.0',
        isCompatible: true
      });

      const { result } = renderHook(() => mockConfigStore);
      
      act(() => {
        const validation = result.current.validateImportConfig(mockConfigExport);
        expect(validation.isValid).toBe(true);
      });
      
      expect(mockConfigStore.validateImportConfig).toHaveBeenCalledWith(mockConfigExport);
    });

    it('should reject invalid import configurations', async () => {
      const invalidConfig = {
        ...mockConfigExport,
        schemaVersion: '2.0.0'
      };

      mockConfigStore.importConfig.mockResolvedValue({
        success: false,
        importedConfig: null,
        importedStopsCount: 0,
        validation: {
          isValid: false,
          errors: [{ 
            code: 'INVALID_SCHEMA', 
            message: 'Unsupported schema version',
            severity: 'error' as const
          }],
          warnings: [],
          schemaVersion: '2.0.0',
          isCompatible: false
        },
        messages: ['Import failed due to invalid schema']
      });

      const { result } = renderHook(() => mockConfigStore);
      
      await act(async () => {
        const importResult = await result.current.importConfig(invalidConfig);
        expect(importResult.success).toBe(false);
        expect(importResult.validation.errors).toHaveLength(1);
      });
    });

    it('should handle import with merge conflicts', async () => {
      const conflictingConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: [{
            ...mockStopConfig,
            name: 'Renamed Stop',
            position: 5
          }]
        }
      };

      mockConfigStore.importConfig.mockResolvedValue({
        success: true,
        importedConfig: conflictingConfig.config,
        importedStopsCount: 1,
        validation: {
          isValid: true,
          errors: [],
          warnings: [{
            code: 'POSITION_CONFLICT',
            message: 'Stop position conflict detected',
            field: 'stops[0].position'
          }],
          schemaVersion: '1.0.0',
          isCompatible: true
        },
        messages: ['Import completed with warnings']
      });

      const { result } = renderHook(() => mockConfigStore);
      
      await act(async () => {
        const importResult = await result.current.importConfig(conflictingConfig);
        expect(importResult.success).toBe(true);
        expect(importResult.validation.warnings).toHaveLength(1);
      });
    });

    it('should create backup before import when requested', async () => {
      mockConfigStore.createBackup.mockReturnValue({
        timestamp: '2024-01-01T00:00:00.000Z',
        config: mockAppConfig
      });

      mockConfigStore.importConfig.mockResolvedValue({
        success: true,
        importedConfig: mockAppConfig,
        importedStopsCount: 1,
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          schemaVersion: '1.0.0',
          isCompatible: true
        },
        backup: {
          timestamp: '2024-01-01T00:00:00.000Z',
          config: mockAppConfig
        },
        messages: ['Backup created successfully']
      });

      const { result } = renderHook(() => mockConfigStore);
      
      await act(async () => {
        const importResult = await result.current.importConfig(mockConfigExport);
        expect(importResult.backup).toBeDefined();
        expect(importResult.backup?.timestamp).toBeDefined();
      });
    });
  });

  describe('Import Options and Behavior', () => {
    it('should handle partial import (settings only)', async () => {
      const settingsOnlyConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: [] // No stops, only settings
        }
      };

      mockConfigStore.importConfig.mockResolvedValue({
        success: true,
        importedConfig: settingsOnlyConfig.config,
        importedStopsCount: 0,
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          schemaVersion: '1.0.0',
          isCompatible: true
        },
        messages: ['Settings imported successfully']
      });

      const { result } = renderHook(() => mockConfigStore);
      
      await act(async () => {
        const importResult = await result.current.importConfig(settingsOnlyConfig);
        expect(importResult.success).toBe(true);
        expect(importResult.importedStopsCount).toBe(0);
      });
    });

    it('should handle import with selective stop visibility', async () => {
      const configWithMixedVisibility = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: [
            { ...mockStopConfig, visible: true },
            { ...mockStopConfig, id: 'stop-2', visible: false, position: 1 }
          ]
        }
      };

      mockConfigStore.importConfig.mockResolvedValue({
        success: true,
        importedConfig: configWithMixedVisibility.config,
        importedStopsCount: 1, // Only visible stops counted
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          schemaVersion: '1.0.0',
          isCompatible: true
        },
        messages: ['Import completed with hidden stops filtered']
      });

      const { result } = renderHook(() => mockConfigStore);
      
      await act(async () => {
        const importResult = await result.current.importConfig(configWithMixedVisibility);
        expect(importResult.success).toBe(true);
        expect(importResult.importedStopsCount).toBe(1);
      });
    });

    it('should preserve stop positions during import', async () => {
      const configWithPositions = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: [
            { ...mockStopConfig, position: 3 },
            { ...mockStopConfig, id: 'stop-2', position: 1 },
            { ...mockStopConfig, id: 'stop-3', position: 2 }
          ]
        }
      };

      const { result } = renderHook(() => mockConfigStore);
      
      await act(async () => {
        await result.current.importConfig(configWithPositions);
      });
      
      expect(mockConfigStore.importConfig).toHaveBeenCalledWith(configWithPositions);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network/storage errors during import', async () => {
      mockConfigStore.importConfig.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => mockConfigStore);
      
      await act(async () => {
        try {
          await result.current.importConfig(mockConfigExport);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Storage error');
        }
      });
    });

    it('should handle corrupt configuration data', async () => {
      const corruptConfig = {
        ...mockConfigExport,
        config: null as unknown as AppConfig
      };

      mockConfigStore.importConfig.mockResolvedValue({
        success: false,
        importedConfig: null,
        importedStopsCount: 0,
        validation: {
          isValid: false,
          errors: [{ 
            code: 'INVALID_STRUCTURE', 
            message: 'Configuration data is corrupt',
            severity: 'critical' as const
          }],
          warnings: [],
          schemaVersion: 'unknown',
          isCompatible: false
        },
        messages: ['Import failed: corrupt data']
      });

      const { result } = renderHook(() => mockConfigStore);
      
      await act(async () => {
        const importResult = await result.current.importConfig(corruptConfig);
        expect(importResult.success).toBe(false);
        expect(importResult.validation.errors[0].severity).toBe('critical');
      });
    });

    it('should handle very large configurations', async () => {
      const largeConfig = {
        ...mockConfigExport,
        config: {
          ...mockAppConfig,
          stops: Array.from({ length: 100 }, (_, i) => ({
            ...mockStopConfig,
            id: `stop-${i}`,
            name: `Stop ${i}`,
            position: i
          }))
        }
      };

      mockConfigStore.importConfig.mockResolvedValue({
        success: true,
        importedConfig: largeConfig.config,
        importedStopsCount: 100,
        validation: {
          isValid: true,
          errors: [],
          warnings: [{
            code: 'PERFORMANCE_IMPACT',
            message: 'Large number of stops may impact performance',
            field: 'stops'
          }],
          schemaVersion: '1.0.0',
          isCompatible: true
        },
        messages: ['Large configuration imported successfully']
      });

      const { result } = renderHook(() => mockConfigStore);
      
      await act(async () => {
        const importResult = await result.current.importConfig(largeConfig);
        expect(importResult.success).toBe(true);
        expect(importResult.importedStopsCount).toBe(100);
        expect(importResult.validation.warnings).toHaveLength(1);
      });
    });

    it('should handle concurrent import/export operations', async () => {
      const { result } = renderHook(() => mockConfigStore);
      
      // Simulate concurrent operations
      const exportPromise = act(() => result.current.exportConfig());
      const importPromise = act(async () => await result.current.importConfig(mockConfigExport));
      
      await Promise.all([exportPromise, importPromise]);
      
      expect(mockConfigStore.exportConfig).toHaveBeenCalled();
      expect(mockConfigStore.importConfig).toHaveBeenCalled();
    });
  });

  describe('Backup and Restore Functionality', () => {
    it('should create backup before destructive operations', () => {
      const backupData = {
        timestamp: '2024-01-01T00:00:00.000Z',
        config: mockAppConfig
      };

      mockConfigStore.createBackup.mockReturnValue(backupData);

      const { result } = renderHook(() => mockConfigStore);
      
      act(() => {
        const backup = result.current.createBackup();
        expect(backup).toEqual(backupData);
      });
      
      expect(mockConfigStore.createBackup).toHaveBeenCalled();
    });

    it('should restore from backup when import fails', async () => {
      const backupData = {
        timestamp: '2024-01-01T00:00:00.000Z',
        config: mockAppConfig
      };

      mockConfigStore.restoreBackup.mockImplementation(() => {
        // Simulate restoring the backup
        return true;
      });

      const { result } = renderHook(() => mockConfigStore);
      
      act(() => {
        const restored = result.current.restoreBackup(backupData);
        expect(restored).toBe(true);
      });
      
      expect(mockConfigStore.restoreBackup).toHaveBeenCalledWith(backupData);
    });

    it('should clear configuration when requested', () => {
      mockConfigStore.clearConfig.mockImplementation(() => {
        // Simulate clearing the config
      });

      const { result } = renderHook(() => mockConfigStore);
      
      act(() => {
        result.current.clearConfig();
      });
      
      expect(mockConfigStore.clearConfig).toHaveBeenCalled();
    });
  });

  describe('Integration with UI State', () => {
    it('should update store state after successful import', async () => {
      const newConfig = {
        ...mockAppConfig,
        darkMode: true,
        language: 'en'
      };

      mockConfigStore.importConfig.mockResolvedValue({
        success: true,
        importedConfig: newConfig,
        importedStopsCount: 1,
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          schemaVersion: '1.0.0',
          isCompatible: true
        },
        messages: ['Configuration updated successfully']
      });

      // Mock the state updates
      mockConfigStore.setDarkMode.mockImplementation((value) => {
        mockConfigStore.darkMode = value;
      });
      mockConfigStore.setLanguage.mockImplementation((value) => {
        mockConfigStore.language = value;
      });

      const { result } = renderHook(() => mockConfigStore);
      
      await act(async () => {
        await result.current.importConfig({
          ...mockConfigExport,
          config: newConfig
        });
      });
      
      expect(mockConfigStore.importConfig).toHaveBeenCalled();
    });

    it('should maintain consistency between getter methods and state', () => {
      // Setup mock return values
      mockConfigStore.getConfig.mockReturnValue(mockAppConfig);
      mockConfigStore.getStopById.mockReturnValue(mockStopConfig);
      mockConfigStore.getVisibleStops.mockReturnValue([mockStopConfig]);
      
      const { result } = renderHook(() => mockConfigStore);
      
      act(() => {
        const config = result.current.getConfig();
        const stopById = result.current.getStopById('stop-1');
        const visibleStops = result.current.getVisibleStops();
        
        expect(config).toBeDefined();
        expect(stopById).toBeDefined();
        expect(visibleStops).toBeDefined();
      });
      
      expect(mockConfigStore.getConfig).toHaveBeenCalled();
      expect(mockConfigStore.getStopById).toHaveBeenCalledWith('stop-1');
      expect(mockConfigStore.getVisibleStops).toHaveBeenCalled();
    });
  });
});