## [4.1.4](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.1.3...v4.1.4) (2025-08-26)

### Bug Fixes

* **build:** fix pnpm setup bug that was exposed in a dependency update ([244d04d](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/244d04d191a5a3ec305c10c3a6b3e308b4beb7db))

### Miscellaneous Chores

* **deps:** update hono requirement from ^4.9.2 to ^4.9.4 ([5566858](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/556685853224309f31a2a4b732f53018efe51a69))
* **deps:** update hono requirement from ^4.9.2 to ^4.9.4 ([#467](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/467)) ([d4e7f4d](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/d4e7f4d992526fa119a2a75ec7a7dc8807364089))
* **deps:** update openai requirement from ^5.12.2 to ^5.15.0 ([5c0dea4](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/5c0dea453ecb99ec8199ef18c7eb5760851b62a5))
* **deps:** update openai requirement from ^5.12.2 to ^5.15.0 ([#466](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/466)) ([c6886f1](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/c6886f1125c8aa7701aca90e27470cd643444355))
* **deps:** update react-resizable-panels requirement ([b6fe276](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/b6fe276571599f7a6783a05613b400704f08828c))
* **deps:** update react-resizable-panels requirement from ^3.0.4 to ^3.0.5 ([#465](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/465)) ([6e7f203](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/6e7f2030fb58e1e1fad33832379693012151f3b0))

### Build System

* **deps:** remove versioning of pnpm setup from several scripts ([60db3ff](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/60db3ff125c8d7cca100fd92b6e7a1b66446cca2))

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
