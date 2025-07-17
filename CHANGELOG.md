## [3.3.5](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v3.3.4...v3.3.5) (2025-07-17)

### Bug Fixes

* **build:** simplify build scripts ([0a829ed](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/0a829edba5152b8874d1156238e051edf7d4fb40))
* **release:** patch pnpm commit to true up versioning across codebase ([ee2eb2f](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/ee2eb2f70f9ec8d479e54f0ba53b7d26e91199e1))

### Miscellaneous Chores

* **release:** sync version to v3.3.4 [skip ci] ([0eecb42](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/0eecb42ad073758c1d34945a82d5021383bff8a0))

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
