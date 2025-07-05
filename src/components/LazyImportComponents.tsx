/**
 * Lazy Loading für Import-Dialog-Komponenten
 * Reduziert die initiale Bundle-Größe durch Code-Splitting
 */

import React, { Suspense } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import { preloadImportComponents } from './LazyComponents';

// Lazy-loaded Komponenten
const ImportConfirmationDialog = React.lazy(() => import('./ImportConfirmationDialog'));
const ImportPreviewComponent = React.lazy(() => import('./ImportPreviewComponent'));
const ImportOptionsComponent = React.lazy(() => import('./ImportOptionsComponent'));

// Basis-Props für Lazy-Komponenten (flexibel für alle Import-Komponenten)
interface BaseLazyProps extends Record<string, unknown> {
  [key: string]: unknown;
}

/**
 * Loading-Komponente für Lazy-Loading
 */
const ImportLoadingComponent: React.FC<{ message?: string }> = ({ message = 'Lade Import-Dialog...' }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="200px"
    padding={3}
  >
    <CircularProgress size={40} />
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mt: 2 }}
    >
      {message}
    </Typography>
  </Box>
);

/**
 * Lazy-Wrapper für ImportConfirmationDialog
 */
export const LazyImportConfirmationDialog: React.FC<BaseLazyProps> = (props) => (
  <Suspense fallback={<ImportLoadingComponent message="Lade Import-Bestätigungsdialog..." />}>
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    <ImportConfirmationDialog {...(props as any)} />
  </Suspense>
);

/**
 * Lazy-Wrapper für ImportPreviewComponent
 */
export const LazyImportPreviewComponent: React.FC<BaseLazyProps> = (props) => (
  <Suspense fallback={<ImportLoadingComponent message="Lade Import-Vorschau..." />}>
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    <ImportPreviewComponent {...(props as any)} />
  </Suspense>
);

/**
 * Lazy-Wrapper für ImportOptionsComponent
 */
export const LazyImportOptionsComponent: React.FC<BaseLazyProps> = (props) => (
  <Suspense fallback={<ImportLoadingComponent message="Lade Import-Optionen..." />}>
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    <ImportOptionsComponent {...(props as any)} />
  </Suspense>
);

/**
 * Performance-optimierte Import-Dialog-Komponente
 */
export const PerformanceOptimizedImportDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onImport: (config: unknown) => void;
  currentStep: 'upload' | 'options' | 'preview' | 'confirm';
  importData?: unknown;
}> = ({
  open,
  onClose,
  onImport,
  currentStep,
  importData
}) => {
  const [preloadStarted, setPreloadStarted] = React.useState(false);

  // Preload-Effekt für bessere UX
  React.useEffect(() => {
    if (open && !preloadStarted) {
      preloadImportComponents();
      setPreloadStarted(true);
    }
  }, [open, preloadStarted]);

  // Render nur die benötigte Komponente basierend auf currentStep
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'options':
        return (
          <LazyImportOptionsComponent
            data={importData}
            onNext={() => {}}
            onBack={() => {}}
          />
        );
      case 'preview':
        return (
          <LazyImportPreviewComponent
            data={importData}
            onNext={() => {}}
            onBack={() => {}}
          />
        );
      case 'confirm':
        return (
          <LazyImportConfirmationDialog
            isOpen={open}
            onClose={onClose}
            onConfirm={onImport}
            data={importData}
          />
        );
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <Box>
      {renderCurrentStep()}
    </Box>
  );
};

/**
 * Error-Boundary für Lazy-Loading-Fehler
 */
export class LazyImportErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Lazy Import Component Error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="200px"
          padding={3}
        >
          <Typography variant="h6" color="error" gutterBottom>
            Fehler beim Laden der Komponente
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {this.state.error?.message || 'Unbekannter Fehler'}
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper mit Error-Boundary für alle Lazy-Komponenten
 */
export const SafeLazyImportDialog: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <LazyImportErrorBoundary fallback={fallback}>
    {children}
  </LazyImportErrorBoundary>
);