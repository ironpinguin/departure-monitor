import React, { useState } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { StopConfig } from '../models';
import AddEditStopDialog from './AddEditStopDialog';

interface StopManagementTabProps {
  stops: StopConfig[];
  onAddStop: (stop: StopConfig) => void;
  onUpdateStop: (stop: StopConfig) => void;
  onRemoveStop: (stopId: string) => void;
}

const StopManagementTab: React.FC<StopManagementTabProps> = ({
  stops,
  onAddStop,
  onUpdateStop,
  onRemoveStop
}) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<StopConfig | null>(null);

  const handleAddStop = () => {
    setEditingStop(null);
    setDialogOpen(true);
  };

  const handleEditStop = (stop: StopConfig) => {
    setEditingStop(stop);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingStop(null);
  };

  const handleSaveStop = (stop: StopConfig) => {
    if (editingStop) {
      onUpdateStop(stop);
    } else {
      onAddStop(stop);
    }
    setDialogOpen(false);
    setEditingStop(null);
  };

  // Sort stops by position
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{t('configModal.stopManagement')}</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddStop}
        >
          {t('addEditStopDialog.addNewStop')}
        </Button>
      </Box>

      <List sx={{ width: '100%' }}>
        {sortedStops.length === 0 ? (
          <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
            {t('configModal.noStops')}
          </Typography>
        ) : (
          sortedStops.map((stop) => (
            <ListItem key={stop.id} disablePadding sx={{ mb: 2 }}>
              <Card sx={{ width: '100%' }}>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {stop.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('city')}: {t('cities.'+stop.city)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('configModal.walkingTime')}: {stop.walkingTimeMinutes} min
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Position: {stop.position}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('configModal.visible')}: {stop.visible ? t('yes') : t('no')}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions>
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditStop(stop)}
                    aria-label="Edit stop"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => onRemoveStop(stop.id)}
                    aria-label="Remove stop"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </ListItem>
          ))
        )}
      </List>

      <AddEditStopDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleSaveStop}
        editingStop={editingStop}
        existingStops={stops}
      />
    </Box>
  );
};

export default StopManagementTab;