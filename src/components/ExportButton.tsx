/**
 * ExportButton-Komponente
 * Standalone Export-Button mit Loading-States und Feedback
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfigStore } from '../store/configStore';
import { createExportSummary } from '../utils/exportUtils';
import type { ConfigExport } from '../types/configExport';
import { loggers } from '../utils/logger';

interface ExportButtonProps {
  /** Zusätzliche CSS-Klassen */
  className?: string;
  /** Button-Variante */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button-Größe */
  size?: 'small' | 'medium' | 'large';
  /** Zeigt Details der zu exportierenden Konfiguration */
  showDetails?: boolean;
  /** Callback bei erfolgreichem Export */
  onExportSuccess?: (summary: ReturnType<typeof createExportSummary>) => void;
  /** Callback bei Export-Fehler */
  onExportError?: (error: string) => void;
  /** Deaktiviert den Button */
  disabled?: boolean;
  /** Custom Button-Text */
  buttonText?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  className = '',
  variant = 'primary',
  size = 'medium',
  showDetails = false,
  onExportSuccess,
  onExportError,
  disabled = false,
  buttonText
}) => {
  const { t } = useTranslation();
  const { exportConfig } = useConfigStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportSummary, setExportSummary] = useState<ReturnType<typeof createExportSummary> | null>(null);

  // Button-Styling basierend auf Variante und Größe
  const getButtonClasses = useCallback(() => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
    
    // Größen-Klassen
    const sizeClasses = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-sm',
      large: 'px-6 py-3 text-base'
    };
    
    // Varianten-Klassen
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:bg-blue-300',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 disabled:bg-gray-300',
      outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 disabled:border-blue-300 disabled:text-blue-300'
    };
    
    const disabledClasses = disabled || isExporting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';
    
    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`;
  }, [variant, size, disabled, isExporting, className]);

  // Export-Funktionalität
  const handleExport = useCallback(async () => {
    if (disabled || isExporting) return;
    
    setIsExporting(true);
    
    try {
      // Konfiguration exportieren
      const configExport: ConfigExport = exportConfig();
      
      // Export-Zusammenfassung erstellen (vor Worker-Aufruf)
      const summary = createExportSummary(configExport);
      setExportSummary(summary);
      
      // Worker-basierter Export mit Validierung
      const { downloadConfigFileWithWorker } = await import('../utils/exportUtils');
      await downloadConfigFileWithWorker(configExport);
      
      // Erfolg-Callback
      if (onExportSuccess) {
        onExportSuccess(summary);
      }
      
      // Toast-Benachrichtigung (falls verfügbar)
      const windowWithToast = window as Window & {
        showToast?: (options: {
          type: 'success' | 'error' | 'warning' | 'info';
          message: string;
          details?: string;
        }) => void;
      };
      
      if (typeof window !== 'undefined' && windowWithToast.showToast) {
        windowWithToast.showToast({
          type: 'success',
          message: t('export.success.message', 'Konfiguration erfolgreich exportiert'),
          details: `${summary.filename} (${summary.size})`
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('export.error.unknown', 'Unbekannter Export-Fehler');
      
      // Fehler-Callback
      if (onExportError) {
        onExportError(errorMessage);
      }
      
      // Toast-Benachrichtigung für Fehler
      const windowWithToast = window as Window & {
        showToast?: (options: {
          type: 'success' | 'error' | 'warning' | 'info';
          message: string;
          details?: string;
        }) => void;
      };
      
      if (typeof window !== 'undefined' && windowWithToast.showToast) {
        windowWithToast.showToast({
          type: 'error',
          message: t('export.error.message', 'Export fehlgeschlagen'),
          details: errorMessage
        });
      }
      
      loggers.components.error('Export operation failed', {
        context: 'ExportButton.handleExport',
        errorMessage,
        hasCallback: !!onExportError,
        hasToastSupport: !!(typeof window !== 'undefined' && (window as Window & { showToast?: unknown }).showToast)
      }, error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsExporting(false);
    }
  }, [disabled, isExporting, exportConfig, onExportSuccess, onExportError, t]);

  // Loading-Spinner-Komponente
  const LoadingSpinner = () => (
    <svg 
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Export-Icon
  const ExportIcon = () => (
    <svg 
      className="w-4 h-4 mr-2" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
      />
    </svg>
  );

  return (
    <div className="space-y-3">
      {/* Haupt-Export-Button */}
      <button
        onClick={handleExport}
        disabled={disabled || isExporting}
        className={getButtonClasses()}
        title={t('export.button.tooltip', 'Konfiguration als JSON-Datei exportieren')}
      >
        {isExporting ? (
          <>
            <LoadingSpinner />
            {t('export.button.exporting', 'Exportiere...')}
          </>
        ) : (
          <>
            <ExportIcon />
            {buttonText || t('export.button.text', 'Konfiguration exportieren')}
          </>
        )}
      </button>

      {/* Details-Anzeige */}
      {showDetails && exportSummary && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {t('export.details.filename', 'Dateiname')}:
              </span>
              <p className="text-gray-900 dark:text-gray-100 truncate" title={exportSummary.filename}>
                {exportSummary.filename}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {t('export.details.size', 'Größe')}:
              </span>
              <p className="text-gray-900 dark:text-gray-100">
                {exportSummary.size}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {t('export.details.stops', 'Stops')}:
              </span>
              <p className="text-gray-900 dark:text-gray-100">
                {exportSummary.stopCount}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {t('export.details.timestamp', 'Zeitstempel')}:
              </span>
              <p className="text-gray-900 dark:text-gray-100">
                {exportSummary.timestamp}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;