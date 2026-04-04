## [4.10.6](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.10.5...v4.10.6) (2026-04-04)

### Bug Fixes

* ensure language selection impacts AI-generated content ([#538](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/538)) ([6c86b31](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/6c86b313511aaa3f2819b1f3c8f0c937a6d85c5d))
* ensure language selection impacts AI-generated content ([#538](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/538)) ([#574](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/574)) ([d3b88f7](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/d3b88f713a37ed690dfa98fdd7c272c6f5f7a5f0))
* **security:** resolve high/critical dependency vulnerabilities ([71d1aac](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/71d1aac5b63f7e9962ddf9d2f57e95d5363c85cb))

### Continuous Integration

* add automatic worker deployment to release workflow ([89e707f](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/89e707f7bc0f4e0cad6093d4963b425623fa296d))
* add automatic worker deployment to release workflow ([#571](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/571)) ([146df33](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/146df3375ed9fb0d4a2ca22c7eafbcd952a5deaf))

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
