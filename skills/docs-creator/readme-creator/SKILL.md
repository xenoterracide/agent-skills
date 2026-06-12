---
name: readme-creator
description: |
  Use when creating, updating, or reviewing `README.md` files. Use when deciding
  whether content belongs in `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, or
  another document.
license: CC-BY-NC-SA-4.0
metadata:
  author: Caleb Cushing <caleb.cushing@gmail.com>
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# README Creator

Guidance for creating and maintaining `README.md` files.

## Overview

`README.md` is the first thing humans read. It should explain what the project
is, how to install and use it, and where to find more information.

## What Belongs in README.md

- Project name and one-line description
- Installation and basic usage instructions
- Link to full documentation or examples
- Link to `AGENTS.md` for agent-specific guidance
- Link to `CONTRIBUTING.md` for human contributors
- License summary and link

## What Does NOT Belong in README.md

- Agent-specific instructions → `AGENTS.md`
- Contributor workflow details → `CONTRIBUTING.md`
- Detailed API documentation → dedicated docs or `--help`
- Temporary or high-churn notes

## Template

A minimal `README.md`:

````markdown
<!--
SPDX-FileCopyrightText: Copyright © 2026 Author Name

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Project Name

One-line description.

## Installation

```bash
npm install package-name
```

## Usage

Brief example or link to docs.

## Development

- See `AGENTS.md` for agent guidance.
- See `CONTRIBUTING.md` for human contributors.

## License

[CC-BY-NC-SA-4.0](LICENSES/CC-BY-NC-SA-4.0.txt)
````

## Format

- Lead with the most important information
- Keep the first screen concise
- Use clear headings and short paragraphs
- Include SPDX copyright and license identifiers

## Maintenance Rule

If you modify project purpose, installation, usage, or related docs, update
`README.md` in the same change. If the change affects agents or contributors,
also update `AGENTS.md` or `CONTRIBUTING.md`.
