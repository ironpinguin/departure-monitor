/**
 * Tests for the shared EFA rapidJSON parsers used by both Munich and Würzburg.
 * The sample shapes mirror real XML_STOPFINDER_REQUEST / XML_SERVINGLINES_REQUEST
 * responses (see docs/apis/*.json).
 */

import { describe, it, expect } from 'vitest';
import { parseEfaStops, parseEfaLines } from '../efa';
import type { EFAServingLinesResponse, EFAStopFinderResponse } from '../../models';

describe('parseEfaStops', () => {
  it('maps stop locations into BasicStop with the given city', () => {
    const data: EFAStopFinderResponse = {
      locations: [
        {
          id: 'de:09162:6',
          isGlobalId: true,
          name: 'München, Hauptbahnhof',
          disassembledName: 'Hauptbahnhof',
          coord: [48.14, 11.56],
          type: 'stop',
        },
      ],
    };

    expect(parseEfaStops(data, 'muc')).toEqual([
      {
        id: 'de:09162:6',
        name: 'Hauptbahnhof',
        city: 'muc',
        longName: 'München, Hauptbahnhof',
      },
    ]);
  });

  it('filters out non-stop locations (localities, addresses, POIs)', () => {
    const data: EFAStopFinderResponse = {
      locations: [
        { id: 'p1', isGlobalId: true, name: 'München', coord: [], type: 'locality' },
        {
          id: 'de:09162:1',
          isGlobalId: true,
          name: 'München, Marienplatz',
          disassembledName: 'Marienplatz',
          coord: [],
          type: 'stop',
        },
      ],
    };

    const result = parseEfaStops(data, 'muc');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('de:09162:1');
  });

  it('falls back to name when disassembledName is missing', () => {
    const data: EFAStopFinderResponse = {
      locations: [{ id: 'x', isGlobalId: true, name: 'Some Stop', coord: [], type: 'stop' }],
    };

    expect(parseEfaStops(data, 'wue')[0].name).toBe('Some Stop');
  });

  it('returns an empty array when there are no locations', () => {
    expect(parseEfaStops({}, 'muc')).toEqual([]);
  });
});

describe('parseEfaLines', () => {
  it('maps serving lines into the app Line model', () => {
    const data: EFAServingLinesResponse = {
      lines: [
        {
          id: 'wvv:10014:E:R:25a',
          name: 'Bus 14',
          number: '14',
          description: 'Gerbrunn - Würzburg Busbahnhof',
          product: { id: 1, class: 5, name: 'Bus', iconId: 3 },
          destination: { id: '80029081', name: 'Busbahnhof', type: 'stop' },
        },
      ],
    };

    expect(parseEfaLines(data)).toEqual([
      { name: '14', direction: 'Busbahnhof', type: 'Bus' },
    ]);
  });

  it('falls back to description for direction and empty string for type', () => {
    const data: EFAServingLinesResponse = {
      lines: [{ id: 'l1', name: 'S1', number: 'S1', description: 'Ostbahnhof' }],
    };

    expect(parseEfaLines(data)).toEqual([
      { name: 'S1', direction: 'Ostbahnhof', type: '' },
    ]);
  });

  it('returns an empty array when there are no lines', () => {
    expect(parseEfaLines({})).toEqual([]);
  });
});
