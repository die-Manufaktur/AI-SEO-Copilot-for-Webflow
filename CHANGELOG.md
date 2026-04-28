## [4.10.7](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.10.6...v4.10.7) (2026-04-28)

### Bug Fixes

* **security:** patch high-severity vite and claude-code CVEs ([931b3ee](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/931b3ee9a1a9ab5eab771bd5ec83d35f0a63eb8a))

### Miscellaneous Chores

* **deps:** update react-dom requirement from ^19.1.1 to ^19.2.0 ([6dbbf08](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/6dbbf08f9c7f5e0aa91b44da9ee2499f9fb59155))
* **deps:** update react-dom requirement from ^19.1.1 to ^19.2.0 ([#519](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/519)) ([7f34206](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/7f34206c41093044a1160af88296c190478333e6))

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
