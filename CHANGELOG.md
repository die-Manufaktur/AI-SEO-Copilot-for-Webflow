## [4.10.0](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.9.0...v4.10.0) (2026-03-05)

### Features

* **Home:** route image alt apply through standard insertion pipeline ([60d2a2d](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/60d2a2d1fbe2b291540fa55b18ee92385e1f6da2))
* **insertionHelpers:** add image_alt type mapping and imageUrl context ([d2be610](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/d2be6102d974654fcfce1f21e1e234fdeeebaf30))
* **types:** add image_alt insertion type and imageUrl field to WebflowInsertionRequest ([0f06dbb](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/0f06dbbb673be3aac4cb7f1791efcf66f79d91d0))
* **webflowInsertion:** add applyImageAlt method for image_alt insertion type ([f80676a](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/f80676ae0d3e65399829e46d3970dc903ab66f91))

### Bug Fixes

* **image-alt:** multi-strategy element matching and applyability detection ([80d3934](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/80d39344b2cf8c0f8fd5d68487c4565ba3b59550))
* **ImageAltTextList:** enable tooltip on disabled Apply buttons ([8ad78c6](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/8ad78c68b729efc59e332d902da9ff2a9cf3b550))

### Documentation

* optimize CLAUDE.md for AI context and update README.md for design system ([92d25b4](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/92d25b4c86bf0ba7a6fce211e6f18193f41d4f38))

### Build System

* **dependencies:** updated pnpm ([30a39fa](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/30a39faf9ad050d2ad96e046477360516dc3270a))

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
