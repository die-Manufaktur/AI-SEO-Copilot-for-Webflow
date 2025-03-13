# SEO Copilot <!-- Update the name here -->

SEO Copilot is an advanced SEO analysis tool performing 11 comprehensive checks including title optimization, meta description analysis, content verification, keyword density, and image optimization. Get AI-powered recommendations for better rankings.

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

This template includes a suggested Prettier configuration in `.prettierrc` and uses Yarn by default.

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

## Note about bundling output

Vite is configured to use the `public/` folder as the output, as this is where the `webflow-cli` expects the final assets for deployment, including scripts and the index.html file.

If you put any assets manually in the `public/` folder, they will be overriden during buliding.

## License

The source code of the `webflow-app-template-react` template is available for use under the MIT license. [See license](https://github.com/stefanwittwer/webflow-app-template-react/blob/main/LICENSE.md)
