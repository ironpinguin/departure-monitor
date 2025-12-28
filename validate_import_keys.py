#!/usr/bin/env python3
import json
import sys

# Zu überprüfende Schlüssel
required_keys = [
    "import.options.merge_strategy_description",
    "import.options.basic_options",
    "import.options.basic_options_description",
    "import.options.advanced_options_description",
    "import.options.summary_description",
    "import.progress.validation",
    "import.progress.validation_description",
    "import.progress.backup",
    "import.progress.backup_description",
    "import.progress.import",
    "import.progress.import_description",
    "import.progress.finalize",
    "import.progress.finalize_description",
    "import.dialog.progress_aria_label",
    "import.card.toggle_expand",
    "import.card.options_count",
    "import.preview.toggle_card",
    "import.preview.conflicts_subtitle",
    "import.preview.no_conflicts",
    "import.preview.stops_subtitle",
    "import.preview.view_all",
    "import.categories.settings",
    "import.categories.safety",
    "import.categories.filtering",
    "import.categories.layout",
    "import.categories.default",
    "import.loading.dialog",
    "import.loading.confirmation",
    "import.loading.preview",
    "import.loading.options",
    "import.loading.component_error",
    "import.loading.unknown_error"
]

def get_nested_value(data, key_path):
    """Holt einen Wert aus einem verschachtelten Dictionary basierend auf einem Pfad wie 'import.options.merge_strategy'."""
    keys = key_path.split('.')
    current = data
    
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return None
    
    return current

def check_translation_file(file_path, lang_name):
    """Überprüft eine Übersetzungsdatei auf die angegebenen Schlüssel."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"\n=== {lang_name} Übersetzungsdatei ===")
        missing_keys = []
        found_keys = []
        
        for key in required_keys:
            value = get_nested_value(data, key)
            if value is not None:
                found_keys.append(key)
                print(f"✅ {key}: '{value}'")
            else:
                missing_keys.append(key)
                print(f"❌ {key}: FEHLT")
        
        print(f"\nZusammenfassung {lang_name}:")
        print(f"Gefunden: {len(found_keys)}/{len(required_keys)}")
        print(f"Fehlend: {len(missing_keys)}")
        
        return found_keys, missing_keys
        
    except Exception as e:
        print(f"Fehler beim Lesen der Datei {file_path}: {e}")
        return [], required_keys

def main():
    # Deutsche Übersetzung prüfen
    de_found, de_missing = check_translation_file('src/i18n/locales/de/translation.json', 'Deutsche')
    
    # Englische Übersetzung prüfen
    en_found, en_missing = check_translation_file('src/i18n/locales/en/translation.json', 'Englische')
    
    print(f"\n=== GESAMTÜBERSICHT ===")
    print(f"Alle Schlüssel: {len(required_keys)}")
    print(f"Deutsch gefunden: {len(de_found)}")
    print(f"Englisch gefunden: {len(en_found)}")
    
    # Schlüssel, die in beiden Sprachen vorhanden sind
    both_found = set(de_found) & set(en_found)
    print(f"In beiden Sprachen vorhanden: {len(both_found)}")
    
    # Schlüssel, die nur in einer Sprache vorhanden sind
    only_de = set(de_found) - set(en_found)
    only_en = set(en_found) - set(de_found)
    
    if only_de:
        print(f"\nNur in Deutsch vorhanden:")
        for key in only_de:
            print(f"  - {key}")
    
    if only_en:
        print(f"\nNur in Englisch vorhanden:")
        for key in only_en:
            print(f"  - {key}")
    
    # Schlüssel, die in beiden Sprachen fehlen
    both_missing = set(de_missing) & set(en_missing)
    if both_missing:
        print(f"\nIn beiden Sprachen fehlend:")
        for key in both_missing:
            print(f"  - {key}")

if __name__ == "__main__":
    main()