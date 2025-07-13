import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  CssBaseline,
  Container,
  Alert,
  Snackbar,
  ThemeProvider,
  createTheme,
  Switch,
  Select,
  MenuItem,
  FormControl,
  Tooltip
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Dashboard from './components/Dashboard';
import StopWidget from './components/StopWidget';
import ConfigModal from './components/ConfigModal';
import { useConfigStore } from './store/configStore';
import type { Departure, StopConfig } from './models';
import { fetchMuenchenDepartures } from './api/muenchenApi';
import { fetchWuerzburgDepartures } from './api/wuerzburgApi';

import './App.css';

const App: React.FC = () => {
  const [configOpen, setConfigOpen] = useState(false);
  const [departuresMap, setDeparturesMap] = useState<Record<string, Departure[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  const { t, i18n } = useTranslation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  const stops = useConfigStore((state) => state.stops);
  const refreshIntervalSeconds = useConfigStore((state) => state.refreshIntervalSeconds);
  const darkMode = useConfigStore((state) => state.darkMode);
  const maxDeparturesShown = useConfigStore((state) => state.maxDeparturesShown);
  const language = useConfigStore((state) => state.language);
  const setStops = useConfigStore((state) => state.setStops);
  const setDarkMode = useConfigStore((state) => state.setDarkMode);
  const setRefreshIntervalSeconds = useConfigStore((state) => state.setRefreshIntervalSeconds);
  const setMaxDeparturesShown = useConfigStore((state) => state.setMaxDeparturesShown);
  const setLanguage = useConfigStore((state) => state.setLanguage);


  useEffect(() => {
   const updateTime = lastUpdateTime;
   if (updateTime) {
    console.log(`Init --- Last update time: ${updateTime.toLocaleTimeString()}`);
   }
  }, [lastUpdateTime]);
  
  const fetchDepartures = useCallback(async (stop: StopConfig) => {
    if (!stop.visible) return;
    
    try {
      setLoading(prev => ({ ...prev, [stop.id]: true }));
      
      let departures: Departure[];
      
      if (stop.city === 'muc') {
        departures = await fetchMuenchenDepartures(stop.stopId);
      } else if (stop.city === 'wue') {
        try {
          departures = await fetchWuerzburgDepartures(stop.stopId);
        } catch (err) {
          console.error(`Error fetching departures for Würzburg stop ${stop.name}:`, err);
          // Set empty departures but don't treat as a global error
          departures = [];
          // Show error in console but continue execution
          console.error(t('errorFetchingWuerzburg', { stopName: stop.name }));
        }
      } else {
        throw new Error(t('unsupportedCity', { city: stop.city }));
      }
      
      setDeparturesMap(prev => ({
        ...prev,
        [stop.id]: departures || [] // Ensure we always have an array even if undefined
      }));
      
      setError(null);
    } catch (err) {
      console.error(t('errorFetchingDepartures', { stopName: stop.name }), err);
      setError(t('errorFetching', { stopName: stop.name }));
    } finally {
      setLoading(prev => ({ ...prev, [stop.id]: false }));
    }
  }, [t]);

  const announceUpdate = useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
      // Clear after a delay to avoid cluttering screen reader
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const refreshAllDepartures = useCallback(() => {
    if (autoRefreshPaused) return;
    
    stops.forEach(stop => {
      if (stop.visible) {
        fetchDepartures(stop);
      }
    });
    
    setLastUpdateTime(new Date());
    announceUpdate(t('dataUpdated'));
  }, [stops, fetchDepartures, autoRefreshPaused, announceUpdate, t]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshPaused(!autoRefreshPaused);
    announceUpdate(autoRefreshPaused ? t('autoRefreshEnabled') : t('autoRefreshDisabled'));
  }, [autoRefreshPaused, announceUpdate, t]);

  const handleRefresh = (stopId: string) => {
    const stop = stops.find(s => s.id === stopId);
    if (stop) {
      fetchDepartures(stop);
    }
  };

  const handleConfigure = (updatedConfig: StopConfig) => {
    // Update the stop configuration in the store
    setStops(stops.map((s) => (s.id === updatedConfig.id ? updatedConfig : s)));
  };

  const openConfigModal = useCallback(() => {
    setConfigOpen(true);
  }, []);

  // Initialize departures and set up refresh interval
  useEffect(() => {
    refreshAllDepartures();
    
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up new interval
    intervalRef.current = setInterval(() => {
      if (!autoRefreshPaused) {
        refreshAllDepartures();
      }
    }, refreshIntervalSeconds * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshIntervalSeconds, refreshAllDepartures, autoRefreshPaused]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to close config modal
      if (event.key === 'Escape' && configOpen) {
        setConfigOpen(false);
      }
      
      // Space to toggle auto-refresh when not in input fields
      if (event.key === ' ' && event.target === document.body) {
        event.preventDefault();
        toggleAutoRefresh();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [configOpen, toggleAutoRefresh]);

  // Create light and dark themes
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
        },
      }),
    [darkMode]
  );
  
  // Change language effect and update HTML lang attribute
  useEffect(() => {
    i18n.changeLanguage(language);
    // Update HTML lang attribute for screen readers
    document.documentElement.lang = language;
  }, [language, i18n]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Skip to content link */}
      <a href="#main-content" className="skip-link">
        {t('skipToContent')}
      </a>
      
      {/* Live region for announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="live-region"
      />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static" role="banner">
          <Toolbar>
            {/* Language selector */}
            <FormControl size="small" sx={{ mr: 2, minWidth: 80 }}>
              <Select
                value={language}
                onChange={(e: SelectChangeEvent) => {
                  setLanguage(e.target.value);
                }}
                sx={{ color: 'white', '& .MuiSelect-icon': { color: 'white' } }}
                SelectDisplayProps={{ 'aria-label': t('selectLanguage') }}
              >
                <MenuItem value="en">{t('english')}</MenuItem>
                <MenuItem value="de">{t('german')}</MenuItem>
              </Select>
            </FormControl>
            
            {/* Dark mode toggle */}
            <Tooltip title={t('toggleDarkMode')}>
              <Switch
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                color="default"
                inputProps={{ 'aria-label': t('toggleDarkMode') }}
              />
            </Tooltip>
            
            {/* Auto-refresh controls */}
            <div className="auto-refresh-controls">
              <Tooltip title={autoRefreshPaused ? t('playAutoRefresh') : t('pauseAutoRefresh')}>
                <IconButton
                  color="inherit"
                  onClick={toggleAutoRefresh}
                  aria-label={autoRefreshPaused ? t('playAutoRefresh') : t('pauseAutoRefresh')}
                  size="small"
                >
                  {autoRefreshPaused ? <PlayArrowIcon /> : <PauseIcon />}
                </IconButton>
              </Tooltip>
              <span
                className="auto-refresh-status"
                aria-live="polite"
                role="status"
              >
                {autoRefreshPaused ? t('autoRefreshDisabled') : t('autoRefreshEnabled')}
              </span>
            </div>
            
            {/* Centered title */}
            <Typography
              variant="h6"
              component="h1"
              sx={{
                mx: 'auto'  // This adds auto margins on both sides, centering the title
              }}
            >
              {t('appTitle')}
            </Typography>
            
            {/* Settings icon */}
            <Tooltip title={t('settings.title')}>
              <IconButton
                color="inherit"
                onClick={() => setConfigOpen(true)}
                aria-label={t('settings.title')}
                aria-describedby="settings-help"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <span id="settings-help" className="sr-only">
              {t('escapeToClose')}
            </span>
          </Toolbar>
        </AppBar>
        
        <Container
          maxWidth={false}
          component="main"
          id="main-content"
          sx={{
            flexGrow: 1,
            p: 0,
            m: 0,
            width: '100%',
            height: '100%',
            overflow: 'auto',
            boxSizing: 'border-box'
          }}
          role="main"
          aria-label={t('appTitle')}
        >
          <Dashboard onOpenConfig={openConfigModal}>
            {stops
              .filter(stop => stop.visible)
              .sort((a, b) => a.position - b.position)
              .map((stop) => (
                <StopWidget
                  key={stop.id}
                  stopConfig={stop}
                  departures={departuresMap[stop.id] || []}
                  isLoading={loading[stop.id] || false}
                  onRefresh={() => handleRefresh(stop.id)}
                  onConfigure={handleConfigure}
                  maxDeparturesShown={maxDeparturesShown}
                />
              ))}
          </Dashboard>
        </Container>
      </Box>
      
      <ConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        stops={stops}
        onAddStop={(stop) => setStops([...stops, stop])}
        onUpdateStop={(updatedStop) =>
          setStops(stops.map((s) => (s.id === updatedStop.id ? updatedStop : s)))
        }
        onRemoveStop={(stopId) => setStops(stops.filter((s) => s.id !== stopId))}
        refreshIntervalSeconds={refreshIntervalSeconds}
        onRefreshIntervalChange={setRefreshIntervalSeconds}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        maxDeparturesShown={maxDeparturesShown}
        onMaxDeparturesChange={setMaxDeparturesShown}
      />
      
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;
