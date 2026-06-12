<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Contributing to Subtree AI

Thank you for contributing to the `xenoterracide-agent-skills` plugin. This
document covers the workflow for human contributors.

## Getting Started

Install dependencies and configure git hooks:

```bash
yarn contribute
```

This runs `uv sync --frozen` and sets `core.hooksPath` to `.share/git/hooks`.

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
yarn lint
```

Format a single file with Prettier:

```bash
yarn exec prettier --write <file>
```

## Testing

```bash
yarn test
```

Skill files are documentation and have no automated tests. Verify them by:

- Validating YAML frontmatter
- Confirming Prettier formatting passes
- Running commands or examples manually

## Pull Requests

This repository uses squash merge.

- Do not force push.
- Use `git merge origin/develop` to update your branch.
- Commit additional changes to the same PR branch.
- PR titles must follow conventional commit format.
- PR descriptions must explain why the change exists.
- Use plain bullets, not checkboxes, in PR descriptions.

## License

By contributing, you agree that your contributions will be licensed under the
same license as the files you modify:

- Skills and documentation: CC-BY-NC-SA-4.0
- Configuration files: CC0-1.0
