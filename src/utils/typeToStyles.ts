import type { StylesConfig } from '../models';
import type { CSSProperties } from '@mui/material';
import typeToStylesData from '../config/typeToStyles.json';
import { ensureWCAGCompliance, analyzeContrast } from './colorContrast';

/**
 * Returns the predefined stops configuration loaded from JSON.
 * This is integrated during the build process.
 */
export function getTypeToStyles(): StylesConfig{
  return typeToStylesData as StylesConfig;
}

/**
 * Erweiterte getLineStyle Funktion mit automatischer WCAG-Kontrastprüfung
 * Stellt sicher, dass alle Farbkombinationen mindestens WCAG AA (4.5:1) erfüllen
 */
export function getLineStyle(
  line: string,
  city: 'muc' | 'wue',
  groupType: string
): CSSProperties {
  const typeToStyles = getTypeToStyles();
  let backgroundColor: string | undefined;
  let textColor: string | undefined;
  let baseStyle: CSSProperties = {};

  // Prüfe spezifische Linienstile
  if (typeToStyles[city].lines[line]) {
    const lineStyle = typeToStyles[city].lines[line];
    backgroundColor = lineStyle["background-color"] || undefined;
    textColor = lineStyle.color || undefined;
    
    // Basis-Style für spezifische Linien
    baseStyle = {
      padding: '5px 5px',
      borderRadius: (city === 'wue') ? '10px' : undefined,
      display: 'inline-block',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      // Hintergrundbild-Eigenschaften (nur für spezielle Linien wie U7)
      backgroundImage: lineStyle["background-image"]
        ? `url(../assets/muc/${lineStyle["background-image"]})`
        : undefined,
      backgroundRepeat: lineStyle["background-repeat"] || undefined,
      backgroundPosition: lineStyle["background-position"] || undefined,
      backgroundSize: lineStyle["background-size"] || undefined
    };
  }
  // Prüfe Gruppenstile
  else if (typeToStyles[city].groups[groupType]) {
    const groupStyle = typeToStyles[city].groups[groupType];
    backgroundColor = groupStyle["background-color"] || undefined;
    textColor = groupStyle.color || undefined;
    
    baseStyle = {
      padding: '2px 6px',
      borderRadius: groupStyle['border-radius'] || undefined,
      display: 'inline-block',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    };
  }
  // Fallback auf Default-Style
  else {
    const defaultStyle = typeToStyles[city].groups.default;
    backgroundColor = defaultStyle["background-color"] || undefined;
    textColor = '#fff'; // Standardmäßig weiß
    
    baseStyle = {
      padding: defaultStyle.padding || '2px 6px',
      borderRadius: defaultStyle['border-radius'] || '4px',
      display: 'inline-block',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    };
  }

  // WCAG-Kontrastprüfung und automatische Anpassung
  const { backgroundColor: finalBgColor, textColor: finalTextColor } =
    ensureWCAGCompliance(textColor, backgroundColor);

  return {
    ...baseStyle,
    backgroundColor: finalBgColor,
    color: finalTextColor
  };
}

/**
 * Analysiert den Kontrast einer bestimmten Linie für Debugging-Zwecke
 */
export function analyzeLineContrast(
  line: string,
  city: 'muc' | 'wue',
  groupType: string
) {
  const typeToStyles = getTypeToStyles();
  let backgroundColor: string | undefined;
  let textColor: string | undefined;

  if (typeToStyles[city].lines[line]) {
    const lineStyle = typeToStyles[city].lines[line];
    backgroundColor = lineStyle["background-color"] || undefined;
    textColor = lineStyle.color || undefined;
  } else if (typeToStyles[city].groups[groupType]) {
    const groupStyle = typeToStyles[city].groups[groupType];
    backgroundColor = groupStyle["background-color"] || undefined;
    textColor = groupStyle.color || undefined;
  } else {
    const defaultStyle = typeToStyles[city].groups.default;
    backgroundColor = defaultStyle["background-color"] || undefined;
    textColor = '#fff';
  }

  return analyzeContrast(textColor, backgroundColor);
}