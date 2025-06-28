/**
 * Tests für die WCAG-Kontrastprüfung
 * Validiert verschiedene Farbkombinationen aus dem typeToStyles.json
 */

import {
  hexToRgb,
  parseColorToRgb,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  getOptimalTextColor,
  ensureWCAGCompliance,
  analyzeContrast,
  rgbToHex
} from './colorContrast';

// Test-Daten aus der typeToStyles.json
const testColors = {
  // München Linien - verschiedene Farbkombinationen
  muc: {
    '12': { bg: '#96368b', text: '#fff' }, // Lila mit Weiß
    '16': { bg: '#0065ae', text: '#fff' }, // Blau mit Weiß
    '20': { bg: '#16bae7', text: '#000' }, // Hellblau mit Schwarz
    '21': { bg: '#c79514', text: '#000' }, // Orange mit Schwarz
    '25': { bg: '#f1919c', text: '#000' }, // Rosa mit Schwarz
    '31': { bg: '#fff', text: '#000' },    // Weiß mit Schwarz
    'S8': { bg: '#000', text: '#fc0' }     // Schwarz mit Gelb
  },
  // Würzburg
  wue: {
    default: { bg: 'rgb(0, 170, 228)', text: undefined }
  }
};

console.log('=== WCAG Kontrastprüfung Tests ===\n');

// Test 1: Farbkonvertierung
console.log('1. Farbkonvertierung Tests:');
console.log('HEX zu RGB:');
console.log('#96368b ->', hexToRgb('#96368b'));
console.log('#fff ->', hexToRgb('#fff'));
console.log('#000 ->', hexToRgb('#000'));

console.log('\nRGB String zu RGB:');
console.log('rgb(0, 170, 228) ->', parseColorToRgb('rgb(0, 170, 228)'));

// Test 2: Kontrastverhältnis-Berechnung
console.log('\n2. Kontrastverhältnis Tests:');
Object.entries(testColors.muc).forEach(([line, colors]) => {
  const bgRgb = parseColorToRgb(colors.bg);
  const textRgb = parseColorToRgb(colors.text || '#fff');
  
  if (bgRgb && textRgb) {
    const ratio = getContrastRatio(textRgb, bgRgb);
    const meetsAA = meetsWCAGAA(textRgb, bgRgb);
    const meetsAAA = meetsWCAGAAA(textRgb, bgRgb);
    
    console.log(`Linie ${line}: ${colors.bg} + ${colors.text || '#fff'}`);
    console.log(`  Kontrast: ${ratio.toFixed(2)}:1 | AA: ${meetsAA ? '✓' : '✗'} | AAA: ${meetsAAA ? '✓' : '✗'}`);
  }
});

// Test 3: Automatische Kontrastanpassung
console.log('\n3. Automatische Kontrastanpassung:');
Object.entries(testColors.muc).forEach(([line, colors]) => {
  const compliance = ensureWCAGCompliance(colors.text, colors.bg);
  const analysis = analyzeContrast(colors.text, colors.bg);
  
  console.log(`Linie ${line}:`);
  console.log(`  Original: ${colors.bg} + ${colors.text || 'undefined'}`);
  console.log(`  WCAG-konform: ${compliance.backgroundColor} + ${compliance.textColor}`);
  console.log(`  Anpassung nötig: ${analysis.adjustmentMade ? 'Ja' : 'Nein'}`);
  console.log(`  Finaler Kontrast: ${analysis.ratio.toFixed(2)}:1`);
  console.log('');
});

// Test 4: Problematische Farbkombinationen
console.log('4. Tests für problematische Kombinationen:');
const problematicColors = [
  { bg: '#ffff00', text: '#ffffff' }, // Gelb + Weiß (schlechter Kontrast)
  { bg: '#ff0000', text: '#00ff00' }, // Rot + Grün (Farbenblindheit)
  { bg: '#808080', text: '#999999' }, // Grau + Hellgrau (zu wenig Kontrast)
];

problematicColors.forEach((colors, index) => {
  const compliance = ensureWCAGCompliance(colors.text, colors.bg);
  const analysis = analyzeContrast(colors.text, colors.bg);
  
  console.log(`Test ${index + 1}: ${colors.bg} + ${colors.text}`);
  console.log(`  Korrigiert zu: ${compliance.backgroundColor} + ${compliance.textColor}`);
  console.log(`  Neuer Kontrast: ${analysis.ratio.toFixed(2)}:1`);
});

// Test 5: Optimale Textfarbe
console.log('\n5. Optimale Textfarbe Tests:');
const backgroundColors = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'];
backgroundColors.forEach(bg => {
  const bgRgb = parseColorToRgb(bg);
  if (bgRgb) {
    const optimal = getOptimalTextColor(bgRgb);
    console.log(`${bg} -> optimale Textfarbe: ${rgbToHex(optimal)}`);
  }
});

console.log('\n=== Tests abgeschlossen ===');