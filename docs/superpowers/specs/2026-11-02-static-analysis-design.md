<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# ESLint and TypeScript Configuration Design

## Intent

Adopt the static analysis setup from `../ghb` and make CI run typecheck, lint,
and tests. The repository has a typecheck script but no CI job for it, and no
ESLint at all.

## Goals

1. Run ghb's ESLint 10 + typescript-eslint strict type-checked configuration.
2. Lint TypeScript, JavaScript, JSON/JSON5/JSONC, and Markdown.
3. Make `pnpm check` the single CI entry point for typecheck, lint, and tests.
4. Build on the pnpm migration in PR #196, which is not merged yet.

## Non-goals

- The TypeScript 7 + TypeScript 6 alias. TypeScript 6 is the only compiler.
- Running evals in CI.
- Wiring ESLint into `lint-staged` or the pre-commit hook.
- Publishing a shared config package.

## Constraints

- `develop` still uses Yarn, so this work branches from and lands on
  `feat/skill-evals` (PR #196).
- `typescript-eslint@8` supports `typescript >=4.8.4 <6.1.0`, so pin
  `~6.0.3`; a `^6.0.3` range would allow 6.1 and break the peer.
- The shared `pnpm.yml` workflow does not install `uv`, so `pnpm check` must
  not call `lint:reuse` or `lint:prettier`. Those stay in the existing
  `license.yml` and `prettier.yml` jobs.
- `tsconfig.eslint.json` uses `moduleResolution: "Bundler"` because the repo's
  relative imports omit file extensions.

## Decisions

### TypeScript

Replace `"typescript": "v7"` with `"typescript": "~6.0.3"`. Keep
`pnpm typecheck` as `tsc --noEmit`. Add `"types": ["node"]` to `tsconfig.json`
so Node globals stay visible under TypeScript 6's `types: []` default.

### ESLint

Copy `../ghb/eslint.config.cts` and adapt:

- Remove the `packages/**` relaxations. The repo has no published packages.
- Remove the CLI/`no-console` block. The repo has no CLI entrypoint.
- Add `node_modules/`, `.venv/`, `coverage/`, `**/dist/`, `**/build/`, and
  `skills/*/tests/fixtures/` to `globalIgnores`.
- Keep the type-checked rule list, including
  `@typescript-eslint/strict-boolean-expressions`.
- Keep the JSON, JSON5, JSONC, and Markdown blocks.

### tsconfig.eslint.json

A lint-only project for the parser:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["eslint.config.cts", "vitest.config.ts", "scripts/**/*.ts", "skills/**/tests/**/*.ts"]
}
```

### Scripts

- `lint:eslint`: `eslint .`
- `lint`: `pnpm lint:eslint && pnpm lint:prettier && pnpm lint:reuse && pnpm skills:check`
- `check`: `pnpm typecheck && pnpm lint:eslint && pnpm skills:check && pnpm test`

### CI

Add `.github/workflows/check.yml` calling
`xenoterracide/github/.github/workflows/pnpm.yml@32faaa187d093e99579de530726442b2fd167362`,
which runs `pnpm install --frozen-lockfile` then `pnpm run check`.

### Expected code changes

`strict-boolean-expressions` and `explicit-function-return-type` will require
small edits in `scripts/eval-helpers.ts`, `scripts/eval-helpers.test.ts`,
`vitest.config.ts`, and the eval tests. `vitest.config.ts`'s
`Number(...) || 3` becomes an explicit NaN/range check. Markdown lint may
surface issues in existing docs; fix them rather than narrowing the config.

## Verification

`pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm check`,
`pnpm test`, and a green `check` workflow.

## Risks

- Markdown lint over many skill docs may be noisy. Fix or, if a rule is
  incompatible with skill authoring, disable that rule with a comment.
- TypeScript 6 changes defaults. The explicit `types: ["node"]` covers the
  known one; the typecheck is the check.
