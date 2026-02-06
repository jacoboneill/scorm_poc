# SCORM Framework + Example Module

This repo contains:

- `package/` — The reusable SCORM framework (published to GitHub Packages)
- `example-module/` — An example module that uses the framework

## Setup: Publishing the Package

### 1. Create a GitHub repo for the package

Create a new repo in your org (e.g., `anthropic-jdo/scorm-framework`).

### 2. Update the package name

Edit `package/package.json` and update:
- `name`: `@your-org/scorm-framework`
- `repository.url`: your repo URL
- `publishConfig.registry`: `https://npm.pkg.github.com`

### 3. Authenticate with GitHub Packages

Create a Personal Access Token (PAT) with `write:packages` scope:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `write:packages` and `read:packages` scopes
3. Login to npm with your token:

```bash
npm login --registry=https://npm.pkg.github.com
# Username: your-github-username
# Password: your-personal-access-token
# Email: your-email
```

### 4. Publish the package

```bash
cd package
npm publish
```

The package is now available at `https://github.com/orgs/your-org/packages`.

---

## Setup: Using the Package in a Module

### 1. Create a GitHub PAT for reading packages

If you haven't already, create a PAT with `read:packages` scope.

### 2. Set the GITHUB_TOKEN environment variable

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Or add it to your shell profile (`~/.zshrc` or `~/.bashrc`).

### 3. Create a new module

Copy `example-module/` as a starting point, or create a new repo with:

```
my-module/
├── .npmrc                 ← points to GitHub Packages registry
├── package.json           ← depends on @your-org/scorm-framework
├── module.config.js       ← course metadata
├── vite.config.js         ← imports plugin from package
├── src/
│   ├── index.html
│   ├── index.jsx
│   ├── index.css          ← imports base styles from package
│   ├── App.jsx            ← defines slides and questions
│   └── slides/
│       └── *.jsx          ← your slide content
└── public/
    └── (assets: video, images, etc.)
```

### 4. Install dependencies

```bash
cd my-module
yarn install
```

### 5. Develop and build

```bash
yarn dev      # Start dev server
yarn build    # Build SCORM package (creates dist/scorm.zip)
```

---

## Creating a New Module (Quick Start)

1. Copy `example-module/` to a new directory
2. Update `.npmrc` with your org name
3. Update `package.json` with your module name
4. Update `module.config.js` with your course details
5. Replace slides in `src/slides/`
6. Add assets to `public/`
7. Run `yarn install && yarn build`
8. Upload `dist/scorm.zip` to your LMS

---

## Package Exports

```js
// Components
import { Module, Slide, Button, Video, Quiz, Score, useModule } from "@your-org/scorm-framework";

// Vite plugin (in vite.config.js)
import scormManifest from "@your-org/scorm-framework/plugin";

// Base CSS (in index.css)
@import "@your-org/scorm-framework/styles";
```
