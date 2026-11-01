---
name: version-managers
description: |
  Use when managing or fixing version-manager tooling — asdf (`.tool-versions`),
  corepack (the `packageManager` field, `yarn`/`pnpm` launchers), direnv
  (`PATH`, `.envrc`) — and when a pinned tool stops resolving after a toolchain
  change. Read `references/corepack-troubleshooting.md` for the node-stack
  recovery procedure. Build-file authoring (Gradle/Maven) stays with
  `gradle-creator`.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Version Managers

Conventions and troubleshooting for the tools that pin and launch tool
versions across ecosystems.

## Conventions

- Pin versions in source-of-truth files: `.tool-versions` (asdf, runtimes,
  `nodejs <major.minor.patch>`) and the `packageManager` field in
  `package.json` (Yarn/pnpm, honored by corepack).
- Install launchers per tool, not per version. Keep corepack shims in a stable
  directory outside runtime installs so version upgrades cannot dangle them:

  ```bash
  corepack enable --install-directory ~/.local/bin
  ```

- Node.js ≥ 25 no longer bundles corepack; install it for the active runtime
  with `npm install --global corepack` after any Node switch.
- Never enable corepack into a runtime install's own `bin/`. asdf shims every
  executable there — including corepack's `yarn`/`pnpm` — and those shadowing
  shims break resolution after version changes.
- The same pin-a-tool story applies elsewhere: the Gradle wrapper pins the
  Gradle version for JVM builds. Wrapper problems are this skill's domain;
  build-file authoring is `gradle-creator`'s.

## Troubleshooting

If `yarn` or `pnpm` stops resolving after a runtime or Node version change
(asdf's "No version is set for command yarn", "command not found", or a
dangling shim), read `references/corepack-troubleshooting.md` and apply its
steps in order.
