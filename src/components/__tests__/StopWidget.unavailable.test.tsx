import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StopWidget from '../StopWidget';
import type { StopConfig } from '../../models';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
}));

const stop: StopConfig = {
  id: 'wue-1',
  name: 'Sanderring',
  city: 'wue',
  stopId: 'de:09663:1',
  walkingTimeMinutes: 5,
  visible: true,
  position: 0,
};

describe('StopWidget provider availability', () => {
  it('explains that the provider is unavailable instead of "no departures"', () => {
    render(<StopWidget stopConfig={stop} departures={[]} providerUnavailable onRefresh={() => {}} maxDeparturesShown={5} />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('stopWidget.providerUnavailable');
    expect(screen.queryByText('stopWidget.noDepartures')).not.toBeInTheDocument();
  });

  it('still shows "no departures" when the provider is reachable', () => {
    render(<StopWidget stopConfig={stop} departures={[]} onRefresh={() => {}} maxDeparturesShown={5} />);

    expect(screen.getByRole('status')).toHaveTextContent('stopWidget.noDepartures');
  });
});
