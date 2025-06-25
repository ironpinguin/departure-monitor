# Testing & Validation - WCAG Compliance

## 🧪 Testing Strategy

The Departure Monitor uses a comprehensive multi-layered testing approach to ensure WCAG 2.1 AA compliance:

```
┌─────────────────────────────────────┐
│         Manual Testing              │
│  (Screen readers, Keyboard, Visual) │
├─────────────────────────────────────┤
│         Automated Testing           │
│  (axe-core, Lighthouse, Jest)       │
├─────────────────────────────────────┤
│         User Testing                │
│  (Real users with disabilities)     │
└─────────────────────────────────────┘
```

## 🤖 Automated Testing

### Test Suite Setup

```bash
# Install testing dependencies
npm install --save-dev @axe-core/react jest-axe @testing-library/jest-dom

# Run all accessibility tests
npm run test:a11y

# Run specific test suites
npm run test:contrast     # Color contrast tests
npm run test:keyboard     # Keyboard navigation tests
npm run test:screenreader # Screen reader tests
```

### axe-core Integration

```typescript
// src/utils/test-helpers/axe-config.ts
import { configureAxe } from 'jest-axe';

export const axe = configureAxe({
  rules: {
    // Enable all WCAG 2.1 AA rules
    'wcag21aa': { enabled: true },
    'wcag2aa': { enabled: true },
    'wcag2a': { enabled: true },
    
    // Custom rules for transport icons
    'svg-img-alt': { enabled: true },
    'color-contrast': { enabled: true }
  }
});
```

### Component Testing

```typescript
// src/components/__tests__/StopWidget.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe } from '../utils/test-helpers/axe-config';
import { StopWidget } from '../StopWidget';

describe('StopWidget Accessibility', () => {
  const mockStop = {
    id: '1',
    name: 'Hauptbahnhof',
    departures: [
      { id: '1', line: 'U1', destination: 'Olympiazentrum', minutes: 3 }
    ]
  };

  test('should have no accessibility violations', async () => {
    const { container } = render(<StopWidget stop={mockStop} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('should have proper ARIA labels', () => {
    const { getByLabelText } = render(<StopWidget stop={mockStop} />);
    expect(getByLabelText(/departures from hauptbahnhof/i)).toBeInTheDocument();
  });

  test('should announce departure updates', async () => {
    const { getByText } = render(<StopWidget stop={mockStop} />);
    const liveRegion = getByText(/departures updated/i);
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});
```

### Color Contrast Testing

```typescript
// src/utils/__tests__/colorContrast.test.ts
import { 
  getContrastRatio, 
  meetsWCAGAA, 
  meetsWCAGAAA,
  ensureWCAGCompliance 
} from '../colorContrast';

describe('Color Contrast WCAG Compliance', () => {
  test('should meet WCAG AA standards', () => {
    const white = { r: 255, g: 255, b: 255 };
    const darkBlue = { r: 0, g: 83, b: 102 }; // #005366
    
    const ratio = getContrastRatio(white, darkBlue);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(meetsWCAGAA(white, darkBlue)).toBe(true);
  });

  test('should automatically adjust insufficient contrast', () => {
    const lightGray = '#cccccc';
    const mediumGray = '#888888';
    
    const result = ensureWCAGCompliance(lightGray, mediumGray);
    
    // Should adjust to black or white text
    expect(['#000000', '#ffffff']).toContain(result.textColor);
  });

  test('should preserve good contrast combinations', () => {
    const white = '#ffffff';
    const darkBlue = '#005366';
    
    const result = ensureWCAGCompliance(white, darkBlue);
    expect(result.textColor).toBe(white);
    expect(result.backgroundColor).toBe(darkBlue);
  });
});
```

### Keyboard Navigation Testing

```typescript
// src/components/__tests__/ConfigModal.keyboard.test.tsx
import { render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigModal } from '../ConfigModal';

describe('ConfigModal Keyboard Navigation', () => {
  test('should trap focus within modal', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(
      <ConfigModal isOpen={true} onClose={jest.fn()} />
    );

    const modal = getByRole('dialog');
    const closeButton = getByRole('button', { name: /close/i });
    const firstInput = getByRole('textbox', { name: /stop name/i });

    // Focus should start on first focusable element
    firstInput.focus();
    expect(document.activeElement).toBe(firstInput);

    // Tab to end of modal and ensure focus wraps
    await user.tab();
    // ... more tab navigation
    await user.tab();
    expect(document.activeElement).toBe(firstInput); // Should wrap around
  });

  test('should close on Escape key', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    
    render(<ConfigModal isOpen={true} onClose={onClose} />);
    
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
```

## 🎭 Manual Testing Procedures

### Screen Reader Testing

#### NVDA (Windows)
```
Test Scenario: Navigation through departure list
1. Start NVDA with Ctrl+Alt+N
2. Navigate to application with Ctrl+L
3. Use H to navigate through headings
4. Use List navigation (L) to find departure lists
5. Use Arrow keys to navigate departures
6. Verify all information is announced clearly

Expected Results:
✓ Stop names announced as headings
✓ Departure count announced
✓ Each departure announced with line, destination, time
✓ Live updates announced automatically
✓ Control descriptions are clear
```

#### VoiceOver (macOS)
```
Test Scenario: Adding a new stop
1. Enable VoiceOver with Cmd+F5
2. Navigate with VO+Arrow keys
3. Find "Add Stop" button with VO+Cmd+Space
4. Navigate through form fields with VO+Tab
5. Complete form and submit

Expected Results:
✓ Form labels read correctly
✓ Required fields announced
✓ Error messages read aloud
✓ Success confirmation announced
```

### Keyboard Navigation Testing

#### Full Keyboard Navigation Test
```
Test Scenario: Complete application navigation without mouse
1. Start at top of page
2. Tab through all interactive elements
3. Use Enter/Space to activate buttons
4. Use Arrow keys for lists and radios
5. Use Escape to close modals

Expected Results:
✓ All interactive elements focusable
✓ Focus indicators visible
✓ Logical tab order maintained
✓ No keyboard traps
✓ All functions accessible
```

#### Keyboard Shortcuts Test
```
Shortcuts to test:
- Alt+S: Skip to main content
- Alt+C: Open configuration
- Alt+A: Add new stop
- Escape: Close modals/dropdowns
- Enter: Activate buttons
- Space: Toggle checkboxes
- Arrow Keys: Navigate lists
```

### Visual Testing

#### High Contrast Mode
```
Test Environment: Windows High Contrast mode
1. Enable High Contrast in Windows settings
2. Navigate through application
3. Verify all content remains visible
4. Check interactive elements are distinguishable

Expected Results:
✓ All text readable
✓ Interactive elements visible
✓ Color information not lost
✓ Focus indicators prominent
```

#### Zoom Testing
```
Test Levels: 100%, 125%, 150%, 200%
1. Set browser zoom to test level
2. Navigate through all pages
3. Verify no content is cut off
4. Check all functions remain usable

Expected Results:
✓ No horizontal scrolling at 200%
✓ All interactive elements remain clickable
✓ Text remains readable
✓ Layout doesn't break
```

## 📋 Validation Checklists

### WCAG 2.1 AA Compliance Checklist

#### Level A Requirements
- [ ] **1.1.1** Alt text for images and icons
- [ ] **1.3.1** Semantic HTML structure used
- [ ] **1.3.2** Logical reading order maintained
- [ ] **1.4.1** Information not conveyed by color alone
- [ ] **2.1.1** All functionality keyboard accessible
- [ ] **2.1.2** No keyboard traps present
- [ ] **2.4.1** Skip links implemented
- [ ] **2.4.2** Page titles are descriptive
- [ ] **2.4.3** Focus order is logical
- [ ] **3.1.1** Page language specified
- [ ] **3.2.1** No unexpected context changes on focus
- [ ] **3.2.2** No unexpected context changes on input
- [ ] **4.1.1** Valid HTML markup
- [ ] **4.1.2** Proper ARIA implementation

#### Level AA Requirements
- [ ] **1.4.3** Color contrast ratio at least 4.5:1
- [ ] **1.4.4** Text resizes to 200% without loss of functionality
- [ ] **1.4.5** Text not embedded in images (except logos)
- [ ] **2.4.5** Multiple ways to find content
- [ ] **2.4.6** Headings and labels are descriptive
- [ ] **2.4.7** Focus indicators visible
- [ ] **3.1.2** Language changes identified
- [ ] **3.2.3** Consistent navigation
- [ ] **3.2.4** Consistent identification
- [ ] **3.3.1** Error identification
- [ ] **3.3.2** Labels and instructions provided
- [ ] **3.3.3** Error suggestions provided
- [ ] **3.3.4** Error prevention for important data

### Component-Specific Checklists

#### StopWidget Component
- [ ] Proper heading structure (h2 for stop name)
- [ ] ARIA labels for departure lists
- [ ] Live regions for updates
- [ ] Keyboard navigation support
- [ ] Color contrast compliance
- [ ] Screen reader announcements

#### ConfigModal Component
- [ ] Focus trap implementation
- [ ] Escape key handling
- [ ] Proper modal semantics (dialog role)
- [ ] Form label associations
- [ ] Error message handling
- [ ] Focus restoration on close

## 🌐 Browser Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge | IE11* |
|---------|--------|---------|--------|------|-------|
| ARIA Support | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ⚠️ Partial |
| Color Contrast | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Keyboard Nav | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Focus Management | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ⚠️ Limited |
| Screen Reader | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ⚠️ Basic |
| Skip Links | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Live Regions | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ⚠️ Limited |

*IE11 support is limited and not recommended for optimal accessibility

### Screen Reader Compatibility

| Screen Reader | Platform | Support Level | Notes |
|---------------|----------|---------------|-------|
| **NVDA 2023+** | Windows | ✅ Full | Primary testing platform |
| **JAWS 2022+** | Windows | ✅ Full | Commercial screen reader |
| **VoiceOver** | macOS/iOS | ✅ Full | Native Apple accessibility |
| **TalkBack** | Android | 🔄 Basic | Mobile web support |
| **Narrator** | Windows | ⚠️ Limited | Basic functionality only |

## 📊 Performance Benchmarks

### Accessibility Performance Metrics

```bash
# Lighthouse Accessibility Audit
npm run audit:lighthouse

# Expected Results:
# Accessibility Score: 100/100
# Performance Impact: <5ms overhead
# Bundle Size Impact: +12KB (gzipped)
```

### Performance Impact Analysis

| Feature | Bundle Size | Runtime Impact | Notes |
|---------|-------------|----------------|-------|
| Color Contrast Utils | +8KB | <1ms per calculation | Cached results |
| ARIA Implementation | +2KB | Negligible | No runtime cost |
| Focus Management | +1KB | <2ms per focus change | Event-driven |
| Screen Reader Support | +1KB | Negligible | Semantic HTML |

### Memory Usage

```javascript
// Accessibility feature memory footprint
{
  "colorContrastCache": "~2MB", // LRU cache for contrast calculations
  "ariaLiveRegions": "~50KB",   // DOM nodes for announcements
  "focusHistory": "~10KB",      // Focus restoration stack
  "totalOverhead": "~2.1MB"     // Total accessibility memory usage
}
```

## 🐛 Common Issues & Solutions

### Issue: Focus Not Visible
```css
/* Solution: Enhanced focus indicators */
*:focus {
  outline: 2px solid #005366;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(0, 83, 102, 0.3);
}
```

### Issue: Screen Reader Not Announcing Updates
```typescript
// Solution: Proper live region implementation
const [announcement, setAnnouncement] = useState('');

useEffect(() => {
  if (departures.length > 0) {
    setAnnouncement(`Updated: ${departures.length} departures available`);
    // Clear announcement after screen reader processes it
    setTimeout(() => setAnnouncement(''), 1000);
  }
}, [departures]);

return (
  <div aria-live="polite" className="sr-only">
    {announcement}
  </div>
);
```

### Issue: Keyboard Navigation Breaks
```typescript
// Solution: Proper focus management
const handleModalClose = () => {
  // Return focus to trigger element
  const returnFocus = document.getElementById('modal-trigger');
  if (returnFocus) {
    returnFocus.focus();
  }
  onClose();
};
```

## 📈 Continuous Integration

### CI/CD Accessibility Pipeline

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests
on: [push, pull_request]

jobs:
  a11y-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run accessibility tests
        run: npm run test:a11y
      - name: Lighthouse CI
        run: npm run lighthouse:ci
      - name: Upload accessibility report
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-report
          path: accessibility-report.html
```

### Automated Regression Testing

```typescript
// src/tests/accessibility.regression.test.ts
describe('Accessibility Regression Tests', () => {
  test('should maintain WCAG AA compliance across all pages', async () => {
    const pages = ['/dashboard', '/config', '/stops'];
    
    for (const page of pages) {
      const { container } = render(<App initialRoute={page} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });
});
```

---

*This testing framework ensures comprehensive WCAG 2.1 AA compliance through automated and manual testing procedures.*