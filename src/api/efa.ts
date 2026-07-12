import type {
  BasicStop,
  Cities,
  EFAServingLinesResponse,
  EFAStopFinderResponse,
  Line,
} from '../models/index';

/**
 * Shared parsing helpers for EFA (Elektronische Fahrplanauskunft) rapidJSON
 * responses. Both Würzburg (whitelabel.bahnland-bayern.de) and Munich
 * (efa.mvv-muenchen.de) expose the same rapidJSON schema, so the mapping into
 * the app's `BasicStop` / `Line` models is identical for both providers.
 */

/**
 * Map an EFA XML_STOPFINDER_REQUEST response into the app's `BasicStop` list.
 * Only entries of type `stop` are kept (the API also returns localities,
 * addresses, POIs, etc.).
 *
 * @param data  Parsed rapidJSON stop finder response.
 * @param city  City the results belong to.
 */
export function parseEfaStops(data: EFAStopFinderResponse, city: Cities): BasicStop[] {
  return (data.locations ?? [])
    .filter((loc) => loc.type === 'stop')
    .map((loc) => ({
      id: loc.id,
      // `disassembledName` is the short, stop-local name (e.g. "Marienplatz");
      // `name` is the fully qualified name (e.g. "München, Marienplatz").
      name: loc.disassembledName ?? loc.name,
      city,
      longName: loc.name,
    }));
}

/**
 * Map an EFA XML_SERVINGLINES_REQUEST response into the app's `Line` list.
 *
 * @param data  Parsed rapidJSON serving lines response.
 */
export function parseEfaLines(data: EFAServingLinesResponse): Line[] {
  return (data.lines ?? []).map((line) => ({
    name: line.number || line.name,
    direction: line.destination?.name ?? line.description ?? '',
    type: line.product?.name ?? '',
  }));
}
