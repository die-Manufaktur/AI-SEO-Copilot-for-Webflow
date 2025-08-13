## [4.0.1](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.0.0...v4.0.1) (2025-08-13)

### Bug Fixes

* **build:** gracefully handle frozen lockfilez ([208cfe6](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/208cfe62c8b25c1aac035aaffdbf5584a5fdec41))

### Miscellaneous Chores

* **deps:** bump @tanstack/react-query from 5.84.1 to 5.84.2 ([c44de77](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/c44de775f5e082a2076525aa389e4806395781f2))
* **deps:** bump @tanstack/react-query from 5.84.1 to 5.84.2 ([#424](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/424)) ([c4130f3](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/c4130f373171b747e3e42b6398fc528954b1b3fa))

### Build System

* **build:** fix zombie caching issues please ([0f0288e](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/0f0288ebd628517cd978c4d74ae27cb97013b273))

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
