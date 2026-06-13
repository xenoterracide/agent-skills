---
name: docs-creator
has-sub-skill: true
description: |
  Use when creating or maintaining project documentation and skill files. Use
  when deciding whether guidance belongs in `README.md`, `AGENTS.md`,
  `CONTRIBUTING.md`, or a reusable skill.
license: CC-BY-NC-SA-4.0
metadata:
  author: Caleb Cushing <caleb.cushing@gmail.com>
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Docs Creator

Parent bundle for authoring and maintaining project documentation and skills.

## Sub-Skills

- **`skill-creator`** — Creating and maintaining AI skill definitions
- **`agents-creator`** — Creating and maintaining `AGENTS.md` files
- **`readme-creator`** — Creating and maintaining `README.md` files
- **`contributing-creator`** — Creating and maintaining `CONTRIBUTING.md` files

Load the relevant sub-skill based on the file you are editing.
