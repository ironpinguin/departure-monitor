import type {
  Departure,
  MUCResponse,
  MucDeparture,
  BasicStop,
  Line,
  MUCLinesResponse,
  MUCLine,
  EFAStopFinderResponse,
} from '../models/index';
import { parseEfaStops } from './efa';

const BASE_URL = 'https://www.mvv-muenchen.de/';

// The legacy stop search (eID=stopFinder on www.mvv-muenchen.de) was removed
// server-side (returns HTTP 500). Stop search now uses the EFA rapidJSON API on
// efa.mvv-muenchen.de, which exposes the same schema as Würzburg. efa.mvv sends
// no CORS headers, so it is reached through the /mvv-efa-api proxy (see
// vite.config.ts and nginx.conf).
const EFA_BASE_URL = '/mvv-efa-api/mvv';

// The MVV API expects the `lines` parameter to be a base64-encoded JSON array
// used to filter by specific lines. An empty array (base64 "W10=") means "no
// filter" and returns all lines. The API rejects a missing or non-base64 value.
const LINES_FILTER_ALL = 'W10='; // base64 of "[]"

function fetchDeparturesUrl(stopId: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  return `${BASE_URL}/?eID=departuresFinder&action=get_departures&stop_id=${stopId}&requested_timestamp=${timestamp}&lines=${LINES_FILTER_ALL}`;
}

function searchStopUrl(query: string): string {
  return `${EFA_BASE_URL}/XML_STOPFINDER_REQUEST?coordOutputFormat=WGS84%5Bdd.ddddd%5D&language=de&locationServerActive=1&name_sf=${encodeURIComponent(query)}&outputFormat=rapidJSON&type_sf=any`;
}

function linesForStopUrl(stopId: string): string {
  return `${BASE_URL}?eID=departuresFinder&action=available_lines&stop_id=${stopId}`;
}

export async function fetchMuenchenDepartures(stopId: string): Promise<Departure[]> {
  const response = await fetch(fetchDeparturesUrl(stopId));
  if (!response.ok) {
    throw new Error(`Failed to fetch departures for stopId ${stopId}: ${response.statusText}`);
  }
  const data: MUCResponse = await response.json();

  if (data.error) {
    throw new Error(`API error: ${data.error}`);
  }

  const departures: Departure[] = data.departures.map((dep: MucDeparture) => {
    // Format YYYYMMDD to YYYY-MM-DD for ISO date compatibility
    const formattedDate = `${dep.departureDate.substring(0, 4)}-${dep.departureDate.substring(4, 6)}-${dep.departureDate.substring(6, 8)}`;
    
    const scheduledDateTimeStr = `${formattedDate}T${dep.departurePlanned}:00`;
    const actualDateTimeStr = dep.departureLive ? `${formattedDate}T${dep.departureLive}:00` : null;

    const scheduledDeparture = new Date(scheduledDateTimeStr);
    const actualDeparture = actualDateTimeStr ? new Date(actualDateTimeStr) : null;

    let delayMinutes: number | null = null;
    if (actualDeparture && scheduledDeparture) {
      delayMinutes = Math.round((actualDeparture.getTime() - scheduledDeparture.getTime()) / 60000);
      if (delayMinutes === 0) {
        delayMinutes = null;
      }
    }

    // Eindeutige ID-Generierung: Kombiniert Stadt-Präfix, Station, Linie, Zeit und Datum
    // um Duplikate zu vermeiden, auch bei identischen Abfahrten zur selben Zeit
    return {
      id: `muc-${dep.station.id}-${dep.line.number}-${dep.departurePlanned}-${dep.departureDate}`,
      line: dep.line.number,
      direction: dep.direction,
      scheduledDeparture,
      actualDeparture,
      delayMinutes,
      platform: dep.track || null,
      transportType: dep.line.name,
      notifications: dep.notifications ? dep.notifications.map((n) => n.text) : [],
    };
  });

  return departures;
}

export async function stopFinderMuenchen(query: string): Promise<BasicStop[]> {
  const response = await fetch(searchStopUrl(query));
  if (!response.ok) {
    throw new Error(`Failed to search for stops with query ${query}: ${response.statusText}`);
  }
  const data: EFAStopFinderResponse = await response.json();

  return parseEfaStops(data, 'muc');
}


export async function linesForStop(stopId:string): Promise<Line[]> {
  const response = await fetch(linesForStopUrl(stopId));
  if (!response.ok) {
    throw new Error(`Failed to fetch lines for stopId ${stopId}: ${response.statusText}`);
  }

  const data: MUCLinesResponse = await response.json();

  if (data.error) {
    throw new Error(`API error: ${data.error}`);
  }

  const lines: Line[] = data.lines.map((line: MUCLine) => {
    /* TODO: Group Types
     * Tram => Tram, NachtTram
     * Bus => Bus, MetroBus, NachtBus, RegionalBus, ExpressBus
     * S-Bahn => S-Bahn, SEV
     * U-Bahn => U-Bahn
    */
    return {
      name: line.number,
      direction: line.direction,
      type: line.name
    }
  });


  return lines;

}
