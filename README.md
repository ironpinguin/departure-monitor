# Public Transport Departure Monitor

A modern web application for displaying real-time departure information for public transportation in various German cities. Currently supports Munich (MVV) and Würzburg.

## Features

- **Real-time departure data** for various stops
- **Multiple cities**: Currently supports Munich (MVV) and Würzburg
- **Customizable display**:
  - Configurable stops
  - Consideration of individual walking times to the stop
  - Adjustable number of displayed departures
- **Transport styling**: Lines are displayed according to the official color schemes
- **Multilingual**: German and English (internationalized with i18next)
- **Responsive design**: Suitable for desktop and mobile devices

## Technology Stack

This application was developed with modern web technologies:

- **Frontend**: React + TypeScript
- **Build tool**: Vite
- **UI Framework**: Material-UI (MUI)
- **Internationalization**: i18next
- **Containerization**: Docker support for easy deployment

## Installation and Running

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/departure-monitor.git
   cd departure-monitor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open in browser: `http://localhost:5173`

### Production Build

1. Build the application:
   ```bash
   npm run build
   ```

2. Test the built application:
   ```bash
   npm run preview
   ```

### Docker Deployment

1. Build Docker image:
   ```bash
   docker build -t departure-monitor .
   ```

2. Start container:
   ```bash
   docker run -p 8080:80 departure-monitor
   ```

3. Open in browser: `http://localhost:8080`

## Configuration

### Adding or Editing Stops

The application allows adding and configuring stops through the user interface. The following settings can be made for each stop:

- Stop name
- City (Munich or Würzburg)
- Stop ID (according to the respective transport association)
- Walking time to the stop in minutes

### Predefined Stops

The application contains a list of predefined stops that can be used as templates. More information can be found in the documentation under `docs/predefined-stops-config.md`.

## API Integration

### Munich (MVV)

The application uses the public MVV API to retrieve real-time departure data for Munich.

### Würzburg

For Würzburg, the EFA API (Electronic Timetable Information) is used, which is accessed via a proxy.

## Contributing

Contributions to the project are welcome! Possible extensions could be:

- Support for additional cities and transport associations
- Additional display options and filters
- Accessibility improvements
- Performance optimizations

## License

This project is licensed under the [MIT License](LICENSE).
