#!/usr/bin/env python3
import json
import sys

def get_all_keys(data, prefix=""):
    """Extrahiert alle Schlüssel aus einem verschachtelten Dictionary."""
    keys = []
    
    if isinstance(data, dict):
        for key, value in data.items():
            current_key = f"{prefix}.{key}" if prefix else key
            keys.append(current_key)
            
            if isinstance(value, dict):
                keys.extend(get_all_keys(value, current_key))
    
    return keys

def check_duplicate_keys(data, prefix="", found_keys=None):
    """Prüft auf doppelte Schlüssel in einem verschachtelten Dictionary."""
    if found_keys is None:
        found_keys = {}
    
    duplicates = []
    
    if isinstance(data, dict):
        for key, value in data.items():
            current_key = f"{prefix}.{key}" if prefix else key
            
            if current_key in found_keys:
                duplicates.append(current_key)
            else:
                found_keys[current_key] = True
            
            if isinstance(value, dict):
                duplicates.extend(check_duplicate_keys(value, current_key, found_keys))
    
    return duplicates

def load_translations():
    """Lädt beide Übersetzungsdateien."""
    try:
        with open('src/i18n/locales/de/translation.json', 'r', encoding='utf-8') as f:
            de_data = json.load(f)
        
        with open('src/i18n/locales/en/translation.json', 'r', encoding='utf-8') as f:
            en_data = json.load(f)
        
        return de_data, en_data
    except Exception as e:
        print(f"Fehler beim Laden der Übersetzungsdateien: {e}")
        return None, None

def main():
    print("=== KONSISTENZPRÜFUNG DER ÜBERSETZUNGEN ===\n")
    
    # Übersetzungsdateien laden
    de_data, en_data = load_translations()
    if de_data is None or en_data is None:
        return
    
    # Alle Schlüssel extrahieren
    de_keys = set(get_all_keys(de_data))
    en_keys = set(get_all_keys(en_data))
    
    print(f"Deutsche Übersetzung: {len(de_keys)} Schlüssel")
    print(f"Englische Übersetzung: {len(en_keys)} Schlüssel")
    
    # Doppelte Schlüssel prüfen
    print("\n=== ÜBERPRÜFUNG AUF DOPPELTE SCHLÜSSEL ===")
    de_duplicates = check_duplicate_keys(de_data)
    en_duplicates = check_duplicate_keys(en_data)
    
    if de_duplicates:
        print(f"❌ Deutsche Übersetzung hat {len(de_duplicates)} doppelte Schlüssel:")
        for dup in de_duplicates:
            print(f"  - {dup}")
    else:
        print("✅ Deutsche Übersetzung: Keine doppelten Schlüssel gefunden")
    
    if en_duplicates:
        print(f"❌ Englische Übersetzung hat {len(en_duplicates)} doppelte Schlüssel:")
        for dup in en_duplicates:
            print(f"  - {dup}")
    else:
        print("✅ Englische Übersetzung: Keine doppelten Schlüssel gefunden")
    
    # Strukturkonsistenz prüfen
    print("\n=== STRUKTURKONSISTENZ ===")
    
    # Schlüssel, die nur in einer Sprache vorhanden sind
    only_de = de_keys - en_keys
    only_en = en_keys - de_keys
    common_keys = de_keys & en_keys
    
    print(f"Gemeinsame Schlüssel: {len(common_keys)}")
    print(f"Nur in Deutsch: {len(only_de)}")
    print(f"Nur in Englisch: {len(only_en)}")
    
    if only_de:
        print(f"\n❌ Nur in deutscher Übersetzung vorhanden ({len(only_de)} Schlüssel):")
        for key in sorted(only_de):
            print(f"  - {key}")
    
    if only_en:
        print(f"\n❌ Nur in englischer Übersetzung vorhanden ({len(only_en)} Schlüssel):")
        for key in sorted(only_en):
            print(f"  - {key}")
    
    # Prüfung auf leere Werte
    print("\n=== ÜBERPRÜFUNG AUF LEERE WERTE ===")
    
    def check_empty_values(data, prefix="", lang_name=""):
        empty_values = []
        
        if isinstance(data, dict):
            for key, value in data.items():
                current_key = f"{prefix}.{key}" if prefix else key
                
                if isinstance(value, dict):
                    empty_values.extend(check_empty_values(value, current_key, lang_name))
                elif isinstance(value, str) and value.strip() == "":
                    empty_values.append(current_key)
        
        return empty_values
    
    de_empty = check_empty_values(de_data, lang_name="Deutsch")
    en_empty = check_empty_values(en_data, lang_name="Englisch")
    
    if de_empty:
        print(f"❌ Deutsche Übersetzung hat {len(de_empty)} leere Werte:")
        for empty in de_empty:
            print(f"  - {empty}")
    else:
        print("✅ Deutsche Übersetzung: Keine leeren Werte gefunden")
    
    if en_empty:
        print(f"❌ Englische Übersetzung hat {len(en_empty)} leere Werte:")
        for empty in en_empty:
            print(f"  - {empty}")
    else:
        print("✅ Englische Übersetzung: Keine leeren Werte gefunden")
    
    # Gesamtbewertung
    print("\n=== GESAMTBEWERTUNG ===")
    
    issues = []
    if de_duplicates:
        issues.append(f"Deutsche Übersetzung hat {len(de_duplicates)} doppelte Schlüssel")
    if en_duplicates:
        issues.append(f"Englische Übersetzung hat {len(en_duplicates)} doppelte Schlüssel")
    if only_de:
        issues.append(f"{len(only_de)} Schlüssel nur in deutscher Übersetzung")
    if only_en:
        issues.append(f"{len(only_en)} Schlüssel nur in englischer Übersetzung")
    if de_empty:
        issues.append(f"Deutsche Übersetzung hat {len(de_empty)} leere Werte")
    if en_empty:
        issues.append(f"Englische Übersetzung hat {len(en_empty)} leere Werte")
    
    if issues:
        print(f"❌ {len(issues)} Problem(e) gefunden:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("✅ Alle Konsistenzprüfungen erfolgreich bestanden!")
        print("✅ Beide Übersetzungsdateien sind vollständig konsistent!")

if __name__ == "__main__":
    main()