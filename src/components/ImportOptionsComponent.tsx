/**
 * Import-Optionen-Komponente
 * Benutzer-Interface für Merge-Strategien und Import-Optionen
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImportOptions } from '../types/configExport';

interface ImportOptionsComponentProps {
  /** Aktuelle Import-Optionen */
  options: ImportOptions;
  /** Callback wenn Optionen sich ändern */
  onOptionsChange: (options: ImportOptions) => void;
  /** Ob erweiterte Optionen angezeigt werden sollen */
  showAdvanced?: boolean;
  /** Zusätzliche CSS-Klassen */
  className?: string;
  /** Kompakte Darstellung */
  compact?: boolean;
}

export const ImportOptionsComponent: React.FC<ImportOptionsComponentProps> = ({
  options,
  onOptionsChange,
  showAdvanced = false,
  className = '',
  compact = false
}) => {
  const { t } = useTranslation();
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(showAdvanced);

  // Option-Update-Handler
  const handleOptionChange = useCallback(<K extends keyof ImportOptions>(
    key: K,
    value: ImportOptions[K]
  ) => {
    const newOptions = { ...options, [key]: value };
    onOptionsChange(newOptions);
  }, [options, onOptionsChange]);

  // Toggle für erweiterte Optionen
  const toggleAdvanced = useCallback(() => {
    setShowAdvancedOptions(!showAdvancedOptions);
  }, [showAdvancedOptions]);

  return (
    <div className={`import-options ${compact ? 'import-options--compact' : ''} ${className}`}>
      {/* Grundlegende Optionen */}
      <div className="import-options__basic">
        <h4 className="import-options__title">
          {t('import.options.title')}
        </h4>

        {/* Merge-Strategie */}
        <div className="import-options__group">
          <h5 className="import-options__group-title">
            {t('import.options.merge_strategy')}
          </h5>
          <div className="import-options__radio-group">
            <label className="import-options__radio-option">
              <input
                type="radio"
                name="mergeStrategy"
                checked={!options.overwriteExisting}
                onChange={() => handleOptionChange('overwriteExisting', false)}
              />
              <span className="import-options__radio-label">
                {t('import.options.merge')}
              </span>
              <span className="import-options__radio-description">
                {t('import.options.merge_description')}
              </span>
            </label>
            <label className="import-options__radio-option">
              <input
                type="radio"
                name="mergeStrategy"
                checked={options.overwriteExisting}
                onChange={() => handleOptionChange('overwriteExisting', true)}
              />
              <span className="import-options__radio-label">
                {t('import.options.replace')}
              </span>
              <span className="import-options__radio-description">
                {t('import.options.replace_description')}
              </span>
            </label>
          </div>
        </div>

        {/* Globale Einstellungen */}
        <div className="import-options__group">
          <label className="import-options__checkbox-option">
            <input
              type="checkbox"
              checked={options.importGlobalSettings}
              onChange={(e) => handleOptionChange('importGlobalSettings', e.target.checked)}
            />
            <span className="import-options__checkbox-label">
              {t('import.options.import_global_settings')}
            </span>
            <span className="import-options__checkbox-description">
              {t('import.options.import_global_settings_description')}
            </span>
          </label>
        </div>

        {/* Backup erstellen */}
        <div className="import-options__group">
          <label className="import-options__checkbox-option">
            <input
              type="checkbox"
              checked={options.createBackup}
              onChange={(e) => handleOptionChange('createBackup', e.target.checked)}
            />
            <span className="import-options__checkbox-label">
              {t('import.options.create_backup')}
            </span>
            <span className="import-options__checkbox-description">
              {t('import.options.create_backup_description')}
            </span>
          </label>
        </div>
      </div>

      {/* Erweiterte Optionen Toggle */}
      {!compact && (
        <div className="import-options__advanced-toggle">
          <button
            type="button"
            className="import-options__toggle-button"
            onClick={toggleAdvanced}
            aria-expanded={showAdvancedOptions}
          >
            <span className="import-options__toggle-icon">
              {showAdvancedOptions ? '▼' : '▶'}
            </span>
            <span className="import-options__toggle-text">
              {t('import.options.advanced_options')}
            </span>
          </button>
        </div>
      )}

      {/* Erweiterte Optionen */}
      {(showAdvancedOptions || compact) && (
        <div className="import-options__advanced">
          <div className="import-options__group">
            <h5 className="import-options__group-title">
              {t('import.options.advanced_title')}
            </h5>

            {/* Nur sichtbare Stops importieren */}
            <label className="import-options__checkbox-option">
              <input
                type="checkbox"
                checked={options.importOnlyVisible}
                onChange={(e) => handleOptionChange('importOnlyVisible', e.target.checked)}
              />
              <span className="import-options__checkbox-label">
                {t('import.options.import_only_visible')}
              </span>
              <span className="import-options__checkbox-description">
                {t('import.options.import_only_visible_description')}
              </span>
            </label>

            {/* Stop-Positionen beibehalten */}
            <label className="import-options__checkbox-option">
              <input
                type="checkbox"
                checked={options.preserveStopPositions}
                onChange={(e) => handleOptionChange('preserveStopPositions', e.target.checked)}
              />
              <span className="import-options__checkbox-label">
                {t('import.options.preserve_positions')}
              </span>
              <span className="import-options__checkbox-description">
                {t('import.options.preserve_positions_description')}
              </span>
            </label>

            {/* Validierung vor Import */}
            <label className="import-options__checkbox-option">
              <input
                type="checkbox"
                checked={options.validateBeforeImport}
                onChange={(e) => handleOptionChange('validateBeforeImport', e.target.checked)}
              />
              <span className="import-options__checkbox-label">
                {t('import.options.validate_before_import')}
              </span>
              <span className="import-options__checkbox-description">
                {t('import.options.validate_before_import_description')}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Optionen-Zusammenfassung */}
      {!compact && (
        <div className="import-options__summary">
          <h5 className="import-options__summary-title">
            {t('import.options.summary')}
          </h5>
          <ul className="import-options__summary-list">
            <li>
              <strong>{t('import.options.strategy')}:</strong> {
                options.overwriteExisting 
                  ? t('import.options.replace') 
                  : t('import.options.merge')
              }
            </li>
            <li>
              <strong>{t('import.options.global_settings')}:</strong> {
                options.importGlobalSettings 
                  ? t('common.yes') 
                  : t('common.no')
              }
            </li>
            <li>
              <strong>{t('import.options.backup')}:</strong> {
                options.createBackup 
                  ? t('common.yes') 
                  : t('common.no')
              }
            </li>
            {showAdvancedOptions && (
              <>
                <li>
                  <strong>{t('import.options.only_visible')}:</strong> {
                    options.importOnlyVisible 
                      ? t('common.yes') 
                      : t('common.no')
                  }
                </li>
                <li>
                  <strong>{t('import.options.preserve_positions')}:</strong> {
                    options.preserveStopPositions 
                      ? t('common.yes') 
                      : t('common.no')
                  }
                </li>
                <li>
                  <strong>{t('import.options.validate')}:</strong> {
                    options.validateBeforeImport 
                      ? t('common.yes') 
                      : t('common.no')
                  }
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImportOptionsComponent;