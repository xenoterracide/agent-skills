---
name: contributing-creator
description: |
  Use when creating, updating, or reviewing `CONTRIBUTING.md` files. Use when
  documenting setup, build, test, lint, and pull request workflows for human
  contributors.
license: CC-BY-NC-SA-4.0
metadata:
  author: Caleb Cushing <caleb.cushing@gmail.com>
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Contributing Creator

Guidance for creating and maintaining `CONTRIBUTING.md` files.

## Overview

`CONTRIBUTING.md` is for human contributors. It documents how to set up a
development environment, run checks, and submit changes.

## What Belongs in CONTRIBUTING.md

- Development environment setup commands
- How to build, test, and lint
- Conventional commit and branch workflow
- Pull request expectations
- Community or governance notes for humans

## What Does NOT Belong in CONTRIBUTING.md

- Agent-specific instructions → `AGENTS.md`
- End-user installation and usage → `README.md`
- High-churn command output or screenshots

## Template

A minimal `CONTRIBUTING.md`:

````markdown
<!--
SPDX-FileCopyrightText: Copyright © 2026 Author Name

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Contributing

## Setup

```bash
yarn install
```

## Build, Test, and Lint

```bash
yarn test
yarn lint
```

## Pull Requests

- Follow conventional commits.
- Squash merge is used.
- Do not force push.

## License

By contributing, you agree to license your work under the project's license.
````

## Format

- Keep it concise and task-oriented
- Use code blocks for commands
- Link to `README.md` and `AGENTS.md` for related guidance
- Include SPDX copyright and license identifiers

## Maintenance Rule

If you modify contributor-facing workflows, tools, or commands, update
`CONTRIBUTING.md` in the same change. Do not let contributor instructions drift
out of sync with the project.
