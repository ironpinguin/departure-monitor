import React from 'react';
import {
  FormControlLabel,
  Switch,
  TextField,
  Box,
  Typography,
  Slider
} from '@mui/material';
import { useTranslation } from 'react-i18next';

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
      </Box>
    </Box>
  );
};

export default GlobalSettingsTab;