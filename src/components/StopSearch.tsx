import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { BasicStop, Cities, Line } from '../models';
import { getLinesForStop, searchStops } from '../api/stopSearch';
import { useDebounce } from '../hooks/useDebounce';

const MIN_QUERY_LENGTH = 2;

interface StopSearchProps {
  /** City whose backend is queried. */
  city: Cities;
  /** Currently selected stop (controlled). */
  value: BasicStop | null;
  /** Called when the user selects (or clears) a stop. */
  onSelect: (stop: BasicStop | null) => void;
}

/**
 * Debounced stop search with autocomplete results and a preview of the lines
 * serving the selected stop. Provider-agnostic: it delegates to the correct
 * city API via `searchStops` / `getLinesForStop`.
 */
const StopSearch: React.FC<StopSearchProps> = ({ city, value, onSelect }) => {
  const { t } = useTranslation();

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<BasicStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lines, setLines] = useState<Line[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [linesError, setLinesError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(inputValue.trim(), 300);

  // Keep the text field in sync with the selected value. This pre-fills the
  // input when editing an existing stop and clears it when the value is reset
  // (e.g. on a city change). It only fires when `value` changes, so it never
  // clobbers the text while the user is typing (typing does not change value).
  useEffect(() => {
    setInputValue(value ? value.name : '');
  }, [value]);

  // Reset the result list when the city changes; the parent clears the value.
  useEffect(() => {
    setOptions([]);
    setError(null);
  }, [city]);

  // Run the debounced search.
  useEffect(() => {
    // Don't search for the label of an already-selected stop.
    if (value && debouncedQuery === value.name) {
      return;
    }

    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      setOptions([]);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    searchStops(city, debouncedQuery)
      .then((results) => {
        if (active) setOptions(results);
      })
      .catch(() => {
        if (active) {
          setOptions([]);
          setError(t('stopSearch.error'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, city, value, t]);

  // Load the line preview for the selected stop.
  useEffect(() => {
    if (!value) {
      setLines([]);
      setLinesError(null);
      setLinesLoading(false);
      return;
    }

    let active = true;
    setLinesLoading(true);
    setLinesError(null);

    getLinesForStop(city, value.id)
      .then((result) => {
        if (active) setLines(result);
      })
      .catch(() => {
        if (active) {
          setLines([]);
          setLinesError(t('stopSearch.linesError'));
        }
      })
      .finally(() => {
        if (active) setLinesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [value, city, t]);

  const noOptionsText =
    debouncedQuery.length < MIN_QUERY_LENGTH ? t('stopSearch.hint') : t('stopSearch.noResults');

  return (
    <Box>
      <Autocomplete<BasicStop>
        value={value}
        onChange={(_event, newValue) => onSelect(newValue)}
        inputValue={inputValue}
        onInputChange={(_event, newInputValue) => setInputValue(newInputValue)}
        options={options}
        loading={loading}
        // The backend already returns filtered results; keep them all.
        filterOptions={(opts) => opts}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        noOptionsText={error ?? noOptionsText}
        renderOption={(props, option) => {
          // Use the stop id as key: many stops share the same short label
          // (e.g. multiple "Marienplatz"), so MUI's default label-based key
          // would collide.
          const { key, ...optionProps } = props as React.HTMLAttributes<HTMLLIElement> & {
            key: React.Key;
          };
          return (
            <li key={option.id ?? key} {...optionProps}>
              <Box>
                <Typography variant="body1">{option.name}</Typography>
                {option.longName && option.longName !== option.name && (
                  <Typography variant="body2" color="text.secondary">
                    {option.longName}
                  </Typography>
                )}
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('stopSearch.label')}
            placeholder={t('stopSearch.placeholder')}
            margin="normal"
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 1 }} role="alert">
          {error}
        </Alert>
      )}

      {value && (
        <Box sx={{ mt: 1 }} aria-live="polite">
          {linesLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                {t('stopSearch.linesLoading')}
              </Typography>
            </Box>
          )}

          {!linesLoading && linesError && (
            <Alert severity="warning" sx={{ mt: 1 }} role="alert">
              {linesError}
            </Alert>
          )}

          {!linesLoading && !linesError && lines.length > 0 && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('stopSearch.linesLabel')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {lines.map((line, index) => (
                  <Chip
                    key={`${line.name}-${line.direction}-${index}`}
                    label={line.name}
                    size="small"
                    title={line.direction ? `${line.name} → ${line.direction}` : line.name}
                  />
                ))}
              </Box>
            </>
          )}

          {!linesLoading && !linesError && lines.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {t('stopSearch.noLines')}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default StopSearch;
