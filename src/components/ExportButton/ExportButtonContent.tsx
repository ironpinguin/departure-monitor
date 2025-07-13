/**
 * Memoized ExportButton Content Component
 * Optimiert für Performance durch Memoization
 */

import React from 'react';
import { LoadingSpinner } from '../Icons/LoadingSpinner';
import { ExportIcon } from '../Icons/ExportIcon';

interface ExportButtonContentProps {
  /** Whether the export is currently in progress */
  isExporting: boolean;
  /** Text to display while exporting */
  exportingText: string;
  /** Text to display when not exporting */
  buttonText: string;
}

/**
 * Memoized Button Content Component
 * Prevents unnecessary re-renders of button content
 */
export const ExportButtonContent: React.FC<ExportButtonContentProps> = React.memo(({ 
  isExporting,
  exportingText,
  buttonText
}) => (
  <>
    {isExporting ? (
      <>
        <LoadingSpinner />
        {exportingText}
      </>
    ) : (
      <>
        <ExportIcon />
        {buttonText}
      </>
    )}
  </>
));

ExportButtonContent.displayName = 'ExportButtonContent';