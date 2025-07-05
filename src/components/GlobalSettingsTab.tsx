import React, { useState } from 'react';
import {
  FormControlLabel,
  Switch,
  TextField,
  Box,
  Typography,
  Slider,
  Button,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useConfigStore } from '../store/configStore';
import { downloadConfigFile, validateExportData, createExportSummary } from '../utils/exportUtils';
import ImportButton from './ImportButton';
import ImportConfirmationDialog from './ImportConfirmationDialog';
import type { ConfigExport, ImportResult } from '../types/configExport';

interface GlobalSettingsTabProps {
  refreshIntervalSeconds: number;
  onRefreshIntervalChange: (seconds: number) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  maxDeparturesShown: number;
  onMaxDeparturesChange: (count: number) => void;
}

const GlobalSettingsTab: React.FC<GlobalSettingsTabProps> = ({
  refreshIntervalSeconds,
  onRefreshIntervalChange,
  darkMode,
  onToggleDarkMode,
  maxDeparturesShown,
  onMaxDeparturesChange,
}) => {
  const { t } = useTranslation();
  const { exportConfig } = useConfigStore();
  
  // Export-State
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: string;
  }>({ type: null, message: '' });

  // Import-State
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importConfig, setImportConfig] = useState<ConfigExport | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: string;
  }>({ type: null, message: '' });
  const handleRefreshIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 60) {
      onRefreshIntervalChange(value);
    }
  };

  const handleMaxDeparturesChange = (_event: Event, value: number | number[]) => {
    // For a non-range slider, value will be a single number
    const newValue = typeof value === 'number' ? value : value[0];
    if (newValue >= 1) {
      onMaxDeparturesChange(newValue);
    }
  };

  // Export-Funktionalität
  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus({ type: null, message: '' });
    
    try {
      // Konfiguration exportieren
      const configExport: ConfigExport = exportConfig();
      
      // Validierung vor Export
      if (!validateExportData(configExport)) {
        throw new Error(t('export.validation.failed', 'Export-Validierung fehlgeschlagen'));
      }
      
      // Export-Zusammenfassung erstellen
      const summary = createExportSummary(configExport);
      
      // Download starten
      await downloadConfigFile(configExport);
      
      // Erfolg-Status setzen
      setExportStatus({
        type: 'success',
        message: t('export.success.message', 'Konfiguration erfolgreich exportiert'),
        details: `${summary.filename} (${summary.size})`
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('export.error.unknown', 'Unbekannter Export-Fehler');
      
      setExportStatus({
        type: 'error',
        message: t('export.error.message', 'Export fehlgeschlagen'),
        details: errorMessage
      });
      
      console.error('Export-Fehler:', error);
    } finally {
      setIsExporting(false);
    }
  };
  // Import-Funktionalität
  const handleImportSuccess = (config: ConfigExport) => {
    setImportConfig(config);
    setImportDialogOpen(true);
    setImportStatus({ type: null, message: '' });
  };

  const handleImportError = (error: string) => {
    setImportStatus({
      type: 'error',
      message: t('import.error.message', 'Import fehlgeschlagen'),
      details: error
    });
  };

  const handleImportComplete = (result: ImportResult) => {
    setImportStatus({
      type: 'success',
      message: t('import.success.message', 'Konfiguration erfolgreich importiert'),
      details: `${result.importedStopsCount} Stops importiert`
    });
    setImportDialogOpen(false);
    setImportConfig(null);
  };

  const handleImportCancel = () => {
    setImportDialogOpen(false);
    setImportConfig(null);
  };


  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>{t('globalSettings.title')}</Typography>
      
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={onToggleDarkMode}
              color="primary"
            />
          }
          label={t('globalSettings.darkMode')}
        />
      </Box>
      
      <Box>
        <TextField
          label={t('globalSettings.refreshInterval')}
          type="number"
          value={refreshIntervalSeconds}
          onChange={handleRefreshIntervalChange}
          slotProps={{ input: { inputProps: { min: 60 } } }}
          fullWidth
          helperText={t('globalSettings.refreshIntervalHelp')}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ mb: 2 }}>
          <Typography id="max-departures-slider" gutterBottom>
            {t('globalSettings.maxDepartures')}
          </Typography>
          <Slider
            value={maxDeparturesShown}
            onChange={handleMaxDeparturesChange}
            aria-labelledby="max-departures-slider"
            valueLabelDisplay="auto"
            step={1}
            marks
            min={1}
            max={20}
          />
          <Typography variant="caption" color="text.secondary">
            {t('globalSettings.maxDeparturesHelp')}
          </Typography>
        </Box>
        
        {/* Export-Sektion */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('export.title', 'Konfiguration exportieren')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('export.description', 'Exportieren Sie Ihre aktuelle Konfiguration als JSON-Datei zum Backup oder zur Übertragung auf andere Geräte.')}
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleExport}
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={20} /> : <DownloadIcon />}
            sx={{ mb: 2 }}
          >
            {isExporting
              ? t('export.button.exporting', 'Exportiere...')
              : t('export.button.text', 'Konfiguration exportieren')
            }
          </Button>
          
          {/* Status-Anzeige */}
          {exportStatus.type && (
            <Alert
              severity={exportStatus.type}
              sx={{ mb: 2 }}
              onClose={() => setExportStatus({ type: null, message: '' })}
            >
              <Typography variant="body2">
                {exportStatus.message}
              </Typography>
              {exportStatus.details && (
                <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                  {exportStatus.details}
                </Typography>
              )}
            </Alert>
          )}
        
        {/* Import-Sektion */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('import.title', 'Konfiguration importieren')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('import.description', 'Importieren Sie eine exportierte Konfigurationsdatei, um Ihre Einstellungen und Stops zu übernehmen.')}
          </Typography>
          
          <ImportButton
            onImportSuccess={handleImportSuccess}
            onImportError={handleImportError}
            variant="outline"
            size="medium"
            className="import-button--styled"
          />
          
          {/* Import-Status-Anzeige */}
          {importStatus.type && (
            <Alert
              severity={importStatus.type}
              sx={{ mb: 2, mt: 2 }}
              onClose={() => setImportStatus({ type: null, message: '' })}
            >
              <Typography variant="body2">
                {importStatus.message}
              </Typography>
              {importStatus.details && (
                <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                  {importStatus.details}
                </Typography>
              )}
            </Alert>
          )}
        </Box>

        {/* Import-Bestätigungsdialog */}
        <ImportConfirmationDialog
          isOpen={importDialogOpen}
          onClose={handleImportCancel}
          config={importConfig}
          onImportSuccess={handleImportComplete}
          onImportError={handleImportError}
        />
        </Box>
      </Box>
    </Box>
  );
};

export default GlobalSettingsTab;