# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Departure Monitor is a modern web application displaying real-time departure information for public transportation in German cities. It currently supports Munich (MVV) and Würzburg transit systems with comprehensive accessibility features and internationalization.

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite 6 + Material-UI 7
- **State Management**: Zustand with localStorage persistence
- **Package Manager**: pnpm (required - do not use npm)
- **Internationalization**: i18next (German/English)
- **Build**: Vite with TypeScript project references
- **Deployment**: Docker + Nginx

## Essential Development Commands

```bash
# Development
pnpm dev                # Start dev server on localhost:5173
pnpm build             # Production build
pnpm preview           # Preview production build
pnpm lint              # Run ESLint

# Release
pnpm build:archives    # Build and create ZIP/TAR.GZ archives
pnpm release           # Full release process with archives
```

## Architecture Overview

### State Management
- **Zustand store** (`src/store/`) manages global state with localStorage persistence
- **Configuration system** for predefined stops and user settings
- **Theme state** for dark/light mode switching

### API Integration
- **Munich MVV API** (`src/api/munich.ts`) - Direct API calls
- **Würzburg EFA API** (`src/api/wuerzburg.ts`) - Proxied through `/wuerzburg-api`
- **Vite proxy configuration** for development API calls

### Component Structure
- **Material-UI components** with custom themes
- **Accessibility-first design** with ARIA labels and screen reader support
- **Internationalized text** via i18next hooks
- **Transport-specific styling** with official color schemes

### Data Flow
1. User selects stops from predefined configurations
2. API calls fetch real-time departure data
3. Zustand store manages state and persistence
4. Components render with accessibility features
5. i18n provides localized text

## Key Configuration Files

- **vite.config.ts** - Proxy setup for Würzburg API (`/wuerzburg-api`)
- **tsconfig.json** - Project references for build optimization
- **eslint.config.js** - Modern flat config with React/TypeScript rules
- **docker-compose.yml** - Production deployment with Nginx

## Important Development Notes

### Package Management
- Always use `pnpm` - lockfile and scripts are configured for pnpm
- Dependencies include React 19 features and MUI 7 components

### API Proxy
- Development server proxies Würzburg API to avoid CORS
- Production uses Nginx reverse proxy configuration

### Accessibility Requirements
- All interactive elements must have proper ARIA labels
- Use live regions for dynamic content updates
- Follow existing patterns in `src/components/` for screen reader support
- Extensive accessibility documentation in `docs/accessibility/`

### Internationalization
- Add new translations to both `src/i18n/locales/de.json` and `src/i18n/locales/en.json`
- Use i18next hooks in components: `useTranslation()`
- Keys should be descriptive and nested appropriately

### State Management
- Use Zustand store for global state (`src/store/`)
- Configuration persists automatically via localStorage
- Follow existing patterns for state updates and subscriptions

### Build Process
- TypeScript compilation with strict settings
- Vite builds ES modules for modern browsers
- Static files output to `dist/` directory
- Multi-stage Docker builds for production

## Testing and Quality

Run linting before commits:
```bash
pnpm lint
```

The project uses strict TypeScript settings and ESLint rules. Follow existing code patterns for consistency.

## Transport System Integration

- **Munich MVV**: Direct API integration with official color schemes
- **Würzburg**: EFA API via proxy with custom parsing
- **Extensible design**: New cities can be added by implementing the transport interface

## Deployment

- **Development**: Vite dev server with API proxy
- **Production**: Docker container with Nginx serving static files
- **Release**: Automated archive creation for distribution