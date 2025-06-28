# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
-

### Changed
-

### Deprecated
-

### Removed
-

### Fixed
-

### Security
-

## [2.1.1] - 2025-06-28

### Added
-

### Changed
-

### Deprecated
-

### Removed
-

### Fixed
- Minor bug fixes in ci pipeline

### Security
-

## [2.1.0] - 2025-06-28

### Added
- Enhanced user interface components for improved user experience
- Additional configuration options for stop management
- Performance optimizations for faster loading times

### Changed
- Updated dependency versions for security and stability improvements
- Refined styling and visual elements for better accessibility
- Improved error handling and user feedback mechanisms

### Deprecated
-

### Removed
-

### Fixed
- Minor bug fixes and stability improvements
- Resolved edge cases in departure time calculations
- Enhanced API error handling and recovery

### Security
-

## [2.0.0] - 2025-06-28

### Added
- **WCAG 2.1 AA Compliance Implementation** - Complete accessibility implementation for improved usability
- Automatic color contrast validation with 4.5:1 minimum contrast ratio
- Complete keyboard navigation and intelligent focus management
- SVG icons with ARIA labels and detailed descriptions for screen readers
- Skip-to-content links for improved navigation
- Modal focus trapping for better user guidance
- Auto-refresh user controls with ARIA live regions for real-time updates
- Comprehensive accessibility documentation with 5 detailed guides
- "Add Stops" button in empty dashboard state for improved UX
- Responsive design support for viewports from 320px to 2560px
- @types/node for improved Node.js type support

### Changed
- **Package Manager Migration** - Complete migration from npm to pnpm for better performance
- Language selector with improved screen reader support
- Heading hierarchy corrected (h3 → h2) for better semantic structure
- Dependency updates: eslint, typescript-eslint and other development dependencies

### Improved
- Screen reader compatibility for all interactive elements
- User experience through direct access to configuration in empty dashboard state
- Docker ignore patterns for optimized container builds
- Git ignore configuration for pnpm cache

### Technical
- Complete WCAG 2.1 AA compliance implementation
- Extended accessibility testing infrastructure
- Improved build and deployment processes
- Migration to pnpm package manager

## [1.0.1] - 2025-06-22

### Changed
- optimize API proxy configuration in nginx for docker image

## [1.0.0] - 2025-06-20

### Added
- Initial release of Departure Monitor
- Public transportation departure monitoring system
- Support for Munich (MUC) and Würzburg (WUE) transit APIs
- Real-time departure information display
- Configurable stop management
- Multi-language support (German and English)
- Material-UI based responsive interface
- Docker containerization support
- Stop widget system for customizable displays
- Predefined stops configuration
- Global settings management
- Internationalization (i18n) support

### Technical
- React 19.1.0 with TypeScript
- Vite build system
- Zustand state management
- Express.js proxy server
- Material-UI component library
- ESLint configuration
- Docker and Docker Compose setup
- GitHub Actions CI/CD workflows

---

## Release Notes Template

When creating a new release, copy the following template and fill in the details:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes
```

## Categories Explanation

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes
- **Technical** for internal/development changes (optional)