/**
 * Import-Button-Komponente
 * Standalone Import-Button mit verstecktem File-Input und Drag & Drop Support
 */

import React, { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ImportUtils } from '../utils/importUtils';
import type { ConfigExport } from '../types/configExport';

interface ImportButtonProps {
  /** Callback wenn Import erfolgreich */
  onImportSuccess: (config: ConfigExport) => void;
  /** Callback wenn Import fehlschlägt */
  onImportError: (error: string) => void;
  /** Callback für Import-Progress */
  onImportProgress?: (progress: number) => void;
  /** Ob der Button disabled ist */
  disabled?: boolean;
  /** Zusätzliche CSS-Klassen */
  className?: string;
  /** Button-Variante */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button-Größe */
  size?: 'small' | 'medium' | 'large';
  /** Ob Drag & Drop aktiv ist */
  supportsDragDrop?: boolean;
}

export const ImportButton: React.FC<ImportButtonProps> = ({
  onImportSuccess,
  onImportError,
  onImportProgress,
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'medium',
  supportsDragDrop = true
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // File-Upload-Handler
  const handleFileUpload = useCallback(async (file: File) => {
    if (disabled || isUploading) return;

    setIsUploading(true);
    
    try {
      // Datei-Validierung
      const validation = await ImportUtils.validateImportFile(file);
      if (!validation.isValid) {
        onImportError(validation.errors.join(', '));
        return;
      }

      // Warnungen anzeigen
      if (validation.warnings.length > 0) {
        console.warn('Import-Warnungen:', validation.warnings);
      }

      // Datei verarbeiten
      const uploadHandler = ImportUtils.createFileUploadHandler(
        onImportSuccess,
        onImportError,
        onImportProgress
      );

      await uploadHandler(file);
    } catch (error) {
      onImportError(ImportUtils.handleImportError(error));
    } finally {
      setIsUploading(false);
    }
  }, [disabled, isUploading, onImportSuccess, onImportError, onImportProgress]);

  // File-Input-Change-Handler
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Input zurücksetzen für wiederholte Uploads
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  // Button-Click-Handler
  const handleButtonClick = useCallback(() => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  }, [disabled, isUploading]);

  // Drag & Drop Handlers
  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (!supportsDragDrop || disabled || isUploading) return;
    
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, [supportsDragDrop, disabled, isUploading]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    if (!supportsDragDrop) return;
    
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, [supportsDragDrop]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    if (!supportsDragDrop || disabled || isUploading) return;
    
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [supportsDragDrop, disabled, isUploading, handleFileUpload]);

  // CSS-Klassen zusammenstellen
  const buttonClasses = [
    'import-button',
    `import-button--${variant}`,
    `import-button--${size}`,
    isDragOver && 'import-button--drag-over',
    isUploading && 'import-button--uploading',
    disabled && 'import-button--disabled',
    className
  ].filter(Boolean).join(' ');

  // Button-Text
  const getButtonText = () => {
    if (isUploading) {
      return t('import.uploading');
    }
    if (isDragOver) {
      return t('import.drop_file');
    }
    return t('import.button');
  };

  // Feature-Support prüfen
  const fileUploadSupported = ImportUtils.supportsFileUpload();
  
  if (!fileUploadSupported) {
    return (
      <div className="import-button--unsupported">
        <p>{t('import.unsupported')}</p>
      </div>
    );
  }

  return (
    <div className="import-button-container">
      <button
        type="button"
        className={buttonClasses}
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label={t('import.button_aria_label')}
      >
        {/* Upload-Icon */}
        <span className="import-button__icon">
          {isUploading ? (
            <svg className="import-button__spinner" viewBox="0 0 24 24">
              <circle
                className="import-button__spinner-circle"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="31.416"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
        </span>
        
        {/* Button-Text */}
        <span className="import-button__text">
          {getButtonText()}
        </span>
      </button>

      {/* Versteckter File-Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        data-testid="file-input"
      />

      {/* Drag & Drop Hinweis */}
      {supportsDragDrop && !disabled && !isUploading && (
        <p className="import-button__hint">
          {t('import.drag_drop_hint')}
        </p>
      )}

      {/* Fortschrittsanzeige */}
      {isUploading && onImportProgress && (
        <div className="import-button__progress">
          <div className="import-button__progress-bar">
            <div className="import-button__progress-fill" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportButton;