/**
 * Tests for the Munich stop search request.
 *
 * The `/mvv` endpoint path on efa.mvv-muenchen.de became very slow (~13 s per
 * request) and ranks results poorly, while `/efa` serves the same rapidJSON
 * schema with the same global stop IDs in well under a second.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { stopFinderMuenchen } from '../muenchenApi';

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);

describe('stopFinderMuenchen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('queries the fast /efa endpoint and asks EFA for stops only', async () => {
    const fetchMock = vi.fn<(input: string) => Promise<Response>>(() => okJson({ locations: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await stopFinderMuenchen('Marienplatz');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost');
    expect(url.pathname).toBe('/mvv-efa-api/efa/XML_STOPFINDER_REQUEST');
    expect(url.searchParams.get('name_sf')).toBe('Marienplatz');
    expect(url.searchParams.get('type_sf')).toBe('any');
    // anyObjFilter_sf=2 restricts results to stops (no POIs/streets/addresses)
    expect(url.searchParams.get('anyObjFilter_sf')).toBe('2');
    expect(url.searchParams.get('outputFormat')).toBe('rapidJSON');
  });

  it('maps stop locations and ignores the non-fatal BROKER system message', async () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson({
      systemMessages: [{ type: 'error', module: 'BROKER', code: -8011, text: '' }],
      locations: [
        { id: 'de:09162:2', name: 'München, Marienplatz', disassembledName: 'Marienplatz', type: 'stop' },
      ],
    })));

    await expect(stopFinderMuenchen('Marienplatz')).resolves.toEqual([
      { id: 'de:09162:2', name: 'Marienplatz', city: 'muc', longName: 'München, Marienplatz' },
    ]);
  });
});
