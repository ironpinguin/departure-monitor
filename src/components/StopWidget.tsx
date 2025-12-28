import React, { useState, useCallback, useRef } from 'react';
import type { Departure, StopConfig } from '../models';
import StopConfigModal from './StopConfigModal';
import TruncatedText from './TruncatedText';
import {
  IconButton,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getLineStyle } from '../utils/typeToStyles';

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
  const tableRef = useRef<HTMLTableElement>(null);
  const theme = useTheme();
  const { t } = useTranslation();

  // Generate unique IDs for table headers
  const tableId = `departure-table-${stopConfig.stopId}`;
  const lineHeaderId = `${tableId}-line-header`;
  const destHeaderId = `${tableId}-destination-header`;
  const depHeaderId = `${tableId}-departure-header`;
  const delayHeaderId = `${tableId}-delay-header`;

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
    }
    setIsConfigModalOpen(false);
  };

  // Keyboard navigation for table cells
  const handleCellKeyDown = useCallback((event: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (!tableRef.current) return;
    
    const rows = tableRef.current.querySelectorAll('tbody tr');
    const totalRows = rows.length;
    const totalCols = 4; // line, destination, departure, delay
    
    let newRow = rowIndex;
    let newCol = colIndex;
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        newRow = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        newRow = Math.min(totalRows - 1, rowIndex + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newCol = Math.max(0, colIndex - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newCol = Math.min(totalCols - 1, colIndex + 1);
        break;
      case 'Home':
        event.preventDefault();
        newCol = 0;
        break;
      case 'End':
        event.preventDefault();
        newCol = totalCols - 1;
        break;
      default:
        return;
    }
    
    // Focus the new cell
    const targetRow = rows[newRow] as HTMLTableRowElement;
    const targetCell = targetRow?.cells[newCol] as HTMLTableCellElement;
    if (targetCell) {
      targetCell.focus();
    }
  }, []);

  // Function to get accessible time description
  const getTimeDescription = (departure: Departure): string => {
    const actualTime = departure.actualDeparture;
    const scheduledTime = departure.scheduledDeparture;
    const delay = departure.delayMinutes;
    
    if (actualTime && delay && delay > 0) {
      return t('stopWidget.departureWithDelay', {
        actualTime: actualTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scheduledTime: scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        delay: delay
      });
    }
    
    const time = actualTime || scheduledTime;
    return t('stopWidget.departureTime', {
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  // Function to get delay description
  const getDelayDescription = (delayMinutes: number | null | undefined): string => {
    if (!delayMinutes || delayMinutes <= 0) {
      return t('stopWidget.onTime');
    }
    return t('stopWidget.delayed', { minutes: delayMinutes });
  };

  // Function to get transport type accessibility description
  const getTransportTypeDescription = (transportType: string): string => {
    const typeKey = transportType.toLowerCase();
    const transportTypeKeys = ['bus', 'tram', 'sbahn', 'ubahn', 'regionalBahn'];
    
    if (transportTypeKeys.includes(typeKey)) {
      return t(`transportTypes.${typeKey}`);
    }
    return t('transportTypes.default');
  };

  // Function to get line accessibility description with transport type
  const getLineAccessibilityLabel = (line: string, transportType: string): string => {
    const transportTypeDesc = getTransportTypeDescription(transportType);
    return t('stopWidget.lineNumber', {
      line: line,
      transportType: transportTypeDesc
    });
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
        <h2 style={{ margin: 0 }}>{stopConfig.name}</h2>
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
        <div
          style={{ padding: '1rem', textAlign: 'center' }}
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          {t('stopWidget.loading')}
        </div>
      ) : filteredDepartures.length === 0 ? (
       <div
         style={{ padding: '1rem', textAlign: 'center' }}
         aria-live="polite"
         role="status"
       >
         {t('stopWidget.noDepartures')}
       </div>
     ) : (
        <table
          ref={tableRef}
          id={tableId}
          style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}
          aria-label={t('stopWidget.departureTableLabel', { stopName: stopConfig.name })}
          role="table"
        >
          <thead>
            <tr role="row">
              <th
                id={lineHeaderId}
                scope="col"
                style={{ textAlign: 'left', padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}` }}
                role="columnheader"
              >
                {t('line')}
              </th>
              <th
                id={destHeaderId}
                scope="col"
                style={{ textAlign: 'left', padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}` }}
                role="columnheader"
              >
                {t('destination')}
              </th>
              <th
                id={depHeaderId}
                scope="col"
                style={{ textAlign: 'left', padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}` }}
                role="columnheader"
              >
                {t('departure')}
              </th>
              <th
                id={delayHeaderId}
                scope="col"
                style={{ textAlign: 'left', padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}` }}
                role="columnheader"
              >
                {t('delay')}
              </th>
            </tr>
          </thead>
          <tbody>
            {/*
              Robuste Key-Strategie: Kombiniert stopId, dep.id, scheduledDeparture timestamp und index
              für garantiert eindeutige React Keys, auch bei mehreren Stops mit identischen Abfahrten
            */}
            {limitedDepartures.map((dep, index) => (
              <tr
                key={`stop-${stopConfig.stopId}-dep-${dep.id}-${dep.scheduledDeparture.getTime()}-${index}`}
                role="row"
              >
                <td
                  className="line-number-cell"
                  style={{ padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}`, width: '15%', minWidth: '80px' }}
                  headers={lineHeaderId}
                  role="gridcell"
                  tabIndex={0}
                  onKeyDown={(e) => handleCellKeyDown(e, index, 0)}
                  aria-label={getLineAccessibilityLabel(dep.line, dep.transportType)}
                >
                  <span
                    className="line-number"
                    style={getLineStyle(dep.line, stopConfig.city, dep.transportType)}
                    title={t('stopWidget.lineNumber', { line: dep.line, transportType: dep.transportType })}
                  >
                    {dep.line}
                  </span>
                </td>
                <td
                  className="direction-text-cell"
                  style={{ padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}`, minWidth: '180px', maxWidth: '250px', width: '45%' }}
                  headers={destHeaderId}
                  role="gridcell"
                  tabIndex={0}
                  onKeyDown={(e) => handleCellKeyDown(e, index, 1)}
                  aria-label={t('stopWidget.destination', { direction: dep.direction })}
                  title={dep.direction}
                >
                  <TruncatedText text={dep.direction} maxLength={25} className="direction-text" />
                </td>
                <td
                  style={{ padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}`, width: '20%', minWidth: '70px' }}
                  headers={depHeaderId}
                  role="gridcell"
                  tabIndex={0}
                  onKeyDown={(e) => handleCellKeyDown(e, index, 2)}
                  aria-label={getTimeDescription(dep)}
                  title={getTimeDescription(dep)}
                >
                  {dep.actualDeparture
                    ? dep.actualDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : dep.scheduledDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td
                  style={{ padding: '0.5rem', borderBottom: `1px solid ${theme.palette.divider}`, width: '20%', minWidth: '60px' }}
                  headers={delayHeaderId}
                  role="gridcell"
                  tabIndex={0}
                  onKeyDown={(e) => handleCellKeyDown(e, index, 3)}
                  aria-label={getDelayDescription(dep.delayMinutes)}
                  title={getDelayDescription(dep.delayMinutes)}
                >
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