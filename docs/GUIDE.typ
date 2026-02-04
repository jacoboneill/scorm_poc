#set document(title: "SCORM Course POC — Technical Guide")
#set page(margin: 2cm, numbering: "1")
#set text(font: "New Computer Modern", size: 11pt)
#set heading(numbering: "1.1.")
#set par(justify: true)

#show raw.where(block: true): set text(size: 9pt)
#show raw.where(block: false): set text(size: 10pt)
#show link: set text(fill: blue)

// ─────────────────────────────────────────────
// Title
// ─────────────────────────────────────────────

#align(center)[
  #text(size: 24pt, weight: "bold")[SCORM Course POC]
  #v(4pt)
  #text(size: 14pt, fill: luma(100))[Technical Guide]
  #v(12pt)
  #text(size: 10pt, fill: luma(120))[
    This document assumes familiarity with HTML, CSS, and JavaScript. \
    No prior knowledge of Vite, Preact, or SCORM is required.
  ]
]

#v(16pt)

#outline(indent: auto, depth: 3)

#pagebreak()

// ═════════════════════════════════════════════
= What This Project Does
// ═════════════════════════════════════════════

This is a proof-of-concept SCORM 2004 e-learning course. It compiles a set of
JSX source files into a single-page web application, generates the XML manifest
that SCORM requires, and bundles everything into a `.zip` file that any
SCORM-compliant Learning Management System (LMS) can import.

The learner experience is a linear slide deck: an intro screen, a video, a
multiple-choice quiz, and a results/outro screen. The course reports its score
and completion status back to the LMS through the SCORM API.

// ═════════════════════════════════════════════
= Technology Stack
// ═════════════════════════════════════════════

Each tool in the stack solves a specific problem. This section explains what
each one does and why it is here.

// ─────────────────────────────────────────────
== Vite — Build Tool
// ─────────────────────────────────────────────

Vite is a build tool. It does two things:

+ *Dev server* — When you run `npm run dev`, Vite starts a local web server
  that serves your source files directly to the browser. It transforms JSX on
  the fly so you see changes instantly without a manual build step.

+ *Production build* — When you run `npm run build:html`, Vite reads every
  source file, resolves all `import` statements, compiles JSX into plain
  JavaScript, and writes the result into the `dist/` folder as a handful of
  static files.

Without Vite, you would need to manually concatenate scripts and set up a dev
server yourself. Vite replaces all of that with a single config file.

=== How the Vite config works

```js
// vite.config.js
export default defineConfig({
  plugins: [preact(), scormManifest(moduleConfig)],
  root: "src",
  base: "./",
  publicDir: "../public",
  build: {
    outDir: "../dist",
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

Key settings:

/ `root: "src"`: Vite treats `src/` as the project root. It looks for
  `index.html` there.
/ `base: "./"`: All asset URLs in the built HTML use relative paths (`./app.js`
  instead of `/app.js`). This is critical for SCORM because the LMS serves
  files from an unpredictable base URL.
/ `publicDir: "../public"`: Files in `public/` (images, video) are copied
  as-is into `dist/` without processing.
/ `assetsDir: "."`: Built assets go directly into `dist/` rather than a
  `dist/assets/` subfolder. SCORM packages work best with a flat structure.
/ `entryFileNames` / `assetFileNames`: Forces predictable output names
  (`app.js`, `index.css`) instead of hashed filenames like `app-3f2a1b.js`.
/ `plugins`: Two plugins run during the build — Preact JSX compilation and the
  custom SCORM manifest generator.

// ─────────────────────────────────────────────
== Preact — UI Framework
// ─────────────────────────────────────────────

Preact is a 4 KB alternative to React. It uses the same API (components, hooks,
JSX) but ships far less code, which matters in a SCORM package where file size
affects upload and load times.

=== JSX in 60 seconds

JSX lets you write HTML-like syntax inside JavaScript. The build tool converts
it to function calls:

```jsx
// You write:
<h1 class="title">Hello</h1>

// Vite compiles it to:
h("h1", { class: "title" }, "Hello")
```

This is purely a compile-time transformation. The browser never sees JSX.

=== Components

A component is a JavaScript function that returns JSX. It receives an object of
*props* (the attributes you pass in the parent's JSX) and returns the UI for
that piece of the page:

```jsx
// Definition
export default function Button({ large, children, ...props }) {
  return (
    <button class={`btn ${large ? "btn-large" : ""}`} {...props}>
      {children}
    </button>
  );
}

// Usage
<Button large onClick={handleClick}>Start Course</Button>
```

`children` is a special prop — it contains whatever you nest between the
opening and closing tags.

=== Hooks

Hooks are functions that give components access to state and lifecycle
behaviour. This project uses three:

/ `useState(initial)`: Returns `[value, setValue]`. Calling `setValue` re-renders
  the component with the new value. The `Module` component uses this for
  `currentSlide`, `quizAnswers`, `quizSubmitted`, and `mediaComplete`.

/ `useMemo(fn, deps)`: Runs `fn` once when the component first mounts (because
  `deps` is `[]`). Used in `Module` to call `scorm.init()` exactly once.

/ `useContext(ctx)`: Reads a value from a *Context* provider higher in the
  component tree. This is how child components (`IntroSlide`, `Quiz`, etc.)
  access shared state without passing props through every level.

=== Context (shared state)

The `Module` component creates a context and wraps its children in a
`<ModuleContext.Provider>`. Any descendant can call `useModule()` to get the
shared state and actions:

```jsx
// In Module.jsx
const ModuleContext = createContext(null);
export function useModule() {
  return useContext(ModuleContext);
}

// In any slide
const { next, quizAnswers } = useModule();
```

This is the Preact equivalent of a global store. Every slide and component can
read the current slide index, quiz state, and media progress, and can call
actions like `next()`, `selectAnswer()`, or `finish()` without the parent
having to pass them down explicitly.

// ─────────────────────────────────────────────
== scorm-again — SCORM Runtime
// ─────────────────────────────────────────────

`scorm-again` is a JavaScript library that implements the SCORM 2004 API. It
serves two purposes in this project:

+ *Development fallback* — When you run the course locally (outside an LMS),
  there is no SCORM API available. `scorm-again` provides a mock API so the
  course runs without errors. Calls to `Initialize`, `SetValue`, and
  `Terminate` succeed silently.

+ *API type reference* — The library's `Scorm2004API` class follows the exact
  SCORM 2004 specification, so importing it ensures the code uses the correct
  method signatures.

When the course is loaded inside an LMS, the LMS provides its own `API_1484_11`
object on the parent window. The `findAPI` function in `scorm.js` detects this
and uses the real LMS API instead of the mock. See @scorm-lifecycle for the
full flow.

// ═════════════════════════════════════════════
= Project Structure
// ═════════════════════════════════════════════

```
scorm-test/
├── module.config.js            ← course metadata (title, pass rate, SCORM version)
├── vite.config.js              ← build configuration
├── package.json                ← dependencies and npm scripts
│
├── plugins/
│   └── vite-plugin-scorm-manifest.js   ← generates imsmanifest.xml at build time
│
├── public/                     ← static assets, copied as-is into dist/
│   ├── video.mp4
│   ├── bg.png
│   ├── bg_welcome.png
│   └── logo.svg
│
├── src/
│   ├── index.html              ← HTML shell (Vite entry point)
│   ├── index.jsx               ← mounts the Preact app
│   ├── index.css               ← vanilla CSS styles
│   ├── App.jsx                 ← course structure (which slides, in what order)
│   ├── scorm.js                ← SCORM API wrapper
│   │
│   ├── components/
│   │   ├── Module.jsx          ← state management + SCORM lifecycle
│   │   ├── Slide.jsx           ← visual container (background + overlay)
│   │   ├── Button.jsx          ← styled button
│   │   ├── Video.jsx           ← HTML5 video player
│   │   ├── Quiz.jsx            ← multi-question quiz engine
│   │   ├── Score.jsx           ← pass/fail display
│   │   └── index.js            ← barrel re-exports
│   │
│   └── slides/
│       ├── IntroSlide.jsx      ← welcome screen
│       ├── VideoSlide.jsx      ← video lesson
│       ├── QuizSlide.jsx       ← assessment
│       └── OutroSlide.jsx      ← results + course completion
│
├── dist/                       ← build output (generated)
│   ├── imsmanifest.xml
│   ├── index.html
│   ├── app.js
│   ├── index.css
│   └── ... (copied public assets)
│
└── scorm.zip                   ← packaged SCORM module (generated)
```

// ─────────────────────────────────────────────
== What each layer does
// ─────────────────────────────────────────────

/ `module.config.js`: Single source of truth. The Vite plugin reads it to
  generate the manifest. The `Module` component reads it at runtime for the
  pass rate. Edit this file to change the course title, identifier, or pass
  threshold.

/ `plugins/vite-plugin-scorm-manifest.js`: A Vite plugin that runs after the
  build finishes. It walks the `dist/` directory, collects every file, and
  writes an `imsmanifest.xml` that lists them. This means you never edit the
  manifest by hand — add a file to `public/` or `src/` and it will
  automatically appear in the manifest after the next build.

/ `src/scorm.js`: A thin wrapper around the raw SCORM API. Instead of calling
  `api.SetValue("cmi.completion_status", "completed")` everywhere, components
  call `scorm.setStatus("completed")`. This keeps SCORM details out of the UI
  code.

/ `src/components/Module.jsx`: The brain of the course. It holds all state
  (current slide, quiz answers, media completion), initialises the SCORM
  session on mount, and exposes actions (`next`, `prev`, `finish`, etc.)
  through context.

/ `src/slides/*.jsx`: Pure content. Each slide imports components, pulls
  actions from context via `useModule()`, and returns JSX. Adding a new slide
  means writing a new file here and adding one line to `App.jsx`.

// ═════════════════════════════════════════════
= How It Works Under the Hood
// ═════════════════════════════════════════════

// ─────────────────────────────────────────────
== Build Pipeline
// ─────────────────────────────────────────────

When you run `npm run build`, three things happen in sequence:

+ *Vite build* (`vite build`) \
  Vite reads `src/index.html`, follows the `<script>` tag to `index.jsx`,
  resolves every `import`, compiles JSX to JavaScript, bundles CSS, tree-shakes
  unused code, and writes the result to `dist/`. Files in `public/` are copied
  unchanged.

+ *Manifest generation* (Vite plugin) \
  After Vite writes the bundle, the `writeBundle` hook in the SCORM manifest
  plugin fires. It walks `dist/`, builds a list of every file, and writes
  `imsmanifest.xml`.

+ *Zip packaging* (`cd dist && zip -r ../scorm.zip .`) \
  The shell command zips the entire `dist/` folder. The zip has
  `imsmanifest.xml` at its root, which is a hard requirement for SCORM — the
  LMS looks for it there.

The `build:html` script runs only step 1 and 2 (no zip), which is useful
during development when you want to inspect the output without packaging.

// ─────────────────────────────────────────────
== The Manifest (imsmanifest.xml)
// ─────────────────────────────────────────────

SCORM requires every package to contain an `imsmanifest.xml` at the root of
the zip. This file tells the LMS:

- *What the course is called* (the `<title>` element)
- *Which file to open* (the `href` on the `<resource>`)
- *What files exist* (the `<file>` elements)
- *What type of content it is* (`adlcp:scormType="sco"` marks it as a
  Shareable Content Object — interactive content that communicates with the
  LMS, as opposed to a static asset)

The plugin generates a deliberately simple manifest with a single organisation
containing a single item pointing to a single resource. No sequencing rules, no
navigation constraints. This is intentional: complex sequencing is poorly
supported across LMS platforms (TalentLMS in particular).

// ─────────────────────────────────────────────
== SCORM Lifecycle <scorm-lifecycle>
// ─────────────────────────────────────────────

This is the sequence of events from the moment the LMS opens the course to the
moment the learner finishes.

=== 1. LMS loads the content

The LMS extracts `scorm.zip`, reads `imsmanifest.xml`, and opens `index.html`
in an iframe. Before loading the iframe, the LMS attaches a JavaScript object
called `API_1484_11` to the parent window. This object is the SCORM 2004
runtime — the communication channel between the course and the LMS.

=== 2. API detection

When `scorm.js` is first imported, `findAPI()` runs. It walks up the
`window.parent` chain (and checks `window.opener`) looking for `API_1484_11`.
If found, it uses the real LMS API. If not (local development), it falls back
to a `scorm-again` mock:

```js
const api =
  findAPI(window) || new Scorm2004API({ autocommit: true, logLevel: 4 });
```

=== 3. Initialisation

`Module.jsx` calls `scorm.init()` when it mounts. This:

+ Calls `api.Initialize("")` — opens the SCORM session.
+ Sets `cmi.completion_status` to `"incomplete"`.
+ Sets `cmi.success_status` to `"unknown"`.
+ Sets `cmi.exit` to `"suspend"` — tells the LMS that if the learner leaves
  now, they are suspending (not finishing).
+ Calls `api.Commit("")` — flushes the data to the LMS.

=== 4. Navigation

Each time the learner advances to a new slide, `Module.next()` updates the
local state _and_ calls `scorm.setLocation(slideIndex)`. This writes to
`cmi.location`, which the LMS stores. If the learner exits and re-enters the
course, `scorm.getLocation()` could retrieve this value to resume from where
they left off. (Resume is not yet wired up in this POC but the data is there.)

=== 5. Completion

When the learner clicks "Complete Course" on the outro slide,
`Module.finish()` runs:

```js
finish: () => {
  const score = context.getScore();   // calculate percentage from quiz answers
  scorm.complete(score, passRate);    // batch-set score + status + exit
  scorm.finish();                     // terminate the SCORM session
}
```

`scorm.complete()` does all the heavy lifting in a single commit:

```js
complete(score, passingScore = 70) {
  api.SetValue("cmi.score.scaled", String(score / 100));  // 0.0–1.0
  api.SetValue("cmi.score.raw", String(score));            // 0–100
  api.SetValue("cmi.score.min", "0");
  api.SetValue("cmi.score.max", "100");
  api.SetValue("cmi.completion_status", "completed");
  api.SetValue("cmi.success_status", score >= passingScore ? "passed" : "failed");
  api.SetValue("cmi.exit", "normal");
  api.Commit("");
}
```

All `SetValue` calls happen before the single `Commit`. This batching is
important — some LMS platforms (including TalentLMS) can misinterpret rapid
sequential commits.

`scorm.finish()` then calls `api.Terminate("")`, which closes the session. The
LMS records the final data.

=== CMI data model summary

#table(
  columns: (auto, 1fr),
  inset: 6pt,
  [*CMI Field*], [*Purpose*],
  [`cmi.completion_status`], [Has the learner finished? `"incomplete"` or `"completed"`.],
  [`cmi.success_status`], [Did they pass? `"unknown"`, `"passed"`, or `"failed"`.],
  [`cmi.score.raw`], [Score as a number from 0 to 100.],
  [`cmi.score.scaled`], [Score as a decimal from 0.0 to 1.0.],
  [`cmi.score.min` / `max`], [The valid score range (always 0–100 here).],
  [`cmi.location`], [Bookmark string. We store the slide index.],
  [`cmi.exit`], [`"suspend"` (mid-course) or `"normal"` (finished).],
)

// ─────────────────────────────────────────────
== Score Calculation
// ─────────────────────────────────────────────

Each quiz question has an ID in the format `q-{index}-{correctAnswerIndex}`.
For example, question 0 with the correct answer at index 1 gets the ID
`q-0-1`.

When the learner submits an answer, two things are recorded:
- `quizAnswers["q-0-1"] = 1` — the index they selected.
- `quizSubmitted["q-0-1"] = true` — they pressed submit.

`getScore()` iterates over all submitted question IDs, extracts the correct
answer index from the ID string, compares it to the selected answer, counts
how many match, and returns a percentage:

```js
getScore: () => {
  const submitted = Object.keys(quizSubmitted);
  if (submitted.length === 0) return 0;
  const correct = submitted.filter((qId) => {
    const correctIndex = parseInt(qId.split("-").pop(), 10);
    return quizAnswers[qId] === correctIndex;
  }).length;
  return Math.round((correct / submitted.length) * 100);
}
```

// ═════════════════════════════════════════════
= Authoring Guide
// ═════════════════════════════════════════════

This section explains how to modify course content without needing to
understand the framework internals.

// ─────────────────────────────────────────────
== Changing Course Metadata
// ─────────────────────────────────────────────

Edit `module.config.js`:

```js
export default {
  title: "Health and Safety Training",     // shown in the LMS course list
  identifier: "com.example.health-safety", // unique ID for the LMS
  version: "1.0",                          // version string
  passRate: 100,                           // minimum % to pass (0–100)
  scorm: {
    version: "2004 4th Edition",
    completionSetByContent: true,
    objectiveSetByContent: true,
  },
};
```

The `passRate` is used at runtime to determine pass/fail. Everything else is
written into the manifest at build time.

// ─────────────────────────────────────────────
== Editing Slide Content
// ─────────────────────────────────────────────

Each slide is a file in `src/slides/`. A slide is a function that returns JSX
wrapped in a `<Slide>` component:

```jsx
import { Slide, Button, useModule } from "../components";

export default function IntroSlide() {
  const { next } = useModule();

  return (
    <Slide bg="./bg_welcome.png">
      <img src="./logo.svg" alt="Logo" class="slide-logo" />
      <h1 class="slide-title">Health and Safety Training</h1>
      <p class="slide-subtitle">
        Complete this course to learn essential workplace safety practices.
      </p>
      <Button large onClick={next}>
        Start Course
      </Button>
    </Slide>
  );
}
```

To change the text, edit the JSX directly. The `bg` prop sets a background
image (the path is relative to `public/`). If you omit `bg`, the slide has a
plain dark background with no overlay.

`useModule()` gives you access to navigation (`next`, `prev`) and state. Call
`next` when the learner should advance.

// ─────────────────────────────────────────────
== Adding a New Slide
// ─────────────────────────────────────────────

+ Create a new file in `src/slides/`, e.g. `TipsSlide.jsx`:

  ```jsx
  import { Slide, Button, useModule } from "../components";

  export default function TipsSlide() {
    const { next } = useModule();

    return (
      <Slide bg="./bg.png">
        <h2 class="slide-title-md">Safety Tips</h2>
        <ul class="slide-subtitle" style="text-align: left; list-style: disc; padding-left: 1.5rem;">
          <li>Always wear your PPE</li>
          <li>Report hazards immediately</li>
          <li>Know your emergency exits</li>
        </ul>
        <Button onClick={next}>Continue</Button>
      </Slide>
    );
  }
  ```

+ Import it in `App.jsx` and add it to the `<Module>` children:

  ```jsx
  import TipsSlide from "./slides/TipsSlide";

  export default function App() {
    return (
      <Module>
        <IntroSlide />
        <VideoSlide src="./video.mp4" />
        <TipsSlide />              // ← new slide
        <QuizSlide questions={questions} graded={true} passRate={100} />
        <OutroSlide />
      </Module>
    );
  }
  ```

The order of children inside `<Module>` determines the slide order. The
`Module` component counts them automatically — no index configuration needed.

// ─────────────────────────────────────────────
== Editing Quiz Questions
// ─────────────────────────────────────────────

Questions are defined as a plain object in `App.jsx`:

```js
const questions = {
  "What is the first step when you discover a fire?": {
    options: [
      "Run outside immediately",
      "Activate the nearest fire alarm",
      "Try to extinguish it yourself",
      "Call a colleague",
    ],
    correct: 1,   // index of the correct option (0-based)
  },
  // ... more questions
};
```

Each key is the question text. The value contains an `options` array and a
`correct` index pointing to the right answer.

To add a question, add another key. To remove one, delete it. To change the
number of options, just change the array — the quiz component renders however
many options are present.

The questions object is passed to `<QuizSlide>` as a prop:

```jsx
<QuizSlide questions={questions} graded={true} passRate={100} />
```

/ `graded`: Whether the quiz counts toward the score (reserved for future use).
/ `passRate`: The pass threshold for this quiz (the `module.config.js` pass
  rate is used for the overall SCORM report; this prop is available for
  per-quiz logic if needed).

// ─────────────────────────────────────────────
== Adding or Replacing Media
// ─────────────────────────────────────────────

Drop files into `public/`. They will be copied to `dist/` at build time and
can be referenced with relative paths (`./filename.ext`) from any component.

To replace the video, put a new `.mp4` in `public/` and update the `src` prop
in `App.jsx`:

```jsx
<VideoSlide src="./new-video.mp4" />
```

To replace a background image, drop the new image in `public/` and update the
`bg` prop on the relevant `<Slide>`:

```jsx
<Slide bg="./new-background.jpg">
```

// ─────────────────────────────────────────────
== Customising Styles
// ─────────────────────────────────────────────

All styles are defined in `src/index.css` using vanilla CSS. The stylesheet
uses semantic class names that map to specific UI components.

=== Available CSS classes

#table(
  columns: (auto, 1fr),
  inset: 6pt,
  [*Class*], [*Purpose*],
  [`.slide`], [Full-viewport slide container with centred content],
  [`.slide-overlay`], [Semi-transparent dark overlay for background images],
  [`.slide-content`], [Content wrapper with padding and max-width],
  [`.slide-title`], [Large title (2.25rem, weight 900)],
  [`.slide-title-lg`], [Medium-large title (1.875rem, weight 900)],
  [`.slide-title-md`], [Medium title (1.5rem, weight 700)],
  [`.slide-subtitle`], [Subtitle text with reduced opacity],
  [`.slide-logo`], [Logo sizing (6rem × 6rem)],
  [`.btn`], [Primary button with gradient background],
  [`.btn-large`], [Larger button variant],
  [`.video-player`], [Video element with rounded corners and shadow],
  [`.quiz-*`], [Quiz-related styles (container, progress, question, options, answer, actions)],
  [`.score-*`], [Score display styles (container, value, status, passrate)],
)

=== Modifying styles

Edit `src/index.css` directly. For example, to change the button colour:

```css
.btn {
  background: linear-gradient(to right, #10b981, #059669); /* green gradient */
}

.btn:hover {
  background: linear-gradient(to right, #059669, #047857);
}
```

=== Adding inline styles

For one-off styling, use the `style` prop in JSX:

```jsx
<h1 class="slide-title" style="color: #fbbf24;">Yellow Title</h1>
```

=== Adding new classes

Add new rules to `index.css`:

```css
.highlight-box {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
}
```

Then use it in JSX: `<div class="highlight-box">...</div>`.

// ═════════════════════════════════════════════
= The Vite Plugin (Manifest Generator)
// ═════════════════════════════════════════════

The manifest plugin is a small Node.js module that hooks into Vite's build
lifecycle. Here is how it works step by step.

=== Plugin structure

A Vite plugin is an object with a `name` and one or more hook functions. This
plugin uses `writeBundle`, which fires after Vite has written all output files
to disk:

```js
export default function scormManifest(config) {
  return {
    name: "vite-plugin-scorm-manifest",
    writeBundle(options) {
      // options.dir is the absolute path to dist/
    },
  };
}
```

=== File collection

`collectFiles()` recursively walks the output directory and returns an array of
relative paths, skipping `imsmanifest.xml` itself (to avoid listing the
manifest inside the manifest):

```js
function collectFiles(dir, base) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const rel = relative(base, full);
    if (statSync(full).isDirectory()) {
      files = files.concat(collectFiles(full, base));
    } else if (entry !== "imsmanifest.xml") {
      files.push(rel);
    }
  }
  return files;
}
```

=== XML generation

The collected file paths are mapped into `<file href="..."/>` elements and
inserted into an XML template string. The template uses values from
`module.config.js` (title, identifier, SCORM version) and escapes them for XML
safety.

The resulting manifest has a single `<organization>` with a single `<item>`,
pointing to a single `<resource>` of type `sco` with `index.html` as the entry
point. This flat, simple structure is the most widely compatible layout across
LMS platforms.

// ═════════════════════════════════════════════
= Component Reference
// ═════════════════════════════════════════════

A quick reference for each component's purpose and props.

=== `<Module>`

Wraps all slides. Provides context, manages state, handles SCORM init/finish.
Takes no props — configuration comes from `module.config.js`.

=== `<Slide bg?>`

Visual container. Fills the viewport, applies a background image (if `bg` is
provided) with a dark overlay, and centres its children.

/ `bg` _(optional string)_: Path to a background image.

=== `<Button large? ...props>`

Styled button. Passes all extra props (like `onClick`, `disabled`) to the
underlying `<button>`.

/ `large` _(optional bool)_: Increases padding and font size.

=== `<Video src onEnded?>`

HTML5 video player with controls.

/ `src` _(string)_: Path to the video file.
/ `onEnded` _(optional function)_: Called when the video finishes playing.

=== `<Quiz questions graded? passRate?>`

Renders one question at a time with multiple-choice answers. Handles selection,
submission, correct/incorrect feedback, and question navigation internally.

/ `questions` _(object)_: The questions object (see the "Editing Quiz Questions" section).
/ `graded` _(bool)_: Reserved for future use.
/ `passRate` _(number)_: Reserved for per-quiz pass logic.

=== `<Score score passRate>`

Displays a score percentage with pass/fail colouring.

/ `score` _(number)_: The score to display (0–100).
/ `passRate` _(number)_: The threshold for pass/fail colouring.

// ═════════════════════════════════════════════
= NPM Scripts
// ═════════════════════════════════════════════

#table(
  columns: (auto, 1fr),
  inset: 6pt,
  [*Command*], [*What it does*],
  [`npm run dev`], [Starts the Vite dev server. Open the URL it prints to preview the course in your browser. Changes to source files are reflected instantly.],
  [`npm run build:html`], [Compiles the source into `dist/` and generates `imsmanifest.xml`. Does not create a zip. Useful for inspecting the output.],
  [`npm run build`], [Runs `build:html`, then zips `dist/` into `scorm.zip` at the project root. This zip is the file you upload to your LMS.],
)

// ═════════════════════════════════════════════
= Data Flow Diagram
// ═════════════════════════════════════════════

The following describes how data moves through the system at runtime:

```
┌─────────────┐
│   LMS        │  provides API_1484_11 on parent window
│  (TalentLMS) │
└──────┬───────┘
       │ iframe
       ▼
┌──────────────────────────────────────────────────────┐
│  index.html → app.js                                 │
│                                                      │
│  ┌────────┐     ┌────────────┐     ┌──────────────┐ │
│  │ scorm.js│◄───│ Module.jsx  │────►│ Slide        │ │
│  │         │    │ (state +    │     │ Components   │ │
│  │ findAPI │    │  context)   │     │              │ │
│  │ init    │    │             │     │ IntroSlide   │ │
│  │ commit  │    │ currentSlide│     │ VideoSlide   │ │
│  │ finish  │    │ quizAnswers │     │ QuizSlide    │ │
│  └────┬────┘    │ mediaComplete     │ OutroSlide   │ │
│       │         └────────────┘     └──────────────┘ │
│       ▼                                              │
│  API_1484_11                                         │
│  .Initialize()  .SetValue()  .Commit()  .Terminate() │
└──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   LMS        │  stores cmi.score, cmi.completion_status, etc.
└─────────────┘
```

// ═════════════════════════════════════════════
= Troubleshooting
// ═════════════════════════════════════════════

/ *Course shows "incomplete" in the LMS after finishing*: The `Terminate` call
  may not have reached the LMS. Check the browser console for errors in
  `scorm.finish()`. Make sure the learner clicks "Complete Course" and does not
  just close the browser tab.

/ *Score shows 0% in the LMS*: Verify that `complete()` is being called with
  the correct score. Open the browser dev tools, go to the Console tab, and
  look for scorm-again debug output (it logs at level 4 in dev mode).

/ *Build fails with "Missing specifier" for scorm-again*: The import path
  changed in v3. Use `import { Scorm2004API } from "scorm-again/scorm2004"`
  (named export from a subpath), not the old `scorm-again/src/Scorm2004API`.

/ *LMS cannot import the zip*: Verify that `imsmanifest.xml` is at the root of
  the zip, not inside a subfolder. Run `unzip -l scorm.zip` to check.
