# SEO Copilot

SEO Copilot is an advanced SEO analysis tool performing comprehensive checks including title optimization, meta description analysis, content verification, keyword density, and image optimization. Get AI-powered recommendations for better rankings.

## Features

- Title Optimization
- Meta Description Analysis
- Content Verification
- Keyword Density
- Image Optimization
- AI-Powered Recommendations

## Installation

```sh
yarn install
```

## Development Workflow

Our development workflow follows these steps:

1. **Setup Environment**
   - Create `.env` file based on `.env.example`
   - Configure required API keys and settings

2. **Local Development**
   - Start both client app and Cloudflare Worker: `yarn start-dev`
   - Visit the app at http://localhost:1337

3. **Testing & Validation**
   - Run type checking: `yarn check`
   - Run linting: `yarn lint`
   - Run formatting: `yarn format`
   - Run unit tests: `yarn test`

4. **Pre-Push Checks**
   - Run `yarn prepush` before pushing code to automatically run all checks

5. **Building & Deployment**
   - Build the application: `yarn build`
   - Deploy worker: `yarn build:worker`
   - Deploy both: `yarn build:all`

## Directory Structure

Here is an overview of the most important directories and files:

`├──client/src/` — React application code<br>
`├──workers/` — Cloudflare Workers backend code<br>
`├──tests/` — Vitest test files<br>
`├──public/` — Output folder for bundled React app<br>
`├──scripts/` — Build and utility scripts<br>
`├──tsconfig.json` — TypeScript configuration<br>
`├──vite.config.ts` — Vite bundler configuration<br>
`├──vitest.config.ts` — Vitest test configuration<br>
`├──wrangler.toml` — Cloudflare Workers configuration<br>
`├──webflow.json` — Webflow App manifest<br>

## Environment Setup

The application requires several environment variables to function correctly:

## Using this template

To create a project from this template, select “Use this template“ → “Create new repository“ on the [GitHub page of this template](https://github.com/stefanwittwer/webflow-app-template-react).

See “Developing“ below to see which scripts to use to get started.

## Developing

### Installation

Run this command in your terminal in the project root directory to install its dependencies:

```
yarn
```

### Running a development server

```
yarn dev
```

The above command does a few things:

- Watches for changes in the `src/` folder and bundles the React application in the `public/` folder, as required by the Webflow CLI for bundling.
- Spins up a process that serves your extension files from under `public/`

The command outputs the URL under which your extension is being served. Use this as the “Development URL” for your app in the Webflow Designer’s Apps panel. You can then launch the extension from the same place.

You will need to create and populate the .env file in the root of the project. This should contain at least three key value pairs, consisting of the following keys:
OPEN_AI_API_KEY - This should be the raw key for the OpenAI API.
USE_GPT_RECOMMENDATIONS - True or false.
ENABLED_GPT_CHECKS - Choose from the following list (comma-separated)
Keyphrase in Title
Keyphrase in Meta Description
Keyphrase in Introduction
Keyphrase in H1 Heading
Keyphrase in H2 Headings

Once the server is running, you must open the Webflow Designer, and then launch the app. The default is localhost:1337, but you can change the local URL.

## Deploying

```
yarn build
```

This will take the contents of the `./public` folder and prepare a `bundle.zip` file ready for you to upload as a Designer extension for your App.

## Deployment

### Setting up Environment Variables

Before building and deploying, you need to set up your environment variables:

1. Copy `.env.example` to `.env` and fill in the necessary values:
   ```
   cp .env.example .env
   ```

2. Configure your Cloudflare Worker secrets using Wrangler:
   ```
   npx wrangler secret put OPENAI_API_KEY
   npx wrangler secret put WEBFLOW_CLIENT_SECRET
   npx wrangler secret put WEBFLOW_CLIENT_ID
   npx wrangler secret put WEBFLOW_REDIRECT_URI
   ```

### Building and Deploying

1. Build both the client app and the Cloudflare Worker:
   ```
   yarn build:all
   ```

2. Upload the extension bundle to Webflow:
   ```
   webflow extension push
   ```

### Production Deployment Checklist

- [ ] Environment variables are set in `.env`
- [ ] Cloudflare Worker secrets are configured
- [ ] Client app is built with `yarn build`
- [ ] Worker is deployed with `yarn build:worker`
- [ ] Extension is uploaded to Webflow

### Troubleshooting

If you encounter issues during deployment:

1. Ensure all dependencies are installed: `yarn install`
2. Verify environment variables are correctly set
3. Check Cloudflare Worker logs for any errors
4. Test the Worker API with: `curl https://your-worker-url.workers.dev/api/ping`

If you have dependency or lockfile issues, run the dependency fix script:
```
