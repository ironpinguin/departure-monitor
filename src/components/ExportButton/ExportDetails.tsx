/**
 * Memoized ExportDetails Component
 * Optimiert für Performance durch Memoization
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { createExportSummary } from '../../utils/exportUtils';

interface ExportDetailsProps {
  /** Export summary data */
  exportSummary: ReturnType<typeof createExportSummary>;
  /** Whether to show the details */
  show: boolean;
}

/**
 * Memoized Export Details Component
 * Only re-renders when exportSummary or show prop changes
 */
export const ExportDetails: React.FC<ExportDetailsProps> = React.memo(({ 
  exportSummary,
  show
}) => {
  const { t } = useTranslation();

  if (!show) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {t('export.details.filename', 'Dateiname')}:
          </span>
          <p className="text-gray-900 dark:text-gray-100 truncate" title={exportSummary.filename}>
            {exportSummary.filename}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {t('export.details.size', 'Größe')}:
          </span>
          <p className="text-gray-900 dark:text-gray-100">
            {exportSummary.size}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {t('export.details.stops', 'Stops')}:
          </span>
          <p className="text-gray-900 dark:text-gray-100">
            {exportSummary.stopCount}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {t('export.details.timestamp', 'Zeitstempel')}:
          </span>
          <p className="text-gray-900 dark:text-gray-100">
            {exportSummary.timestamp}
          </p>
        </div>
      </div>
    </div>
  );
});

ExportDetails.displayName = 'ExportDetails';