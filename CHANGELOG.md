## [4.2.0](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.1.5...v4.2.0) (2025-09-02)

### Features

* **api:** advanced settings persist forever ([9961c2e](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/9961c2e35a64dd9b12747c01291ccda496aebf38))
* **api:** advanced settings persist forever ([#473](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/473)) ([54501e8](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/54501e8b3be129eabfebe8b18cda8c9f22bb8843))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive semantic versioning automation system
- Automated draft releases with customizable release notes
- Conventional commits validation and enforcement
- Interactive commit helper with `pnpm commit`
- Automated version synchronization across all project files
- GitHub Actions workflows for manual and automated releases
- Pre-commit hooks for testing and type checking
- Comprehensive documentation for versioning workflow

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
