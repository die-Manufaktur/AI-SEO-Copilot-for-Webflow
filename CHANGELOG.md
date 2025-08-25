## [4.1.3](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.1.2...v4.1.3) (2025-08-25)

### Bug Fixes

* **api:** claude deleted a critical piece of code, so I restored it ([c5135be](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/c5135be0609bdf40f5579a868befa0970398f149))
* implement missing OG Image and other SEO checks ([bdb8ea8](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/bdb8ea8da50a9a75ade0a264df3dc14c0c94e248)), closes [#432](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/432)
* implement missing OG Image and other SEO checks ([#464](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/464)) ([65e15ec](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/65e15ecd3093a607a9a210cb9f718089383b8249))

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
