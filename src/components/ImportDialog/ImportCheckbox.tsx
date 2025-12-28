/**
 * ImportCheckbox - Enhanced checkbox component with improved accessibility and readability
 * Addresses design issues: better labeling, clear visual hierarchy, keyboard navigation
 */

import React, { useId, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './ImportCheckbox.css';

export interface ImportCheckboxProps {
  /** Unique identifier for the checkbox */
  id?: string;
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when checkbox state changes */
  onChange: (checked: boolean) => void;
  /** Main label text */
  label: string;
  /** Additional description text */
  description?: string;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Whether the checkbox is required */
  required?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show validation state */
  validationState?: 'valid' | 'invalid' | 'warning';
  /** Validation message */
  validationMessage?: string;
  /** Whether to use compact layout */
  compact?: boolean;
  /** ARIA label for better accessibility */
  ariaLabel?: string;
  /** ARIA describedby for additional description */
  ariaDescribedBy?: string;
  /** Test ID for testing purposes */
  testId?: string;
}

export const ImportCheckbox: React.FC<ImportCheckboxProps> = ({
  id: providedId,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  required = false,
  className = '',
  size = 'medium',
  validationState,
  validationMessage,
  compact = false,
  ariaLabel,
  ariaDescribedBy,
  testId
}) => {
  const { t } = useTranslation();
  const generatedId = useId();
  const id = providedId || generatedId;
  const descriptionId = `${id}-description`;
  const validationId = `${id}-validation`;

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(event.target.checked);
    }
  }, [onChange, disabled]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLLabelElement>) => {
    // Allow space key to toggle checkbox when focusing the label
    if (event.key === ' ' && !disabled) {
      event.preventDefault();
      onChange(!checked);
    }
  }, [checked, onChange, disabled]);

  const getValidationIcon = () => {
    switch (validationState) {
      case 'valid':
        return <span className="import-checkbox__validation-icon import-checkbox__validation-icon--valid" aria-hidden="true">✓</span>;
      case 'invalid':
        return <span className="import-checkbox__validation-icon import-checkbox__validation-icon--invalid" aria-hidden="true">✗</span>;
      case 'warning':
        return <span className="import-checkbox__validation-icon import-checkbox__validation-icon--warning" aria-hidden="true">⚠</span>;
      default:
        return null;
    }
  };

  const computedAriaDescribedBy = [
    description ? descriptionId : '',
    validationMessage ? validationId : '',
    ariaDescribedBy || ''
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div 
      className={`
        import-checkbox
        import-checkbox--${size}
        ${compact ? 'import-checkbox--compact' : ''}
        ${disabled ? 'import-checkbox--disabled' : ''}
        ${validationState ? `import-checkbox--${validationState}` : ''}
        ${className}
      `.trim()}
      data-testid={testId}
    >
      <label 
        htmlFor={id}
        className="import-checkbox__label"
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled}
        aria-required={required}
        aria-label={ariaLabel}
        aria-describedby={computedAriaDescribedBy}
      >
        <div className="import-checkbox__input-container">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            className="import-checkbox__input"
            aria-hidden="true" // Hide from screen readers since label handles accessibility
            tabIndex={-1} // Remove from tab order, label handles focus
          />
          <div className="import-checkbox__checkmark" aria-hidden="true">
            {checked && (
              <svg 
                className="import-checkbox__checkmark-icon" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M13.5 4.5L6 12L2.5 8.5" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>

        <div className="import-checkbox__content">
          <div className="import-checkbox__label-container">
            <span className="import-checkbox__label-text">
              {label}
              {required && (
                <span className="import-checkbox__required" aria-label={t('common.required')}>
                  *
                </span>
              )}
            </span>
            {getValidationIcon()}
          </div>
          
          {description && (
            <span 
              id={descriptionId}
              className="import-checkbox__description"
              aria-hidden="false"
            >
              {description}
            </span>
          )}
          
          {validationMessage && (
            <span 
              id={validationId}
              className="import-checkbox__validation-message"
              role="alert"
              aria-live="polite"
            >
              {validationMessage}
            </span>
          )}
        </div>
      </label>
    </div>
  );
};

export default ImportCheckbox;