# Predefined Stops Configuration

This document explains how the predefined stops are configured in the Departure Monitor application.

## Overview

The application uses a JSON configuration file to store predefined stops for different cities. This approach allows for:

- Easy addition, modification, or removal of stops without changing code
- Integration during the build process
- Potential future expansion to load from external sources

## Configuration Structure

The predefined stops are stored in `src/config/predefinedStops.json` with the following structure:

```json
{
  "cityName": [
    { "id": "stop-id", "name": "Stop Name", "stopId": "API-identifier" },
    ...more stops
  ],
  ...more cities
}
```

Where:
- `cityName`: The name of the city (e.g., "würzburg", "munich")
- `id`: A unique identifier for the stop in our system
- `name`: The display name of the stop
- `stopId`: The identifier used by the public transport API

## How to Update

To add or modify predefined stops:

1. Edit the `src/config/predefinedStops.json` file
2. Follow the existing structure
3. Rebuild the application to integrate the changes

## Integration Flow

1. The JSON file is imported during build time
2. The `getPredefinedStops()` utility function provides typed access to the configuration
3. The `AddEditStopDialog` component uses this configuration to populate the stop selection dropdown

## Type Definitions

The configuration is typed using TypeScript interfaces defined in `src/models/PredefinedStops.ts`:

```typescript
export interface PredefinedStop {
  id: string;
  name: string;
  stopId: string;
}

export interface PredefinedStopsConfig {
  [city: string]: PredefinedStop[];
}