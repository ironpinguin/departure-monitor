/**
 * Import-Optionen-Komponente
 * Benutzer-Interface für Merge-Strategien und Import-Optionen
 * Modernized with card-based layout for better UX
 */

import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ImportOptionCard } from './ImportCards/ImportOptionCard';
import type { ImportOptions } from '../types/configExport';
import type { ImportOptionItem } from './ImportCards/ImportOptionCard';

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
  const showAdvancedOptions = showAdvanced;

  // Option-Update-Handler mit Radio-Button-Unterstützung
  const handleOptionChange = useCallback((newOptions: ImportOptions) => {
    onOptionsChange(newOptions);
  }, [onOptionsChange]);

  // Spezielle Handler für Radio-Buttons
  const handleMergeStrategyChange = useCallback((overwriteExisting: boolean) => {
    const newOptions = { ...options, overwriteExisting };
    onOptionsChange(newOptions);
  }, [options, onOptionsChange]);

  // Konfigurierte Option-Items für die Cards
  const basicOptions = useMemo(() => {
    const opts: ImportOptionItem[] = [
      {
        key: 'importGlobalSettings',
        label: 'import.options.import_global_settings',
        description: 'import.options.import_global_settings_description',
        category: 'settings'
      },
      {
        key: 'createBackup',
        label: 'import.options.create_backup',
        description: 'import.options.create_backup_description',
        category: 'safety',
        required: true
      }
    ];
    return opts;
  }, []);

  const advancedOptions = useMemo(() => {
    const opts: ImportOptionItem[] = [
      {
        key: 'importOnlyVisible',
        label: 'import.options.import_only_visible',
        description: 'import.options.import_only_visible_description',
        category: 'filtering'
      },
      {
        key: 'preserveStopPositions',
        label: 'import.options.preserve_positions',
        description: 'import.options.preserve_positions_description',
        category: 'layout'
      },
      {
        key: 'validateBeforeImport',
        label: 'import.options.validate_before_import',
        description: 'import.options.validate_before_import_description',
        category: 'safety'
      }
    ];
    return opts;
  }, []);

  return (
    <div className={`import-options ${compact ? 'import-options--compact' : ''} ${className}`}>
      {/* Header */}
      <div className="import-options__header">
        <h4 className="import-options__title">
          {t('import.options.title')}
        </h4>
      </div>

      {/* Merge-Strategie Card - Spezielle Behandlung für Radio-Buttons */}
      <div className="import-options__merge-strategy">
        <div className="import-option-card import-option-card--high">
          <div className="import-option-card__header">
            <div className="import-option-card__header-content">
              <span className="import-option-card__default-icon import-option-card__default-icon--high">⚡</span>
              <div className="import-option-card__header-text">
                <h3 className="import-option-card__title">{t('import.options.merge_strategy')}</h3>
                <p className="import-option-card__description">{t('import.options.merge_strategy_description')}</p>
              </div>
            </div>
          </div>
          <div className="import-option-card__content">
            <div className="import-options__radio-group">
              <label className="import-options__radio-option">
                <input
                  type="radio"
                  name="mergeStrategy"
                  checked={!options.overwriteExisting}
                  onChange={() => handleMergeStrategyChange(false)}
                  aria-describedby="merge-strategy-merge-desc"
                />
                <div className="import-options__radio-content">
                  <span className="import-options__radio-label">
                    {t('import.options.merge')}
                  </span>
                  <span id="merge-strategy-merge-desc" className="import-options__radio-description">
                    {t('import.options.merge_description')}
                  </span>
                </div>
              </label>
              <label className="import-options__radio-option">
                <input
                  type="radio"
                  name="mergeStrategy"
                  checked={options.overwriteExisting}
                  onChange={() => handleMergeStrategyChange(true)}
                  aria-describedby="merge-strategy-replace-desc"
                />
                <div className="import-options__radio-content">
                  <span className="import-options__radio-label">
                    {t('import.options.replace')}
                  </span>
                  <span id="merge-strategy-replace-desc" className="import-options__radio-description">
                    {t('import.options.replace_description')}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Grundlegende Optionen Card */}
      <ImportOptionCard
        title={t('import.options.basic_options')}
        description={t('import.options.basic_options_description')}
        options={basicOptions}
        currentOptions={options}
        onOptionsChange={handleOptionChange}
        priority="high"
        icon={<span>🔧</span>}
        compact={compact}
        className="import-options__basic-card"
        testId="basic-options-card"
      />

      {/* Erweiterte Optionen Card */}
      <ImportOptionCard
        title={t('import.options.advanced_options')}
        description={t('import.options.advanced_options_description')}
        options={advancedOptions}
        currentOptions={options}
        onOptionsChange={handleOptionChange}
        collapsible={!compact}
        defaultExpanded={showAdvancedOptions || compact}
        priority="medium"
        icon={<span>⚙️</span>}
        compact={compact}
        className="import-options__advanced-card"
        testId="advanced-options-card"
      />

      {/* Optionen-Zusammenfassung */}
      {!compact && (
        <div className="import-options__summary">
          <div className="import-option-card import-option-card--low">
            <div className="import-option-card__header">
              <div className="import-option-card__header-content">
                <span className="import-option-card__default-icon import-option-card__default-icon--low">📋</span>
                <div className="import-option-card__header-text">
                  <h3 className="import-option-card__title">{t('import.options.summary')}</h3>
                  <p className="import-option-card__description">{t('import.options.summary_description')}</p>
                </div>
              </div>
            </div>
            <div className="import-option-card__content">
              <div className="import-options__summary-content">
                <ul className="import-options__summary-list">
                  <li className="import-options__summary-item">
                    <strong>{t('import.options.strategy')}:</strong> {
                      options.overwriteExisting
                        ? t('import.options.replace')
                        : t('import.options.merge')
                    }
                  </li>
                  <li className="import-options__summary-item">
                    <strong>{t('import.options.global_settings')}:</strong> {
                      options.importGlobalSettings
                        ? t('common.yes')
                        : t('common.no')
                    }
                  </li>
                  <li className="import-options__summary-item">
                    <strong>{t('import.options.backup')}:</strong> {
                      options.createBackup
                        ? t('common.yes')
                        : t('common.no')
                    }
                  </li>
                  {(showAdvancedOptions || compact) && (
                    <>
                      <li className="import-options__summary-item">
                        <strong>{t('import.options.only_visible')}:</strong> {
                          options.importOnlyVisible
                            ? t('common.yes')
                            : t('common.no')
                        }
                      </li>
                      <li className="import-options__summary-item">
                        <strong>{t('import.options.preserve_positions')}:</strong> {
                          options.preserveStopPositions
                            ? t('common.yes')
                            : t('common.no')
                        }
                      </li>
                      <li className="import-options__summary-item">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportOptionsComponent;