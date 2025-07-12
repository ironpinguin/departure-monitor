import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Box
} from '@mui/material';
import { Menu as MenuIcon, Settings, Add, Language } from '@mui/icons-material';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';

interface DashboardProps {
  children?: React.ReactNode;
  onOpenConfig?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ children, onOpenConfig }) => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  // Burger Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    handleMenuClose();
  };
  
  const handleOpenConfig = () => {
    onOpenConfig?.();
    handleMenuClose();
  };
  
  // Responsive grid configuration
  const getGridConfig = () => {
    if (isMobile) {
      return {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.75rem',
        padding: '0.5rem',
        alignItems: 'stretch'
      };
    } else if (isTablet) {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
        padding: '1rem',
        justifyItems: 'center'
      };
    } else {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem',
        padding: '1.5rem',
        justifyItems: 'center'
      };
    }
  };
  
  return (
    <>
      {/* Mobile Header with Burger Menu */}
      {isMobile && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--background-color)',
            borderBottom: '1px solid var(--border-color)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
          }}
        >
          <Typography
            variant="h6"
            component="h1"
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}
          >
            {t('appTitle')}
          </Typography>
          
          <IconButton
            onClick={handleMenuOpen}
            aria-label={t('dashboard.openMenu')}
            sx={{
              color: 'var(--text-primary)',
              '&:hover': {
                backgroundColor: 'var(--hover-background)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      )}

      {/* Mobile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleOpenConfig}>
          <Settings sx={{ mr: 1 }} />
          {t('settings')}
        </MenuItem>
        
        <MenuItem onClick={handleOpenConfig}>
          <Add sx={{ mr: 1 }} />
          {t('dashboard.addStopsButton')}
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleLanguageChange('de')}>
          <Language sx={{ mr: 1 }} />
          {t('german')}
        </MenuItem>
        
        <MenuItem onClick={() => handleLanguageChange('en')}>
          <Language sx={{ mr: 1 }} />
          {t('english')}
        </MenuItem>
      </Menu>

      <section
        role="region"
        aria-label={t('appTitle')}
        aria-describedby="dashboard-description"
        style={{
          ...getGridConfig(),
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          maxWidth: '100vw',
          overflowX: 'hidden'
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
              fontSize: isMobile ? '1rem' : '1.2rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              gap: isMobile ? '1rem' : '1.5rem',
              padding: isMobile ? '1rem' : '2rem'
            }}
          >
            <div>{t('configModal.noStops')}</div>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onOpenConfig?.()}
              aria-label={t('dashboard.addStopsButton')}
              size={isMobile ? 'large' : 'medium'}
              sx={{
                minHeight: isMobile ? '48px' : '40px',
                minWidth: isMobile ? '120px' : '100px',
                fontSize: isMobile ? '1rem' : '0.875rem'
              }}
            >
              {t('dashboard.addStopsButton')}
            </Button>
          </div>
        ) : (
          children
        )}
      </section>
    </>
  );
};

export default Dashboard;