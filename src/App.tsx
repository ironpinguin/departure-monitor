import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  FormControl
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SettingsIcon from '@mui/icons-material/Settings';
import Dashboard from './components/Dashboard';
import StopWidget from './components/StopWidget';
import ConfigModal from './components/ConfigModal';
import { useConfigStore } from './store/configStore';
import type { Departure, StopConfig } from './models';
import { fetchMuenchenDepartures } from './api/muenchenApi';
import { fetchWuerzburgDepartures } from './api/wuerzburgApi';

const App: React.FC = () => {
  const [configOpen, setConfigOpen] = useState(false);
  const [departuresMap, setDeparturesMap] = useState<Record<string, Departure[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  const { t, i18n } = useTranslation();
  
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

  const refreshAllDepartures = useCallback(() => {
    stops.forEach(stop => {
      if (stop.visible) {
        fetchDepartures(stop);
      }
    });
  }, [stops, fetchDepartures]);

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

  // Initialize departures and set up refresh interval
  useEffect(() => {
    refreshAllDepartures();
    
    const intervalId = setInterval(() => {
      refreshAllDepartures();
    }, refreshIntervalSeconds * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshIntervalSeconds, refreshAllDepartures]);

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
  
  // Change language effect
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            {/* Language selector */}
            <FormControl size="small" sx={{ mr: 2, minWidth: 80 }}>
              <Select
                value={language}
                onChange={(e: SelectChangeEvent) => {
                  setLanguage(e.target.value);
                }}
                sx={{ color: 'white', '& .MuiSelect-icon': { color: 'white' } }}
              >
                <MenuItem value="en">{t('english')}</MenuItem>
                <MenuItem value="de">{t('german')}</MenuItem>
              </Select>
            </FormControl>
            
            {/* Dark mode toggle */}
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              color="default"
              inputProps={{ 'aria-label': t('toggleDarkMode') }}
            />
            
            {/* Centered title */}
            <Typography
              variant="h6"
              component="div"
              sx={{
                mx: 'auto'  // This adds auto margins on both sides, centering the title
              }}
            >
              {t('appTitle')}
            </Typography>
            
            {/* Settings icon */}
            <IconButton
              color="inherit"
              onClick={() => setConfigOpen(true)}
              aria-label={t('settings')}
            >
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth={false} sx={{
          flexGrow: 1,
          p: 0,
          m: 0,
          width: '100%',
          height: '100%',
          overflow: 'auto',
          boxSizing: 'border-box'
        }}>
          <Dashboard>
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
