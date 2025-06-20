# Departure Monitor - GitHub Repository

Welcome to the **Departure Monitor** project repository! This is a modern web application for displaying real-time departure information for public transportation in German cities, currently supporting Munich (MVV) and Würzburg.

## 🚀 Project Overview

The Departure Monitor is a React-based web application that provides:

- **Real-time departure data** for public transport stops
- **Multi-city support** (Munich MVV and Würzburg)
- **Customizable displays** with configurable stops and walking times
- **Official transport styling** with authentic color schemes
- **Multilingual interface** (German/English) using i18next
- **Responsive design** for desktop and mobile devices
- **Docker containerization** for easy deployment

### Technology Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Material-UI (MUI)
- **Package Manager**: PNPM
- **Containerization**: Docker with multi-platform support
- **Internationalization**: i18next

## 🛠️ Development & Contributing

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/ironpinguin/departure-monitor.git
   cd departure-monitor
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Start Development Server**
   ```bash
   pnpm run dev
   ```

4. **Access Application**
   Open `http://localhost:5173` in your browser

### Development Workflow

- **Main Branch**: `main` - Production-ready code
- **Development Branch**: `develop` - Integration branch for new features
- **Feature Branches**: `feature/your-feature-name` - Individual feature development

### Code Quality

This project maintains high code quality standards:

- **ESLint**: Automated linting with `pnpm run lint`
- **TypeScript**: Strict type checking
- **Build Validation**: Automated build testing in CI/CD

## 🔄 GitHub Workflows & Automation

### Continuous Integration

#### Docker Build Test (`.github/workflows/docker-build.yml`)
- **Triggers**: Push to `main`/`develop`, Pull Requests to `main`
- **Actions**:
  - Multi-platform Docker builds (linux/amd64, linux/arm64)
  - ESLint code quality checks
  - Build validation
  - Automated testing for PRs (build-only, no push)
  - Development images pushed to GitHub Container Registry

#### Release Build and Deploy (`.github/workflows/release.yml`)
- **Triggers**: Published GitHub releases
- **Actions**:
  - Multi-platform Docker image builds
  - Push to GitHub Container Registry (`ghcr.io`)
  - Security vulnerability scanning with Trivy
  - Automatic release notes enhancement with Docker information
  - SARIF security report upload to GitHub Security tab

### Container Registry

Docker images are automatically published to:
- **Registry**: `ghcr.io`
- **Image Name**: `departure-monitor`
- **Tags**: 
  - Release versions (e.g., `v1.0.0`)
  - Branch names for development builds
  - `latest` for stable releases

### Security

- **Vulnerability Scanning**: Trivy security scanner runs on all releases
- **SARIF Reports**: Security findings uploaded to GitHub Security tab
- **Multi-platform Support**: Images built for AMD64 and ARM64 architectures

## 📦 Deployment Options

### Docker Deployment (Recommended)

**Pull and run the latest release:**
```bash
docker pull ghcr.io/ironpinguin/departure-monitor:latest
docker run -p 8080:80 ghcr.io/ironpinguin/departure-monitor:latest
```

**Using Docker Compose:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Local Build

```bash
pnpm run build
pnpm run preview
```

## 📋 Contributing Guidelines

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow existing code style and conventions
   - Add/update tests as needed
   - Update documentation if required

3. **Test Locally**
   ```bash
   pnpm run lint
   pnpm run build
   ```

4. **Submit Pull Request**
   - Target the `develop` branch
   - Provide clear description of changes
   - Reference any related issues

### Contribution Areas

We welcome contributions in these areas:

- **New City Support**: Add APIs for additional German cities
- **UI/UX Improvements**: Enhance user interface and experience
- **Performance Optimization**: Improve loading times and responsiveness
- **Accessibility**: Enhance accessibility features
- **Documentation**: Improve project documentation
- **Testing**: Add unit and integration tests

### Development Notes

- **Package Manager**: This project uses PNPM exclusively
- **Node.js Version**: Node.js 20 is required
- **Code Style**: ESLint configuration enforces consistent styling
- **Commit Messages**: Use clear, descriptive commit messages

## 📚 Documentation

### Project Documentation

- **Main README**: [`/README.md`](../README.md) - Complete project documentation
- **API Documentation**: [`/docs/apis/`](../docs/apis/) - API response examples and Bruno collections
- **Configuration Guide**: [`/docs/predefined-stops-config.md`](../docs/predefined-stops-config.md) - Stop configuration documentation

### API Integration

- **Munich (MVV)**: Public MVV API integration
- **Würzburg**: EFA API via proxy
- **Response Examples**: Available in `/docs/apis/` directory

## 🏗️ Architecture

### Project Structure

```
departure-monitor/
├── src/
│   ├── api/           # API integrations (Munich, Würzburg)
│   ├── components/    # React components
│   ├── config/        # Configuration files
│   ├── i18n/          # Internationalization
│   ├── models/        # TypeScript type definitions
│   ├── store/         # State management
│   └── utils/         # Utility functions
├── docs/              # Documentation and API examples
├── public/            # Static assets
└── .github/           # GitHub workflows and templates
```

### Key Components

- **Dashboard**: Main application interface
- **StopWidget**: Individual stop display component
- **DepartureList**: Real-time departure information
- **ConfigModal**: Stop configuration interface

## 🤝 Community & Support

### Getting Help

- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Documentation**: Check existing documentation before asking questions

### Recognition

This project was primarily developed with **RooCode** (https://roocode.com/), an AI-powered development assistant, contributing approximately 90% of the codebase including core architecture, API integrations, and user interface.

**Inspiration**: Based on ideas from [MMM-MVVWiesty](https://github.com/wiesty/MMM-MVVWiesty), a MagicMirror module for MVV departure information.

## 📄 License

This project is licensed under the [MIT License](../LICENSE).

---

**Ready to contribute?** Check out our [open issues](../../issues) or start a [discussion](../../discussions) to get involved!