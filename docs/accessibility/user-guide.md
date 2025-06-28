# User Guide - Accessibility Features

## 🎯 Welcome to the Accessible Departure Monitor

The Departure Monitor is designed to be fully accessible to all users, regardless of their abilities or the assistive technologies they use. This guide will help you make the most of the accessibility features available.

## 🎧 For Screen Reader Users

### Getting Started

The Departure Monitor works seamlessly with all major screen readers:
- **NVDA** (Windows) - Fully supported
- **JAWS** (Windows) - Fully supported  
- **VoiceOver** (macOS/iOS) - Fully supported
- **TalkBack** (Android) - Basic support

### Navigation Structure

The application uses a clear heading structure for easy navigation:

```
├── H1: Departure Monitor (Main title)
├── H2: Quick Actions (Configuration, Add Stop)
├── H2: Your Stops (Stop list section)
│   ├── H3: [Stop Name] (Individual stops)
│   └── H3: [Stop Name] (Individual stops)
└── H2: Settings (Configuration options)
```

### Screen Reader Commands

#### NVDA Users
- **H / Shift+H**: Navigate between headings
- **L / Shift+L**: Jump between lists (departure lists)
- **B / Shift+B**: Navigate buttons
- **F / Shift+F**: Navigate form fields
- **R / Shift+R**: Navigate regions/landmarks

#### JAWS Users
- **H / Shift+H**: Navigate headings
- **L / Shift+L**: Navigate lists
- **B / Shift+B**: Navigate buttons
- **F / Shift+F**: Navigate forms
- **Insert+F6**: Navigate frames/regions

#### VoiceOver Users
- **VO+Cmd+H**: Navigate headings
- **VO+Cmd+L**: Navigate lists
- **VO+Cmd+B**: Navigate buttons
- **VO+Cmd+J**: Navigate form controls

### Live Updates

The application automatically announces important changes:
- **Departure updates**: "Departures updated at [time]"
- **New stops added**: "[Stop name] added successfully"
- **Errors**: Clear error messages with guidance
- **Status changes**: Connection status and data refresh notifications

### Example Announcements

```
"Hauptbahnhof, heading level 3"
"List with 5 items"
"U1 to Olympiazentrum, departing in 3 minutes, list item 1 of 5"
"S1 to Airport, departing in 7 minutes, list item 2 of 5"
"Live region: Departures updated at 10:30 AM"
```

## ⌨️ Keyboard Navigation

### Basic Navigation

All features are accessible using only the keyboard:

| Key | Action |
|-----|--------|
| **Tab** | Move to next interactive element |
| **Shift+Tab** | Move to previous interactive element |
| **Enter** | Activate buttons and links |
| **Space** | Activate buttons, toggle checkboxes |
| **Escape** | Close modals and dropdowns |
| **Arrow Keys** | Navigate within lists and menus |

### Quick Access Shortcuts

| Shortcut | Action |
|----------|--------|
| **Alt+S** | Skip to main content |
| **Alt+C** | Open configuration modal |
| **Alt+A** | Add new stop |
| **Alt+R** | Refresh all departures |

### Modal Navigation

When a modal (like the configuration dialog) opens:

1. **Focus automatically moves** to the first interactive element
2. **Tab navigation is trapped** within the modal
3. **Escape key closes** the modal
4. **Focus returns** to the element that opened the modal

### Step-by-Step: Adding a New Stop

1. **Navigate to Add Stop button**: Press `Tab` until you reach "Add Stop" button
2. **Open modal**: Press `Enter` or `Space`
3. **Fill in stop details**:
   - Stop name: Type the name
   - `Tab` to next field
   - Select city: Use arrow keys or type
   - `Tab` to next field
4. **Save**: Press `Tab` to reach "Save" button, then `Enter`
5. **Modal closes**: Focus returns to "Add Stop" button

## 🎨 Visual Accessibility

### High Contrast Support

The application automatically:
- **Detects system high contrast mode**
- **Adjusts colors accordingly**
- **Maintains readability** in all contrast modes
- **Preserves color meaning** through icons and text

### Color Contrast

All text meets WCAG AA standards:
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Enhanced contrast for better visibility

### Zoom and Magnification

The application supports:
- **Browser zoom up to 200%** without loss of functionality
- **No horizontal scrolling** at high zoom levels
- **Responsive design** that adapts to different screen sizes
- **Large touch targets** for mobile devices (minimum 44px)

### Focus Indicators

All interactive elements have clear focus indicators:
- **Blue outline** around focused elements
- **Enhanced visibility** in high contrast mode
- **Consistent styling** throughout the application

## 📱 Mobile Accessibility

### Touch Navigation

- **Large touch targets**: All buttons and links are at least 44px
- **Gesture support**: Standard swipe and tap gestures
- **Screen reader gestures**: Full support for VoiceOver and TalkBack

### Mobile Screen Readers

#### iOS VoiceOver
- **Rotor control**: Navigate by headings, links, buttons
- **Swipe gestures**: Left/right to navigate, double-tap to activate
- **Three-finger scroll**: Navigate long lists efficiently

#### Android TalkBack
- **Explore by touch**: Touch anywhere to hear content
- **Swipe navigation**: Left/right to move between elements
- **Double-tap**: Activate focused element

## 🌐 Language Support

### Available Languages

- **German (Deutsch)**: Full localization
- **English**: Full localization

### Changing Language

1. **Open Configuration**: Press `Alt+C` or navigate to settings
2. **Find Language Setting**: Tab to language dropdown
3. **Select Language**: Use arrow keys or type first letter
4. **Apply Changes**: Tab to save button and press Enter

### Localized Features

- **Interface elements**: All buttons, labels, and messages
- **Error messages**: Clear, actionable error descriptions
- **Announcements**: Screen reader announcements in selected language
- **Date/time formats**: Localized formatting

## ⚠️ Troubleshooting

### Screen Reader Issues

#### Screen Reader Not Announcing Updates
**Problem**: Live updates not being announced
**Solution**: 
1. Ensure screen reader is running
2. Check volume and speech settings
3. Try refreshing the page

#### Navigation Seems Broken
**Problem**: Can't navigate properly with heading keys
**Solution**:
1. Ensure you're in browse/virtual mode
2. Try different navigation commands (H, L, B, F)
3. Use Tab key as fallback navigation

### Keyboard Issues

#### Can't Access All Features
**Problem**: Some buttons or controls not reachable
**Solution**:
1. Try using Tab key to navigate systematically
2. Check if you're trapped in a modal (press Escape)
3. Use skip links (Alt+S) to jump to main content

#### Focus Disappeared
**Problem**: Lost track of keyboard focus
**Solution**:
1. Click anywhere on the page to restore focus
2. Use Tab key to start navigating again
3. Refresh the page if needed

### Visual Issues

#### Text Too Small
**Solution**:
1. Use browser zoom (Ctrl++ or Cmd++)
2. Adjust system text size settings
3. Enable high contrast mode if needed

#### Poor Contrast
**Solution**:
1. Enable high contrast mode in system settings
2. Adjust monitor brightness and contrast
3. Try different browser themes

### Mobile Issues

#### Touch Targets Too Small
**Solution**:
1. Use pinch-to-zoom gesture
2. Enable accessibility options in device settings
3. Try landscape orientation

## 🔧 Customization Options

### Browser Settings

#### Chrome/Edge
1. **Settings → Advanced → Accessibility**
2. Enable "Navigate pages with a text cursor"
3. Adjust font size and zoom settings

#### Firefox
1. **Settings → General → Fonts & Colors**
2. Override website colors if needed
3. Set minimum font size

#### Safari
1. **Preferences → Websites → Page Zoom**
2. Set per-site zoom levels
3. Enable "Press Tab to highlight each item on a webpage"

### Operating System Settings

#### Windows
- **Settings → Ease of Access**
- Enable High Contrast mode
- Adjust text size and cursor settings
- Configure Narrator if needed

#### macOS
- **System Preferences → Accessibility**
- Enable VoiceOver
- Adjust display contrast and cursor size
- Configure keyboard navigation

#### Mobile Settings
- **iOS**: Settings → Accessibility
- **Android**: Settings → Accessibility

## 📞 Getting Help

### Common Questions

**Q: The departure times aren't being announced automatically**
A: Live updates should be announced every 30 seconds. If not working, try refreshing the page or check your screen reader's verbosity settings.

**Q: I can't find the configuration button**
A: Use the keyboard shortcut `Alt+C` or navigate with heading keys (H) to find the "Configuration" section.

**Q: The app works differently on mobile**
A: Mobile versions use touch-optimized navigation. Enable your device's screen reader for full accessibility.

**Q: Can I use this app with my switch device?**
A: Yes, the app works with switch navigation through the keyboard interface. Configure your switch to send Tab and Enter key commands.

### Reporting Issues

If you encounter accessibility problems:

1. **Note your setup**: Screen reader, browser, operating system
2. **Describe the issue**: What you expected vs. what happened
3. **Steps to reproduce**: How to recreate the problem
4. **Contact information**: [Report issues through GitHub or support channels]

### Resources

- **WebAIM Screen Reader Survey**: Latest compatibility information
- **NVDA User Guide**: https://www.nvaccess.org/documentation/
- **VoiceOver User Guide**: Apple's official documentation
- **JAWS User Guide**: Freedom Scientific documentation

---

*This guide is updated regularly to reflect the latest accessibility features and best practices. Last updated: December 2024*