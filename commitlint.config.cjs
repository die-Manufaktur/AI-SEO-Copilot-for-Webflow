module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Changes that do not affect the meaning of the code
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Code change that improves performance
        'test',     // Adding missing tests or correcting existing tests
        'build',    // Changes that affect the build system or external dependencies
        'ci',       // Changes to CI configuration files and scripts
        'chore',    // Other changes that don't modify src or test files
        'revert'    // Reverts a previous commit
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'ui',           // User interface changes
        'api',          // API/backend changes
        'worker',       // Cloudflare worker changes
        'webflow',      // Webflow extension specific changes
        'seo',          // SEO analysis features
        'auth',         // Authentication related
        'build',        // Build system changes
        'deps',         // Dependencies updates
        'config',       // Configuration changes
        'release',      // Release related changes
        'docs',         // Documentation changes
        'test',         // Test related changes
        'security',     // Security improvements
        'performance',  // Performance improvements
        'accessibility' // Accessibility improvements
      ]
    ],
    'subject-case': [0, 'never'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100]
  }
};