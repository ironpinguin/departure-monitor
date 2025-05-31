import React from 'react';

interface DashboardProps {
  children?: React.ReactNode;
}

const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      padding: '0.5rem',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box'
    }}>
      {children}
    </div>
  );
};

export default Dashboard;