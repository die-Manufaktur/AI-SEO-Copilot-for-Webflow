## [4.6.3](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.6.2...v4.6.3) (2025-09-12)

### Bug Fixes

* **api:** remove AI Rec from Content Length Check ([4993343](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/4993343b5e1cd899dca84439f8e79eb5b3d58ca1))

### Code Refactoring

* remove AI recommendations from content length check ([6f67c9b](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/6f67c9b8dc5cab177c29b92bb8b8a77d4a27912c))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Multilingual AI Recommendations**: Support for AI-powered SEO recommendations in 9 languages
- **Automatic Site Language Detection**: Detects site language from HTML lang attribute and browser settings
- **Site-Specific Language Preferences**: Language choices are remembered per Webflow site
- **Language Selector UI**: Dropdown with visual indicators showing detected default language
- Comprehensive semantic versioning automation system
- Automated draft releases with customizable release notes
- Conventional commits validation and enforcement
- Interactive commit helper with `pnpm commit`
- Automated version synchronization across all project files
- GitHub Actions workflows for manual and automated releases
- Pre-commit hooks for testing and type checking
- Comprehensive documentation for versioning workflow

#### Supported Languages for AI Recommendations
- English (en) - English 🇺🇸
- French (fr) - Français 🇫🇷
- German (de) - Deutsch 🇩🇪
- Spanish (es) - Español 🇪🇸
- Italian (it) - Italiano 🇮🇹
- Japanese (ja) - 日本語 🇯🇵
- Portuguese (pt) - Português 🇵🇹
- Dutch (nl) - Nederlands 🇳🇱
- Polish (pl) - Polski 🇵🇱

### Changed
- Updated project version to 2.3.3
- Improved Page Type Input focus border styling
- Enhanced test coverage for secondary keywords functionality

### Fixed
- Advanced options settings now persist when toggling the advanced tab off and on (#453)
- Page Type Input focus border issue in Chrome
- Test compatibility with secondary keywords feature
- Production console logging issues
- API URL handling for development vs production environments

## [2.3.3] - 2025-01-16

### Fixed
- Page Type Input focus border styling that appeared too thick and awkward in Chrome
- Removed focus ring entirely for cleaner appearance while maintaining functionality

### Changed
- Simplified Page Type Input focus behavior with `focus:ring-0 focus:ring-offset-0`
- Maintained full accessibility and keyboard navigation support
