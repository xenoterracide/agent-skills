<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Contributing to Subtree AI

Thank you for contributing to the `xenoterracide-agent-skills` plugin. This
document covers the workflow for human contributors.

<<<<<<< before updating
## Getting Started
=======
    git clone <repo-url>
    cd <project>
    npm run contribute
>>>>>>> after updating

Heal the toolchain and configure git hooks:

```bash
pnpm contribute
```

This runs `.config/git/hooks/heal.sh`: `asdf install`, corepack bootstrap,
`pnpm install --frozen-lockfile`, `uv sync --frozen`, and the
`core.hooksPath` config. Without direnv or pnpm, run the healer directly:

<<<<<<< before updating
```bash
sh .config/git/hooks/heal.sh
```
=======
    uv run --group dev copier update --trust
>>>>>>> after updating

With direnv, entering the repository runs `.envrc`, which calls the same
healer.

Existing clones that last pulled before the hooks moved to
`.config/git/hooks` have a stale `core.hooksPath`: run
`sh .config/git/hooks/heal.sh` once to repoint it.

## Making Changes

1. Read `README.md` and `AGENTS.md` first.
2. Load the relevant skills for your task.
3. Follow the conventional commit format defined in
   `git-conventional-commits.yaml`.
4. Keep skills concise; put heavy reference material in a `references/`
   directory.
5. Update `AGENTS.md` when you change workflows, tools, file layouts, skill
   conventions, or licensing.
6. Update `CONTRIBUTING.md` when you change contributor-facing workflows.

## Linting and Formatting

Run all checks before pushing:

```bash
pnpm lint
```

Format a single file with Prettier:

```bash
pnpm exec prettier --write <file>
```

## Testing

Tests are TypeScript — `*.test.ts` under `vitest`. Reserve `*.mjs` for
files `node` executes directly, like `scripts/generate-skill-catalog.mjs`.

```bash
pnpm check        # typecheck + eslint + catalog + tests
pnpm test         # plugin (node) and unit (vitest) tests
pnpm typecheck    # tsc --noEmit
pnpm lint:eslint  # ESLint only
pnpm evals        # helper unit tests and skill evals
```

Skill trigger evals live in `skills/<skill>/tests/evals.test.ts`. Each case
forks a real agent session in a sandbox and passes only when the skill loads in
all three runs. Evals are on demand and never run in CI; `EVAL_MODEL` and
`EVAL_ITERATIONS` override the defaults. The suite bails at the first failure.

Before opening a PR, also validate YAML frontmatter, confirm Prettier passes,
and run any changed examples manually.

## Pull Requests

This repository uses squash merge.

- Commit additional changes to the same PR branch.
- PR titles must follow conventional commit format.
- PR descriptions must explain why the change exists.
- Use plain bullets, not checkboxes, in PR descriptions.

## License

By contributing, you agree that your contributions will be licensed under the
same license as the files you modify:

- Skills and documentation: CC-BY-NC-SA-4.0
- Configuration files: CC0-1.0
