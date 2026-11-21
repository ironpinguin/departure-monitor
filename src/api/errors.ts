import type { Cities } from '../models/index';

/**
 * Thrown when a transit data provider refuses to serve the app at all (as
 * opposed to a transient failure), e.g. the Würzburg EFA endpoint answering
 * every request with HTTP 429 "not an open data endpoint". The UI uses this to
 * tell the user that the city's data is unavailable instead of showing an
 * empty departure list or a generic error.
 */
export class ProviderUnavailableError extends Error {
  readonly city: Cities;
  readonly status: number;

  constructor(city: Cities, status: number, message?: string) {
    super(message ?? `Transit data provider for "${city}" is unavailable (HTTP ${status})`);
    this.name = 'ProviderUnavailableError';
    this.city = city;
    this.status = status;
  }
}

/** HTTP status codes that mean the provider is blocking us, not a transient error. */
const BLOCKED_STATUSES = new Set([429]);

/**
 * Throw a ProviderUnavailableError if the response signals that the provider
 * blocks access. Other responses are left for the caller to handle.
 */
export function throwIfProviderBlocked(response: Response, city: Cities): void {
  if (BLOCKED_STATUSES.has(response.status)) {
    throw new ProviderUnavailableError(city, response.status);
  }
}
