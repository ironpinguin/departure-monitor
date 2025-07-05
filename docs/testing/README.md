# Test-Dokumentation für das Import/Export-System

## Übersicht

Diese Dokumentation beschreibt die umfassende Test-Suite für das Import/Export-System des departure-monitor Projekts. Die Tests sind darauf ausgelegt, eine hohe Code-Coverage zu erreichen und alle kritischen Funktionen zu validieren.

## Test-Struktur

### Unit-Tests (`src/utils/__tests__/`)

#### configValidation.test.ts
**Zweck**: Testet alle Validierungslogik-Funktionen für Import/Export-Konfigurationen

**Getestete Funktionen**:
- `validateConfigStructure()` - Validierung der gesamten Konfigurationsstruktur
- `validateStopConfig()` - Validierung einzelner Stop-Konfigurationen
- `validateSettingsConfig()` - Validierung der App-Einstellungen
- `createImportPreview()` - Erstellung von Import-Vorschauen

**Test-Kategorien**:
- ✅ Erfolgreiche Validierung korrekter Konfigurationen
- ❌ Erkennung und Behandlung ungültiger Daten
- ⚠️ Warnungen bei ungewöhnlichen aber gültigen Konfigurationen
- 🔧 Edge-Cases und Grenzwerte
- 🔄 Schema-Kompatibilität

**Coverage-Ziele**: 95%+ für alle Validierungsfunktionen

#### exportUtils.test.ts
**Zweck**: Testet alle Export-Utilities für Browser-Download und Datei-Export

**Getestete Funktionen**:
- `downloadConfigFile()` - Browser-Download-Funktionalität
- `generateExportFilename()` - Dateinamen-Generierung
- `formatConfigForDownload()` - JSON-Formatierung
- `validateExportData()` - Export-Daten-Validierung
- `estimateFileSize()` - Dateigröße-Schätzung
- `supportsDownloadAPI()` - Browser-Kompatibilität

**Test-Kategorien**:
- 📁 Datei-Download und -Generierung
- 🔧 Browser-Kompatibilität und Fallbacks
- ❌ Fehlerbehandlung bei Download-Problemen
- 📊 Performance bei großen Konfigurationen
- 🎨 Formatierung und Metadaten

**Coverage-Ziele**: 90%+ für alle Export-Funktionen

#### importUtils.test.ts
**Zweck**: Testet alle Import-Utilities für Datei-Upload und JSON-Parsing

**Getestete Funktionen**:
- `readConfigFile()` - Datei-Lesen und -Parsing
- `validateFileFormat()` - Dateiformat-Validierung
- `processImportFile()` - Vollständige Datei-Verarbeitung
- `handleImportError()` - Fehlerbehandlung
- `supportsFileUpload()` - Upload-Support-Erkennung
- `createFileUploadHandler()` - Upload-Handler-Erstellung

**Test-Kategorien**:
- 📤 Datei-Upload und -Verarbeitung
- ✅ Validierung verschiedener Dateiformate
- ❌ Fehlerbehandlung und Recovery
- 📊 Performance bei großen Dateien
- 🔧 Edge-Cases (leere Dateien, Korruption, etc.)

**Coverage-Ziele**: 90%+ für alle Import-Funktionen

### Integration-Tests (`src/store/__tests__/`)

#### configStore.importExport.test.ts
**Zweck**: Testet die vollständige Integration zwischen Store und Import/Export-System

**Getestete Bereiche**:
- Store-Export-Funktionalität
- Store-Import-Funktionalität
- Import-Optionen und -Verhalten
- Backup und Restore
- UI-State-Integration

**Test-Kategorien**:
- 🔄 End-to-End Import/Export-Workflows
- ⚙️ Store-State-Management
- 🔧 Import-Optionen (Merge, Overwrite, etc.)
- 💾 Backup- und Recovery-Funktionen
- ⚡ Concurrent Operations

**Coverage-Ziele**: 85%+ für Store-Integration

### Komponenten-Tests (`src/components/__tests__/`)

#### ExportButton.test.tsx
**Zweck**: Testet die ExportButton-Komponente mit allen UI-Interaktionen

**Getestete Bereiche**:
- Rendering und Styling
- Export-Funktionalität
- Fehlerbehandlung
- Accessibility
- Performance

**Test-Kategorien**:
- 🎨 UI-Rendering und Styling-Varianten
- 🖱️ Benutzerinteraktionen (Click, Keyboard)
- ❌ Fehlerbehandlung und Recovery
- ♿ Accessibility-Features (ARIA, Keyboard)
- 🌍 Internationalisierung

**Coverage-Ziele**: 90%+ für UI-Komponenten

#### ImportButton.test.tsx
**Zweck**: Testet die ImportButton-Komponente mit Drag & Drop Support

**Getestete Bereiche**:
- File-Upload-Interface
- Drag & Drop-Funktionalität
- Validierung und Fehlerbehandlung
- Progress-Anzeige
- Accessibility

**Test-Kategorien**:
- 📁 File-Upload und Input-Handling
- 🖱️ Drag & Drop-Interaktionen
- ✅ Validierung und Error-States
- 📊 Progress-Tracking
- ♿ Accessibility und Keyboard-Support

**Coverage-Ziele**: 90%+ für UI-Komponenten

## Test-Utilities und Setup

### Vitest-Konfiguration (`vitest.config.ts`)
- **Environment**: jsdom für DOM-Tests
- **Setup**: Automatische Test-Setup-Datei
- **Coverage**: v8 Provider mit HTML/JSON Reports
- **Globals**: Aktiviert für einfachere Test-Syntax

### Test-Setup (`src/test-setup.ts`)
- **DOM-Mocks**: URL, File, FileReader, Blob APIs
- **Jest-DOM**: Erweiterte Matcher für DOM-Tests
- **Browser-APIs**: Mock-Implementierungen für Testing

## Test-Execution

### NPM Scripts
```bash
# Alle Tests ausführen
npm test

# Tests mit UI
npm run test:ui

# Coverage-Report generieren
npm run test:coverage
```

### CI/CD Integration
Tests sind für kontinuierliche Integration konfiguriert und sollten bei jedem Pull Request ausgeführt werden.

## Coverage-Ziele

| Bereich | Ziel-Coverage | Kritisch |
|---------|---------------|----------|
| Utils | 90%+ | ✅ |
| Store | 85%+ | ✅ |
| Components | 90%+ | ✅ |
| Types | 100% | ✅ |
| Error Handling | 95%+ | ✅ |

## Performance-Tests

### Getestete Szenarien
- ⚡ Große Konfigurationsdateien (>100 Stops)
- 📁 Große Upload-Dateien (>10MB)
- 🔄 Concurrent Import/Export-Operationen
- 📊 Memory-Usage bei wiederholten Operationen

### Performance-Benchmarks
- Export: <1s für 100 Stops
- Import: <2s für 10MB Datei
- Validation: <100ms für Standard-Konfiguration

## Wartung und Updates

### Test-Aktualisierung
- Tests sollten bei API-Änderungen aktualisiert werden
- Neue Features benötigen entsprechende Test-Coverage
- Performance-Tests sollten regelmäßig überprüft werden

### Code-Review-Checklist
- [ ] Neue Funktionen haben Tests
- [ ] Coverage-Ziele werden erreicht
- [ ] Error-Handling ist getestet
- [ ] Accessibility ist validiert
- [ ] Performance-Impact ist berücksichtigt

## Debugging und Troubleshooting

### Häufige Probleme
1. **Mock-Setup**: Stelle sicher, dass alle Browser-APIs gemockt sind
2. **Async-Tests**: Verwende `waitFor()` für asynchrone Operationen
3. **File-API**: FileReader und File-Konstruktor müssen gemockt werden
4. **DOM-Events**: Custom Events müssen korrekt implementiert werden

### Debug-Tools
- `screen.debug()` - DOM-Struktur anzeigen
- `console.log()` - Mock-Aufrufe überprüfen
- Vitest UI - Interaktive Test-Ausführung

## Erweiterte Test-Szenarien

### Stress-Tests
- Import von 1000+ Stops
- Rapid File-Upload-Sequenzen
- Memory-Leak-Detection

### Browser-Kompatibilität
- Legacy-Browser-Fallbacks
- Feature-Detection-Tests
- API-Verfügbarkeits-Tests

### Sicherheits-Tests
- Malformed JSON-Handling
- Large File-Attack-Prevention
- XSS-Prevention in File-Content

## Metriken und Reporting

### Coverage-Reports
- HTML-Report für detaillierte Analyse
- JSON-Report für CI/CD-Integration
- Threshold-Enforcement für Quality Gates

### Performance-Monitoring
- Test-Ausführungszeit-Tracking
- Memory-Usage-Monitoring
- Flaky-Test-Detection

Diese Test-Suite gewährleistet die Qualität und Zuverlässigkeit des Import/Export-Systems und sollte kontinuierlich gepflegt und erweitert werden.