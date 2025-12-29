# YouTube to Invidious Extension

A browser extension that adds a floating button to YouTube videos embedded in websites, allowing you to open them on Invidious with one click.

## Installation

### Chrome Web Store
Install from: [Chrome Web Store](https://chrome.google.com/webstore/detail/hinknbjekomiaomaicgpghmlnbbpenmk)

Extension ID: `hinknbjekomiaomaicgpghmlnbbpenmk`

### Firefox Add-ons
Coming soon to Firefox Add-ons

## Features

- **Auto-detection** - Automatically scans pages for YouTube iframes
- **Works on any website** with embedded YouTube videos
- **Floating button** on each detected video - slides down on hover
- **Instance health checking** - Verifies your preferred instance is available
- **Smart fallback** - Shows list of healthy instances if primary is down
- **Instance picker** - Modal dialog with uptime percentages and country flags
- **Configurable** - Choose and save your preferred Invidious instance
- **API integration** - Fetches healthy instances from api.invidious.io
- **Caching** - 15-minute cache to reduce API calls
- **Privacy-focused** - Minimal permissions (activeTab, scripting, storage)

## Development

### Prerequisites

- Node.js 18+
- pnpm 10.26.2+

### Installation

```bash
pnpm install
```

### Development Workflow

1. Make changes to source files in `src/`
2. Build the extension:
   ```bash
   pnpm build:chrome   # Creates dist-chrome/
   pnpm build:firefox  # Creates dist-firefox/
   ```
3. Load unpacked extension in browser:
   - **Chrome**: Navigate to `chrome://extensions/`, enable Developer mode, Load unpacked → select `dist-chrome/`
   - **Firefox**: Navigate to `about:debugging`, This Firefox → Load Temporary Add-on → select any file in `dist-firefox/`
4. After code changes, rebuild and reload extension manually

### Build for Production

Build for both Chrome and Firefox:
```bash
pnpm build
```

This creates:
- `dist-chrome/` - Chrome extension directory
- `dist-firefox/` - Firefox extension directory
- `extension-chrome.zip` - Ready for Chrome Web Store
- `extension-chrome.crx` - Signed CRX (if privatekey.pem exists)
- `extension-firefox.zip` - Ready for Firefox Add-ons

Or build individually:
```bash
pnpm build:chrome   # Chrome only
pnpm build:firefox  # Firefox only
```

### Testing

Run unit tests:
```bash
pnpm test           # Run tests once
pnpm test:watch     # Run tests in watch mode
pnpm test:coverage  # Run tests with coverage report
```

Tests run automatically:
- **Pre-commit hook** - Tests run before every commit
- **GitHub Actions CI** - Tests run on push and pull requests

### Deployment

Deploy to Firefox Add-ons:
```bash
# 1. Update RELEASE_NOTES.md with current version changes
# 2. Build Firefox extension
pnpm build:firefox

# 3. Deploy (requires Firefox Add-ons API credentials)
pnpm deploy:firefox
```

Set environment variables for deployment:
- `WEB_EXT_API_KEY` - Your Firefox Add-ons JWT issuer
- `WEB_EXT_API_SECRET` - Your Firefox Add-ons JWT secret

## How It Works

1. Content script automatically injects on all pages
2. Scans for YouTube iframes (youtube.com, youtube-nocookie.com)
3. Adds floating button above each detected video
4. On button click:
   - Checks health of your preferred Invidious instance
   - If healthy: Opens video immediately
   - If unhealthy: Shows modal with healthy instances from API
5. Modal displays:
   - Instance names with country flags
   - Uptime percentages (sorted highest first)
   - "Remember my choice" option
6. Configure preferred instance in options page
7. Instance list fetched from `https://api.invidious.io/instances.json`
8. Results cached for 15 minutes

## Browser Support

- ✅ **Chrome/Chromium** - Manifest v3
- ✅ **Firefox** - Manifest v3 (modern versions)

## Architecture

- **manifest.json** - Unified manifest for both browsers (modified during build)
- **src/content.js** - Content script for iframe detection and UI
- **src/utils.js** - Utility functions (URL parsing, API, health checks)
- **src/background.js** - Background service worker
- **src/options.js/html** - Options page for instance configuration
- **scripts/** - Build scripts that create browser-specific builds

### Browser-Specific Builds

- **Chrome**: Uses `service_worker` for background script
- **Firefox**: Uses `scripts` array for background script (converted during build)
