/**
 * Enhanced Import Components - TypeScript Interfaces
 * Comprehensive type definitions for all import UI components
 */

// Base types
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Test ID for testing purposes */
  testId?: string;
}

// ImportCheckbox types
export interface ImportCheckboxProps extends BaseComponentProps {
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
  /** Whether the checkbox is required */
  required?: boolean;
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
}

// ImportOptionCard types
export interface ImportOptionItem {
  /** Unique key for the option */
  key: string;
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

export interface ImportOptionCardProps extends BaseComponentProps {
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** List of options to display */
  options: ImportOptionItem[];
  /** Current options state */
  currentOptions: Record<string, boolean>;
  /** Callback when options change */
  onOptionsChange: (options: Record<string, boolean>) => void;
  /** Whether the card is collapsible */
  collapsible?: boolean;
  /** Whether the card is initially expanded */
  defaultExpanded?: boolean;
  /** Card icon */
  icon?: React.ReactNode;
  /** Whether to show as compact variant */
  compact?: boolean;
  /** Card priority level for visual hierarchy */
  priority?: 'high' | 'medium' | 'low';
}

// PreviewCard types
export interface PreviewCardProps extends BaseComponentProps {
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
  /** Priority level for visual hierarchy */
  priority?: 'high' | 'medium' | 'low';
  /** Callback when card is expanded/collapsed */
  onToggle?: (expanded: boolean) => void;
  /** Maximum height when expanded */
  maxHeight?: string;
  /** Whether to show loading state */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
}

export interface ConflictPreviewCardProps {
  /** List of import conflicts */
  conflicts: ImportConflict[];
  /** Callback when conflict is resolved */
  onResolve?: (conflictId: string, resolution: string) => void;
}

export interface StopPreviewCardProps {
  /** List of stops to preview */
  stops: StopPreviewItem[];
  /** Maximum number of stops to display */
  maxDisplay?: number;
  /** Callback when view all is clicked */
  onViewAll?: () => void;
}

export interface StopPreviewItem {
  /** Stop ID */
  id?: string;
  /** Stop name */
  name: string;
  /** Stop city */
  city?: string;
  /** Stop identifier */
  stopId: string;
  /** Whether the stop is visible */
  visible?: boolean;
}

// ImportProgressIndicator types
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

export interface ImportProgressIndicatorProps extends BaseComponentProps {
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
  /** Whether to animate progress changes */
  animated?: boolean;
  /** Color theme */
  theme?: 'primary' | 'success' | 'warning' | 'error';
  /** Callback when step is clicked */
  onStepClick?: (stepIndex: number) => void;
  /** Callback when progress is clicked */
  onProgressClick?: (progress: number) => void;
  /** ARIA label for the progress indicator */
  ariaLabel?: string;
}

// Import-related types (from existing codebase)
export interface ImportConflict {
  /** Conflict type */
  type: string;
  /** Conflict severity */
  severity: 'high' | 'medium' | 'low';
  /** Conflict description */
  description: string;
  /** Related stop ID */
  stopId?: string;
  /** Suggested resolution */
  suggestedResolution?: string;
}

// Enhanced component composition types
export interface ImportUIConfig {
  /** Whether to enable enhanced checkboxes */
  useEnhancedCheckboxes: boolean;
  /** Whether to use card-based layouts */
  useCardLayout: boolean;
  /** Whether to show progress indicators */
  showProgressIndicator: boolean;
  /** Whether to enable collapsible preview cards */
  enableCollapsiblePreviews: boolean;
  /** Default component sizes */
  defaultSizes: {
    checkbox: 'small' | 'medium' | 'large';
    card: 'small' | 'medium' | 'large';
    progress: 'small' | 'medium' | 'large';
  };
  /** Accessibility preferences */
  accessibility: {
    /** Whether to enable enhanced keyboard navigation */
    enhancedKeyboardNavigation: boolean;
    /** Whether to show additional ARIA labels */
    verboseAriaLabels: boolean;
    /** Whether to enable reduced motion mode */
    reducedMotion: boolean;
  };
}

// Hook types for state management
export interface UseImportCheckboxReturn {
  /** Current checked state */
  checked: boolean;
  /** Toggle checkbox */
  toggle: () => void;
  /** Set checkbox state */
  setChecked: (checked: boolean) => void;
  /** Validation state */
  validationState?: 'valid' | 'invalid' | 'warning';
  /** Validation message */
  validationMessage?: string;
}

export interface UseImportProgressReturn {
  /** Current progress percentage */
  progress: number;
  /** Current step index */
  currentStepIndex: number;
  /** Whether import is active */
  isActive: boolean;
  /** Whether import is paused */
  isPaused: boolean;
  /** Elapsed time in seconds */
  elapsedTime: number;
  /** Estimated remaining time */
  estimatedRemainingTime: number | null;
  /** Start import process */
  startImport: () => void;
  /** Pause import process */
  pauseImport: () => void;
  /** Resume import process */
  resumeImport: () => void;
  /** Stop import process */
  stopImport: () => void;
  /** Go to specific step */
  goToStep: (stepIndex: number) => void;
}

// All types are already exported inline above