import React, { useState, useEffect } from 'react';
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
import type { StopConfig } from '../models';
import { getPredefinedStops } from '../utils/predefinedStops';

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
  const [city, setCity] = useState<'wue' | 'muc'>('muc');
  const [selectedStopId, setSelectedStopId] = useState('');
  const [walkingTimeMinutes, setWalkingTimeMinutes] = useState(5);
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState(0);

  // Reset form when dialog opens or editingStop changes
  useEffect(() => {
    if (editingStop) {
      setCity(editingStop.city);
      setSelectedStopId(editingStop.stopId);
      setWalkingTimeMinutes(editingStop.walkingTimeMinutes);
      setVisible(editingStop.visible);
      setPosition(editingStop.position);
    } else {
      // Default values for new stop
      setCity('muc');
      setSelectedStopId('');
      setWalkingTimeMinutes(5);
      setVisible(true);
      setPosition(existingStops.length);
    }
  }, [editingStop, existingStops.length, open]);

  // Update walking time when a stop is selected (only when adding a new stop)
  useEffect(() => {
    // Don't override walking time when editing an existing stop
    if (editingStop) return;
    
    // If a stop is selected, load its predefined walking time
    if (selectedStopId) {
      const selectedPredefinedStop = PREDEFINED_STOPS[city].find(
        stop => stop.stopId === selectedStopId
      );
      
      if (selectedPredefinedStop) {
        setWalkingTimeMinutes(selectedPredefinedStop.walkingTimeMinutes);
      }
    }
  }, [selectedStopId, city, editingStop]);

  const handleSave = () => {
    if (!selectedStopId) return;

    const selectedPredefinedStop = PREDEFINED_STOPS[city].find(
      stop => stop.stopId === selectedStopId
    );

    if (!selectedPredefinedStop) return;

    const stopToSave: StopConfig = {
      id: editingStop?.id || `${city}-${Date.now()}`,
      name: selectedPredefinedStop.name,
      city,
      stopId: selectedStopId,
      walkingTimeMinutes,
      visible,
      position
    };

    onSave(stopToSave);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingStop ? 'Edit Stop' : 'Add New Stop'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="city-select-label">City</InputLabel>
            <Select
              labelId="city-select-label"
              value={city}
              label="City"
              onChange={(e) => {
                setCity(e.target.value as 'wue' | 'muc');
                setSelectedStopId('');
              }}
            >
              <MenuItem value="wue">Würzburg</MenuItem>
              <MenuItem value="muc">Munich</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="stop-select-label">Stop</InputLabel>
            <Select
              labelId="stop-select-label"
              value={selectedStopId}
              label="Stop"
              onChange={(e) => {
                setSelectedStopId(e.target.value);
              }}
            >
              {PREDEFINED_STOPS[city].map((stop) => (
                <MenuItem key={stop.stopId} value={stop.stopId}>
                  {stop.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="normal"
            label="Walking Time (minutes)"
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
            label="Position"
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
            label="Visible"
            sx={{ mt: 1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!selectedStopId}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditStopDialog;