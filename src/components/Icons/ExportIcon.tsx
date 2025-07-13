/**
 * Memoized ExportIcon Component
 * Optimiert für Performance - wird nur einmal gerendert
 */

import React from 'react';

interface ExportIconProps {
  /** Custom CSS classes */
  className?: string;
  /** Size of the icon */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
}

/**
 * Memoized Export Icon Component
 * Prevents unnecessary re-renders of static SVG
 */
export const ExportIcon: React.FC<ExportIconProps> = React.memo(({ 
  className = "w-4 h-4 mr-2",
  size = 24,
  strokeWidth = 2
}) => (
  <svg 
    className={className}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    width={size}
    height={size}
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={strokeWidth} 
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
    />
  </svg>
));

ExportIcon.displayName = 'ExportIcon';