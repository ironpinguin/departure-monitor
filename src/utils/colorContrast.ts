/**
 * WCAG 2.1 Color Contrast Utility
 * Implementiert automatische Kontrastprüfung und -anpassung gemäß WCAG 1.4.3
 * Mindest-Kontrastverhältnis: 4.5:1 für normalen Text
 */

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Konvertiert HEX-Farbe zu RGB
 */
export function hexToRgb(hex: string): ColorRGB | null {
  // Entferne # falls vorhanden
  hex = hex.replace('#', '');
  
  // Unterstütze 3-stellige und 6-stellige HEX-Codes
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  if (hex.length !== 6) {
    return null;
  }
  
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Konvertiert RGB-String zu RGB-Objekt
 * Unterstützt Formate: "rgb(255, 255, 255)", "rgba(255, 255, 255, 0.5)"
 */
export function rgbStringToRgb(rgbString: string): ColorRGB | null {
  const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (!match) {
    return null;
  }
  
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10)
  };
}

/**
 * Konvertiert HSL zu RGB
 */
export function hslToRgb(h: number, s: number, l: number): ColorRGB {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Parst verschiedene Farbformate zu RGB
 */
export function parseColorToRgb(color: string): ColorRGB | null {
  if (!color) return null;
  
  // HEX-Format
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }
  
  // RGB/RGBA-Format
  if (color.startsWith('rgb')) {
    return rgbStringToRgb(color);
  }
  
  // HSL-Format (einfache Implementierung)
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      return hslToRgb(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
  }
  
  // Benannte Farben (nur die wichtigsten)
  const namedColors: Record<string, ColorRGB> = {
    'white': { r: 255, g: 255, b: 255 },
    'black': { r: 0, g: 0, b: 0 },
    'red': { r: 255, g: 0, b: 0 },
    'green': { r: 0, g: 128, b: 0 },
    'blue': { r: 0, g: 0, b: 255 },
    'yellow': { r: 255, g: 255, b: 0 },
    'cyan': { r: 0, g: 255, b: 255 },
    'magenta': { r: 255, g: 0, b: 255 },
    'transparent': { r: 255, g: 255, b: 255 } // Fallback zu weiß
  };
  
  const lowerColor = color.toLowerCase();
  return namedColors[lowerColor] || null;
}

/**
 * Berechnet die relative Luminanz einer Farbe nach WCAG-Standard
 */
export function getRelativeLuminance(rgb: ColorRGB): number {
  // Konvertiere zu sRGB
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  // Linearisiere die RGB-Werte
  const linearize = (colorComponent: number): number => {
    return colorComponent <= 0.03928
      ? colorComponent / 12.92
      : Math.pow((colorComponent + 0.055) / 1.055, 2.4);
  };
  
  const rLinear = linearize(rsRGB);
  const gLinear = linearize(gsRGB);
  const bLinear = linearize(bsRGB);
  
  // Berechne relative Luminanz
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Berechnet das Kontrastverhältnis zwischen zwei Farben
 */
export function getContrastRatio(color1: ColorRGB, color2: ColorRGB): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Prüft ob das Kontrastverhältnis WCAG AA (4.5:1) erfüllt
 */
export function meetsWCAGAA(foreground: ColorRGB, background: ColorRGB): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/**
 * Prüft ob das Kontrastverhältnis WCAG AAA (7:1) erfüllt
 */
export function meetsWCAGAAA(foreground: ColorRGB, background: ColorRGB): boolean {
  return getContrastRatio(foreground, background) >= 7;
}

/**
 * Bestimmt die optimale Textfarbe (schwarz oder weiß) für einen gegebenen Hintergrund
 */
export function getOptimalTextColor(backgroundColor: ColorRGB): ColorRGB {
  const white: ColorRGB = { r: 255, g: 255, b: 255 };
  const black: ColorRGB = { r: 0, g: 0, b: 0 };
  
  const whiteContrast = getContrastRatio(white, backgroundColor);
  const blackContrast = getContrastRatio(black, backgroundColor);
  
  return whiteContrast > blackContrast ? white : black;
}

/**
 * Konvertiert RGB zu HEX
 */
export function rgbToHex(rgb: ColorRGB): string {
  const componentToHex = (c: number): string => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return '#' + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
}

/**
 * Passt die Textfarbe automatisch an, um WCAG AA-Kontrast zu gewährleisten
 */
export function ensureWCAGCompliance(
  textColor: string | undefined,
  backgroundColor: string | undefined
): { textColor: string; backgroundColor: string } {
  // Standardwerte falls Farben nicht definiert sind
  const defaultBackground = '#005366'; // Default aus typeToStyles.json
  const defaultText = '#ffffff';
  
  // Parse Farben
  const bgRgb = backgroundColor ? parseColorToRgb(backgroundColor) : parseColorToRgb(defaultBackground);
  const textRgb = textColor ? parseColorToRgb(textColor) : parseColorToRgb(defaultText);
  
  if (!bgRgb) {
    // Falls Hintergrundfarbe nicht parsbar, verwende sichere Defaults
    return {
      backgroundColor: defaultBackground,
      textColor: defaultText
    };
  }
  
  // Bestimme optimale Textfarbe
  let finalTextRgb: ColorRGB;
  
  if (textRgb && meetsWCAGAA(textRgb, bgRgb)) {
    // Ursprüngliche Textfarbe hat ausreichenden Kontrast
    finalTextRgb = textRgb;
  } else {
    // Bestimme optimale Textfarbe (schwarz oder weiß)
    finalTextRgb = getOptimalTextColor(bgRgb);
  }
  
  return {
    backgroundColor: backgroundColor || defaultBackground,
    textColor: rgbToHex(finalTextRgb)
  };
}

/**
 * Erweiterte Kontrastprüfung mit detaillierten Informationen
 */
export interface ContrastResult {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  recommendedTextColor: string;
  originalTextColor?: string;
  adjustmentMade: boolean;
}

/**
 * Führt eine umfassende Kontrastanalyse durch
 */
export function analyzeContrast(
  textColor: string | undefined,
  backgroundColor: string | undefined
): ContrastResult {
  const compliance = ensureWCAGCompliance(textColor, backgroundColor);
  const bgRgb = parseColorToRgb(compliance.backgroundColor);
  const textRgb = parseColorToRgb(compliance.textColor);
  const originalTextRgb = textColor ? parseColorToRgb(textColor) : null;
  
  if (!bgRgb || !textRgb) {
    return {
      ratio: 1,
      meetsAA: false,
      meetsAAA: false,
      recommendedTextColor: '#ffffff',
      adjustmentMade: true
    };
  }
  
  const ratio = getContrastRatio(textRgb, bgRgb);
  const adjustmentMade = !originalTextRgb || !meetsWCAGAA(originalTextRgb, bgRgb);
  
  return {
    ratio,
    meetsAA: ratio >= 4.5,
    meetsAAA: ratio >= 7,
    recommendedTextColor: compliance.textColor,
    originalTextColor: textColor,
    adjustmentMade
  };
}