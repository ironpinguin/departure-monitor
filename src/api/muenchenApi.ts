import type { 
  Departure, 
  MUCResponse, 
  MucDeparture, 
  BasicStop, 
  MUCStopResponse, 
  Line, 
  MUCLinesResponse, 
  MUCStop, 
  MUCLine 
} from '../models/index';


const BASE_URL = 'https://www.mvv-muenchen.de/';

function fetchDeparturesUrl(stopId: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  return `${BASE_URL}/?eID=departuresFinder&action=get_departures&stop_id=${stopId}&requested_timestamp=${timestamp}&lines`;
}

function searchStopUrl(query: string): string {
  return `${BASE_URL}?eID=stopFinder&query=${query}`;
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
  const data: MUCStopResponse = await response.json();

  if (!data.success) {
    throw new Error(`API error: ${data.message}`);
  }

  const stops: BasicStop[] = (data.result.filter((stop: MUCStop) => (stop.anyType == 'stop'))).map((stop: MUCStop) => {
    return {
        id: stop.id,
        name: stop.object,
        city: 'muc',
        longName: stop.name
    }
  });

  return stops;
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
