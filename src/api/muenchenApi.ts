import type { Departure, MUCResponse, MucDeparture } from '../models/index';

export async function fetchMuenchenDepartures(stopId: string): Promise<Departure[]> {
  const timestamp = Math.floor(Date.now() / 1000);
  const baseUrl = 'https://www.mvv-muenchen.de/';
  const url = `${baseUrl}/?eID=departuresFinder&action=get_departures&stop_id=${stopId}&requested_timestamp=${timestamp}&lines`;

  const response = await fetch(url);
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