# Contributing to Departure Monitor

Thank you for your interest in contributing to Departure Monitor! 🚌🚊 This project thrives on community contributions, and we welcome all kinds of contributions, whether it's code, documentation, bug reports, or translations.

## Types of Contributions

We welcome various types of contributions:

### 🐛 Bug Reports
- Report bugs or unexpected behavior
- Use the Bug Report template
- Include screenshots and detailed reproduction steps

### ✨ Feature Requests
- Suggest new features
- Describe the use case and expected benefits
- Discuss your idea in an issue first

### 💻 Code Contributions
- Bug fixes
- New features
- Performance improvements
- Code refactoring

### 📚 Documentation
- README improvements
- API documentation
- Code comments
- Tutorials and guides

### 🌍 Translations
- Add new languages
- Improve existing translations
- Localization for new regions

## Getting Started

### 1. Fork the Repository
```bash
# Fork the repository on GitHub
# Clone your fork locally
git clone https://github.com/YOUR_USERNAME/departure-monitor.git
cd departure-monitor
```

### 2. Add Remote
```bash
# Add the original repository as upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/departure-monitor.git
```

## Development Environment Setup

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm** or **pnpm** (recommended)
- **Git**

### Installation
```bash
# Install dependencies (pnpm recommended)
pnpm install

# Or with npm
npm install
```

### Start Local Development
```bash
# Start development server
pnpm dev

# Or with npm
npm run dev
```

The application will be available at `http://localhost:5173`.

### Build
```bash
# Create production build
pnpm build

# Preview build
pnpm preview
```

## Code Guidelines

### TypeScript Standards
- Use strict TypeScript configuration
- Define explicit types for all public APIs
- Use interfaces for object structures
- Avoid `any` - use specific types instead

### ESLint and Formatting
```bash
# Check code quality
pnpm lint

# Auto-fix formatting
pnpm lint:fix
```

### Code Style Guidelines
- Use meaningful variable and function names
- Write self-documenting code
- Add JSDoc comments for complex functions
- Follow existing naming conventions

### File Structure
```
src/
├── api/           # API integrations for different cities
├── components/    # React components
├── config/        # Configuration files
├── i18n/          # Internationalization
├── models/        # TypeScript interfaces and types
├── store/         # State management
├── types/         # Global type definitions
└── utils/         # Utility functions
```

## Commit Messages

We use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code refactoring
- `test`: Adding or correcting tests
- `chore`: Build process or auxiliary tools

### Examples
```bash
feat(api): add Munich API integration
fix(widget): correct departure time display
docs(readme): update installation instructions
feat(i18n): add French translation
```

## Pull Request Process

### Branch Naming
- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation
- `refactor/description` - for refactoring

### Before Pull Request
1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**
   ```bash
   pnpm test
   pnpm lint
   ```

3. **Test build**
   ```bash
   pnpm build
   ```

### Creating Pull Request
1. Create a meaningful title
2. Describe changes in detail
3. Link relevant issues
4. Add screenshots (for UI changes)
5. Mark breaking changes

### Review Process
- At least one maintainer must review the PR
- All CI checks must pass
- Conflicts must be resolved
- Feedback is given constructively and respectfully

## Adding New Cities

### 1. Create API Integration
Create a new file in `src/api/cityname-api.ts`:

```typescript
import { DepartureData } from '../models';

export interface CitynameApiResponse {
  // Define API-specific types
}

export const fetchDepartures = async (
  stopId: string
): Promise<DepartureData[]> => {
  // API implementation
};
```

### 2. Define Models
Add corresponding TypeScript interfaces in `src/models/`.

### 3. Extend Configuration
- Update `src/config/predefinedStops.json`
- Add city-specific styles in `src/config/typeToStyles.json`

### 4. Add Assets
Create a folder `src/assets/citycode/` for transport-specific icons.

### 5. Documentation
- Update README.md
- Add API examples in `docs/apis/`

## Translations

### Adding New Language
1. **Create language folder**
   ```bash
   mkdir src/i18n/locales/LANGUAGE_CODE
   ```

2. **Create translation file**
   ```bash
   cp src/i18n/locales/en/translation.json src/i18n/locales/LANGUAGE_CODE/translation.json
   ```

3. **Update i18n configuration**
   Add the new language in `src/i18n/i18n.ts`.

### Improving Existing Translations
- Edit the corresponding `translation.json` file
- Maintain consistency in terminology
- Test translations in the application

### Translation Keys
```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error"
  },
  "dashboard": {
    "title": "Departure Monitor"
  }
}
```

## Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Writing New Tests
- Unit tests for utility functions
- Component tests for React components
- Integration tests for API calls
- E2E tests for critical user flows

### Test Structure
```
src/
├── __tests__/
│   ├── components/
│   ├── utils/
│   └── api/
```

## Docker Development

### Local Development with Docker
```bash
# Start development container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop container
docker-compose down
```

### Testing Production Build
```bash
# Create production container
docker-compose -f docker-compose.prod.yml up --build
```

### Docker Commands
```bash
# Build image
docker build -t departure-monitor .

# Run container
docker run -p 3000:80 departure-monitor
```

## Reporting Issues

### Bug Report Template
When reporting a bug, please include the following information:

**Bug Description**
A clear and concise description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What should happen?

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 10, macOS 12.0, Ubuntu 20.04]
- Browser: [e.g. Chrome 96, Firefox 95, Safari 15]
- Version: [e.g. 1.2.3]

**Additional Context**
Any other information about the problem.

### Performance Issues
- Use browser developer tools
- Include performance profiling data
- Describe hardware specifications

## Contact and Community

### Getting Help
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions and discussions
- **Pull Request Reviews**: For code-specific questions

### Communication Guidelines
- Be respectful and constructive
- Use clear and precise language
- Help other community members
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)

### Contacting Maintainers
For urgent questions or security issues, you can contact maintainers directly.

## License

By contributing to this project, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

---

**Thank you for contributing to Departure Monitor! 🚀**

Every contribution, no matter how small, makes a difference and helps make public transportation more accessible for everyone.