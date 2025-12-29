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

## [3.0.0] - 2025-12-29

### Added
- **Import/Export Functionality** - Complete configuration backup and restore system
  - Export current configuration to JSON files with full data integrity
  - Import configurations with conflict resolution and merge strategies
  - Progressive disclosure UI with card-based dialog components
  - Real-time validation and preview of import changes
  - Performance-optimized with Web Worker processing
  - Comprehensive error handling and structured logging
  - Memory pressure detection with adaptive monitoring
  - Rate limiting and security checks against XSS attacks
  - Progress tracking with time estimates and validation feedback
  - Material-UI tabs for modern step navigation
  - Full internationalization support (German/English)
  - Extensive test coverage with 21 memory management tests
- **Mobile-First Responsive Design** - Touch-optimized interface for all screen sizes
  - Mobile-specific departure card component with touch-friendly targets
  - Responsive layout switching for stop widgets
  - Custom media query hooks for breakpoint detection
  - Multi-row header layout for mobile devices (< 600px)
  - Single-row layout for tablet/desktop (≥ 600px)
  - Responsive font sizes and spacing optimizations
  - Integrated delay information in departure displays
  - Support for viewports from 320px upwards
- **Structured Logging System** - Context-aware application monitoring
  - Logger instances for different modules (api, components, import/export)
  - Timestamped and structured log output for debugging
  - Memory usage monitoring and performance metrics
  - Eliminated all direct console.* calls for consistent logging
- **Enhanced Developer Experience**
  - Comprehensive CLAUDE.md documentation with project overview
  - Python validation scripts for translation consistency
  - Vitest testing infrastructure with coverage reporting
  - Extensive documentation for import/export system
  - Memory management improvement documentation

### Changed
- **Import/Export UI/UX Improvements**
  - Replace step indicator list with Material-UI Tabs component
  - Add icons for better visual recognition (Preview, Settings, CheckCircle)
  - Remove redundant UI elements for cleaner appearance
  - Implement card-based progressive disclosure pattern
  - Add collapsible sections with grouped checkboxes
  - Enhanced progress indicator with elapsed/remaining time
- **Mobile Header Layout**
  - Reorganized controls for better mobile usability
  - Auto-refresh status text hidden on small screens
  - Centered app title in dedicated row on mobile
  - Improved element spacing to prevent overlapping
- **Translation Updates**
  - Added 360+ translation keys for import/export functionality
  - Updated live departure data terminology
  - Fixed duplicate translation keys in dialog components
  - 100% synchronization between German and English translations
- **Dependency Updates**
  - Updated Vite from 6.3.5 to 6.4.1

### Improved
- Type safety with branded types and discriminated unions
- Null/undefined validation with defensive programming patterns
- Async/await patterns with Promise.all() for parallel operations
- Resource management with proper cleanup and timeout handling
- DOM manipulation efficiency through React.memo and useMemo
- Accessibility with ARIA labels and keyboard navigation
- BOM handling in JSON parsing for better file compatibility

### Technical
- Migrated from direct console calls to structured logging system
- Implemented Web Worker for performance-optimized operations
- Added comprehensive test suites (memory, concurrency, performance)
- Enhanced Docker build with full Node image for corepack support
- Added MCP server configuration updates (context7 integration)
- Removed unused conventional-commits mode from .roomodes
- Extensive code refactoring for maintainability and performance

### Breaking Changes
- **Import/Export Feature**: This is a new major feature that introduces configuration export/import capabilities. While backwards compatible with existing configurations, the new functionality represents a significant architectural enhancement that warrants a major version bump.
- **Mobile-First Design**: Layout and responsive behavior has been completely redesigned. Custom styling that relied on previous component structure may need adjustments.

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