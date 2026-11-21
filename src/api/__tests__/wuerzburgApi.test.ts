/**
 * The Würzburg EFA provider (whitelabel.bahnland-bayern.de) now rejects
 * third-party clients with HTTP 429 ("This endpoint is not an open data
 * endpoint", Retry-After: 86400). The API layer must surface that as a
 * ProviderUnavailableError so the UI can explain it instead of showing an
 * empty departure list or a generic error.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProviderUnavailableError } from '../errors';
import { fetchWuerzburgDepartures, linesForStop, stopFinderWuerzburg } from '../wuerzburgApi';

const blocked = () =>
  Promise.resolve({
    ok: false,
    status: 429,
    statusText: '',
    text: () => Promise.resolve('This endpoint is not an open data endpoint. Please contact the portal owner'),
    json: () => Promise.reject(new Error('not json')),
  } as Response);

describe('Würzburg API when the provider blocks access (HTTP 429)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['fetchWuerzburgDepartures', () => fetchWuerzburgDepartures('de:09663:1')],
    ['stopFinderWuerzburg', () => stopFinderWuerzburg('Sanderring')],
    ['linesForStop', () => linesForStop('de:09663:1')],
  ])('%s throws ProviderUnavailableError', async (_name, call) => {
    vi.stubGlobal('fetch', vi.fn(blocked));

    const error = await call().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderUnavailableError);
    expect(error).toMatchObject({ city: 'wue', status: 429 });
  });

  it('keeps throwing a plain Error for other HTTP failures', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: false, status: 500, statusText: 'Internal Server Error', json: () => Promise.resolve({}),
    } as Response)));

    const error = await stopFinderWuerzburg('Sanderring').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ProviderUnavailableError);
  });
});
