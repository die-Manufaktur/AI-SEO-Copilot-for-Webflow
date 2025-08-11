## [4.0.0](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v3.3.14...v4.0.0) (2025-08-11)

### ⚠ BREAKING CHANGES

* **api:** We split the worker into discrete workers by role

re 383

Signed-off-by: Paul Mulligan <paul@pmds.pull-list.net>
* **api:** Once the worker is split into four, then the old way of calling it won't work.

Signed-off-by: Paul Mulligan <paul@pmds.pull-list.net>

### Features

* **api:** create schema recommendations in Technical SEO category ([8d8a82f](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/8d8a82fc20984511b77547c98c546e6e6f5b3497)), closes [#383](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/383)
* **api:** dynamic Site Data in Schema Recs ([1065266](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/10652660a098064b131b64654705c84e5455d131)), closes [#383](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/383)
* **api:** implement schema recommendations ([f64aa34](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/f64aa3475100d7d781e0b79336f0bd067c69d55e)), closes [#383](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/383)

### Bug Fixes

* **build:** fix broken lockfile ([e875de4](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/e875de49ff88e7251ebe1399dc13fec245e054fa))
* **build:** fix broken lockfile ([#431](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/431)) ([bc841a6](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/bc841a608eef627d20f93801478a0c62fd2477e7))
* **build:** that one didn't take ([c979fb3](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/c979fb3953b264d2e0de3876ffc82a14a2d9dfdd))
* **security:** remove GitHub PAT from .mcp.json ([0fd6516](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/0fd65166e530b92fa12c483b4da1e5f451d626d9))

### Documentation

* **api:** update only ([cf547f5](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/cf547f5edc259604479f8b8a3d3d92d0109686ee))
* **docs:** add MCP config to gitignore ([fae54fe](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/fae54fe895f3c208567224a4a6cb05893a3e8f12))

### Miscellaneous Chores

* **deps:** bump axios from 1.10.0 to 1.11.0 in the npm_and_yarn group ([a5e9767](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/a5e9767df63f2bbd593e1f5f1ae56365b9e28dd6))
* **deps:** bump axios from 1.10.0 to 1.11.0 in the npm_and_yarn group ([#423](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/423)) ([ffbe9e8](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/ffbe9e80a55b59da510bca7f2b031b4c4ee018ea))

### Code Refactoring

* **api:** patching latest changes ([a3a377c](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/a3a377c8b89abaddb00cc42b5ac5ec77d65d5946))
* **api:** split worker into four components ([815ad87](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/815ad877e9a801806adb698c6783cc67e3470386))

### Tests

* **test:** fix webflow window testing ([6123327](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/612332776c3e1936c718f9c5f2eece6e9ed78ca7))
* **test:** fix webflow window testing ([#422](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/422)) ([abf53b9](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/abf53b93bda869ea96e00ab51be22131a33018ce))

### Build System

* **deps:** update pnpm and fix frozen lockfile ([006663d](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/006663d259fc7cc1ff428d066b16aea077e783c8))
* **deps:** update pnpm and fix frozen lockfile ([#426](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/426)) ([a1c4827](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/a1c4827baa4758cebf511371be568051bab8d5a6))

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
