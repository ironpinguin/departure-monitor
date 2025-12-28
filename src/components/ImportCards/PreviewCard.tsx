/**
 * PreviewCard - Collapsible Cards for Progressive Disclosure
 * Solves information overload by organizing preview details in expandable cards
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImportConflict } from '../../types/configExport';
import './PreviewCard.css';

export interface PreviewCardProps {
  /** Card title */
  title: string;
  /** Card subtitle */
  subtitle?: string;
  /** Card content */
  children: React.ReactNode;
  /** Whether the card is collapsible */
  collapsible?: boolean;
  /** Whether the card is initially expanded */
  defaultExpanded?: boolean;
  /** Card type affects styling and behavior */
  type?: 'info' | 'warning' | 'error' | 'success' | 'neutral';
  /** Number badge for the card */
  badge?: number;
  /** Icon for the card */
  icon?: React.ReactNode;
  /** Whether to show as compact variant */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Priority level for visual hierarchy */
  priority?: 'high' | 'medium' | 'low';
  /** Test ID for testing purposes */
  testId?: string;
  /** Callback when card is expanded/collapsed */
  onToggle?: (expanded: boolean) => void;
  /** Maximum height when expanded */
  maxHeight?: string;
  /** Whether to show loading state */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  title,
  subtitle,
  children,
  collapsible = true,
  defaultExpanded = false,
  type = 'neutral',
  badge,
  icon,
  compact = false,
  className = '',
  disabled = false,
  priority = 'medium',
  testId,
  onToggle,
  maxHeight = '400px',
  loading = false,
  loadingMessage = 'Loading...'
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    if (collapsible && !disabled && !loading) {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      onToggle?.(newExpanded);
    }
  }, [collapsible, disabled, loading, isExpanded, onToggle]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (collapsible && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleToggle();
    }
  }, [collapsible, handleToggle]);

  const getTypeIcon = () => {
    if (icon) return icon;
    if (loading) return <span className="preview-card__spinner" />;
    
    switch (type) {
      case 'info':
        return <span className="preview-card__type-icon preview-card__type-icon--info">ℹ️</span>;
      case 'warning':
        return <span className="preview-card__type-icon preview-card__type-icon--warning">⚠️</span>;
      case 'error':
        return <span className="preview-card__type-icon preview-card__type-icon--error">❌</span>;
      case 'success':
        return <span className="preview-card__type-icon preview-card__type-icon--success">✅</span>;
      default:
        return <span className="preview-card__type-icon preview-card__type-icon--neutral">📋</span>;
    }
  };

  const cardId = testId || `preview-card-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div 
      className={`
        preview-card
        preview-card--${type}
        preview-card--${priority}
        ${compact ? 'preview-card--compact' : ''}
        ${disabled ? 'preview-card--disabled' : ''}
        ${loading ? 'preview-card--loading' : ''}
        ${collapsible ? 'preview-card--collapsible' : ''}
        ${isExpanded ? 'preview-card--expanded' : 'preview-card--collapsed'}
        ${className}
      `.trim()}
      data-testid={testId}
    >
      <div 
        className="preview-card__header"
        onClick={collapsible ? handleToggle : undefined}
        onKeyDown={collapsible ? handleKeyDown : undefined}
        tabIndex={collapsible ? 0 : -1}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? isExpanded : undefined}
        aria-controls={collapsible ? `${cardId}-content` : undefined}
        aria-label={collapsible ? t('import.preview.toggle_card', { title }) : undefined}
        aria-disabled={disabled || loading}
      >
        <div className="preview-card__header-content">
          <div className="preview-card__header-left">
            {getTypeIcon()}
            <div className="preview-card__header-text">
              <h3 className="preview-card__title">
                {title}
                {badge !== undefined && (
                  <span className="preview-card__badge">
                    {badge}
                  </span>
                )}
              </h3>
              {subtitle && (
                <p className="preview-card__subtitle">{subtitle}</p>
              )}
            </div>
          </div>
          
          {collapsible && (
            <div className="preview-card__toggle">
              <span 
                className="preview-card__toggle-icon"
                aria-hidden="true"
              >
                {isExpanded ? '▼' : '▶'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div 
        className="preview-card__content"
        id={`${cardId}-content`}
        style={{
          maxHeight: isExpanded ? maxHeight : '0',
          overflow: 'hidden'
        }}
      >
        <div className="preview-card__content-inner">
          {loading ? (
            <div className="preview-card__loading">
              <div className="preview-card__loading-spinner" />
              <span className="preview-card__loading-text">{loadingMessage}</span>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

// Specialized preview cards for different content types
export interface ConflictPreviewCardProps {
  conflicts: ImportConflict[];
  onResolve?: (conflictId: string, resolution: string) => void;
}

export const ConflictPreviewCard: React.FC<ConflictPreviewCardProps> = ({
  conflicts
}) => {
  const { t } = useTranslation();
  
  const sortedConflicts = useMemo(() => {
    return [...conflicts].sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [conflicts]);

  const severityCount = useMemo(() => {
    return conflicts.reduce((counts, conflict) => {
      counts[conflict.severity] = (counts[conflict.severity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }, [conflicts]);

  const cardType = conflicts.length > 0 ? 
    (severityCount.high > 0 ? 'error' : 
     severityCount.medium > 0 ? 'warning' : 'info') : 'success';

  return (
    <PreviewCard
      title={t('import.preview.conflicts')}
      subtitle={t('import.preview.conflicts_subtitle', { count: conflicts.length })}
      type={cardType}
      badge={conflicts.length}
      defaultExpanded={conflicts.length > 0}
      testId="conflict-preview-card"
    >
      {conflicts.length === 0 ? (
        <div className="preview-card__empty">
          <p>{t('import.preview.no_conflicts')}</p>
        </div>
      ) : (
        <div className="preview-card__conflicts">
          {sortedConflicts.map((conflict, index) => (
            <div key={index} className={`preview-card__conflict preview-card__conflict--${conflict.severity}`}>
              <div className="preview-card__conflict-header">
                <span className="preview-card__conflict-severity">
                  {conflict.severity === 'high' && '🔴'}
                  {conflict.severity === 'medium' && '🟡'}
                  {conflict.severity === 'low' && '🟢'}
                </span>
                <span className="preview-card__conflict-type">
                  {t(`import.conflicts.${conflict.type}`)}
                </span>
                {conflict.stopId && (
                  <span className="preview-card__conflict-id">
                    {conflict.stopId}
                  </span>
                )}
              </div>
              <p className="preview-card__conflict-description">
                {conflict.description}
              </p>
              {conflict.suggestedResolution && (
                <div className="preview-card__conflict-resolution">
                  <strong>{t('import.preview.suggested_resolution')}:</strong>
                  <span>{conflict.suggestedResolution}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PreviewCard>
  );
};

export interface StopPreviewCardProps {
  stops: Array<{
    id?: string;
    name: string;
    city?: string;
    stopId: string;
    visible?: boolean;
  }>;
  maxDisplay?: number;
  onViewAll?: () => void;
}

export const StopPreviewCard: React.FC<StopPreviewCardProps> = ({ 
  stops, 
  maxDisplay = 10, 
  onViewAll 
}) => {
  const { t } = useTranslation();
  
  const displayStops = stops.slice(0, maxDisplay);
  const hasMore = stops.length > maxDisplay;

  return (
    <PreviewCard
      title={t('import.preview.stops')}
      subtitle={t('import.preview.stops_subtitle', { count: stops.length })}
      type="info"
      badge={stops.length}
      defaultExpanded={false}
      testId="stop-preview-card"
    >
      <div className="preview-card__stops">
        {displayStops.map((stop, index) => (
          <div key={stop.id || index} className="preview-card__stop">
            <div className="preview-card__stop-info">
              <span className="preview-card__stop-name">{stop.name}</span>
              <span className="preview-card__stop-details">
                {stop.city?.toUpperCase()} • {stop.stopId}
              </span>
            </div>
            <div className="preview-card__stop-status">
              <span className={`preview-card__stop-visibility ${stop.visible ? 'visible' : 'hidden'}`}>
                {stop.visible ? t('import.preview.visible') : t('import.preview.hidden')}
              </span>
            </div>
          </div>
        ))}
        
        {hasMore && (
          <div className="preview-card__more">
            <button 
              className="preview-card__view-all"
              onClick={onViewAll}
              type="button"
            >
              {t('import.preview.view_all', { remaining: stops.length - maxDisplay })}
            </button>
          </div>
        )}
      </div>
    </PreviewCard>
  );
};

export default PreviewCard;