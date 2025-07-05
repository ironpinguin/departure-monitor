/**
 * Import-Vorschau-Komponente
 * Detaillierte Vorschau der zu importierenden Daten mit Konflikten und Änderungen
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImportConflict, ConfigExport } from '../types/configExport';
import { useConfigStore } from '../store/configStore';

interface ImportPreviewComponentProps {
  /** Konfiguration zum Importieren */
  config: ConfigExport;
  /** Zusätzliche CSS-Klassen */
  className?: string;
  /** Kompakte Darstellung */
  compact?: boolean;
  /** Maximale Anzahl der angezeigten Stops */
  maxStopsShown?: number;
}

export const ImportPreviewComponent: React.FC<ImportPreviewComponentProps> = ({
  config,
  className = '',
  compact = false,
  maxStopsShown = 10
}) => {
  const { t } = useTranslation();
  const { previewImport } = useConfigStore();

  // Import-Vorschau generieren
  const preview = useMemo(() => {
    return previewImport(config);
  }, [config, previewImport]);

  // Sortierte Konflikte nach Schweregrad
  const sortedConflicts = useMemo(() => {
    return [...preview.conflicts].sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [preview.conflicts]);

  // Anzeige-Stops (begrenzt)
  const displayStops = useMemo(() => {
    return preview.stops.slice(0, maxStopsShown);
  }, [preview.stops, maxStopsShown]);

  // Zähler für verschiedene Änderungstypen
  const changeCounts = preview.estimatedChanges;
  const hasChanges = changeCounts.stopsAdded > 0 || changeCounts.stopsUpdated > 0 || 
                    changeCounts.stopsRemoved > 0 || changeCounts.settingsChanged > 0;

  return (
    <div className={`import-preview ${compact ? 'import-preview--compact' : ''} ${className}`}>
      {/* Header mit Zusammenfassung */}
      <div className="import-preview__header">
        <h3 className="import-preview__title">
          {t('import.preview.title')}
        </h3>
        <div className="import-preview__summary">
          <span className="import-preview__count">
            {t('import.preview.stops_count', { count: preview.stopCount })}
          </span>
          {preview.conflicts.length > 0 && (
            <span className="import-preview__conflicts">
              {t('import.preview.conflicts_count', { count: preview.conflicts.length })}
            </span>
          )}
        </div>
      </div>

      {/* Metadaten */}
      <div className="import-preview__metadata">
        <div className="import-preview__metadata-item">
          <span className="import-preview__label">{t('import.preview.schema_version')}:</span>
          <span className="import-preview__value">{config.schemaVersion}</span>
        </div>
        <div className="import-preview__metadata-item">
          <span className="import-preview__label">{t('import.preview.language')}:</span>
          <span className="import-preview__value">{config.config.language}</span>
        </div>
        <div className="import-preview__metadata-item">
          <span className="import-preview__label">{t('import.preview.export_date')}:</span>
          <span className="import-preview__value">
            {new Date(config.exportTimestamp).toLocaleDateString()}
          </span>
        </div>
        {config.metadata.source && (
          <div className="import-preview__metadata-item">
            <span className="import-preview__label">{t('import.preview.source')}:</span>
            <span className="import-preview__value">{config.metadata.source}</span>
          </div>
        )}
      </div>

      {/* Geschätzte Änderungen */}
      {hasChanges && (
        <div className="import-preview__changes">
          <h4 className="import-preview__section-title">
            {t('import.preview.estimated_changes')}
          </h4>
          <div className="import-preview__changes-grid">
            {changeCounts.stopsAdded > 0 && (
              <div className="import-preview__change-item import-preview__change-item--added">
                <span className="import-preview__change-icon">+</span>
                <span className="import-preview__change-count">{changeCounts.stopsAdded}</span>
                <span className="import-preview__change-label">{t('import.preview.stops_added')}</span>
              </div>
            )}
            {changeCounts.stopsUpdated > 0 && (
              <div className="import-preview__change-item import-preview__change-item--updated">
                <span className="import-preview__change-icon">~</span>
                <span className="import-preview__change-count">{changeCounts.stopsUpdated}</span>
                <span className="import-preview__change-label">{t('import.preview.stops_updated')}</span>
              </div>
            )}
            {changeCounts.stopsRemoved > 0 && (
              <div className="import-preview__change-item import-preview__change-item--removed">
                <span className="import-preview__change-icon">-</span>
                <span className="import-preview__change-count">{changeCounts.stopsRemoved}</span>
                <span className="import-preview__change-label">{t('import.preview.stops_removed')}</span>
              </div>
            )}
            {changeCounts.settingsChanged > 0 && (
              <div className="import-preview__change-item import-preview__change-item--settings">
                <span className="import-preview__change-icon">⚙</span>
                <span className="import-preview__change-count">{changeCounts.settingsChanged}</span>
                <span className="import-preview__change-label">{t('import.preview.settings_changed')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Globale Einstellungen Änderungen */}
      {Object.keys(preview.globalSettingsChanges).length > 0 && (
        <div className="import-preview__settings">
          <h4 className="import-preview__section-title">
            {t('import.preview.global_settings')}
          </h4>
          <div className="import-preview__settings-list">
            {preview.globalSettingsChanges.darkMode !== undefined && (
              <div className="import-preview__setting-item">
                <span className="import-preview__setting-label">{t('settings.dark_mode')}:</span>
                <span className="import-preview__setting-value">
                  {preview.globalSettingsChanges.darkMode ? t('common.enabled') : t('common.disabled')}
                </span>
              </div>
            )}
            {preview.globalSettingsChanges.language !== undefined && (
              <div className="import-preview__setting-item">
                <span className="import-preview__setting-label">{t('settings.language')}:</span>
                <span className="import-preview__setting-value">
                  {preview.globalSettingsChanges.language}
                </span>
              </div>
            )}
            {preview.globalSettingsChanges.refreshIntervalSeconds !== undefined && (
              <div className="import-preview__setting-item">
                <span className="import-preview__setting-label">{t('settings.refresh_interval')}:</span>
                <span className="import-preview__setting-value">
                  {preview.globalSettingsChanges.refreshIntervalSeconds}s
                </span>
              </div>
            )}
            {preview.globalSettingsChanges.maxDeparturesShown !== undefined && (
              <div className="import-preview__setting-item">
                <span className="import-preview__setting-label">{t('settings.max_departures')}:</span>
                <span className="import-preview__setting-value">
                  {preview.globalSettingsChanges.maxDeparturesShown}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Konflikte */}
      {sortedConflicts.length > 0 && (
        <div className="import-preview__conflicts">
          <h4 className="import-preview__section-title">
            {t('import.preview.conflicts')}
          </h4>
          <div className="import-preview__conflicts-list">
            {sortedConflicts.map((conflict, index) => (
              <ConflictItem key={index} conflict={conflict} />
            ))}
          </div>
        </div>
      )}

      {/* Stops-Vorschau */}
      {!compact && displayStops.length > 0 && (
        <div className="import-preview__stops">
          <h4 className="import-preview__section-title">
            {t('import.preview.stops')}
            {preview.stops.length > maxStopsShown && (
              <span className="import-preview__stops-count">
                {t('import.preview.showing_of', { 
                  shown: maxStopsShown, 
                  total: preview.stops.length 
                })}
              </span>
            )}
          </h4>
          <div className="import-preview__stops-list">
            {displayStops.map((stop) => (
              <div key={stop.id} className="import-preview__stop-item">
                <div className="import-preview__stop-info">
                  <span className="import-preview__stop-name">{stop.name}</span>
                  <span className="import-preview__stop-details">
                    {stop.city.toUpperCase()} • {stop.stopId}
                  </span>
                </div>
                <div className="import-preview__stop-status">
                  {stop.visible ? (
                    <span className="import-preview__stop-visible">
                      {t('import.preview.visible')}
                    </span>
                  ) : (
                    <span className="import-preview__stop-hidden">
                      {t('import.preview.hidden')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Konflikt-Item-Komponente
const ConflictItem: React.FC<{ conflict: ImportConflict }> = ({ conflict }) => {
  const { t } = useTranslation();

  const getSeverityIcon = (severity: ImportConflict['severity']) => {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getSeverityClass = (severity: ImportConflict['severity']) => {
    return `import-preview__conflict-item--${severity}`;
  };

  return (
    <div className={`import-preview__conflict-item ${getSeverityClass(conflict.severity)}`}>
      <div className="import-preview__conflict-header">
        <span className="import-preview__conflict-icon">
          {getSeverityIcon(conflict.severity)}
        </span>
        <span className="import-preview__conflict-type">
          {t(`import.conflicts.${conflict.type}`)}
        </span>
        {conflict.stopId && (
          <span className="import-preview__conflict-stop-id">
            {conflict.stopId}
          </span>
        )}
      </div>
      <div className="import-preview__conflict-description">
        {conflict.description}
      </div>
      {conflict.suggestedResolution && (
        <div className="import-preview__conflict-resolution">
          <strong>{t('import.preview.suggested_resolution')}:</strong> {conflict.suggestedResolution}
        </div>
      )}
    </div>
  );
};

export default ImportPreviewComponent;