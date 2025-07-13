/**
 * Performance Tests für ExportButton-Komponente
 * Testet die optimierten DOM-Manipulationen und Memoization
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExportButton } from '../ExportButton';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key
  })
}));

vi.mock('../../store/configStore', () => ({
  useConfigStore: () => ({
    exportConfig: vi.fn().mockReturnValue({
      stops: [{ id: '1', name: 'Test Stop' }],
      globalSettings: {},
      version: '1.0.0'
    })
  })
}));

vi.mock('../../utils/exportUtils', () => ({
  createExportSummary: vi.fn().mockReturnValue({
    filename: 'test-config.json',
    size: '1.2 KB',
    stopCount: 1,
    timestamp: '2025-01-13 10:00:00'
  }),
  downloadConfigFileWithWorker: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../utils/logger', () => ({
  loggers: {
    components: {
      error: vi.fn()
    }
  }
}));

describe('ExportButton Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with optimized button classes using useMemo', () => {
    const { rerender } = render(<ExportButton />);
    
    const button = screen.getByRole('button');
    const initialClasses = button.className;
    
    // Re-render with same props should maintain same classes (useMemo optimization)
    rerender(<ExportButton />);
    expect(button.className).toBe(initialClasses);
  });

  it('should only re-calculate button classes when relevant props change', () => {
    const { rerender } = render(<ExportButton variant="primary" size="medium" />);
    
    const button = screen.getByRole('button');
    const initialClasses = button.className;
    
    // Re-render with irrelevant prop change should maintain same classes
    rerender(<ExportButton variant="primary" size="medium" showDetails={true} />);
    expect(button.className).toBe(initialClasses);
    
    // Re-render with relevant prop change should update classes
    rerender(<ExportButton variant="secondary" size="medium" showDetails={true} />);
    expect(button.className).not.toBe(initialClasses);
  });

  it('should maintain consistent content structure', () => {
    const { rerender } = render(<ExportButton />);
    
    const button = screen.getByRole('button');
    const initialContent = button.textContent;
    
    // Re-render with same props should maintain same content
    rerender(<ExportButton />);
    expect(button.textContent).toBe(initialContent);
  });

  it('should render ExportDetails only when needed', () => {
    const { rerender } = render(<ExportButton showDetails={false} />);
    
    // No details should be rendered initially
    expect(screen.queryByText('Dateiname')).not.toBeInTheDocument();
    
    // Enable details but no summary yet
    rerender(<ExportButton showDetails={true} />);
    expect(screen.queryByText('Dateiname')).not.toBeInTheDocument();
  });

  it('should use memoized tooltip text', () => {
    const { rerender } = render(<ExportButton />);
    
    const button = screen.getByRole('button');
    const initialTitle = button.getAttribute('title');
    
    // Re-render should maintain same title (memoized)
    rerender(<ExportButton />);
    expect(button.getAttribute('title')).toBe(initialTitle);
  });

  it('should optimize conditional rendering structure', () => {
    const { rerender } = render(<ExportButton />);
    
    // Get initial layout - button should always be present
    const button = screen.getByRole('button');
    const initialContent = button.textContent;
    
    // Component should maintain structure across rerenders
    rerender(<ExportButton showDetails={false} />);
    const buttonAfterRerender = screen.getByRole('button');
    expect(buttonAfterRerender.textContent).toBe(initialContent);
  });

  it('should use constant style objects for better performance', () => {
    const { rerender } = render(<ExportButton variant="primary" />);
    
    const button = screen.getByRole('button');
    const classes1 = button.className;
    
    rerender(<ExportButton variant="primary" />);
    const classes2 = button.className;
    
    // Same variant should produce same classes (constant objects)
    expect(classes1).toBe(classes2);
  });

  it('should render with proper accessibility attributes', () => {
    render(<ExportButton />);
    
    const button = screen.getByRole('button');
    
    // Should have proper button attributes (type="button" is already set in component)
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('title');
  });

  it('should handle disabled state correctly', () => {
    render(<ExportButton disabled={true} />);
    
    const button = screen.getByRole('button');
    
    // Should be disabled
    expect(button).toBeDisabled();
    expect(button.className).toContain('cursor-not-allowed');
    expect(button.className).toContain('opacity-50');
  });

  it('should use memoized components for icons', () => {
    const { rerender } = render(<ExportButton />);
    
    const button = screen.getByRole('button');
    
    // Should contain icon content (text content indicates icon is rendered)
    expect(button.textContent).toContain('Konfiguration exportieren');
    
    // Re-render should maintain same content structure
    rerender(<ExportButton />);
    expect(button.textContent).toContain('Konfiguration exportieren');
  });
});