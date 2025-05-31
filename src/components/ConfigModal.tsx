import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import GlobalSettingsTab from './GlobalSettingsTab';
import StopManagementTab from './StopManagementTab';
import type { StopConfig } from '../models';

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
  stops: StopConfig[];
  onAddStop: (stop: StopConfig) => void;
  onUpdateStop: (stop: StopConfig) => void;
  onRemoveStop: (stopId: string) => void;
  refreshIntervalSeconds: number;
  onRefreshIntervalChange: (seconds: number) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  maxDeparturesShown: number;
  onMaxDeparturesChange: (count: number) => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({
  open,
  onClose,
  stops,
  onAddStop,
  onUpdateStop,
  onRemoveStop,
  refreshIntervalSeconds,
  onRefreshIntervalChange,
  darkMode,
  onToggleDarkMode,
  maxDeparturesShown,
  onMaxDeparturesChange
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const { t } = useTranslation();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleClose = () => {
    onClose();
    // Reset to first tab when closing
    setTabIndex(0);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="config-dialog-title"
    >
      <DialogTitle id="config-dialog-title">{t('configModal.title')}</DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="configuration tabs">
          <Tab label={t('configModal.globalSettings')} id="tab-0" aria-controls="tabpanel-0" />
          <Tab label={t('configModal.stopManagement')} id="tab-1" aria-controls="tabpanel-1" />
        </Tabs>
      </Box>
      
      <DialogContent dividers>
        <div
          role="tabpanel"
          hidden={tabIndex !== 0}
          id="tabpanel-0"
          aria-labelledby="tab-0"
        >
          {tabIndex === 0 && (
            <GlobalSettingsTab
              refreshIntervalSeconds={refreshIntervalSeconds}
              onRefreshIntervalChange={onRefreshIntervalChange}
              darkMode={darkMode}
              onToggleDarkMode={onToggleDarkMode}
              maxDeparturesShown={maxDeparturesShown}
              onMaxDeparturesChange={onMaxDeparturesChange}
            />
          )}
        </div>
        
        <div
          role="tabpanel"
          hidden={tabIndex !== 1}
          id="tabpanel-1"
          aria-labelledby="tab-1"
        >
          {tabIndex === 1 && (
            <StopManagementTab
              stops={stops}
              onAddStop={onAddStop}
              onUpdateStop={onUpdateStop}
              onRemoveStop={onRemoveStop}
            />
          )}
        </div>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigModal;