import React, { useState } from 'react';
import type { Departure, StopConfig } from '../models';
import StopConfigModal from './StopConfigModal';
import TruncatedText from './TruncatedText';
import type { CSSProperties } from '@mui/material';
import {
  IconButton,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getTypeToStyles } from '../utils/typeToStyles';

const typeToStyles = getTypeToStyles();

interface StopWidgetProps {
  stopConfig: StopConfig;
  departures: Departure[];
  isLoading?: boolean;
  onRefresh: () => void;
  onConfigure?: (updatedConfig: StopConfig) => void;
  maxDeparturesShown: number;
}

const StopWidget: React.FC<StopWidgetProps> = ({
  stopConfig,
  departures,
  isLoading = false,
  onRefresh,
  onConfigure,
  maxDeparturesShown
}) => {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();

  const handleOpenConfigModal = () => {
    setIsConfigModalOpen(true);
  };

  const handleCloseConfigModal = () => {
    setIsConfigModalOpen(false);
  };

  const handleSaveConfig = (updatedConfig: StopConfig) => {
    // Save the updated configuration
    if (onConfigure) {
      onConfigure(updatedConfig);
    } else {
      console.log('Saving config:', updatedConfig);
    }
    setIsConfigModalOpen(false);
  };

  // Function to get the style for a line
  const getLineStyle = (line: string, city: 'muc' | 'wue', groupType: string): CSSProperties => {
    // Check if we have a specific style for this line in muc.lines
    if (typeToStyles[city].lines[line]) {
      const lineStyle = typeToStyles[city].lines[line];
      return {
        backgroundColor: lineStyle["background-color"] ? lineStyle["background-color"] : undefined,
        color: lineStyle.color ? lineStyle.color : undefined,
        padding: '5px 5px',
        borderRadius: (city == 'wue') ? '10px' : undefined,
        display: 'inline-block',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        // Optional background image properties
        backgroundImage: lineStyle["background-image"]
          ? `url(../assets/muc/${lineStyle["background-image"]})`
          : undefined,
        backgroundRepeat: lineStyle["background-repeat"] || undefined,
        backgroundPosition: lineStyle["background-position"] || undefined,
        backgroundSize: lineStyle["background-size"] || undefined
      };
    } else if (typeToStyles[city].groups[groupType]) {
      const groupStyle = typeToStyles[city].groups[groupType];
      return {
                backgroundColor: groupStyle["background-color"] ? groupStyle["background-color"] : undefined,
        color: groupStyle.color ? groupStyle.color : undefined,
        padding: '2px 6px',
        borderRadius: groupStyle['border-radius'] ? groupStyle['border-radius'] : undefined,
        display: 'inline-block',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      };
    }

    // Default style if no specific style is found
    const defaultStyle = typeToStyles[city].groups.default;
    return {
      backgroundColor: defaultStyle["background-color"] ? defaultStyle["background-color"] : undefined,
      color: '#fff', // White text on colored background
      padding: defaultStyle.padding ? defaultStyle.padding : '2px 6px',
      borderRadius: defaultStyle['border-radius'] ? defaultStyle['border-radius'] : '4px',
      display: 'inline-block',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    };
  };

  // Filter departures based on walking time
  const filteredDepartures = departures.filter(dep => {
    const departureTime = dep.actualDeparture || dep.scheduledDeparture;
    const currentTime = new Date();
    const walkingTimeMs = stopConfig.walkingTimeMinutes * 60 * 1000; // Convert minutes to milliseconds
    const arrivalTime = new Date(currentTime.getTime() + walkingTimeMs);
    
    // Keep the departure if the user can arrive before the departure time
    return departureTime.getTime() >= arrivalTime.getTime();
  });

  // Limit the number of departures based on the global setting
  const limitedDepartures = filteredDepartures.slice(0, maxDeparturesShown);

  return (
    <>
      <div style={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 8,
        padding: '1rem',
        minWidth: '300px',
        flex: '1 1 300px',
        maxWidth: '500px',
        margin: '0.5rem',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{stopConfig.name}</h3>
        <div style={{ display: 'flex' }}>
          <IconButton
            size="small"
            onClick={handleOpenConfigModal}
            aria-label={t('stopWidget.configure')}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              marginRight: '8px',
              padding: '4px'
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={onRefresh}
            aria-label={t('stopWidget.refresh')}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              padding: '4px'
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
      <div>{t('walkingTime', { minutes: stopConfig.walkingTimeMinutes })}</div>
      {isLoading ? (
        <div style={{ padding: '1rem', textAlign: 'center' }}>{t('stopWidget.loading')}</div>
      ) : filteredDepartures.length === 0 ? (
       <div style={{ padding: '1rem', textAlign: 'center' }}>{t('stopWidget.noDepartures')}</div>
     ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}` }}>{t('line')}</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}` }}>{t('destination')}</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}` }}>{t('departure')}</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}` }}>{t('delay')}</th>
            </tr>
          </thead>
          <tbody>
            {/*
              Robuste Key-Strategie: Kombiniert stopId, dep.id, scheduledDeparture timestamp und index
              für garantiert eindeutige React Keys, auch bei mehreren Stops mit identischen Abfahrten
            */}
            {limitedDepartures.map((dep, index) => (
              <tr key={`stop-${stopConfig.stopId}-dep-${dep.id}-${dep.scheduledDeparture.getTime()}-${index}`}>
                <td className="line-number-cell" style={{ padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}`, width: '15%', minWidth: '80px' }}>
                  <span className="line-number" style={getLineStyle(dep.line, stopConfig.city, dep.transportType)}>{dep.line}</span>
                </td>
                <td className="direction-text-cell" style={{ padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}`, minWidth: '180px', maxWidth: '250px', width: '45%' }}>
                  <TruncatedText text={dep.direction} maxLength={25} className="direction-text" />
                </td>
                <td style={{ padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}`, width: '20%', minWidth: '70px' }}>
                  {dep.actualDeparture
                    ? dep.actualDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : dep.scheduledDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}`, width: '20%', minWidth: '60px' }}>
                  {dep.delayMinutes && dep.delayMinutes > 0 ? `+${dep.delayMinutes}m` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

    <StopConfigModal
      open={isConfigModalOpen}
      onClose={handleCloseConfigModal}
      onSave={handleSaveConfig}
      initialConfig={stopConfig}
    />
    </>
  );
};

export default StopWidget;