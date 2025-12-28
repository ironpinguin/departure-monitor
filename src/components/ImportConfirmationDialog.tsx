/**
 * Import-Bestätigungsdialog-Komponente
 * Modal-Dialog mit Vorschau und Optionen für den Import-Prozess
 * Enhanced with progress indicator and improved accessibility
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfigStore } from '../store/configStore';
import ImportPreviewComponent from './ImportPreviewComponent';
import ImportOptionsComponent from './ImportOptionsComponent';
import { ImportProgressIndicator } from './ImportDialog/ImportProgressIndicator';
import type { ConfigExport, ImportOptions, ImportResult } from '../types/configExport';
import type { ImportProgressStep } from './ImportDialog/ImportProgressIndicator';
import CloseIcon from '@mui/icons-material/Close';

interface ImportConfirmationDialogProps {
  /** Ob der Dialog geöffnet ist */
  isOpen: boolean;
  /** Callback zum Schließen des Dialogs */
  onClose: () => void;
  /** Zu importierende Konfiguration */
  config: ConfigExport | null;
  /** Callback wenn Import erfolgreich */
  onImportSuccess: (result: ImportResult) => void;
  /** Callback wenn Import fehlschlägt */
  onImportError: (error: string) => void;
  /** Zusätzliche CSS-Klassen */
  className?: string;
}

export const ImportConfirmationDialog: React.FC<ImportConfirmationDialogProps> = ({
  isOpen,
  onClose,
  config,
  onImportSuccess,
  onImportError,
  className = ''
}) => {
  const { t } = useTranslation();
  const { importConfig, validateConfig } = useConfigStore();
  
  // Dialog-Zustand
  const [isImporting, setIsImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'preview' | 'options' | 'confirm'>('preview');
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    importOnlyVisible: false,
    preserveStopPositions: true,
    importGlobalSettings: true,
    validateBeforeImport: true,
    createBackup: true
  });
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateConfig> | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [currentImportStep, setCurrentImportStep] = useState(0);

  // Import-Schritte für den Progress Indicator
  const importSteps = useMemo(() => {
    const steps: ImportProgressStep[] = [
      {
        id: 'validation',
        label: t('import.progress.validation'),
        description: t('import.progress.validation_description'),
        completed: validationResult?.isValid === true,
        active: currentImportStep === 0,
        hasError: validationResult?.isValid === false,
        errorMessage: validationResult?.errors?.[0]?.message
      },
      {
        id: 'backup',
        label: t('import.progress.backup'),
        description: t('import.progress.backup_description'),
        completed: currentImportStep > 1,
        active: currentImportStep === 1,
        hasError: false
      },
      {
        id: 'import',
        label: t('import.progress.import'),
        description: t('import.progress.import_description'),
        completed: currentImportStep > 2,
        active: currentImportStep === 2,
        hasError: false
      },
      {
        id: 'finalize',
        label: t('import.progress.finalize'),
        description: t('import.progress.finalize_description'),
        completed: currentImportStep > 3,
        active: currentImportStep === 3,
        hasError: false
      }
    ];
    return steps;
  }, [t, validationResult, currentImportStep]);

  // Validierung beim Öffnen des Dialogs
  useEffect(() => {
    if (isOpen && config) {
      const validation = validateConfig(config);
      setValidationResult(validation);
      
      if (!validation.isValid) {
        setCurrentStep('preview');
      }
    }
  }, [isOpen, config, validateConfig]);

  // Dialog schließen und Zustand zurücksetzen
  const handleClose = useCallback(() => {
    if (isImporting) return;
    
    setCurrentStep('preview');
    setValidationResult(null);
    onClose();
  }, [isImporting, onClose]);

  // Import ausführen mit Progress-Tracking
  const handleImport = useCallback(async () => {
    if (!config || isImporting) return;
    
    setIsImporting(true);
    setImportProgress(0);
    setCurrentImportStep(0);
    
    try {
      // Schritt 1: Validierung (bereits durchgeführt)
      setCurrentImportStep(1);
      setImportProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      
      // Schritt 2: Backup (wenn aktiviert)
      if (importOptions.createBackup) {
        setCurrentImportStep(2);
        setImportProgress(50);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate backup time
      }
      
      // Schritt 3: Import durchführen
      setCurrentImportStep(3);
      setImportProgress(75);
      const result = await importConfig(config, importOptions);
      
      // Schritt 4: Finalisierung
      setCurrentImportStep(4);
      setImportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate finalization
      
      if (result.success) {
        onImportSuccess(result);
        handleClose();
      } else {
        onImportError(result.messages.join('\n'));
      }
    } catch (error) {
      onImportError(error instanceof Error ? error.message : 'Unbekannter Import-Fehler');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      setCurrentImportStep(0);
    }
  }, [config, importOptions, isImporting, importConfig, onImportSuccess, onImportError, handleClose]);

  // Schritt-Navigation
  const goToStep = useCallback((step: typeof currentStep) => {
    if (isImporting) return;
    setCurrentStep(step);
  }, [isImporting]);

  const canProceed = useCallback(() => {
    if (!config || !validationResult) return false;
    
    if (validationResult.errors.some(e => e.severity === 'critical')) {
      return false;
    }
    
    return validationResult.isValid;
  }, [config, validationResult]);

  // Keyboard-Handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && !isImporting) {
      handleClose();
    }
  }, [isImporting, handleClose]);

  // Backdrop-Click-Handler
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !isImporting) {
      handleClose();
    }
  }, [isImporting, handleClose]);

  if (!isOpen || !config) {
    return null;
  }

  return (
    <div 
      className={`import-dialog-overlay ${className}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
    >
      <div className="import-dialog">
        {/* Header */}
        <div className="import-dialog__header">
          <h2 id="import-dialog-title" className="import-dialog__title">
            {t('import.dialog.title')}
          </h2>
          <button
            type="button"
            className="import-dialog__close"
            onClick={handleClose}
            disabled={isImporting}
            aria-label={t('common.close')}
          >
            <CloseIcon fontSize="large" />
            <br/>{t('common.cancel')}
          </button>
        </div>

        {/* Schritt-Indikator - Verbessert mit Progress Indicator */}
        {isImporting ? (
          <ImportProgressIndicator
            progress={importProgress}
            steps={importSteps}
            currentStepIndex={currentImportStep}
            isActive={isImporting}
            showDetails={true}
            showTimeEstimates={true}
            showSteps={true}
            variant="linear"
            size="medium"
            animated={true}
            theme="primary"
            testId="import-progress"
            ariaLabel={t('import.dialog.progress_aria_label')}
          />
        ) : (
          <div className="import-dialog__steps">
            <div className={`import-dialog__step ${currentStep === 'preview' ? 'import-dialog__step--active' : ''}`}>
              <span className="import-dialog__step-number">{t('import.dialog.step')} 1: </span>
              <span className="import-dialog__step-label">{t('import.dialog.step_preview')}</span>
            </div>
            <div className={`import-dialog__step ${currentStep === 'options' ? 'import-dialog__step--active' : ''}`}>
              <span className="import-dialog__step-number">{t('import.dialog.step')} 2: </span>
              <span className="import-dialog__step-label">{t('import.dialog.step_options')}</span>
            </div>
            <div className={`import-dialog__step ${currentStep === 'confirm' ? 'import-dialog__step--active' : ''}`}>
              <span className="import-dialog__step-number">{t('import.dialog.step')} 3: </span>
              <span className="import-dialog__step-label">{t('import.dialog.step_confirm')}</span>
            </div>
          </div>
        )}

        {/* Inhalt */}
        <div className="import-dialog__content">
          {/* Validierungsfehler */}
          {validationResult && !validationResult.isValid && (
            <div className="import-dialog__validation-errors">
              <h3 className="import-dialog__validation-title">
                {t('import.dialog.validation_errors')}
              </h3>
              <ul className="import-dialog__validation-list">
                {validationResult.errors.map((error, index) => (
                  <li key={index} className={`import-dialog__validation-error import-dialog__validation-error--${error.severity}`}>
                    <strong>{error.code}:</strong> {error.message}
                    {error.field && <span className="import-dialog__validation-field"> ({error.field})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Validierungswarnungen */}
          {validationResult && validationResult.warnings.length > 0 && (
            <div className="import-dialog__validation-warnings">
              <h3 className="import-dialog__validation-title">
                {t('import.dialog.validation_warnings')}
              </h3>
              <ul className="import-dialog__validation-list">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index} className="import-dialog__validation-warning">
                    <strong>{warning.code}:</strong> {warning.message}
                    {warning.field && <span className="import-dialog__validation-field"> ({warning.field})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Schritt-Inhalt */}
          {currentStep === 'preview' && (
            <ImportPreviewComponent config={config} />
          )}

          {currentStep === 'options' && (
            <ImportOptionsComponent
              options={importOptions}
              onOptionsChange={setImportOptions}
              showAdvanced={true}
            />
          )}

          {currentStep === 'confirm' && (
            <div className="import-dialog__confirm">
              <h3 className="import-dialog__confirm-title">
                {t('import.dialog.confirm_title')}
              </h3>
              <p className="import-dialog__confirm-message">
                {t('import.dialog.confirm_message')}
              </p>
              
              {/* Finale Zusammenfassung */}
              <div className="import-dialog__final-summary">
                <div className="import-dialog__summary-item">
                  <strong>{t('import.dialog.stops_to_import')}:</strong> {config.config.stops.length}
                </div>
                <div className="import-dialog__summary-item">
                  <strong>{t('import.dialog.merge_strategy')}:</strong> {
                    importOptions.overwriteExisting 
                      ? t('import.options.replace') 
                      : t('import.options.merge')
                  }
                </div>
                <div className="import-dialog__summary-item">
                  <strong>{t('import.dialog.backup_creation')}:</strong> {
                    importOptions.createBackup 
                      ? t('common.yes') 
                      : t('common.no')
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="import-dialog__footer">
          <div className="import-dialog__buttons">
            {/* Zurück-Button */}
            {currentStep !== 'preview' && (
              <button
                type="button"
                className="import-dialog__button import-dialog__button--secondary"
                onClick={() => goToStep(currentStep === 'confirm' ? 'options' : 'preview')}
                disabled={isImporting}
              >
                {t('common.back')}
              </button>
            )}

            {/* Abbrechen-Button */}
            <button
              type="button"
              className="import-dialog__button import-dialog__button--cancel"
              onClick={handleClose}
              disabled={isImporting}
            >
              {t('common.cancel')}
            </button>

            {/* Weiter/Import-Button */}
            {currentStep === 'preview' && (
              <button
                type="button"
                className="import-dialog__button import-dialog__button--primary"
                onClick={() => goToStep('options')}
                disabled={!canProceed()}
              >
                {t('common.next')}
              </button>
            )}

            {currentStep === 'options' && (
              <button
                type="button"
                className="import-dialog__button import-dialog__button--primary"
                onClick={() => goToStep('confirm')}
                disabled={!canProceed()}
              >
                {t('common.next')}
              </button>
            )}

            {currentStep === 'confirm' && (
              <button
                type="button"
                className="import-dialog__button import-dialog__button--primary"
                onClick={handleImport}
                disabled={!canProceed() || isImporting}
              >
                {isImporting ? (
                  <>
                    <span className="import-dialog__loading-spinner" />
                    {t('import.dialog.importing')}
                  </>
                ) : (
                  t('import.dialog.import')
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportConfirmationDialog;