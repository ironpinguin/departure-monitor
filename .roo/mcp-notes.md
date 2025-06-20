# MCP Server Konfiguration - Notizen

## Entfernte Server (20.06.2025)

Die folgenden MCP-Server wurden aus der Konfiguration entfernt, da sie als NPM-Pakete nicht verfügbar sind:

### Entfernte Server:
- **http-client** (`@modelcontextprotocol/server-http-client`)
- **json-schema** (`@modelcontextprotocol/server-json-schema`) 
- **git** (`@modelcontextprotocol/server-git`)
- **filesystem** (`@modelcontextprotocol/server-filesystem`)
- **docker** (`@modelcontextprotocol/server-docker`)
- **datetime** (`@modelcontextprotocol/server-datetime`)
- **translation** (`@modelcontextprotocol/server-translation`)

## Aktuell funktionsfähige Server:

### ✅ brave-search
- **Paket**: `brave-search-mcp`
- **Status**: Funktioniert korrekt
- **Funktionen**: Web-Suche, Bild-Suche, News-Suche, Video-Suche, lokale Suche
- **API-Key**: Konfiguriert

## Empfehlungen für das Departure Monitor Projekt

### Nützliche Server für die Zukunft:
1. **HTTP Client** - Für API-Aufrufe zu ÖPNV-Diensten
2. **Filesystem** - Für Konfigurationsdateien-Management
3. **Git** - Für Versionskontrolle-Integration
4. **DateTime** - Für Zeitberechnungen bei Abfahrtszeiten

### Alternative Lösungen:
- **HTTP-Requests**: Verwende die bestehenden API-Module (`muenchenApi.ts`, `wuerzburgApi.ts`)
- **Dateisystem-Operationen**: Nutze die vorhandenen Konfigurationsdateien
- **Git-Integration**: Verwende Git-Befehle direkt über die Kommandozeile
- **Zeitberechnungen**: Nutze JavaScript Date-Objekte und Libraries wie `date-fns`

## Hinweise für zukünftige Server-Ergänzungen:

1. **Verfügbarkeit prüfen**: Vor dem Hinzufügen neuer Server immer die NPM-Verfügbarkeit überprüfen
2. **Dokumentation**: Offizielle MCP-Server-Dokumentation konsultieren
3. **Testing**: Neue Server in einer Testumgebung validieren
4. **Backup**: Immer eine Backup-Konfiguration vor Änderungen erstellen

## Nützliche Links:
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- [Brave Search MCP Documentation](https://www.npmjs.com/package/brave-search-mcp)