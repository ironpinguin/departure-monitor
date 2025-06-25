import React from 'react';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
  children?: React.ReactNode;
}

const Dashboard: React.FC<DashboardProps> = ({ children }) => {
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
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            textAlign: 'center'
          }}
        >
          {t('configModal.noStops')}
        </div>
      ) : (
        children
      )}
    </section>
  );
};

export default Dashboard;