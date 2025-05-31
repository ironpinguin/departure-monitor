import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppConfig, StopConfig } from '../models';

interface ConfigState extends AppConfig {
  setStops: (stops: StopConfig[]) => void;
  setDarkMode: (darkMode: boolean) => void;
  setRefreshIntervalSeconds: (seconds: number) => void;
  setMaxDeparturesShown: (count: number) => void;
  setLanguage: (language: string) => void;
}

// Load initial state from localStorage if available
const getInitialState = (): AppConfig => {
  const defaultState: AppConfig = {
    stops: [],
    darkMode: false,
    refreshIntervalSeconds: 60, // default 1 minute
    maxDeparturesShown: 10, // default number of departures to show
    language: 'en', // default language is English
  };
  
  return defaultState;
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      ...getInitialState(),
      setStops: (stops: StopConfig[]) => set({ stops }),
      setDarkMode: (darkMode: boolean) => set({ darkMode }),
      setRefreshIntervalSeconds: (seconds: number) => {
        if (seconds < 60) seconds = 60;
        set({ refreshIntervalSeconds: seconds });
      },
      setMaxDeparturesShown: (count: number) => {
        if (count < 1) count = 1;
        set({ maxDeparturesShown: count });
      },
      setLanguage: (language: string) => set({ language }),
    }),
    {
      name: 'departure-monitor-config',
      storage: createJSONStorage(() => localStorage),
    }
  )
);