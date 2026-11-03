<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Static Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt ghb's ESLint configuration, pin TypeScript 6, and make CI run typecheck, lint, and tests through `pnpm check`.

**Architecture:** ESLint 10 with `typescript-eslint` strict type-checked rules lints TS/JS, JSON, and Markdown. A lint-only `tsconfig.eslint.json` feeds the parser. A shared `pnpm.yml` workflow runs `pnpm check`; the existing prettier and license jobs keep covering formatting and REUSE.

**Tech Stack:** pnpm, TypeScript 6.0.x, ESLint 10, typescript-eslint 8, `@eslint/json`, `@eslint/markdown`, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-02-static-analysis-design.md`

## Global Constraints

- Work on `feat/skill-evals` (PR #196); `develop` still uses Yarn.
- `typescript`: `~6.0.3`. Do not use `^6.0.3`; it allows 6.1 and breaks the `typescript-eslint` peer.
- `eslint`: `^10.0.0`, `@eslint/js`: `^10.0.0`, `@eslint/json`: `^2.0.0`, `@eslint/markdown`: `^8.0.0`, `globals`: `^17.0.0`, `typescript-eslint`: `^8.0.0`, `jiti`: `^2.0.0`.
- `pnpm check` must not run `lint:reuse` or `lint:prettier`; the shared `pnpm.yml` has no `uv`.
- `tsconfig.eslint.json` uses `moduleResolution: "Bundler"`; the repo's imports omit extensions.
- Do not add ESLint to `lint-staged` in this plan.

## Review Focus

- TypeScript 6 defaults `types` to `[]`; `process` and `import.meta.dirname` must still typecheck.
- `strict-boolean-expressions` rejects `Number(...) || 3` and nullable checks in `scripts/eval-helpers.ts`.
- `explicit-function-return-type` rejects arrow callbacks in the eval tests.
- Markdown lint runs over every skill doc and may reject existing authoring.
- The CI job must not depend on `uv`, `shfmt`, or anything only the other workflows install.

---

### Task 1: Sync the branch and pin TypeScript 6

**Files:**

- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `pnpm-lock.yaml` (generated)

**Interfaces:**

- Produces: `pnpm exec tsc --version` reports `6.0.x`; `pnpm typecheck` still exits 0.

- [ ] **Step 1: Merge the one commit `develop` has that the branch lacks**

```bash
git fetch origin
git merge origin/develop
```

Expected: a merge commit or a fast-forward; `git status` clean.

- [ ] **Step 2: Pin TypeScript 6 in `package.json`**

Change `"typescript": "v7"` to:

```json
"typescript": "~6.0.3",
```

- [ ] **Step 3: Add explicit Node types to `tsconfig.json`**

Add `"types": ["node"]` inside `compilerOptions`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "types": ["node"]
  },
  "include": ["scripts/**/*.ts", "skills/**/tests/**/*.ts", "vitest.config.ts"]
}
```

- [ ] **Step 4: Install and verify**

```bash
pnpm install
pnpm exec tsc --version
pnpm typecheck
```

Expected: `tsc --version` prints `6.0.3`; `pnpm typecheck` exits 0.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json
git commit -m "build: pin typescript 6 for eslint compatibility"
```

---

### Task 2: Add the lint-only tsconfig and ESLint config

**Files:**

- Create: `tsconfig.eslint.json`
- Create: `eslint.config.cts`
- Modify: `tsconfig.json`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml` (generated)

**Interfaces:**

- Produces: `pnpm exec eslint <file>` exits 0 or reports violations; `tsconfig.eslint.json` covers every linted `.ts`/`.cts` file.

- [ ] **Step 1: Add the ESLint dev dependencies**

Add to `devDependencies`:

```json
"@eslint/js": "^10.0.0",
"@eslint/json": "^2.0.0",
"@eslint/markdown": "^8.0.0",
"eslint": "^10.0.0",
"globals": "^17.0.0",
"jiti": "^2.0.0",
"typescript-eslint": "^8.0.0"
```

Run:

```bash
pnpm install
```

- [ ] **Step 2: Create `tsconfig.eslint.json`**

```jsonc
// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: CC0-1.0

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"],
  },
  "include": ["eslint.config.cts", "vitest.config.ts", "scripts/**/*.ts", "skills/**/tests/**/*.ts"],
}
```

- [ ] **Step 3: Add the new config to the typecheck project**

Add `"eslint.config.cts"` to the `include` array in `tsconfig.json` so
`pnpm typecheck` covers it too.

- [ ] **Step 4: Create `eslint.config.cts`**

```ts
// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import eslint from "@eslint/js";
import jsonPluginImport from "@eslint/json";
import markdown from "@eslint/markdown";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const jsonPlugin = (jsonPluginImport as { default?: typeof jsonPluginImport }).default ?? jsonPluginImport;

export default defineConfig([
  globalIgnores([
    "node_modules/",
    ".venv/",
    "coverage/",
    "**/dist/",
    "**/build/",
    ".agents/",
    "skills/*/tests/fixtures/",
  ]),
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: globals.node },
    ...eslint.configs.recommended,
  },
  {
    files: ["**/*.{ts,mts,cts}"],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
    rules: {
      "max-params": "off",
      "@typescript-eslint/max-params": "error",
      "default-param-last": "off",
      "@typescript-eslint/default-param-last": "error",
      "no-use-before-define": "off",
      "@typescript-eslint/no-use-before-define": "error",
      "init-declarations": "off",
      "@typescript-eslint/init-declarations": "error",
      "prefer-destructuring": "off",
      "@typescript-eslint/prefer-destructuring": "error",

      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-member-accessibility": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/member-ordering": "error",
      "@typescript-eslint/method-signature-style": "error",
      "@typescript-eslint/no-dupe-class-members": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-invalid-this": "error",
      "@typescript-eslint/no-loop-func": "error",
      "@typescript-eslint/no-redeclare": "error",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unnecessary-parameter-property-assignment": "error",
      "@typescript-eslint/no-unnecessary-qualifier": "error",
      "@typescript-eslint/no-unnecessary-type-arguments": "error",
      "@typescript-eslint/no-useless-empty-export": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  {
    files: ["**/*.json"],
    ignores: ["**/tsconfig.json", "**/tsconfig.*.json"],
    plugins: { json: jsonPlugin },
    language: "json/json",
    ...jsonPlugin.configs.recommended,
  },
  {
    files: ["**/*.json5"],
    plugins: { json: jsonPlugin },
    language: "json/json5",
    ...jsonPlugin.configs.recommended,
  },
  {
    files: ["**/*.jsonc", "**/tsconfig.json", "**/tsconfig.*.json"],
    plugins: { json: jsonPlugin },
    language: "json/jsonc",
    languageOptions: { allowTrailingCommas: true },
    ...jsonPlugin.configs.recommended,
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/gfm",
    extends: [markdown.configs.recommended],
  },
]);
```

- [ ] **Step 5: Run ESLint on one file to confirm the config loads**

```bash
pnpm exec eslint scripts/eval-helpers.test.ts
```

Expected: FAIL with rule violations (the test's arrow functions lack return
types), proving the parser resolved the project.

- [ ] **Step 6: Commit the config**

```bash
git add package.json pnpm-lock.yaml tsconfig.json tsconfig.eslint.json eslint.config.cts
git commit -m "build: add eslint configuration"
```

---

### Task 3: Fix TypeScript and JavaScript lint violations

**Files:**

- Modify: `scripts/eval-helpers.ts`
- Modify: `scripts/eval-helpers.test.ts`
- Modify: `vitest.config.ts`
- Modify: `skills/*/tests/evals.test.ts`
- Modify: any other file `eslint .` reports

**Interfaces:**

- Consumes: `eslint.config.cts` and `tsconfig.eslint.json` from Task 2.
- Produces: `pnpm exec eslint .` exits 0 for all TS/JS files.

- [ ] **Step 1: List the code violations**

```bash
pnpm exec eslint "scripts/**/*.{ts,mjs}" "skills/**/tests/**/*.ts" vitest.config.ts index.js eslint.config.cts 2>&1 | tee /tmp/opencode/eslint.log
```

Expected: violations. Fix them in the following steps.

- [ ] **Step 2: Replace the number truthiness in `vitest.config.ts`**

Replace:

```ts
const iterations = Math.max(1, Number(process.env.EVAL_ITERATIONS ?? 3) || 3);
```

with:

```ts
const configuredIterations = Number(process.env.EVAL_ITERATIONS ?? 3);
const iterations = Number.isNaN(configuredIterations) ? 3 : Math.max(1, configuredIterations);
```

- [ ] **Step 3: Make nullable checks explicit in `scripts/eval-helpers.ts`**

Replace each truthiness check with an explicit comparison:

- `if (configDir)` → `if (configDir !== undefined)`
- `if (fixture)` → `if (fixture !== undefined)`
- `if (rejection)` → `if (rejection !== undefined)`
- `if (result.error)` → `if (result.error !== undefined)`

Also initialize the two `let` declarations, because `@typescript-eslint/init-declarations` is enabled:

```ts
let cachedHarness: string | undefined = undefined;
let configDir: string | undefined = undefined;
```

- [ ] **Step 4: Add return types where ESLint requires them**

Add `: string` to arrow functions in `scripts/eval-helpers.test.ts` and the eval tests that return a transcript; add `: void` where an arrow returns nothing. If `@typescript-eslint/explicit-function-return-type` flags the `HARNESSES` arrows, add `: HarnessCommand` to each.

- [ ] **Step 5: Fix any remaining reported violations**

Apply the rule's suggested fix. Do not disable a rule to silence a real violation; if a rule conflicts with the repo's design, add a scoped `eslint-disable-next-line` with a reason.

- [ ] **Step 6: Verify the code files**

```bash
pnpm exec eslint "scripts/**/*.{ts,mjs}" "skills/**/tests/**/*.ts" vitest.config.ts index.js eslint.config.cts
```

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "style: satisfy strict type-checked eslint rules"
```

---

### Task 4: Fix JSON and Markdown lint violations

**Files:**

- Modify: any file `eslint .` reports under JSON, JSON5, JSONC, or Markdown

**Interfaces:**

- Consumes: the JSON and Markdown blocks from Task 2.
- Produces: `pnpm exec eslint .` exits 0 for every file.

- [ ] **Step 1: List the JSON and Markdown violations**

```bash
pnpm exec eslint "**/*.json" "**/*.json5" "**/*.jsonc" "**/*.md" 2>&1 | tee /tmp/opencode/eslint-docs.log
```

- [ ] **Step 2: Fix each reported issue**

Common fixes: duplicate headings, missing link definitions, table formatting, and stray HTML. If a Markdown rule is incompatible with skill authoring, disable that single rule in the `**/*.md` block with a comment explaining why.

- [ ] **Step 3: Verify**

```bash
pnpm exec eslint .
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: satisfy json and markdown lint rules"
```

---

### Task 5: Add the scripts and CI job

**Files:**

- Modify: `package.json`
- Create: `.github/workflows/check.yml`

**Interfaces:**

- Produces: `pnpm check` runs typecheck, ESLint, and the node tests; the `check` workflow calls the shared `pnpm.yml`.

- [ ] **Step 1: Add the scripts**

```json
"lint:eslint": "eslint .",
"lint": "pnpm lint:eslint && pnpm lint:prettier && pnpm lint:reuse && pnpm skills:check",
"check": "pnpm typecheck && pnpm lint:eslint && pnpm skills:check && pnpm test",
```

- [ ] **Step 2: Create `.github/workflows/check.yml`**

```yaml
# SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
#
# SPDX-License-Identifier: MIT

name: check
on: push
permissions:
  contents: read
jobs:
  check:
    uses: xenoterracide/github/.github/workflows/pnpm.yml@32faaa187d093e99579de530726442b2fd167362 # develop
```

- [ ] **Step 3: Verify locally**

```bash
pnpm check
```

Expected: typecheck, ESLint, and `node --test scripts/*.test.mjs` all pass.

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/check.yml
git commit -m "ci: run typecheck, lint, and tests"
```

---

### Task 6: Update contributor documentation and verify the whole branch

**Files:**

- Modify: `AGENTS.md`
- Modify: `CONTRIBUTING.md`

**Interfaces:**

- Produces: docs list `pnpm check` and `pnpm lint:eslint`; the full local suite passes.

- [ ] **Step 1: Add the new commands**

In `AGENTS.md`, under "Build and Test", add:

```bash
pnpm check                        # typecheck + eslint + tests
pnpm lint:eslint                  # ESLint only
```

In `CONTRIBUTING.md`, change the Testing block to include `pnpm check`.

- [ ] **Step 2: Format the docs**

```bash
pnpm lint:prettier
```

Expected: exit 0.

- [ ] **Step 3: Run the full local suite**

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm check
pnpm test
```

Expected: every command exits 0.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md CONTRIBUTING.md
git commit -m "docs: document the check and eslint commands"
```
