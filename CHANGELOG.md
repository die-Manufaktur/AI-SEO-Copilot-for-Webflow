## [3.3.13](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v3.3.12...v3.3.13) (2025-07-22)

### Bug Fixes

* **api:** keyphrase in URL check only returns slug ([749e728](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/749e72846687806f7a92feec282d60f839f484ab))
* **api:** patch Keyphrase in URL bug ([467b59b](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/467b59bf9b0b4d073d55378d6646dbeecd1ef19b))

### Miscellaneous Chores

* **deps-dev:** bump esbuild from 0.25.6 to 0.25.7 in the npm_and_yarn group ([#419](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/419)) ([593a59a](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/593a59a2eb001d98bbe9566a80bcef04522faf0e))
* **deps-dev:** bump esbuild in the npm_and_yarn group ([aa0f6c1](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/aa0f6c15820cac022dedccf2614bde18f94e1fa5))

### Continuous Integration

* **build:** remove auto-pr script ([8ec1a0c](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/8ec1a0c6a4fa1552b91eb45e48b2f71edb0e9050))

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
