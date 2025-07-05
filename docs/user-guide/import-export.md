# Benutzerhandbuch: Import/Export-Funktionen

## Übersicht

Das departure-monitor System bietet umfassende Import- und Export-Funktionen, mit denen Sie Ihre Konfigurationen sichern, teilen und zwischen verschiedenen Installationen übertragen können.

## Export-Funktionen

### Konfiguration exportieren

#### Über die Benutzeroberfläche

1. **Export-Button finden**
   - Navigieren Sie zu den Einstellungen
   - Klicken Sie auf den Tab "Globale Einstellungen"
   - Suchen Sie den "Konfiguration exportieren" Button

2. **Export starten**
   - Klicken Sie auf "Konfiguration exportieren"
   - Die Datei wird automatisch heruntergeladen
   - Standard-Dateiname: `departure-monitor-config-[Anzahl]stops-[Sprache]-[Datum].json`

#### Was wird exportiert?

- ✅ **Alle Stop-Konfigurationen**
  - Stop-Namen und IDs
  - Gehzeiten
  - Sichtbarkeitseinstellungen
  - Positionen/Reihenfolge

- ✅ **Globale Einstellungen**
  - Dark Mode Präferenz
  - Refresh-Intervall
  - Maximale Anzahl Abfahrten
  - Spracheinstellung

- ✅ **Metadaten**
  - Export-Zeitstempel
  - Schema-Version
  - Anzahl der Stops
  - Quelle der Konfiguration

#### Export-Optionen

**Standard-Export**
- Enthält alle Konfigurationen
- Kompakt formatiert
- Für Backup und Sharing optimiert

**Export mit Details** (falls verfügbar)
- Zeigt Datei-Informationen vor Download
- Dateigröße und Stop-Anzahl
- Export-Zeitstempel

### Export-Dateiformate

#### JSON-Format
```json
{
  "schemaVersion": "1.0.0",
  "exportTimestamp": "2024-01-01T12:00:00.000Z",
  "exportedBy": "departure-monitor-app",
  "metadata": {
    "stopCount": 3,
    "language": "de",
    "source": "user-export"
  },
  "config": {
    "stops": [...],
    "darkMode": false,
    "refreshIntervalSeconds": 30,
    "maxDeparturesShown": 10,
    "language": "de"
  },
  "exportSettings": {
    "includeUserSettings": true,
    "includeStopPositions": true,
    "includeVisibilitySettings": true
  }
}
```

## Import-Funktionen

### Konfiguration importieren

#### Über die Benutzeroberfläche

1. **Import-Button finden**
   - Navigieren Sie zu den Einstellungen
   - Klicken Sie auf den Tab "Globale Einstellungen"
   - Suchen Sie den "Konfiguration importieren" Button

2. **Datei auswählen**
   - Klicken Sie auf "Konfiguration importieren"
   - Wählen Sie eine `.json` Datei aus
   - **Oder** ziehen Sie die Datei direkt auf den Button (Drag & Drop)

3. **Import-Vorschau** (falls aktiviert)
   - Überprüfen Sie die zu importierenden Stops
   - Sehen Sie sich Konflikte mit bestehenden Konfigurationen an
   - Wählen Sie Import-Optionen

4. **Import bestätigen**
   - Klicken Sie auf "Import bestätigen"
   - Warten Sie auf die Bestätigung
   - Die Konfiguration wird automatisch angewendet

#### Drag & Drop Support

**Desktop-Browser**
- Ziehen Sie die JSON-Datei direkt auf den Import-Button
- Der Button wird beim Hovern hervorgehoben
- Lassen Sie die Datei fallen, um den Import zu starten

**Touch-Geräte**
- Verwenden Sie den traditionellen Datei-Auswahl-Dialog
- Drag & Drop ist nicht verfügbar

### Import-Optionen

#### Merge-Verhalten
- **Neue Stops hinzufügen**: Stops mit neuen IDs werden hinzugefügt
- **Bestehende Stops aktualisieren**: Stops mit gleichen IDs werden überschrieben
- **Positionen beibehalten**: Option zur Beibehaltung der aktuellen Stop-Reihenfolge

#### Einstellungen-Import
- **Globale Einstellungen übernehmen**: Dark Mode, Sprache, etc.
- **Nur Stops importieren**: Behält aktuelle globale Einstellungen bei
- **Selektiver Import**: Wählen Sie spezifische Bereiche zum Import

### Import-Validation

#### Automatische Prüfungen
- ✅ **Dateiformat**: Nur `.json` Dateien werden akzeptiert
- ✅ **Schema-Version**: Kompatibilität wird geprüft
- ✅ **Datenintegrität**: Vollständige Struktur-Validierung
- ✅ **Größenlimits**: Maximum 10MB pro Datei

#### Warnungen und Fehler
- **🔴 Fehler**: Import wird abgebrochen
  - Ungültiges JSON-Format
  - Inkompatible Schema-Version
  - Fehlende erforderliche Felder
  - Datei zu groß

- **🟡 Warnungen**: Import möglich, aber Aufmerksamkeit erforderlich
  - Große Datei (>1MB)
  - Ungewöhnliche Konfigurationswerte
  - Potentielle Konflikte

## Praktische Anwendungsfälle

### 1. Backup erstellen

**Wann?**
- Vor größeren Änderungen an der Konfiguration
- Regelmäßige Datensicherung
- Vor System-Updates

**Wie?**
1. Export durchführen
2. Datei an sicherem Ort speichern
3. Dateiname mit Datum versehen

### 2. Konfiguration zwischen Geräten teilen

**Szenario**: Desktop-Konfiguration auf Smartphone übertragen

**Schritte**:
1. Export auf Desktop-Computer
2. Datei via Cloud/E-Mail auf Smartphone übertragen
3. Import auf Smartphone durchführen

### 3. Teamkonfiguration verteilen

**Szenario**: Standardkonfiguration für Arbeitsplätze

**Workflow**:
1. Manager erstellt optimale Konfiguration
2. Export der Master-Konfiguration
3. Verteilung an alle Teammitglieder
4. Import an allen Arbeitsplätzen

### 4. Experimentelle Konfigurationen

**Szenario**: Neue Stop-Konfigurationen testen

**Vorgehen**:
1. Aktuelle Konfiguration als Backup exportieren
2. Experimentelle Änderungen vornehmen
3. Bei Problemen: Backup importieren
4. Bei Erfolg: Neue Konfiguration exportieren

## Fehlerbehebung

### Häufige Probleme

#### Export schlägt fehl
**Symptome**: Download startet nicht, Fehlermeldung erscheint

**Lösungen**:
1. **Browser-Kompatibilität prüfen**
   - Moderne Browser verwenden (Chrome, Firefox, Safari, Edge)
   - JavaScript aktiviert?
   - Pop-up-Blocker deaktiviert?

2. **Konfiguration prüfen**
   - Sind alle Stops korrekt konfiguriert?
   - Sind alle Pflichtfelder ausgefüllt?

3. **Speicherplatz prüfen**
   - Ist genügend Speicherplatz vorhanden?
   - Download-Ordner-Berechtigungen korrekt?

#### Import schlägt fehl
**Symptome**: Datei wird nicht akzeptiert, Validierungsfehler

**Lösungen**:
1. **Dateiformat prüfen**
   - Ist es wirklich eine `.json` Datei?
   - Wurde die Datei korrekt heruntergeladen?
   - Ist die Datei nicht beschädigt?

2. **Dateigröße prüfen**
   - Maximum: 10MB
   - Bei größeren Dateien: Konfiguration aufteilen

3. **Schema-Version prüfen**
   - Ist die Datei von einer kompatiblen Version?
   - Aktualisierung erforderlich?

#### Drag & Drop funktioniert nicht
**Symptome**: Datei wird nicht erkannt beim Ziehen

**Lösungen**:
1. **Browser-Support prüfen**
   - Moderne Desktop-Browser verwenden
   - Auf Touch-Geräten: Datei-Dialog verwenden

2. **Dateiformat prüfen**
   - Nur `.json` Dateien werden unterstützt
   - Dateiendung korrekt?

3. **Seite neu laden**
   - Browser-Cache leeren
   - Seite vollständig neu laden

### Support und Hilfe

#### Logfiles und Debugging
- Öffnen Sie die Browser-Entwicklertools (F12)
- Prüfen Sie die Konsole auf Fehlermeldungen
- Notieren Sie sich Fehlercodes für Support-Anfragen

#### Community-Support
- GitHub Issues für Bug-Reports
- Dokumentation für weitere Informationen
- FAQ für häufige Fragen

## Sicherheit und Datenschutz

### Datenschutz
- **Lokale Verarbeitung**: Alle Daten bleiben auf Ihrem Gerät
- **Keine Cloud-Übertragung**: Export/Import erfolgt direkt über Browser
- **Keine Tracking**: Keine Analyse der importierten/exportierten Daten

### Sicherheitshinweise
- **Dateiquelle prüfen**: Importieren Sie nur Dateien aus vertrauenswürdigen Quellen
- **Backup erstellen**: Vor größeren Imports immer Backup anlegen
- **Sensitive Daten**: Konfigurationsdateien können Stop-Namen und -IDs enthalten

## Best Practices

### Export
- 📅 **Regelmäßige Backups**: Wöchentlich oder vor größeren Änderungen
- 📝 **Aussagekräftige Dateinamen**: Datum und Zweck im Dateinamen
- 📁 **Strukturierte Ablage**: Ordner-Struktur für verschiedene Konfigurationen
- 🔄 **Versionierung**: Alte Backups nicht sofort löschen

### Import
- ✅ **Validierung beachten**: Warnungen und Fehler ernst nehmen
- 💾 **Backup vor Import**: Aktuelle Konfiguration sichern
- 🔍 **Vorschau nutzen**: Import-Preview zur Kontrolle verwenden
- 🧪 **Schrittweise Anpassung**: Große Änderungen in Etappen durchführen

### Sharing
- 🔒 **Datenschutz beachten**: Keine sensiblen Informationen in geteilten Dateien
- 📋 **Dokumentation**: Änderungen und Anpassungen dokumentieren
- 👥 **Team-Standards**: Einheitliche Namenskonventionen verwenden
- 🔄 **Update-Zyklen**: Regelmäßige Aktualisierung geteilter Konfigurationen

Diese Funktionen ermöglichen eine flexible und sichere Verwaltung Ihrer departure-monitor Konfigurationen. Bei Fragen oder Problemen konsultieren Sie die Fehlerbehebungsanleitung oder wenden Sie sich an den Support.