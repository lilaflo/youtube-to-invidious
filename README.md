# YouTube to Invidious Extension

A Chrome browser extension that detects when YouTube blocks videos with the "Sign in to confirm you're not a bot" error and offers to switch to Invidious (yewtu.be) to watch the video.

## Features

- **Works on any website** with embedded YouTube videos
- **Floating button** appears on embedded videos - slides down on hover
- **YouTube.com**: Detects bot protection errors and offers redirect
- **One-click access** to Invidious (yewtu.be)
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

```bash
pnpm build
```

## How It Works

### On Third-Party Sites (with embedded videos)
1. Scans page for YouTube iframes (youtube.com, youtube-nocookie.com)
2. Adds floating button at top center of each video
3. Button peeks from top, slides down on hover
4. Click → Opens video on Invidious in new tab

### On YouTube.com
1. Detects "Sign in to confirm you're not a bot" error
2. Shows popup with redirect option
3. Click → Redirects to Invidious

## Future Plans

- Firefox support
- User-configurable Invidious instance selection
- Instance health checking
- Automatic redirection option
