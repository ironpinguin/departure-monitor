import React from 'react';
import type { Departure } from '../models';
import TruncatedText from './TruncatedText';

interface DepartureListProps {
  departures: Departure[];
}

const DepartureList: React.FC<DepartureListProps> = ({ departures }) => {
  return (
    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
      {/*
        Eindeutige Key-Strategie: Kombiniert dep.id, scheduledDeparture timestamp und index
        um React Key-Duplikate zu vermeiden, auch bei identischen API-Daten
      */}
      {departures.map((dep, index) => (
        <li key={`departure-${dep.id}-${dep.scheduledDeparture.getTime()}-${index}`} style={{ marginBottom: '0.5rem' }}>
          <strong className="line-number">{dep.line}</strong> to <TruncatedText text={dep.direction} maxLength={35} /> at{' '}
          {dep.actualDeparture
            ? dep.actualDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : dep.scheduledDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {dep.delayMinutes && dep.delayMinutes > 0 ? ` (+${dep.delayMinutes}m)` : ''}
        </li>
      ))}
    </ul>
  );
};

export default DepartureList;