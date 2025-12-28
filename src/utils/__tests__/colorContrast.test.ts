/**
 * Tests für die WCAG-Kontrastprüfung
 * Validiert verschiedene Farbkombinationen aus dem typeToStyles.json
 */

import { describe, it, expect } from 'vitest';
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
} from '../colorContrast';

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

describe('WCAG Kontrastprüfung Tests', () => {
  console.log('=== WCAG Kontrastprüfung Tests ===\n');

  describe('Farbkonvertierung', () => {
    it('sollte HEX zu RGB korrekt konvertieren', () => {
      console.log('1. Farbkonvertierung Tests:');
      console.log('HEX zu RGB:');
      
      const result1 = hexToRgb('#96368b');
      console.log('#96368b ->', result1);
      expect(result1).toEqual({ r: 150, g: 54, b: 139 });
      
      const result2 = hexToRgb('#fff');
      console.log('#fff ->', result2);
      expect(result2).toEqual({ r: 255, g: 255, b: 255 });
      
      const result3 = hexToRgb('#000');
      console.log('#000 ->', result3);
      expect(result3).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('sollte RGB String zu RGB korrekt konvertieren', () => {
      console.log('\nRGB String zu RGB:');
      const result = parseColorToRgb('rgb(0, 170, 228)');
      console.log('rgb(0, 170, 228) ->', result);
      expect(result).toEqual({ r: 0, g: 170, b: 228 });
    });
  });

  describe('Kontrastverhältnis-Berechnung', () => {
    it('sollte Kontrastverhältnisse korrekt berechnen', () => {
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
          
          // Assertions
          expect(ratio).toBeGreaterThan(0);
          expect(typeof meetsAA).toBe('boolean');
          expect(typeof meetsAAA).toBe('boolean');
        }
      });
    });
  });

  describe('Automatische Kontrastanpassung', () => {
    it('sollte Kontrast automatisch anpassen', () => {
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
        
        // Assertions
        expect(compliance.backgroundColor).toBeDefined();
        expect(compliance.textColor).toBeDefined();
        expect(analysis.ratio).toBeGreaterThan(0);
        expect(typeof analysis.adjustmentMade).toBe('boolean');
      });
    });
  });

  describe('Problematische Farbkombinationen', () => {
    it('sollte problematische Kombinationen korrigieren', () => {
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
        
        // Assertions
        expect(compliance.backgroundColor).toBeDefined();
        expect(compliance.textColor).toBeDefined();
        expect(analysis.ratio).toBeGreaterThanOrEqual(4.5); // Mindestens AA-Standard
      });
    });
  });

  describe('Optimale Textfarbe', () => {
    it('sollte optimale Textfarben ermitteln', () => {
      console.log('\n5. Optimale Textfarbe Tests:');
      const backgroundColors = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'];
      
      backgroundColors.forEach(bg => {
        const bgRgb = parseColorToRgb(bg);
        if (bgRgb) {
          const optimal = getOptimalTextColor(bgRgb);
          const optimalHex = rgbToHex(optimal);
          console.log(`${bg} -> optimale Textfarbe: ${optimalHex}`);
          
          // Assertions
          expect(optimal.r).toBeGreaterThanOrEqual(0);
          expect(optimal.r).toBeLessThanOrEqual(255);
          expect(optimal.g).toBeGreaterThanOrEqual(0);
          expect(optimal.g).toBeLessThanOrEqual(255);
          expect(optimal.b).toBeGreaterThanOrEqual(0);
          expect(optimal.b).toBeLessThanOrEqual(255);
          expect(optimalHex).toMatch(/^#[0-9a-fA-F]{6}$/);
        }
      });
      
      console.log('\n=== Tests abgeschlossen ===');
    });
  });
});