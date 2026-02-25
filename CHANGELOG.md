## [4.8.0](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/compare/v4.7.0...v4.8.0) (2026-02-25)

### Features

* **analysis:** generate per-H2 AI suggestions in parallel during analysis ([9a03437](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/9a03437e4ec0bb3ca64589baf8468e602f777229))
* **api:** add client generateRecommendation function ([9b783cb](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/9b783cb765076926944dc2ac477084e9d29d60b1))
* **api:** add generate-recommendation endpoint ([ef05958](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/ef059585c7fb00e3beca02f77c8975426e671abf))
* **home:** pass per-H2 recommendations and keyphrase context to H2SelectionList ([f79d587](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/f79d58724975cbce601aba0795db59899b96cf47))
* **images:** add per-image AI alt text generation and apply ([395b611](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/395b61177578f795e8ce5161375dc5689795a27f))
* **types:** add h2Recommendations array to SEOCheck ([d28c558](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/d28c558af54eb8b96cd71083546799f893256e48))
* **ui:** add H2 generate buttons and spacing fixes ([359899e](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/359899e69a3b34cfa9e80bb14b329c1b2d28f50b))
* **ui:** rewrite H2SelectionList with per-H2 suggestions and regenerate functionality ([3278527](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/327852720b55f05092ff769c7d1a8d80470579ea))
* **ui:** wire up Generate and Regenerate buttons to AI backend ([ee57687](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/ee57687b02d9335e1a1eedef807f11b50cefb4eb))

### Bug Fixes

* **build:** add @playwright/test dependency for E2E tests ([af4613a](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/af4613aed6e6b3ba75f3d1eabef766ebc0276e55))
* **build:** add lint script to package.json ([3a29b44](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/3a29b4415201ce08a4f53cc15647d3c65eae429e))
* **build:** make Codecov upload non-blocking in CI ([bbe2e96](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/bbe2e966655bba38363acd79f55e5991188420e3))
* **build:** replace cd client scripts with --root client ([a72e39d](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/a72e39d2f30d9e8b0ecbba89f805c150f028eb5b))
* **build:** revert packageManager to pnpm@10.14.0 to match CI workflow ([4593927](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/4593927b0bb2d1fdb090ecd06c8f74f2956ec1db))
* **build:** track pnpm-lock.yaml for CI frozen-lockfile installs ([3f19ae7](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/3f19ae7b1ec1599df0a8d30283fecb34cc85af3e))
* **ci:** make Snyk security scan non-blocking ([1aa77a7](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/1aa77a7072a7edcbe270cee860b44f7d260d74f5))
* **ci:** revert packageManager to pnpm@10.14.0 to match CI workflow ([8d0a552](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/8d0a552a5bd791f8d7d6d2b3c9fd0a6d226766b5))
* **css:** switch to @tailwindcss/vite plugin to restore utility class generation ([b870d7d](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/b870d7da754acbded82a703542dd42eb8b21d964))
* **deps:** address dependency security vulnerabilities ([6b2b707](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/6b2b7071fffa3a49cd423dbc479224e18430e3e7))
* **deps:** fix lint config and audit level ([25c0ce9](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/25c0ce9cc6503c8219cc9e2cfbbb36d65c1d505a))
* **e2e:** add list reporter and use vite-only webServer for CI compatibility ([4a903ba](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/4a903bae2db22c73b7983d2bd71e687d1c208425))
* **e2e:** update beforeEach selector from seo-extension to webflow-app-wrapper ([e73e867](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/e73e8678e678513e3c8d98d6ea8075b8cf6db4d1))
* **security:** fix double-unescaping vulnerability in htmlSanitizer ([696d79c](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/696d79c7ec034a1617443fcc312a822fc4414588))
* **security:** override minimatch to resolve high-severity audit findings ([7578d24](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/7578d24e5f4a429e0fdb6ba6572348bdc4c4ab73))
* **security:** replace DOMParser with regex-based HTML stripping ([a9dbe70](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/a9dbe70e4b4b2df8f9e233381121febdcf98f5c4))
* **security:** resolve CodeQL alerts in htmlSanitizer ([1e05d8a](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/1e05d8a887c339c6bf1b6da2513d97e3738558b5))
* **test:** align test assertions with Figma design system updates ([abcf789](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/abcf7897a6b8ce02dbbf6cf5ef2e11dd1d2931df))
* **test:** handle empty integration test suite gracefully ([dac31ff](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/dac31ff704a88f861c234548046128144e4d05fe))
* **test:** remove non-existent Playwright reporters from config ([9d114ae](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/9d114ae1d1f737247dc68615a25cf9689324b399))
* **test:** update ProgressCircle and Toast tests to match new design system ([158b637](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/158b6375f3edeb4eaec26877e85270b111a17f70))
* **test:** use plain function for AnimatePresence mock to prevent vi.restoreAllMocks clearing ([a9298a1](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/a9298a19bb1428f7326461a9fb032b53fd1f86ce))
* **ui:** fix H2SelectionList render gate and concurrent regeneration guard ([7348bba](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/7348bba979e14fa20d273402ce8b819fa056bd8a))
* **ui:** implement polling retry for setExtensionSize in WebflowAppWrapper ([dc74d79](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/dc74d79d7f1c33ccb9b225c7172275c59895ec44))
* **ui:** use green success badge for all passed counts in CategoryCard ([9de3b08](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/9de3b087abc48db827ca7211f3f94fb6abdecf11))

### Styles

* **api:** style changes from "\ ([5a52688](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/5a52688caef92256160d12079d9721a15df12f71))
* **ui:** align setup screen with Figma design specs ([7848e7b](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/7848e7b04c8312d7ae25f44cafe6eeb06e07d47d)), closes [#FF8484](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/FF8484) [#444](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/444)
* **ui:** fix priority pills text color and padding to match Figma ([1f716dc](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/1f716dc8baed4620ef75b320fae7ccca31c7edc9))
* **ui:** implement new design system from Figma ([#561](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/561)) ([f28d3b4](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/f28d3b401d440a0e823ccca2d27e5e086e25bcde))
* **ui:** lock extension width at 715px and replace motion animations with CSS ([b82801b](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/b82801b6caeaf8ce7a24808614f2cc49d4150f03))
* **ui:** moving code ([2ebba88](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/2ebba88f81e51bf559d4c3ce901633abcfff0dc4))
* **ui:** refine category detail view and image list to match Figma design ([fa2b110](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/fa2b11028d0ced5c8282db8d1ded81ed20088383)), closes [#FFEA9E](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/FFEA9E)
* **ui:** separate passed pill and arrow link into separate pills ([edb4c51](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/edb4c51d2b9f9dba358d4337460c8903dfe7ddc9))
* **ui:** update action button icons and styling to match Figma design ([cd6290f](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/cd6290f88d087cd53fc50faeef84dec8e208783b))
* **ui:** update badge styling to match Figma design ([e5479f0](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/e5479f040bd34e6f34ad33249c4acd595e64817c))
* **ui:** update design system to match Figma specs ([e20a6b4](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/e20a6b4f88c801f47333ad121527ba102c1a8bed)), closes [#5B5959](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/5B5959) [#313131](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/313131)
* **ui:** update Generate All button and notification badge to match Figma design ([9a39935](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/9a399352cffc5b13ba4b33df52e22ac6bae67501)), closes [#787878](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/787878)
* **ui:** update gradient borders and footer layout ([0991c59](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/0991c59d86079b5a6bc0482a2fe91553fb03abb1)), closes [#717171](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/717171) [#4C4A4A](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/4C4A4A)
* **ui:** update score circle and triangle icons to match Figma design ([0780bb9](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/0780bb925bfa0dd511bee1b40e9602404ed1f8cb)), closes [#A2FFB4](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/A2FFB4) [#FFD064](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/FFD064) [#FF4343](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/FF4343)
* **ui:** update triangle indicators to match Figma design ([0dfc422](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/0dfc422c092f9bf1cb281a0231218e2d84fbcd96)), closes [#A2FFB4](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/A2FFB4) [#FF4343](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues/FF4343)

### Miscellaneous Chores

* add .claude/ directory to gitignore ([fdd84cf](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/fdd84cfc8c1cb2f05249c031877fe2beb00296e8))
* add per-H2 implementation plan and append-tests helper ([9fe786b](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/9fe786bbecc92ad13e805ce2fff82131b464c47c))
* add playwright-report to gitignore and update docs ([bc588c5](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/bc588c5ecd826a17a3dfe65e9f284bbc2ad870cc))
* **git:** remove files that should be ignored from tracking ([2fae643](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/2fae643da2d42262e2e84be5d08483c8a24e5b59))
* remove tracked files that should be gitignored ([72ab7a4](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/72ab7a4d1a2df3699ab434fe72cf9f6841dffbbf))
* remove unused workspaces config and husky prepare script ([c3a20ec](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/c3a20ecc8e16fbeaf112338019dabe32fd8bc7b0))
* update gitignore and docs for design system work ([8a56b22](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/8a56b2258b2b7c6111e5ba30e08e4aa41842246e))

### Code Refactoring

* **ui:** fix passed pill color ([1c62491](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/1c62491069b062f38ce683c0aea64636774de7e1))
* **ui:** fix Success State pill size ([ea3fab8](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/ea3fab87d1edcc86503df1144564200ec2d7a3b7))
* **ui:** restore Figma dimensions, remove responsive code, update UI styling ([4bd52d9](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/4bd52d92143c6e9ba5412dffe43762f23ec45dba))

### Tests

* add ImageAltTextList and stringUtils unit tests ([3114ab8](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/3114ab8c6db782ec9415fab6272d8a9f7a1cf960))
* **test:** latest changes from Replit ([125772c](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/125772c1a987a700f35c8debed8e7176fa0a593d))
* **test:** untangling Git ([4e0b20d](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/4e0b20d98db03f212d6c12936dfb235b4f2d48f9))

### Continuous Integration

* simplify pipeline by removing E2E tests and placeholder deploy jobs ([1dc89e1](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/commit/1dc89e1f57fae2ed1b842b3e3e913c9b7a210600))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Multilingual AI Recommendations**: Support for AI-powered SEO recommendations in 9 languages
- **Automatic Site Language Detection**: Detects site language from HTML lang attribute and browser settings
- **Site-Specific Language Preferences**: Language choices are remembered per Webflow site
- **Language Selector UI**: Dropdown with visual indicators showing detected default language
- Comprehensive semantic versioning automation system
- Automated draft releases with customizable release notes
- Conventional commits validation and enforcement
- Interactive commit helper with `pnpm commit`
- Automated version synchronization across all project files
- GitHub Actions workflows for manual and automated releases
- Pre-commit hooks for testing and type checking
- Comprehensive documentation for versioning workflow

#### Supported Languages for AI Recommendations
- English (en) - English 🇺🇸
- French (fr) - Français 🇫🇷
- German (de) - Deutsch 🇩🇪
- Spanish (es) - Español 🇪🇸
- Italian (it) - Italiano 🇮🇹
- Japanese (ja) - 日本語 🇯🇵
- Portuguese (pt) - Português 🇵🇹
- Dutch (nl) - Nederlands 🇳🇱
- Polish (pl) - Polski 🇵🇱

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
