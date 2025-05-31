import React from 'react';
import type { Departure } from '../models';

interface DepartureListProps {
  departures: Departure[];
}

const DepartureList: React.FC<DepartureListProps> = ({ departures }) => {
  return (
    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
      {departures.map((dep) => (
        <li key={dep.id} style={{ marginBottom: '0.5rem' }}>
          <strong>{dep.line}</strong> to {dep.direction} at{' '}
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