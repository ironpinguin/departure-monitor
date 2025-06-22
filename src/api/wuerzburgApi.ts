import type { Departure, WUEResponse } from '../models/index';

const VERSION = "10.6.21.17";

export async function fetchWuerzburgDepartures(stopId: string): Promise<Departure[]> {
  const baseUrl = '/wuerzburg-api';
  const url = `${baseUrl}/efa/XML_DM_REQUEST?commonMacro=dm&type_dm=any&name_dm=${stopId}&outputFormat=rapidJSON&mode=direct&useRealtime=1&includeCompleteStopSeq=1&depType=stopEvents&version=${VERSION}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`Failed to fetch Würzburg departures: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    
    let data: WUEResponse;
    try {
      data = JSON.parse(text) as WUEResponse;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response text:', text.substring(0, 200) + '...');
      throw new Error('Failed to parse API response as JSON');
    }
    
    if (!data.stopEvents || !Array.isArray(data.stopEvents)) {
      console.error('Invalid response structure:', data);
      return [];
    }

    const departures: Departure[] = data.stopEvents.map((event) => {
      const scheduledDeparture = new Date(event.departureTimePlanned);
      const actualDeparture = event.departureTimeEstimated ? new Date(event.departureTimeEstimated) : null;
      const delayMinutes = actualDeparture ? Math.round((actualDeparture.getTime() - scheduledDeparture.getTime()) / 60000) : null;
      const platform = event.location.properties?.platformName || event.location.properties?.platform || null;
      const transportType = event.transportation.product?.name || 'Unknown';

      // Eindeutige ID-Generierung: Kombiniert Stadt-Präfix, Trip-ID und Zeitstempel
      // um Duplikate zu vermeiden, auch bei identischen Trip-IDs zu verschiedenen Zeiten
      return {
        id: `wue-${event.properties?.AVMSTripID || event.transportation.id}-${scheduledDeparture.getTime()}`,
        line: event.transportation.name,
        direction: event.transportation.destination.name,
        scheduledDeparture,
        actualDeparture,
        delayMinutes,
        platform,
        transportType,
        notifications: [],
      };
    });

    return departures;
  } catch (error) {
    console.error('Error fetching Würzburg departures:', error);
    // Rethrow the error to let the component handle it
    throw error;
  }
}