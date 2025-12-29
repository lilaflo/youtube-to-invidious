# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2025-12-29

### Added
- Initial release
- Floating button on YouTube video iframes for quick access to Invidious
- One-click redirect to yewtu.be for any YouTube video
- Support for youtube.com, youtube-nocookie.com, and youtu.be embeds
- Options page with debug logging toggle
- Works on any website with embedded YouTube videos
- Cross-browser support (Chrome & Firefox with Manifest v3)
- Bundled content script for Firefox compatibility
- Unit tests with pre-commit hooks and CI

### Technical
- ES module bundling for production builds
- 19 unit tests covering URL parsing and video ID extraction
- GitHub Actions CI workflow
- Husky pre-commit hooks for automated testing
