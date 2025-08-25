## [4.1.2](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.1.1...v4.1.2) (2025-08-25)

### Bug Fixes

* prevent cross-site data contamination in keyword storage ([a711d2c](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/a711d2c3cb0c032c0d8236da78de256566f4c1bd)), closes [#459](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/459)
* prevent cross-site data contamination in keyword storage ([#461](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/461)) ([44f113a](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/44f113ad5a0f4851fe511b9fcb83ad0da042efa8))

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
