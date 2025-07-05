/**
 * Lazy Loading für Import-Dialog-Komponenten
 * Reduziert die initiale Bundle-Größe durch Code-Splitting
 */

import React from 'react';

/**
 * Preload-Funktion für Import-Komponenten
 * Kann verwendet werden, um Komponenten proaktiv zu laden
 */
export const preloadImportComponents = (): void => {
  // Komponenten vorab laden
  import('./ImportConfirmationDialog');
  import('./ImportPreviewComponent');
  import('./ImportOptionsComponent');
};

/**
 * Hook für intelligentes Preloading
 */
export const useImportComponentPreloader = (): {
  preloadOnHover: () => void;
  preloadOnFocus: () => void;
  preloadImmediate: () => void;
} => {
  const preloadOnHover = React.useCallback(() => {
    // Preload bei Hover über Import-Button
    setTimeout(() => {
      preloadImportComponents();
    }, 100);
  }, []);

  const preloadOnFocus = React.useCallback(() => {
    // Preload bei Focus auf Import-Button
    setTimeout(() => {
      preloadImportComponents();
    }, 50);
  }, []);

  const preloadImmediate = React.useCallback(() => {
    // Sofortiges Preloading
    preloadImportComponents();
  }, []);

  return {
    preloadOnHover,
    preloadOnFocus,
    preloadImmediate
  };
};

/**
 * Bundle-Size-Monitor für Import-Komponenten
 */
export const ImportComponentsMetrics = {
  /**
   * Geschätzte Größe der Import-Komponenten
   */
  estimatedBundleSize: {
    ImportConfirmationDialog: 8500, // ~8.5KB
    ImportPreviewComponent: 12000, // ~12KB
    ImportOptionsComponent: 6000, // ~6KB
    total: 26500 // ~26.5KB
  },

  /**
   * Lazy-Loading-Einsparungen
   */
  lazySavings: {
    initialBundleReduction: 26500, // Einsparung beim initialen Bundle
    loadOnDemand: true,
    preloadingAvailable: true
  },

  /**
   * Performance-Metriken
   */
  getPerformanceMetrics: () => ({
    componentsLoaded: [
      'ImportConfirmationDialog',
      'ImportPreviewComponent',
      'ImportOptionsComponent'
    ].filter(comp => {
      // Prüfe, ob Komponente bereits geladen wurde
      try {
        const windowWithWebpack = window as Window & {
          __webpack_require__?: {
            cache: Record<string, unknown>;
          };
        };
        return !!(windowWithWebpack.__webpack_require__?.cache[comp]);
      } catch {
        return false;
      }
    }).length,
    totalComponents: 3,
    estimatedSavings: 26500
  })
};
