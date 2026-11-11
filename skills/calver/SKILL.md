---
name: calver
description: |
  Use when creating, bumping, or explaining a Calendar Versioning (CalVer)
  version, especially `YY.M.MICRO` or `YY.0M.MICRO`. Invoke when asked how to
  increment a CalVer release, what the next version should be, or whether a
  month segment should be zero-padded.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# CalVer

Trimmed, actionable rules for Calendar Versioning. Canonical spec and other
layouts: https://calver.org

## Preferred schemes

Use `YY.M.MICRO` by default. Avoid zero-padding the month: many tools treat a
leading zero badly.

| Segment | Meaning                                           | Example       |
| ------- | ------------------------------------------------- | ------------- |
| `YY`    | Short year                                        | `26` for 2026 |
| `M`     | Month, 1-12 (no leading zero)                     | `5`, `11`     |
| `0M`    | Month, 01-12 (zero-padded)                        | `05`, `11`    |
| `MICRO` | Release number within that month, starting at `0` | `0`, `1`, `2` |

`YY.0M.MICRO` is a valid CalVer form. If a project already uses `0M`, keep the
padding and do not "fix" it to `M`. Treat the leading zero as intentional, not
a typo, and increment within that form.

## How to increment

1. Determine the release period: `YY` and month for the release.
2. Compare to the current version's period (`YY.M` or `YY.0M`).
3. **Same period:** increment `MICRO` by 1.
4. **New period:** set the new period and reset `MICRO` to `0`.

Examples (`YY.M.MICRO`):

- Same month: `26.11.5` -> `26.11.6`
- Next month: `26.11.6` -> `26.12.0`
- First release of a month: `26.5.0`

Examples (`YY.0M.MICRO`, preserve padding):

- Same month: `26.05.0` -> `26.05.1`
- Next month: `26.05.1` -> `26.06.0`

`MICRO` starts at `0` so the first release in a period behaves like the start of
a SemVer-style patch line, even though the date segments are not semantic
major/minor.

## This repository

This repository uses `YY.M.MICRO` with `MICRO` starting at `0`. Bump the version
in the files that carry it (for example `.kimi-plugin/plugin.json` and
`package.json`) when a change warrants a release, as requested.
