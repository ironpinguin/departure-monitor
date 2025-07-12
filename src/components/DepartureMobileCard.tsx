import React from 'react';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Departure } from '../models';
import { getLineStyle } from '../utils/typeToStyles';
import TruncatedText from './TruncatedText';

interface DepartureMobileCardProps {
  departure: Departure;
  city: 'muc' | 'wue';
}

/**
 * Mobile card component for displaying departure information
 * Optimized for touch devices with better spacing and readability
 */
const DepartureMobileCard: React.FC<DepartureMobileCardProps> = ({
  departure,
  city
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

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

  const departureTime = departure.actualDeparture || departure.scheduledDeparture;
  const hasDelay = departure.delayMinutes && departure.delayMinutes > 0;

  return (
    <div
      className="departure-mobile-card"
      style={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        minHeight: '44px', // Minimum touch target size
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
      role="article"
      aria-label={t('stopWidget.departureCard', { 
        line: departure.line, 
        destination: departure.direction,
        time: departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })}
      tabIndex={0}
    >
      {/* Header Row: Line and Time */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span
            className="line-number-mobile"
            style={{
              ...getLineStyle(departure.line, city, departure.transportType),
              minWidth: '44px', // Touch target size
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            aria-label={getLineAccessibilityLabel(departure.line, departure.transportType)}
            title={t('stopWidget.lineNumber', { line: departure.line, transportType: departure.transportType })}
          >
            {departure.line}
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px'
        }}>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: hasDelay ? theme.palette.warning.main : theme.palette.text.primary
            }}
            aria-label={getTimeDescription(departure)}
            title={getTimeDescription(departure)}
          >
            {departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          {hasDelay && departure.delayMinutes && departure.delayMinutes != 0 && (
            <div
              style={{
                fontSize: '12px',
                color: theme.palette.warning.main,
                fontWeight: '500'
              }}
              aria-label={getDelayDescription(departure.delayMinutes)}
              title={getDelayDescription(departure.delayMinutes)}
            >
              ({departure.delayMinutes > 0 ? '+' : ''}{departure.delayMinutes}m)
            </div>
          )}
        </div>
      </div>

      {/* Destination Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span
          style={{
            fontSize: '14px',
            color: theme.palette.text.secondary,
            fontWeight: '500'
          }}
        >
          {t('destination')}:
        </span>
        <div
          style={{
            flex: 1,
            fontSize: '14px',
            color: theme.palette.text.primary
          }}
          aria-label={t('stopWidget.destination', { direction: departure.direction })}
          title={departure.direction}
        >
          <TruncatedText text={departure.direction} maxLength={35} className="direction-text-mobile" />
        </div>
      </div>
    </div>
  );
};

export default DepartureMobileCard;