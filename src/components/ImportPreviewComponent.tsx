/**
 * Import-Vorschau-Komponente
 * Detaillierte Vorschau der zu importierenden Daten mit Konflikten und Änderungen
 * Modernized with card-based progressive disclosure layout
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PreviewCard, ConflictPreviewCard, StopPreviewCard } from './ImportCards/PreviewCard';
import type { ConfigExport } from '../types/configExport';
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

  // Zähler für verschiedene Änderungstypen
  const changeCounts = preview.estimatedChanges;
  const hasChanges = changeCounts.stopsAdded > 0 || changeCounts.stopsUpdated > 0 ||
                    changeCounts.stopsRemoved > 0 || changeCounts.settingsChanged > 0;

  // Stops für die StopPreviewCard formatieren
  const formattedStops = useMemo(() => {
    return preview.stops.map(stop => ({
      id: stop.id,
      name: stop.name,
      city: stop.city,
      stopId: stop.stopId,
      visible: stop.visible
    }));
  }, [preview.stops]);

  return (
    <div className={`import-preview ${compact ? 'import-preview--compact' : ''} ${className}`}>
      {/* Header */}
      <div className="import-preview__header">
        <h3 className="import-preview__title">
          {t('import.preview.title')}
        </h3>
      </div>

      {/* Metadaten Card */}
      <PreviewCard
        title={t('import.preview.metadata')}
        subtitle={t('import.preview.metadata_subtitle')}
        type="info"
        defaultExpanded={true}
        collapsible={false}
        compact={compact}
        testId="metadata-card"
      >
        <div className="import-preview__metadata">
          <div className="import-preview__metadata-item">
            <span className="import-preview__label">{t('import.preview.schema_version')}:</span>
            <span className="import-preview__value">{config.schemaVersion}</span>
          </div>
          <div className="import-preview__metadata-item">
            <span className="import-preview__label">{t('import.preview.language')}:</span>
            <span className="import-preview__value">{config.metadata.language}</span>
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
      </PreviewCard>

      {/* Geschätzte Änderungen Card */}
      {hasChanges && (
        <PreviewCard
          title={t('import.preview.estimated_changes')}
          subtitle={t('import.preview.estimated_changes_subtitle')}
          type="warning"
          defaultExpanded={true}
          collapsible={!compact}
          compact={compact}
          testId="changes-card"
        >
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
        </PreviewCard>
      )}

      {/* Globale Einstellungen Card */}
      {Object.keys(preview.globalSettingsChanges).length > 0 && (
        <PreviewCard
          title={t('import.preview.global_settings')}
          subtitle={t('import.preview.global_settings_subtitle')}
          type="info"
          defaultExpanded={false}
          collapsible={!compact}
          compact={compact}
          testId="global-settings-card"
        >
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
        </PreviewCard>
      )}

      {/* Konflikte Card */}
      <ConflictPreviewCard conflicts={preview.conflicts} />

      {/* Stops Card */}
      {!compact && formattedStops.length > 0 && (
        <StopPreviewCard
          stops={formattedStops}
          maxDisplay={maxStopsShown}
          onViewAll={() => {
            // Callback für "Alle anzeigen" könnte hier implementiert werden
          }}
        />
      )}
    </div>
  );
};


export default ImportPreviewComponent;