/**
 * ImportOptionCard - Card-based checkbox grouping for improved readability
 * Solves the inline checkbox layout problem by organizing options in cards
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ImportCheckbox } from '../ImportDialog/ImportCheckbox';
import type { ImportOptions } from '../../types/configExport';
import './ImportOptionCard.css';

export interface ImportOptionItem {
  /** Unique key for the option */
  key: keyof ImportOptions;
  /** Label text for the option */
  label: string;
  /** Description text for the option */
  description?: string;
  /** Whether the option is required */
  required?: boolean;
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Validation state */
  validationState?: 'valid' | 'invalid' | 'warning';
  /** Validation message */
  validationMessage?: string;
  /** Option category for grouping */
  category?: string;
}

export interface ImportOptionCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** List of options to display */
  options: ImportOptionItem[];
  /** Current import options state */
  currentOptions: ImportOptions;
  /** Callback when options change */
  onOptionsChange: (options: ImportOptions) => void;
  /** Whether the card is collapsible */
  collapsible?: boolean;
  /** Whether the card is initially expanded */
  defaultExpanded?: boolean;
  /** Card icon */
  icon?: React.ReactNode;
  /** Whether to show as compact variant */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Card priority level for visual hierarchy */
  priority?: 'high' | 'medium' | 'low';
  /** Test ID for testing purposes */
  testId?: string;
}

export const ImportOptionCard: React.FC<ImportOptionCardProps> = ({
  title,
  description,
  options,
  currentOptions,
  onOptionsChange,
  collapsible = false,
  defaultExpanded = true,
  icon,
  compact = false,
  className = '',
  disabled = false,
  priority = 'medium',
  testId
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggleExpanded = useCallback(() => {
    if (collapsible && !disabled) {
      setIsExpanded(!isExpanded);
    }
  }, [collapsible, disabled, isExpanded]);

  const handleOptionChange = useCallback((optionKey: keyof ImportOptions, value: boolean) => {
    if (disabled) return;
    
    const newOptions = {
      ...currentOptions,
      [optionKey]: value
    };
    onOptionsChange(newOptions);
  }, [currentOptions, onOptionsChange, disabled]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (collapsible && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleToggleExpanded();
    }
  }, [collapsible, handleToggleExpanded]);

  // Group options by category
  const groupedOptions = options.reduce((groups, option) => {
    const category = option.category || 'default';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(option);
    return groups;
  }, {} as Record<string, ImportOptionItem[]>);

  const getCardIcon = () => {
    if (icon) return icon;
    
    switch (priority) {
      case 'high':
        return <span className="import-option-card__default-icon import-option-card__default-icon--high">⚡</span>;
      case 'low':
        return <span className="import-option-card__default-icon import-option-card__default-icon--low">📋</span>;
      default:
        return <span className="import-option-card__default-icon import-option-card__default-icon--medium">⚙️</span>;
    }
  };

  return (
    <div 
      className={`
        import-option-card
        import-option-card--${priority}
        ${compact ? 'import-option-card--compact' : ''}
        ${disabled ? 'import-option-card--disabled' : ''}
        ${collapsible ? 'import-option-card--collapsible' : ''}
        ${isExpanded ? 'import-option-card--expanded' : 'import-option-card--collapsed'}
        ${className}
      `.trim()}
      data-testid={testId}
    >
      <div 
        className="import-option-card__header"
        onClick={collapsible ? handleToggleExpanded : undefined}
        onKeyDown={collapsible ? handleKeyDown : undefined}
        tabIndex={collapsible ? 0 : -1}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? isExpanded : undefined}
        aria-controls={collapsible ? `${testId || 'card'}-content` : undefined}
        aria-label={collapsible ? t('import.card.toggle_expand', { title }) : undefined}
      >
        <div className="import-option-card__header-content">
          {getCardIcon()}
          <div className="import-option-card__header-text">
            <h3 className="import-option-card__title">{title}</h3>
            {description && (
              <p className="import-option-card__description">{description}</p>
            )}
          </div>
        </div>
        
        {collapsible && (
          <div className="import-option-card__toggle">
            <span 
              className="import-option-card__toggle-icon"
              aria-hidden="true"
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
        )}
      </div>

      <div 
        className="import-option-card__content"
        id={collapsible ? `${testId || 'card'}-content` : undefined}
        style={{
          display: collapsible && !isExpanded ? 'none' : 'block'
        }}
      >
        {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
          <div key={category} className="import-option-card__category">
            {category !== 'default' && (
              <h4 className="import-option-card__category-title">
                {t(`import.categories.${category}`, { defaultValue: category })}
              </h4>
            )}
            
            <div className="import-option-card__options">
              {categoryOptions.map((option) => (
                <ImportCheckbox
                  key={option.key}
                  id={`${testId || 'card'}-${option.key}`}
                  checked={currentOptions[option.key] as boolean}
                  onChange={(checked) => handleOptionChange(option.key, checked)}
                  label={t(option.label, { defaultValue: option.label })}
                  description={option.description ? t(option.description, { defaultValue: option.description }) : undefined}
                  required={option.required}
                  disabled={disabled || option.disabled}
                  validationState={option.validationState}
                  validationMessage={option.validationMessage}
                  size={compact ? 'small' : 'medium'}
                  compact={compact}
                  testId={`${testId || 'card'}-${option.key}-checkbox`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Card footer for additional actions */}
      {!compact && isExpanded && (
        <div className="import-option-card__footer">
          <div className="import-option-card__stats">
            <span className="import-option-card__stat">
              {t('import.card.options_count', { 
                enabled: options.filter(opt => currentOptions[opt.key]).length,
                total: options.length 
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportOptionCard;