# YouTube to Invidious Extension

A browser extension that adds a floating button to YouTube videos, allowing you to open them on Invidious (yewtu.be) with one click.

## Installation

### Chrome Web Store
Install from: [Chrome Web Store](https://chrome.google.com/webstore/detail/hinknbjekomiaomaicgpghmlnbbpenmk)

Extension ID: `hinknbjekomiaomaicgpghmlnbbpenmk`

### Firefox Add-ons
Coming soon to Firefox Add-ons

## Features

- **On-demand activation** - Click extension icon to scan current page
- **Works on any website** with embedded YouTube videos
- **Floating button** on each detected video - slides down on hover
- **One-click access** to Invidious (yewtu.be) in new tab
- **Privacy-focused** - Uses minimal permissions (activeTab + scripting only)
- **Hot-reload** support for development

## Development

### Prerequisites

- Node.js 18+
- pnpm 10.26.2+

### Installation

```bash
pnpm install
```

### Development Mode (with hot-reload)

```bash
pnpm dev
```

This will:
1. Start Vite in development mode with hot-reload
2. Generate the extension in `dist/` directory
3. Automatically rebuild when you change files

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist/` directory from this project

The extension will automatically reload when you make changes to the code.

### Build for Production

Build for both Chrome and Firefox:
```bash
pnpm build
```

This creates:
- `dist-chrome/` - Chrome extension
- `dist-firefox/` - Firefox extension
- `extension-chrome.zip` - Ready for Chrome Web Store
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

1. Click the extension icon in your browser toolbar
2. Extension scans the current page for YouTube iframes (youtube.com, youtube-nocookie.com)
3. Adds floating button at top center of each detected video
4. Button peeks from top, slides down on hover
5. Click button → Opens video on Invidious in new tab

## Browser Support

- ✅ **Chrome/Chromium** - Manifest v3
- ✅ **Firefox** - Manifest v3 (modern versions)

## Future Plans

- User-configurable Invidious instance selection
- Instance health checking
- Automatic redirection option
