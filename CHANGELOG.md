## [4.1.5](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.1.4...v4.1.5) (2025-08-28)

### Bug Fixes

* **build:** fix connection between production app and production worker ([5cb9f93](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/5cb9f93bdcb58cd633ccc3cdd32860ac2798d03a))

### Miscellaneous Chores

* **deps:** update @tanstack/react-query requirement ([a48e88e](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/a48e88e02250c32c356f316a42ca588c913a6f4a))
* **deps:** update @tanstack/react-query requirement from ^5.85.3 to ^5.85.5 ([#471](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/471)) ([1aff0bf](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/1aff0bf94a141220959fb16f14d214a6444af994))
* **deps:** update @vitejs/plugin-react requirement ([b0c7d44](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/b0c7d446d3a41e06504d45e9e99ed5e4d5396116))
* **deps:** update @vitejs/plugin-react requirement from ^5.0.0 to ^5.0.1 ([#469](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/469)) ([8d80ead](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/8d80ead3253393b57cd5122d7597fd8bcf77a403))
* **deps:** update undici requirement from ^7.14.0 to ^7.15.0 ([2a0b1b2](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/2a0b1b2176958fa562d7877c8cff962335e3cf09))
* **deps:** update undici requirement from ^7.14.0 to ^7.15.0 ([#470](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/470)) ([e9b2968](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/e9b296879ed7b88b1f3c7c37fcc4143b7ccb076e))
* **deps:** update zod requirement from ^4.0.17 to ^4.1.1 ([e763b2c](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/e763b2c0a6797ba3d2781c51f553e6ad1bbdfbac))
* **deps:** update zod requirement from ^4.0.17 to ^4.1.1 ([#468](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/468)) ([a5cc3d8](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/a5cc3d88b25c8ba20793237e3e7eed71e6c4239c))

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
