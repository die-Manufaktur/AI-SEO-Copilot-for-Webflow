# SEO Copilot Development Guide

## Development Workflow

Our development workflow is designed to ensure code quality and consistency. Follow these steps for the most effective development process:

### Prerequisites
- Node.js (v16 or higher)
- Yarn (v1.22 or higher)
- Cloudflare account (for Worker deployment)

### First-Time Setup
1. Clone the repository
2. Install dependencies: `yarn install`
3. Create an `.env` file from `.env.example` and fill in all required values
4. Login to Cloudflare: `npx wrangler login`

### Local Development
To run both the Webflow app and the Cloudflare Worker simultaneously:

```bash
yarn start-dev
```

This command starts:
- Webflow app on http://localhost:1337
- Vite dev server on http://localhost:5173
- Cloudflare Worker on http://127.0.0.1:8787

### Making Changes

1. **Client-Side Changes**:
   - Modify files in the `client/src` directory
   - Vite will automatically reload the application

2. **Worker Changes**:
   - Modify files in the `workers` directory
   - The worker will automatically reload

### Testing Your Changes

Before committing your changes, you should run several checks:

```bash
# Type checking
yarn check

# Linting
yarn lint

# Formatting
yarn format

# Unit tests
yarn test
```

### Comprehensive Pre-Push Check

We've created a special `prepush` command that runs all checks at once:

```bash
yarn prepush
```

This command runs:
1. Type checking with TypeScript
2. Linting with ESLint
3. Code formatting with Prettier
4. All unit tests with Vitest
5. A full build to ensure everything compiles correctly

**Always run this before pushing code to ensure your changes meet quality standards.**

### Building for Production

To build the app for production:

```bash
# Build just the client app
yarn build

# Build just the worker
yarn build:worker

# Build both client and worker
yarn build:all
```

### Deploying to Webflow

1. Build the app and worker: `yarn build:all`
2. Upload the extension to Webflow: `webflow extension push`

## Troubleshooting

### Worker Connectivity Issues
If you see errors about API endpoints not found:

1. Check if the Worker is running: `yarn dev:worker`
2. Verify Worker connectivity: `node test-connection.js`
3. Check console for the API base URL being used
4. Ensure ports 1337, 5173, and 8787 are available

### Environment Variable Issues
If you get environment variable errors:

1. Verify your `.env` file has all required variables
2. For Cloudflare Worker, set secrets: `npx wrangler secret put OPENAI_API_KEY`

### Dependency and Lockfile Issues
If you encounter errors related to missing packages, mismatched versions, or lockfile inconsistencies:

1. Run the dependency fix script:
   ```bash
   yarn fix-deps
   ```

   This script will:
   - Back up your current yarn.lock file
   - Remove node_modules and yarn.lock
   - Clear yarn cache
   - Reinstall all dependencies with --force flag

2. If errors persist, you may need to manually edit package.json to resolve version conflicts

3. For specific dependency errors, check:
   - Version incompatibilities between packages
   - Missing peer dependencies
   - Broken or outdated package references

## Testing

We use Vitest for testing. Test files are in the `tests` directory:

```bash
# Run tests once
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

## Structure
- `/client` - React application code
  - `/src` - Source code
  - `/components` - UI components
  - `/lib` - Utilities and API clients
  - `/pages` - Page components
- `/workers` - Cloudflare Workers code (serverless backend)
- `/tests` - Test files
- `/scripts` - Build and utility scripts
