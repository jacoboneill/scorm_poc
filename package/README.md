# @anthropic-jdo/scorm-framework

A SCORM 2004 course framework built with Preact.

## Installation

Add `.npmrc` to your project:

```
@anthropic-jdo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then install:

```bash
yarn add @anthropic-jdo/scorm-framework preact
yarn add -D vite @preact/preset-vite
```

## Usage

### vite.config.js

```js
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import scormManifest from "@anthropic-jdo/scorm-framework/plugin";
import moduleConfig from "./module.config.js";

export default defineConfig({
  plugins: [preact(), scormManifest(moduleConfig)],
  root: "src",
  base: "./",
  publicDir: "../public",
  build: {
    outDir: "../dist/html",
    emptyOutDir: true,
    assetsDir: ".",
    rollupOptions: {
      output: {
        entryFileNames: "app.js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});
```

### module.config.js

```js
export default {
  title: "My Course",
  identifier: "com.example.my-course",
  version: "1.0",
  passRate: 80,
  scorm: {
    version: "2004 4th Edition",
  },
};
```

### src/index.css

```css
@import "@anthropic-jdo/scorm-framework/styles";

/* Your custom styles here */
```

### src/App.jsx

```jsx
import { Module, Slide, Button, Video, Quiz, Score, useModule } from "@anthropic-jdo/scorm-framework";

// Define your slides and questions...
```

## Exports

### Components

- `Module` - Wraps slides, provides context, handles SCORM lifecycle
- `Slide` - Visual container with optional background
- `Button` - Styled button
- `Video` - HTML5 video player
- `Quiz` - Multi-question quiz engine
- `Score` - Pass/fail display

### Hooks

- `useModule()` - Access shared state and navigation

### Other

- `scorm` - SCORM API wrapper
- `scormManifest` (from `/plugin`) - Vite plugin for manifest generation

## Publishing

```bash
npm publish --registry=https://npm.pkg.github.com
```
