import React, { useState, useEffect } from 'react';
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
    // Announce tab change to screen readers
    const tabName = newValue === 0 ? t('configModal.globalSettings') : t('configModal.stopManagement');
    // Small delay to let screen reader process the tab change
    setTimeout(() => {
      const announcement = `${tabName} ${t('configModal.title')}`;
      const liveRegion = document.querySelector('.live-region');
      if (liveRegion) {
        liveRegion.textContent = announcement;
      }
    }, 100);
  };

  const handleClose = () => {
    onClose();
    // Reset to first tab when closing
    setTabIndex(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
      return;
    }
    
    // Focus trap implementation
    if (event.key === 'Tab') {
      const focusableElements = event.currentTarget.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  // Focus management
  useEffect(() => {
    if (open) {
      // Focus the first focusable element when modal opens
      setTimeout(() => {
        const firstTab = document.querySelector('#tab-0') as HTMLElement;
        if (firstTab) {
          firstTab.focus();
        }
      }, 100);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      onKeyDown={handleKeyDown}
      maxWidth="md"
      fullWidth
      aria-labelledby="config-dialog-title"
      aria-describedby="config-dialog-description"
      aria-modal="true"
      role="dialog"
    >
      <DialogTitle id="config-dialog-title">
        {t('configModal.title')}
      </DialogTitle>
      
      <div id="config-dialog-description" className="sr-only">
        {t('escapeToClose')}. {t('keyboardShortcuts')}.
      </div>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          aria-label={t('configModal.title')}
          variant="fullWidth"
        >
          <Tab
            label={t('configModal.globalSettings')}
            id="tab-0"
            aria-controls="tabpanel-0"
            aria-selected={tabIndex === 0}
            aria-describedby="tab-0-desc"
          />
          <Tab
            label={t('configModal.stopManagement')}
            id="tab-1"
            aria-controls="tabpanel-1"
            aria-selected={tabIndex === 1}
            aria-describedby="tab-1-desc"
          />
        </Tabs>
        
        {/* Hidden descriptions for tabs */}
        <div id="tab-0-desc" className="sr-only">
          {t('globalSettings.title')}
        </div>
        <div id="tab-1-desc" className="sr-only">
          {t('configModal.stopManagement')}
        </div>
      </Box>
      
      <DialogContent dividers>
        <div
          role="tabpanel"
          hidden={tabIndex !== 0}
          id="tabpanel-0"
          aria-labelledby="tab-0"
          aria-describedby="tab-0-desc"
          tabIndex={tabIndex === 0 ? 0 : -1}
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
          aria-describedby="tab-1-desc"
          tabIndex={tabIndex === 1 ? 0 : -1}
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
        <Button
          onClick={handleClose}
          aria-describedby="close-button-desc"
        >
          {t('close')}
        </Button>
        <div id="close-button-desc" className="sr-only">
          {t('escapeToClose')}
        </div>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigModal;