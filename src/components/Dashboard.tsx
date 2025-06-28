import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';

interface DashboardProps {
  children?: React.ReactNode;
  onOpenConfig?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ children, onOpenConfig }) => {
  const { t } = useTranslation();
  
  return (
    <section
      role="region"
      aria-label={t('appTitle')}
      aria-describedby="dashboard-description"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.5rem',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div id="dashboard-description" className="sr-only">
        {t('stopWidget.departureTableLabel', { stopName: t('appTitle') })}
      </div>
      
      {React.Children.count(children) === 0 ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            gap: '1.5rem'
          }}
        >
          <div>{t('configModal.noStops')}</div>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onOpenConfig?.()}
            aria-label={t('dashboard.addStopsButton')}
          >
            {t('dashboard.addStopsButton')}
          </Button>
        </div>
      ) : (
        children
      )}
    </section>
  );
};

export default Dashboard;