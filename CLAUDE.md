# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser extension that redirects YouTube URLs to Invidious instances when YouTube blocks access.

## Package Manager

This project uses **pnpm** (version 10.26.2 or compatible). Always use pnpm commands:
- `pnpm install` - Install dependencies
- `pnpm build` - Build for both Chrome and Firefox
- `pnpm build:chrome` - Build Chrome version only
- `pnpm build:firefox` - Build Firefox version only
- `pnpm test` - Run tests

## Development Workflow

1. Make changes to source files in `src/`
2. Build the extension:
   - `pnpm build:chrome` - Creates `dist-chrome/` folder
   - `pnpm build:firefox` - Creates `dist-firefox/` folder
3. Load unpacked extension in browser:
   - **Chrome**: Load `dist-chrome/` in `chrome://extensions/`
   - **Firefox**: Load `dist-firefox/` in `about:debugging`
4. After code changes, rebuild and reload extension manually

## Browser Extension Structure

### Current Implementation
- `manifest.json` - Manifest v3 configuration
- `src/content.js` - Content script that detects YouTube iframes and adds Invidious button
- `src/utils.js` - Utility functions for URL parsing and instance management
- `src/background.js` - Background service worker
- `src/options.js` / `src/options.html` - Options page for configuring preferred instance
- `icons/` - Extension icons (16x16, 48x48, 128x128 PNG)
- `dist-chrome/` - Built Chrome extension (load as unpacked extension)
- `dist-firefox/` - Built Firefox extension (load as temporary add-on)

### How It Works
1. Content script auto-injects on all pages via `content_scripts` in manifest
2. Scans page for YouTube iframes (including youtube-nocookie.com)
3. Adds floating button above each detected YouTube iframe
4. On button click:
   - Checks health of user's preferred Invidious instance
   - If healthy: Opens video immediately on that instance
   - If unhealthy: Shows modal with list of healthy instances from API
5. User can select and save preferred instance via options page
6. Instance list fetched from `https://api.invidious.io/instances.json`
7. Results cached for 15 minutes to reduce API calls

## Architecture Notes

### Redirection Logic
The extension should intercept YouTube URLs and redirect to equivalent Invidious URLs:
- Video: `youtube.com/watch?v=VIDEO_ID` → `invidious.instance/watch?v=VIDEO_ID`
- Channel: `youtube.com/channel/CHANNEL_ID` → `invidious.instance/channel/CHANNEL_ID`
- Playlist: `youtube.com/playlist?list=PLAYLIST_ID` → `invidious.instance/playlist?list=PLAYLIST_ID`

### Invidious Instances
Maintain a list of public Invidious instances with fallback options. Consider:
- Health checking instances
- User-configurable instance preference
- Automatic fallback if preferred instance is down

## Cross-Browser Compatibility

**Supported Browsers**: Chrome and Firefox (both use Manifest v3)

**Build System**:
- Single unified `manifest.json` for both browsers
- Both browsers use Manifest v3 (modern versions only)
- `browser_specific_settings.gecko.id` for Firefox (ignored by Chrome)
- Build scripts in `scripts/` directory:
  - `build.js` - Builds both browsers
  - `build-chrome.js` - Chrome only
  - `build-firefox.js` - Firefox only
- `webextension-polyfill` installed for cross-browser API compatibility

## Testing

Unit tests should cover:
- URL parsing and transformation logic
- Redirect decision logic (when to redirect vs. when not to)
- Storage operations for user preferences
