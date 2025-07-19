## [3.3.12](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v3.3.11...v3.3.12) (2025-07-19)

### Bug Fixes

* **build:** localhost crept back into the Webflow bundle ([#417](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/417)) ([6a424c2](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/6a424c26543660f48136f7c9814976e80afab59f))
* **build:** localhost crept back into the Webflow bundle, which is not allowed ([25e1f5a](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/25e1f5a3c1c77fa1e7feb4ca874bc11fb24a27d6)), closes [#416](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/416)

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
