<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Alias Bootstrap Design

## Problem

The plugin injects a `Git aliases:` list with every session bootstrap. It appends the list after `</EXTREMELY_IMPORTANT>`, so the aliases read as passive text. The agent then follows canonical git commands in the skills and expands the aliases.

## Decisions

- `buildAliasBlock` ends with the imperative `Use these aliases for every matching git command. Do not expand them.`
- `buildSessionBootstrap` places every block inside the `<EXTREMELY_IMPORTANT>` wrapper.
- The one-time bootstrap marker stays unchanged. Repeated context calls still skip injection.
- Skills use a curated alias wherever the example has an exact equivalent. Commands with extra flags stay canonical.
- Static tests pin the wrapper order, the imperative, and the skill examples. No eval is added.
- Version moves to `26.11.32`. The catalog is regenerated.

## Non-goals

- No re-injection after compaction. The loaded skill carries the standing rule.
- No new config key, alias, tool, or schema.
- No change to alias reading, classification, or installation.
