# Technical Implementation - WCAG Compliance

## 🏗️ Architecture Overview

The accessibility features of the Departure Monitor are implemented in multiple layers:

```
┌─────────────────────────────────────┐
│        Presentation Layer           │
│  (ARIA, Semantic HTML, Focus)       │
├─────────────────────────────────────┤
│         Logic Layer                 │
│  (Color Contrast, i18n, Utils)      │
├─────────────────────────────────────┤
│         Data Layer                  │
│  (API Responses, State Management)  │
└─────────────────────────────────────┘
```

## 🎨 Color Contrast Implementation

### Core Utility: [`colorContrast.ts`](../src/utils/colorContrast.ts)

The color contrast system ensures WCAG 2.1 AA compliance with automatic contrast adjustment:

```typescript
// Automatic WCAG compliance enforcement
export function ensureWCAGCompliance(
  textColor: string | undefined,
  backgroundColor: string | undefined
): { textColor: string; backgroundColor: string } {
  const bgRgb = parseColorToRgb(backgroundColor);
  const textRgb = parseColorToRgb(textColor);
  
  if (textRgb && meetsWCAGAA(textRgb, bgRgb)) {
    return { textColor, backgroundColor };
  }
  
  // Automatically determine optimal text color
  const optimalTextRgb = getOptimalTextColor(bgRgb);
  return {
    backgroundColor: backgroundColor || '#005366',
    textColor: rgbToHex(optimalTextRgb)
  };
}
```

### Key Functions

| Function | Purpose | WCAG Criterion |
|----------|---------|----------------|
| [`getContrastRatio()`](../src/utils/colorContrast.ts:158) | Calculates contrast ratio between two colors | 1.4.3, 1.4.6 |
| [`meetsWCAGAA()`](../src/utils/colorContrast.ts:171) | Validates 4.5:1 minimum contrast | 1.4.3 |
| [`meetsWCAGAAA()`](../src/utils/colorContrast.ts:178) | Validates 7:1 enhanced contrast | 1.4.6 |
| [`getOptimalTextColor()`](../src/utils/colorContrast.ts:185) | Determines black or white text | 1.4.3 |

### Color Parsing Support

The system supports multiple color formats:

```typescript
// Supported formats
const colors = [
  '#ff0000',           // HEX
  'rgb(255, 0, 0)',    // RGB
  'rgba(255, 0, 0, 1)', // RGBA
  'hsl(0, 100%, 50%)',  // HSL
  'red'                 // Named colors
];
```

## 🔍 Focus Management

### Focus Trap Implementation

Modal dialogs implement proper focus management:

```typescript
// Focus trap in ConfigModal component
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    onClose();
  }
  
  if (e.key === 'Tab') {
    // Trap focus within modal
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements) {
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }
};
```

### Skip Links

Skip links are implemented for keyboard navigation:

```typescript
// Skip to main content
<a 
  href="#main-content" 
  className="skip-link"
  onFocus={(e) => e.target.scrollIntoView()}
>
  Skip to main content
</a>
```

## 🎭 ARIA Implementation

### Live Regions for Dynamic Content

Departure updates are announced to screen readers:

```typescript
// Live region for departure announcements
<div 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
>
  {lastUpdate && `Departures updated at ${formatTime(lastUpdate)}`}
</div>
```

### Semantic Markup

Each component uses proper ARIA attributes:

```typescript
// StopWidget with comprehensive ARIA
<article 
  className="stop-widget"
  aria-labelledby={`stop-${stop.id}-title`}
  aria-describedby={`stop-${stop.id}-status`}
>
  <h2 id={`stop-${stop.id}-title`}>
    {stop.name}
  </h2>
  
  <div 
    id={`stop-${stop.id}-status`}
    aria-live="polite"
  >
    {departures.length} departures available
  </div>
  
  <ul 
    role="list"
    aria-label={`Departures from ${stop.name}`}
  >
    {departures.map(departure => (
      <li 
        key={departure.id}
        role="listitem"
        aria-label={`${departure.line} to ${departure.destination} in ${departure.minutes} minutes`}
      >
        {/* Departure content */}
      </li>
    ))}
  </ul>
</article>
```

## 🌐 Internationalization

### i18n Implementation

The application supports multiple languages with proper accessibility:

```typescript
// Language-aware ARIA labels
const t = useTranslation();

<button 
  aria-label={t('buttons.addStop')}
  onClick={handleAddStop}
>
  <PlusIcon aria-hidden="true" />
  {t('buttons.add')}
</button>
```

### RTL Support

CSS is prepared for right-to-left languages:

```css
/* RTL-aware styles */
.departure-item {
  margin-inline-start: 1rem;
  padding-inline-end: 0.5rem;
  text-align: start;
}

[dir="rtl"] .departure-item {
  /* RTL-specific overrides */
}
```

## 📱 Responsive Accessibility

### Viewport and Zoom

The application supports 200% zoom without horizontal scrolling:

```css
/* Responsive design with accessibility */
@media (max-width: 768px) {
  .stop-widget {
    font-size: 1.125rem; /* 18px minimum for mobile */
    line-height: 1.5;
    touch-action: manipulation;
  }
}

/* High DPI support */
@media (-webkit-min-device-pixel-ratio: 2) {
  .icon {
    image-rendering: -webkit-optimize-contrast;
  }
}
```

### Touch Targets

Interactive elements meet minimum touch target sizes:

```css
/* Minimum 44px touch targets */
.button, .link, .control {
  min-height: 44px;
  min-width: 44px;
  padding: 0.5rem;
}
```

## 🔧 Utility Functions

### Type Styles with Accessibility

The [`typeToStyles.ts`](../src/utils/typeToStyles.ts) utility provides accessible color schemes:

```typescript
// Accessible color mapping
export function getAccessibleTypeStyles(
  type: TransportType,
  customColors?: { bg?: string; text?: string }
): TypeStyles {
  const baseStyles = getTypeStyles(type);
  
  // Ensure WCAG compliance
  const { textColor, backgroundColor } = ensureWCAGCompliance(
    customColors?.text || baseStyles.textColor,
    customColors?.bg || baseStyles.backgroundColor
  );
  
  return {
    ...baseStyles,
    textColor,
    backgroundColor
  };
}
```

### Contrast Analysis

Comprehensive contrast analysis for debugging:

```typescript
// Detailed contrast analysis
const contrastResult = analyzeContrast('#ffffff', '#005366');
console.log({
  ratio: contrastResult.ratio,           // 8.2
  meetsAA: contrastResult.meetsAA,       // true
  meetsAAA: contrastResult.meetsAAA,     // true
  recommendedColor: contrastResult.recommendedTextColor
});
```

## 🎯 Component-Specific Implementation

### ConfigModal

The configuration modal implements comprehensive accessibility:

```typescript
// Modal accessibility features
<dialog
  ref={modalRef}
  className="config-modal"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  onKeyDown={handleKeyDown}
>
  <header>
    <h1 id="modal-title">{t('config.title')}</h1>
    <button
      onClick={onClose}
      aria-label={t('buttons.close')}
      className="close-button"
    >
      <CloseIcon aria-hidden="true" />
    </button>
  </header>
  
  <main id="modal-description">
    {/* Modal content with proper focus management */}
  </main>
</dialog>
```

### Dashboard

The main dashboard uses semantic HTML structure:

```typescript
// Semantic dashboard structure
<main id="main-content">
  <header>
    <h1>{t('app.title')}</h1>
    <nav aria-label={t('navigation.main')}>
      {/* Navigation items */}
    </nav>
  </header>
  
  <section aria-labelledby="stops-heading">
    <h2 id="stops-heading">{t('stops.title')}</h2>
    {stops.map(stop => (
      <StopWidget key={stop.id} stop={stop} />
    ))}
  </section>
</main>
```

## 🔄 State Management Accessibility

### Accessible State Updates

State changes are communicated to assistive technologies:

```typescript
// Accessible state management
const [announceMessage, setAnnounceMessage] = useState('');

const updateDepartures = useCallback(async () => {
  try {
    const newDepartures = await fetchDepartures();
    setDepartures(newDepartures);
    setAnnounceMessage(
      t('announcements.departuresUpdated', { 
        count: newDepartures.length 
      })
    );
  } catch (error) {
    setAnnounceMessage(t('announcements.updateError'));
  }
}, []);

// Announcement component
<div aria-live="polite" className="sr-only">
  {announceMessage}
</div>
```

## 🎨 SVG Accessibility

### Accessible Icons

All SVG icons include proper accessibility attributes:

```typescript
// Accessible SVG implementation
<svg
  className="transport-icon"
  aria-hidden={decorative}
  role={decorative ? 'presentation' : 'img'}
  aria-label={!decorative ? iconLabel : undefined}
  focusable="false"
>
  {decorative && <title>{iconLabel}</title>}
  {/* SVG content */}
</svg>
```

## 📊 Performance Considerations

### Accessibility Performance

The accessibility features are optimized for performance:

```typescript
// Memoized accessibility calculations
const accessibleStyles = useMemo(() => {
  return ensureWCAGCompliance(textColor, backgroundColor);
}, [textColor, backgroundColor]);

// Debounced announcements
const debouncedAnnounce = useMemo(
  () => debounce((message: string) => {
    setAnnounceMessage(message);
  }, 500),
  []
);
```

---

*This implementation ensures full WCAG 2.1 AA compliance while maintaining optimal performance and user experience.*