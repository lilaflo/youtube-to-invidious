# AGENTS.md

Guide for agentic coding agents working in this repository.

## Project Overview

Browser extension (Manifest V3) that detects YouTube videos/iframes and adds a floating button to open them on an Invidious instance. Supports Chrome and Firefox via a shared codebase with build-time bundling.

## Build & Development Commands

**Package manager: pnpm** (version 10.26.2, enforced via `packageManager` in package.json).

| Command | Description |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm build` | Build both Chrome and Firefox (runs build-chrome + build-firefox) |
| `pnpm build:chrome` | Build Chrome version → `dist-chrome/` |
| `pnpm build:firefox` | Build Firefox version → `dist-firefox/` |
| `pnpm test` | Run all tests once (vitest run) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with v8 coverage report |
| `vitest run test/utils.test.js` | Run a single test file |
| `vitest run -t "pattern"` | Run tests matching a describe/it name pattern |

There is **no lint or typecheck command** configured. The pre-commit hook (`.husky/pre-commit`) runs `pnpm test` only.

CI (`.github/workflows/ci.yml`) runs: `pnpm install → pnpm test → pnpm build`.

## Project Structure

```
manifest.json          # Manifest V3 config (shared for both browsers)
src/
  utils.js             # Pure utility functions (URL parsing, instance mgmt, health checks)
  content.js           # Content script (iframe detection, floating button, modal picker)
  background.js        # Service worker (icon click → inject content script)
  options.js           # Options page logic (instance selection, debug toggle)
  options.html         # Options page markup
test/
  setup.js             # Global chrome API mock for vitest
  utils.test.js        # Unit tests for utils.js
scripts/
  build.js             # Orchestrates both browser builds
  build-chrome.js      # Chrome-specific build
  build-firefox.js     # Firefox-specific build
  bundle-content.js    # Inlines utils.js into content.js for dist (strips ES module imports/exports)
icons/                 # 16, 48, 128 PNG icons
```

**Build output:** `dist-chrome/` and `dist-firefox/` each contain the full loadable extension. The build bundles `utils.js` + `content.js` into a single IIFE (no ES module imports) for browser compatibility.

## Code Style Guidelines

### Language & Modules

- **Plain JavaScript** (no TypeScript, no transpilation).
- **ES modules** in source (`"type": "module"` in package.json).
- Source files use `import`/`export` syntax; the build script strips these for distribution via `bundle-content.js`.

### Imports

- Use named imports from local modules: `import { foo, bar } from './utils.js';`
- Include the `.js` extension in import paths.
- Third-party imports: `webextension-polyfill` is available but the codebase currently uses `chrome.*` APIs directly.

### Formatting

- 2-space indentation.
- Single quotes for strings.
- Semicolons required.
- No trailing commas enforced, but used in some places.
- JSDoc comments on exported functions (`@param`, `@returns`).
- File-level doc comment at the top of each source file.

### Naming Conventions

- **Functions:** camelCase (`extractVideoId`, `checkInstanceHealth`).
- **Constants:** UPPER_SNAKE_CASE for true constants (`CACHE_TTL`), camelCase for everything else.
- **CSS classes:** BEM-like prefix `yt-inv-` (e.g., `yt-inv-floating-btn`, `yt-inv-modal-overlay`).
- **DOM IDs:** kebab-case with `yt-inv-` prefix (e.g., `yt-inv-page-btn`).
- **Log prefix:** `[YT2INV]` for all console output.

### Console Logging

- **Always use `console.debug`**, never `console.log`.
- `console.error` is acceptable for genuine error conditions (e.g., background.js injection failure).

### Error Handling

- Wrap risky operations in try/catch (URL parsing, fetch, storage access).
- Return safe fallback values on error: `null` for lookups, `false` for health checks, hardcoded fallback instances for API failures.
- Never throw from utility functions; always return a usable default.
- Check `chrome.runtime.lastError` after storage callbacks.

### Async Patterns

- Use `async`/`await` (no raw `.then()` chains).
- Use `AbortController` with `setTimeout` for fetch timeouts (5-second default for health checks).

### Storage

- `chrome.storage.sync` for user preferences (`preferredInstance`, `debugEnabled`).
- `chrome.storage.local` for cached data (`instancesCache`, `instancesCacheTimestamp`).

### Testing

- **Framework:** Vitest with `happy-dom` environment and global API (`globals: true` in vitest.config.js).
- **Setup:** `test/setup.js` mocks `chrome.storage.sync` and `chrome.runtime` on the global scope.
- Tests import explicitly: `import { describe, it, expect } from 'vitest';`
- Import source functions from `../src/utils.js`.
- Write at least **2 unit tests per new function** and **regression tests for every bug fix**.
- Wait on writing tests until the implementation is stable.

### Browser Extension Conventions

- Manifest V3 only. Chrome uses `service_worker`, Firefox uses `background.scripts` (both handled at build time).
- `webextension-polyfill` is installed if cross-browser API normalization is needed.
- Content scripts run at `document_idle` and are injected on all URLs (`<all_urls>`).
- YouTube SPA navigation is handled via `yt-navigate-finish` and `popstate` events plus a `MutationObserver`.

### Git

- **Conventional Commits** (e.g., `feat:`, `fix:`, `chore:`).
- Commit messages: concise, user-focused, no verbose descriptions.
- Never include `Co-Authored-By` or mention AI assistants in commit messages.
- Never commit unless explicitly asked.
- Always update README for business logic changes.
- Store implementation plans in `planning/` for substantial changes.
