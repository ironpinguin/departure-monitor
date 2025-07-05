/**
 * Schema-Version-Verwaltung für das Import/Export-System
 * Enthält Funktionen zur Versionskontrolle und -migration
 */

import { 
  SCHEMA_VERSIONS, 
  type SchemaVersionInfo,
  type ValidationWarning,
  WARNING_CODES
} from '../types/configExport';

/**
 * Schema-Version-Informationen
 */
export function getSchemaVersionInfo(): SchemaVersionInfo {
  return {
    current: SCHEMA_VERSIONS.CURRENT,
    supported: [...SCHEMA_VERSIONS.SUPPORTED],
    minimum: SCHEMA_VERSIONS.MINIMUM
  };
}

/**
 * Überprüft, ob eine Version unterstützt wird
 */
export function isSupportedVersion(version: string): boolean {
  return (SCHEMA_VERSIONS.SUPPORTED as readonly string[]).includes(version);
}

/**
 * Überprüft, ob eine Version die aktuelle ist
 */
export function isCurrentVersion(version: string): boolean {
  return version === SCHEMA_VERSIONS.CURRENT;
}

/**
 * Überprüft, ob eine Version die minimale unterstützte Version ist
 */
export function isMinimumVersion(version: string): boolean {
  return version === SCHEMA_VERSIONS.MINIMUM;
}

/**
 * Vergleicht zwei Versionen (einfache Implementierung für Semantic Versioning)
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(n => parseInt(n, 10));
  const v2Parts = version2.split('.').map(n => parseInt(n, 10));
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part < v2Part) return -1;
    if (v1Part > v2Part) return 1;
  }
  
  return 0;
}

/**
 * Überprüft, ob eine Version neuer ist als eine andere
 */
export function isNewerVersion(version: string, compareVersion: string): boolean {
  return compareVersions(version, compareVersion) > 0;
}

/**
 * Überprüft, ob eine Version älter ist als eine andere
 */
export function isOlderVersion(version: string, compareVersion: string): boolean {
  return compareVersions(version, compareVersion) < 0;
}

/**
 * Findet die neueste unterstützte Version
 */
export function getLatestSupportedVersion(): string {
  const versions = [...SCHEMA_VERSIONS.SUPPORTED];
  return versions.sort((a, b) => compareVersions(b, a))[0];
}

/**
 * Findet die älteste unterstützte Version
 */
export function getOldestSupportedVersion(): string {
  const versions = [...SCHEMA_VERSIONS.SUPPORTED];
  return versions.sort((a, b) => compareVersions(a, b))[0];
}

/**
 * Überprüft die Versionskompatibilität
 */
export function checkVersionCompatibility(
  sourceVersion: string,
  targetVersion: string = SCHEMA_VERSIONS.CURRENT
): {
  isCompatible: boolean;
  requiresMigration: boolean;
  isSupported: boolean;
  warnings: ValidationWarning[];
} {
  const warnings: ValidationWarning[] = [];
  const isSupported = isSupportedVersion(sourceVersion);
  const isCompatible = sourceVersion === targetVersion;
  const requiresMigration = !isCompatible && isSupported;

  if (!isSupported) {
    warnings.push({
      code: WARNING_CODES.COMPATIBILITY_ISSUE,
      message: `Schema-Version ${sourceVersion} wird nicht unterstützt`,
      field: 'schemaVersion',
      value: sourceVersion,
      recommendation: `Verwenden Sie eine der unterstützten Versionen: ${SCHEMA_VERSIONS.SUPPORTED.join(', ')}`
    });
  }

  if (requiresMigration) {
    warnings.push({
      code: WARNING_CODES.COMPATIBILITY_ISSUE,
      message: `Schema-Migration von ${sourceVersion} zu ${targetVersion} erforderlich`,
      field: 'schemaVersion',
      value: sourceVersion,
      recommendation: 'Führen Sie eine Schema-Migration durch'
    });
  }

  if (isOlderVersion(sourceVersion, targetVersion)) {
    warnings.push({
      code: WARNING_CODES.COMPATIBILITY_ISSUE,
      message: `Schema-Version ${sourceVersion} ist veraltet`,
      field: 'schemaVersion',
      value: sourceVersion,
      recommendation: `Aktualisieren Sie auf Version ${targetVersion}`
    });
  }

  return {
    isCompatible,
    requiresMigration,
    isSupported,
    warnings
  };
}

/**
 * Erstellt eine neue Schema-Version für Export
 */
export function createSchemaVersionForExport(): string {
  return SCHEMA_VERSIONS.CURRENT;
}

/**
 * Validiert eine Schema-Version-Zeichenkette
 */
export function validateVersionString(version: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!version || typeof version !== 'string') {
    errors.push('Schema-Version muss ein gültiger String sein');
    return { isValid: false, errors };
  }

  // Einfache Semantic Versioning-Validierung (X.Y.Z)
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(version)) {
    errors.push('Schema-Version muss dem Format X.Y.Z entsprechen (z.B. 1.0.0)');
  }

  const parts = version.split('.');
  if (parts.length !== 3) {
    errors.push('Schema-Version muss genau drei Teile haben (Major.Minor.Patch)');
  }

  // Überprüfen, ob alle Teile gültige Zahlen sind
  for (let i = 0; i < parts.length; i++) {
    const part = parseInt(parts[i], 10);
    if (isNaN(part) || part < 0) {
      errors.push(`Schema-Version-Teil ${i + 1} muss eine gültige nicht-negative Zahl sein`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generiert einen Migrations-Pfad zwischen zwei Versionen
 */
export function generateMigrationPath(
  fromVersion: string,
  toVersion: string
): {
  migrationSteps: string[];
  isDirectMigration: boolean;
  estimatedComplexity: 'low' | 'medium' | 'high';
} {
  const migrationSteps: string[] = [];
  const isDirectMigration = isSupportedVersion(fromVersion) && isSupportedVersion(toVersion);
  
  // Einfache Migration für unterstützte Versionen
  if (isDirectMigration) {
    migrationSteps.push(`Migriere von ${fromVersion} zu ${toVersion}`);
  }

  // Komplexität basierend auf Versionsunterschied schätzen
  let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';
  
  if (isDirectMigration) {
    const versionDiff = Math.abs(compareVersions(fromVersion, toVersion));
    if (versionDiff === 0) {
      estimatedComplexity = 'low';
    } else if (versionDiff === 1) {
      estimatedComplexity = 'medium';
    } else {
      estimatedComplexity = 'high';
    }
  } else {
    estimatedComplexity = 'high';
  }

  return {
    migrationSteps,
    isDirectMigration,
    estimatedComplexity
  };
}

/**
 * Erstellt einen Versions-Fingerprint für Caching
 */
export function createVersionFingerprint(version: string): string {
  return `schema-${version}-${Date.now()}`;
}

/**
 * Überprüft, ob eine Version rückwärtskompatibel ist
 */
export function isBackwardCompatible(
  currentVersion: string,
  requiredVersion: string
): boolean {
  // Einfache Implementierung: Rückwärtskompatibilität innerhalb derselben Major-Version
  const currentParts = currentVersion.split('.');
  const requiredParts = requiredVersion.split('.');
  
  if (currentParts.length !== 3 || requiredParts.length !== 3) {
    return false;
  }
  
  const currentMajor = parseInt(currentParts[0], 10);
  const requiredMajor = parseInt(requiredParts[0], 10);
  
  // Gleiche Major-Version erforderlich für Rückwärtskompatibilität
  if (currentMajor !== requiredMajor) {
    return false;
  }
  
  // Aktuelle Version muss mindestens so hoch sein wie die erforderliche
  return compareVersions(currentVersion, requiredVersion) >= 0;
}

/**
 * Berechnet die Versionskompatibilitäts-Matrix
 */
export function getVersionCompatibilityMatrix(): Record<string, {
  compatible: string[];
  requiresMigration: string[];
  unsupported: string[];
}> {
  const matrix: Record<string, {
    compatible: string[];
    requiresMigration: string[];
    unsupported: string[];
  }> = {};
  
  SCHEMA_VERSIONS.SUPPORTED.forEach(version => {
    matrix[version] = {
      compatible: [],
      requiresMigration: [],
      unsupported: []
    };
    
    SCHEMA_VERSIONS.SUPPORTED.forEach(otherVersion => {
      if (version === otherVersion) {
        matrix[version].compatible.push(otherVersion);
      } else {
        matrix[version].requiresMigration.push(otherVersion);
      }
    });
  });
  
  return matrix;
}

/**
 * Export der Hauptfunktionen
 */
export const SchemaVersionManager = {
  getVersionInfo: getSchemaVersionInfo,
  isSupported: isSupportedVersion,
  isCurrent: isCurrentVersion,
  isMinimum: isMinimumVersion,
  compare: compareVersions,
  isNewer: isNewerVersion,
  isOlder: isOlderVersion,
  getLatest: getLatestSupportedVersion,
  getOldest: getOldestSupportedVersion,
  checkCompatibility: checkVersionCompatibility,
  createForExport: createSchemaVersionForExport,
  validate: validateVersionString,
  generateMigrationPath,
  createFingerprint: createVersionFingerprint,
  isBackwardCompatible,
  getCompatibilityMatrix: getVersionCompatibilityMatrix
};