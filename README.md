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

### Web Server Deployment

For production deployments using web servers with reverse proxy capabilities, we provide comprehensive installation guides:

- **[Nginx Installation Guide](docs/installation/nginx-installation.md)** - Complete setup instructions for deploying with Nginx, including SPA routing configuration, API proxying, and static asset caching
- **[Apache Installation Guide](docs/installation/apache-installation.md)** - Detailed deployment guide for Apache HTTP Server with mod_rewrite, mod_proxy, and caching configuration

Both guides include:
- Step-by-step installation procedures
- Complete configuration examples
- Security considerations
- Firewall setup instructions
- Troubleshooting tips

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

## Credits

### Inspiration

This project was inspired by [MMM-MVVWiesty](https://github.com/wiesty/MMM-MVVWiesty), a MagicMirror module for displaying MVV departure information. We appreciate the foundational work and ideas that helped shape this project.

### Development

This project was primarily developed with **RooCode**, an AI-powered LLM extension for VS Code (https://roocode.com/), which contributed at least 90% of the codebase, including the core architecture, API integrations, user interface, and overall functionality. RooCode is an intelligent coding assistant that helps developers write, refactor, and optimize code efficiently.

## Contributing

We welcome contributions from the community! 🎉 This project offers many opportunities to contribute, whether you're interested in:

- 🐛 **Bug fixes** and improvements
- ✨ **New features** like additional cities and transport associations
- 📚 **Documentation** improvements
- 🌍 **Translations** to new languages
- 🎨 **UI/UX enhancements**
- 🚀 **Performance optimizations**

Please read our comprehensive [**Contributing Guide**](CONTRIBUTING.md) for detailed information on:
- Development environment setup
- Code style guidelines
- Pull request process
- Adding new cities and transport APIs
- Translation workflow

## Code of Conduct

We are committed to providing a welcoming and inclusive community for everyone. Please read our [**Code of Conduct**](CODE_OF_CONDUCT.md) to understand the standards we expect from all community members.

## License

This project is licensed under the [MIT License](LICENSE).
