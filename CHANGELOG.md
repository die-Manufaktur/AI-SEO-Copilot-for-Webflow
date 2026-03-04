## [4.9.0](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.8.0...v4.9.0) (2026-03-04)

### Features

* enable Apply to page button for Keyphrase in Introduction check ([d1e8346](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/d1e8346e657c86fa4eb36f06ac1723de76599cb8))

### Bug Fixes

* **keyphrase-intro:** complete Apply button functionality with success state ([0affcd0](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/0affcd07233ac20f98384cd7922e061229dc353b))

### Continuous Integration

* remove duplicate CodeQL and unconfigured Snyk steps from security-scan ([3b384ac](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/3b384ac468de48489134778753e31ea0386c83dc))
* remove duplicate CodeQL and unconfigured Snyk steps from security… ([#562](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/562)) ([f31a157](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/f31a15709804cb4c1b1cdb58da04d191c2255e60))

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
