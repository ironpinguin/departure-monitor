/**
 * ImportProgressIndicator - Intelligent progress indicator with tooltips
 * Provides clear feedback about import progress with enhanced accessibility
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './ImportProgressIndicator.css';

export interface ImportProgressStep {
  /** Unique identifier for the step */
  id: string;
  /** Step label */
  label: string;
  /** Step description */
  description?: string;
  /** Whether the step is completed */
  completed: boolean;
  /** Whether the step is currently active */
  active: boolean;
  /** Whether the step has an error */
  hasError: boolean;
  /** Error message if any */
  errorMessage?: string;
  /** Estimated duration in seconds */
  estimatedDuration?: number;
  /** Actual duration in seconds */
  actualDuration?: number;
  /** Additional metadata */
  metadata?: Record<string, string | number | boolean>;
}

export interface ImportProgressIndicatorProps {
  /** Current progress percentage (0-100) */
  progress: number;
  /** List of progress steps */
  steps: ImportProgressStep[];
  /** Current step index */
  currentStepIndex: number;
  /** Whether the import is in progress */
  isActive: boolean;
  /** Whether the import is paused */
  isPaused?: boolean;
  /** Whether to show detailed progress */
  showDetails?: boolean;
  /** Whether to show time estimates */
  showTimeEstimates?: boolean;
  /** Whether to show steps */
  showSteps?: boolean;
  /** Progress indicator variant */
  variant?: 'linear' | 'circular' | 'stepped';
  /** Size of the indicator */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate progress changes */
  animated?: boolean;
  /** Color theme */
  theme?: 'primary' | 'success' | 'warning' | 'error';
  /** Callback when step is clicked */
  onStepClick?: (stepIndex: number) => void;
  /** Callback when progress is clicked */
  onProgressClick?: (progress: number) => void;
  /** Test ID for testing purposes */
  testId?: string;
  /** ARIA label for the progress indicator */
  ariaLabel?: string;
}

export const ImportProgressIndicator: React.FC<ImportProgressIndicatorProps> = ({
  progress,
  steps,
  currentStepIndex,
  isActive,
  isPaused = false,
  showDetails = true,
  showTimeEstimates = true,
  showSteps = true,
  variant = 'linear',
  size = 'medium',
  className = '',
  animated = true,
  theme = 'primary',
  onStepClick,
  onProgressClick,
  testId,
  ariaLabel
}) => {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState<{ show: boolean; content: string; x: number; y: number }>({
    show: false,
    content: '',
    x: 0,
    y: 0
  });
  const progressRef = useRef<HTMLDivElement>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Track elapsed time
  useEffect(() => {
    if (isActive && !isPaused) {
      if (!startTime) {
        setStartTime(Date.now());
      }
      const interval = setInterval(() => {
        if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, isPaused, startTime]);

  // Calculate estimated remaining time
  const estimatedRemainingTime = useCallback(() => {
    if (progress === 0 || !isActive) return null;
    const avgTimePerPercent = elapsedTime / progress;
    const remainingPercent = 100 - progress;
    return Math.ceil(avgTimePerPercent * remainingPercent);
  }, [progress, elapsedTime, isActive]);

  // Handle tooltip display
  const showTooltip = useCallback((event: React.MouseEvent, content: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      content,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip({ show: false, content: '', x: 0, y: 0 });
  }, []);

  // Handle progress click
  const handleProgressClick = useCallback((event: React.MouseEvent) => {
    if (onProgressClick && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const newProgress = (x / rect.width) * 100;
      onProgressClick(Math.max(0, Math.min(100, newProgress)));
    }
  }, [onProgressClick]);

  // Handle step click
  const handleStepClick = useCallback((stepIndex: number) => {
    if (onStepClick) {
      onStepClick(stepIndex);
    }
  }, [onStepClick]);

  // Format time
  const formatTime = useCallback((seconds: number) => {
    if (seconds < 60) {
      return t('import.progress.seconds', { count: seconds });
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return t('import.progress.minutes_seconds', { minutes, seconds: remainingSeconds });
    } else {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return t('import.progress.hours_minutes', { hours, minutes: remainingMinutes });
    }
  }, [t]);

  // Get current step
  const currentStep = steps[currentStepIndex];
  const completedSteps = steps.filter(step => step.completed).length;
  const hasErrors = steps.some(step => step.hasError);

  // Get status text
  const getStatusText = () => {
    if (hasErrors) {
      return t('import.progress.status_error');
    } else if (isPaused) {
      return t('import.progress.status_paused');
    } else if (isActive) {
      return t('import.progress.status_active');
    } else if (progress === 100) {
      return t('import.progress.status_completed');
    } else {
      return t('import.progress.status_idle');
    }
  };

  const getThemeClass = () => {
    if (hasErrors) return 'error';
    if (isPaused) return 'warning';
    if (progress === 100) return 'success';
    return theme;
  };

  return (
    <div 
      className={`
        import-progress-indicator
        import-progress-indicator--${variant}
        import-progress-indicator--${size}
        import-progress-indicator--${getThemeClass()}
        ${animated ? 'import-progress-indicator--animated' : ''}
        ${isActive ? 'import-progress-indicator--active' : ''}
        ${isPaused ? 'import-progress-indicator--paused' : ''}
        ${hasErrors ? 'import-progress-indicator--error' : ''}
        ${className}
      `.trim()}
      data-testid={testId}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || t('import.progress.aria_label', { progress: Math.round(progress) })}
      aria-describedby={showDetails ? `${testId}-details` : undefined}
    >
      {/* Progress header */}
      <div className="import-progress-indicator__header">
        <div className="import-progress-indicator__info">
          <h4 className="import-progress-indicator__title">
            {currentStep?.label || t('import.progress.title')}
          </h4>
          <p className="import-progress-indicator__status">
            {getStatusText()}
          </p>
        </div>
        
        {showTimeEstimates && (
          <div className="import-progress-indicator__time">
            <div className="import-progress-indicator__elapsed">
              {t('import.progress.elapsed')}: {formatTime(elapsedTime)}
            </div>
            {estimatedRemainingTime() && (
              <div className="import-progress-indicator__remaining">
                {t('import.progress.remaining')}: {formatTime(estimatedRemainingTime()!)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div 
        className="import-progress-indicator__track"
        ref={progressRef}
        onClick={handleProgressClick}
        onMouseEnter={(e) => showTooltip(e, `${Math.round(progress)}%`)}
        onMouseLeave={hideTooltip}
      >
        <div 
          className="import-progress-indicator__bar"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
        <div className="import-progress-indicator__percentage">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Progress details */}
      {showDetails && (
        <div 
          className="import-progress-indicator__details"
          id={`${testId}-details`}
        >
          <div className="import-progress-indicator__stats">
            <span className="import-progress-indicator__stat">
              {t('import.progress.steps_completed', { 
                completed: completedSteps, 
                total: steps.length 
              })}
            </span>
            {currentStep?.description && (
              <span className="import-progress-indicator__description">
                {currentStep.description}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step indicators */}
      {showSteps && steps.length > 0 && (
        <div className="import-progress-indicator__steps">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`
                import-progress-indicator__step
                ${step.completed ? 'import-progress-indicator__step--completed' : ''}
                ${step.active ? 'import-progress-indicator__step--active' : ''}
                ${step.hasError ? 'import-progress-indicator__step--error' : ''}
                ${onStepClick ? 'import-progress-indicator__step--clickable' : ''}
              `.trim()}
              onClick={() => handleStepClick(index)}
              onMouseEnter={(e) => showTooltip(e, step.label)}
              onMouseLeave={hideTooltip}
              role={onStepClick ? 'button' : undefined}
              tabIndex={onStepClick ? 0 : -1}
              aria-label={`${step.label} ${step.completed ? t('import.progress.completed') : step.active ? t('import.progress.active') : t('import.progress.pending')}`}
            >
              <div className="import-progress-indicator__step-indicator">
                {step.hasError ? (
                  <span className="import-progress-indicator__step-icon">❌</span>
                ) : step.completed ? (
                  <span className="import-progress-indicator__step-icon">✓</span>
                ) : step.active ? (
                  <span className="import-progress-indicator__step-spinner" />
                ) : (
                  <span className="import-progress-indicator__step-number">{index + 1}</span>
                )}
              </div>
              <div className="import-progress-indicator__step-label">
                {step.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {tooltip.show && (
        <div 
          className="import-progress-indicator__tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
          role="tooltip"
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default ImportProgressIndicator;