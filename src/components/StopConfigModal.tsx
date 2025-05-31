import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { StopConfig } from '../models';

interface StopConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (updatedConfig: StopConfig) => void;
  initialConfig: StopConfig;
}

const StopConfigModal: React.FC<StopConfigModalProps> = ({ open, onClose, onSave, initialConfig }) => {
  const [currentConfig, setCurrentConfig] = useState<StopConfig>(initialConfig);

  useEffect(() => {
    setCurrentConfig(initialConfig);
  }, [initialConfig, open]); // Reset form when modal opens or initialConfig changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCurrentConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    onSave(currentConfig);
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="stop-config-dialog-title">
      <DialogTitle id="stop-config-dialog-title">Configure Stop: {initialConfig.name}</DialogTitle>
      <DialogContent dividers>
        <TextField
          margin="dense"
          name="name"
          label="Stop Name"
          type="text"
          fullWidth
          variant="outlined"
          value={currentConfig.name}
          onChange={handleChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel id="city-select-label">City</InputLabel>
          <Select
            labelId="city-select-label"
            name="city"
            value={currentConfig.city}
            label="City"
            onChange={handleSelectChange}
          >
            <MenuItem value="wue">Würzburg</MenuItem>
            <MenuItem value="muc">Munich</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          name="stopId"
          label="Stop ID"
          type="text"
          fullWidth
          variant="outlined"
          value={currentConfig.stopId}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="walkingTimeMinutes"
          label="Walking Time (minutes)"
          type="number"
          fullWidth
          variant="outlined"
          value={currentConfig.walkingTimeMinutes}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="position"
          label="Position"
          type="number"
          fullWidth
          variant="outlined"
          value={currentConfig.position}
          onChange={handleChange}
        />
        <FormControlLabel
          control={
            <Switch
              checked={currentConfig.visible}
              onChange={handleChange}
              name="visible"
              color="primary"
            />
          }
          label="Visible"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StopConfigModal;