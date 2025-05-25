# AI SEO Copilot for Webflow

An advanced SEO analysis tool that performs 18 comprehensive checks with AI-powered recommendations for Webflow sites.

## Quick Links
- [Full Documentation](https://ai-seo-copilot.gitbook.io/ai-seo-copilot)
- [Feature Requests](https://aiseocopilot.featurebase.app)
- [Roadmap](https://aiseocopilot.featurebase.app/roadmap)

## Features

- Title Tag Optimization
- Meta Description Analysis
- Content Structure Verification
- Keyword Density Analysis
- Image Alt Text Optimization
- AI-Powered SEO Recommendations
- OpenGraph Tags Validation
- Schema Markup Validation
- URL Optimization
- Content Length Analysis
- Heading Hierarchy Check
- Internal & Outbound Link Analysis
- Next-Gen Image Format Detection
- Code Minification Check
- Image File Size Optimization

## Local Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/PMDevSolutions/seo-copilot
   cd seo-copilot
   ```

2. Install dependencies using pnpm:
   ```bash
   pnpm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Required environment variables:
   - `USE_GPT_RECOMMENDATIONS`: Set to "true"
   - `ENABLED_GPT_CHECKS`: Comma-separated list of enabled checks
   - `VITE_WEBFLOW_API_KEY`: Your Webflow API key
   - `VITE_WEBFLOW_SITE_ID`: Your Webflow site ID
   - `VITE_WEBFLOW_CLIENT_ID`: Your Webflow client ID
   - `WEBFLOW_CLIENT_SECRET`: Your Webflow client secret
   - `WEBFLOW_REDIRECT_URI`: Authorized redirect URI for OAuth
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token (required for deployment)

4. Start development server:
   ```bash
   pnpm dev
   ```

5. Access the app:
   - Development URL: `http://localhost:1337`
   - Add this URL in Webflow Designer's Apps panel
   - Launch the extension from Webflow Designer

## Directory Structure

Here is an overview over the most important directories and files:

`├──src/` — React application code<br>
`├──public/` — Output folder for bundled React app (see note below)<br>
`├──index.html` — The index file which will be used as an entry point by the bundler<br>
`├──tsconfig.json` — A modified tsconfig which combines JSX support, Webflow types, and sensible React defaults.<br>
`├──vite.config.ts` — Configuration for the bundler<br>
`├──webflow.json` — Webflow App manifest<br>

This template includes a suggested Prettier configuration in `.prettierrc` and uses pnpm by default.

## Developing

### Running a development server

```
pnpm dev
```

The above command uses the Concurrently package to run a few commands at the same time:
- First it starts the Vite development server, with options to force rebuild dependencies and offer CORS for local development.
- It then builds the bundle in the /public folder that enables the app to be run in Webflow.
- We serve the Webflow extension.
- Finally, the dev version of the Cloudflare Worker is deployed. This is on port 8787 by default, but you can change this in the package.json.

The default port to run the app on in Webflow is 1337, but you can change that as well.

You will need to create and populate the .env file in the root of the project. This should contain at least the following environment variables:

- `USE_GPT_RECOMMENDATIONS`: Set to "true" to enable AI-powered recommendations
- `ENABLED_GPT_CHECKS`: Comma-separated list of enabled checks from the following options:
  - Keyphrase in Title
  - Keyphrase in Meta Description
  - Keyphrase in URL
  - Content Length
  - Keyphrase Density
  - Keyphrase in Introduction
  - Image Alt Attributes
  - Internal Links
  - Outbound Links
  - Next-Gen Image Formats
  - OG Image
  - OG Title and Description
  - Keyphrase in H1 Heading
  - Keyphrase in H2 Headings
  - Heading Hierarchy
  - Code Minification
  - Schema Markup
- `OPENAI_API_KEY`: Your OpenAI API key for AI-powered recommendations

## Deployment and Installation

Once you've been developing your app locally, preparing it for production is done in a few simple steps.

### Build
1. First, run pnpm check and make sure you don't have any syntax errors in your Typescript.
2. Delete the public folder and bundle.zip file in your project if either or both of them already exist.
3. Secondly, just run pnpm build. That's it! If you don't see any errors, you should have a bundle.zip file that you can upload to update your app in Webflow.

We won't go into all the details of setting up a Webflow app here, but you should read the following before beginning development: https://developers.webflow.com/

### Setting up Environment Variables
Once you've deployed, you'll need the production worker to have access to the correct environment variables. Make sure to run the following commands in your terminal:

`npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put WEBFLOW_CLIENT_SECRET
npx wrangler secret put WEBFLOW_CLIENT_ID
npx wrangler secret put WEBFLOW_REDIRECT_URI`

Your app should be production-ready at this point. YOu can install it from the Marketplace like any other app, or follow these instructions:

## Installing in Webflow

1. Open the Webflow Designer
2. Go to Apps panel (keyboard shortcut: E)
3. Search for "AI SEO Copilot"
4. Click Install
5. Configure your settings:
      - Set your Webflow API credentials

### Troubleshooting
If you're stuck with something and you think it may be a bug, please submit a bug report on our Github repo: https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues. Be sure to search through the closed issues to make sure the issue you're seeing hasn't already been solved by someone else! We try to push updates as often as possible, but this is a FOSS product, and things can fall behind sometimes.

Complete documentation available at [AI SEO Copilot Docs](https://ai-seo-copilot.gitbook.io/ai-seo-copilot)

## Contributing

Please see [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.
Feature requests: [FeatureBase](https://aiseocopilot.featurebase.app)