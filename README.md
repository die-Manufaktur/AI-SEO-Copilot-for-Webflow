# AI SEO Copilot for Webflow

An advanced SEO analysis tool that performs 11 comprehensive checks with AI-powered recommendations for Webflow sites.

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
- Search Engine Preview
- Mobile Responsiveness Check
- Page Speed Insights
- Schema Markup Validation

## Installing in Webflow

1. Open the Webflow Designer
2. Go to Apps panel (keyboard shortcut: A)
3. Search for "AI SEO Copilot"
4. Click Install
5. Configure your settings:
      - Set your Webflow API credentials

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

4. Start development server:
   ```bash
   pnpm start-dev
   ```

5. Access the app:
   - Development URL: `http://localhost:1337`
   - Add this URL in Webflow Designer's Apps panel
   - Launch the extension from Webflow Designer

## Using this template

To create a project from this template, select “Use this template“ → “Create new repository“ on the [GitHub page of this template](https://github.com/stefanwittwer/webflow-app-template-react).

See “Developing“ below to see which scripts to use to get started.

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
pnpm start-dev
```

The above command does a few things:

- Watches for changes in the `src/` folder and bundles the React application in the `public/` folder, as required by the Webflow CLI for bundling.
- Spins up a process that serves your extension files from under `public/`

The command outputs the URL under which your extension is being served. Use this as the “Development URL” for your app in the Webflow Designer’s Apps panel. You can then launch the extension from the same place.

You will need to create and populate the .env file in the root of the project. This should contain at least three key value pairs, consisting of the following keys:
OPENGPT_RECOMMENDATIONS - True or false.
ENABLED_GPT_CHECKS - Choose from the following list (comma-separated)
Keyphrase in Title
Keyphrase in Meta Description
Keyphrase in Introduction
Keyphrase in H1 Heading
Keyphrase in H2 Headings

Once the server is running, you must open the Webflow Designer, and then launch the app. The default is localhost:1337, but you can change the local URL.

## Deploying

```
pnpm build
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
   pnpm build:all
   ```

2. Upload the extension bundle to Webflow:
   ```
   webflow extension push
   ```

### Production Deployment Checklist

- [ ] Environment variables are set in `.env`
- [ ] Cloudflare Worker secrets are configured
- [ ] Client app is built with `pnpm build`
- [ ] Worker is deployed with `pnpm build:worker`
- [ ] Extension is uploaded to Webflow

### Troubleshooting

If you encounter issues during deployment:

1. Ensure all dependencies are installed: `pnpm install`
2. Verify environment variables are correctly set
3. Check Cloudflare Worker logs for any errors
4. Test the Worker API with: `curl https://your-worker-url.workers.dev/api/ping`

## Note about bundling output

Vite is configured to use the `public/` folder as the output, as this is where the `webflow-cli` expects the final assets for deployment, including scripts and the index.html file.

If you put any assets manually in the `public/` folder, they will be overriden during buliding.

## Installation Guide

Follow these steps to install the AI SEO Copilot onto your Webflow site:

### Prerequisites
1. Ensure you have access to the Webflow Designer and the Webflow CLI installed globally:
   ```bash
   pnpm add -g @webflow/webflow-cli
   ```
2. Obtain your Webflow Client ID and API credentials from the Webflow Developer Portal.
3. Make sure you have Node.js (v20 or later) and `pnpm` installed.

### Steps to Install
1. **Clone the Repository**:
   Clone this repository to your local machine:
   ```bash
   git clone <repository-url>
   cd AI-SEO-Copilot-for-Webflow
   ```

2. **Install Dependencies**:
   Install the required dependencies using `pnpm`:
   ```bash
   pnpm install --frozen-lockfile
   ```

3. **Build the Application**:
   Build the application for deployment:
   ```bash
   pnpm build:all
   ```

4. **Deploy to Webflow**:
   Use the Webflow CLI to deploy the extension:
   ```bash
   webflow deploy
   ```
   Ensure you have the following environment variables set:
   - `VITE_WEBFLOW_CLIENT_ID`
   - `VITE_WEBFLOW_EXTENSION=true`
   - `CLOUDFLARE_API_TOKEN`
   - `OPENAI_API_KEY`

5. **Activate the Extension**:
   - Log in to your Webflow account.
   - Navigate to the **Extensions** section in the Webflow Designer.
   - Locate the AI SEO Copilot extension and activate it.

6. **Configure Settings**:
   - Open the extension settings in Webflow Designer.
   - Provide your OpenAI API Key and any other required configuration.

### Troubleshooting
- If you encounter issues during deployment, ensure your environment variables are correctly set.
- Check the Webflow CLI documentation for additional deployment options.

For further assistance, refer to the [Webflow Developer Documentation](https://developers.webflow.com/designer/docs/getting-started-designer-extensions).

## Documentation

Complete documentation available at [AI SEO Copilot Docs](https://ai-seo-copilot.gitbook.io/ai-seo-copilot):
- Setup guides
- API reference
- Configuration options
- Troubleshooting
- Best practices
- Feature guides

## Contributing

Please see [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.
Feature requests: [FeatureBase](https://aiseocopilot.featurebase.app)

## Support
- Issues: GitHub Issues
- Questions: GitHub Discussions
- Updates: [Roadmap](https://aiseocopilot.featurebase.app/roadmap)

## License

Licensed under MIT. See [LICENSE.md](LICENSE.md) for details.
