import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { BasicStop, StopConfig } from '../models';
import { getPredefinedStops } from '../utils/predefinedStops';
import StopSearch from './StopSearch';

// Load predefined stops from configuration
const PREDEFINED_STOPS = getPredefinedStops();

interface AddEditStopDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (stop: StopConfig) => void;
  editingStop: StopConfig | null;
  existingStops: StopConfig[];
}

const AddEditStopDialog: React.FC<AddEditStopDialogProps> = ({
  open,
  onClose,
  onSave,
  editingStop,
  existingStops
}) => {
  const { t } = useTranslation();
  const [city, setCity] = useState<'wue' | 'muc'>('muc');
  const [selectedStop, setSelectedStop] = useState<BasicStop | null>(null);
  const [walkingTimeMinutes, setWalkingTimeMinutes] = useState(5);
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState(0);

  // Curated stops for the selected city, offered as "saved" suggestions in the
  // search field. Deduped by transit stopId (a few predefined entries reuse the
  // same id under different names).
  const savedStops = useMemo<BasicStop[]>(() => {
    const seen = new Set<string>();
    const result: BasicStop[] = [];
    for (const stop of PREDEFINED_STOPS[city]) {
      if (seen.has(stop.stopId)) continue;
      seen.add(stop.stopId);
      result.push({ id: stop.stopId, name: stop.name, city, longName: stop.name });
    }
    return result;
  }, [city]);

  // Reset form when dialog opens or editingStop changes
  useEffect(() => {
    if (editingStop) {
      setCity(editingStop.city);
      // Reconstruct a BasicStop so the search field is pre-filled when editing.
      setSelectedStop({
        id: editingStop.stopId,
        name: editingStop.name,
        city: editingStop.city,
        longName: editingStop.name
      });
      setWalkingTimeMinutes(editingStop.walkingTimeMinutes);
      setVisible(editingStop.visible);
      setPosition(editingStop.position);
    } else {
      // Default values for new stop
      setCity('muc');
      setSelectedStop(null);
      setWalkingTimeMinutes(5);
      setVisible(true);
      setPosition(existingStops.length);
    }
  }, [editingStop, existingStops.length, open]);

  // When adding a new stop, prefill the walking time from a matching predefined
  // stop (if any) as a convenience. Don't override when editing.
  useEffect(() => {
    if (editingStop || !selectedStop) return;

    const predefinedMatch = PREDEFINED_STOPS[city].find(
      stop => stop.stopId === selectedStop.id
    );

    if (predefinedMatch) {
      setWalkingTimeMinutes(predefinedMatch.walkingTimeMinutes);
    }
  }, [selectedStop, city, editingStop]);

  const handleSave = () => {
    if (!selectedStop) return;

    const stopToSave: StopConfig = {
      id: editingStop?.id || `${city}-${Date.now()}`,
      // Prefer the fully qualified name (e.g. "Würzburg, Hauptbahnhof") so that
      // stops sharing the same short label ("Hauptbahnhof") across cities stay
      // distinguishable on the dashboard. Falls back to the short name.
      name: selectedStop.longName || selectedStop.name,
      city,
      stopId: selectedStop.id,
      walkingTimeMinutes,
      visible,
      position
    };

    onSave(stopToSave);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingStop ? t('addEditStopDialog.editStop') : t('addEditStopDialog.addNewStop')}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="city-select-label">{t('addEditStopDialog.city')}</InputLabel>
            <Select
              labelId="city-select-label"
              value={city}
              label={t('addEditStopDialog.city')}
              onChange={(e) => {
                setCity(e.target.value as 'wue' | 'muc');
                setSelectedStop(null);
              }}
            >
              <MenuItem value="wue">{t('cities.wue')}</MenuItem>
              <MenuItem value="muc">{t('cities.muc')}</MenuItem>
            </Select>
          </FormControl>

          <StopSearch
            city={city}
            value={selectedStop}
            onSelect={setSelectedStop}
            savedStops={savedStops}
          />

          <TextField
            margin="normal"
            label={t('addEditStopDialog.walkingTime')}
            type="number"
            fullWidth
            value={walkingTimeMinutes}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 0) {
                setWalkingTimeMinutes(value);
              }
            }}
            inputProps={{ min: 0 }}
          />

          <TextField
            margin="normal"
            label={t('addEditStopDialog.position')}
            type="number"
            fullWidth
            value={position}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 0) {
                setPosition(value);
              }
            }}
            inputProps={{ min: 0 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
                color="primary"
              />
            }
            label={t('addEditStopDialog.visible')}
            sx={{ mt: 1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('addEditStopDialog.cancel')}</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!selectedStop}
        >
          {t('addEditStopDialog.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditStopDialog;
