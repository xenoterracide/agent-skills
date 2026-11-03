<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Package Manager Launcher Troubleshooting

Step-by-step recovery for version-manager toolchain breakage. The parent skill
holds the conventions; apply the steps here in order when `yarn` or `pnpm`
stops resolving after a runtime or Node version change.

## Why it breaks

- Node.js ≥ 25 no longer bundles corepack, so a newly pinned Node version has
  no `yarn` shim at all.
- Corepack shims installed inside a Node version's own `bin/` directory dangle
  or misdirect as soon as the pinned version changes.
- asdf auto-shims every executable inside installed nodejs versions — including
  corepack's `yarn`/`pnpm` — and those shims fail with "No version is set for
  command yarn" because yarn is not an asdf-managed tool.

## Diagnosis

```bash
which yarn                # was it an asdf shim? ~/.asdf/shims/yarn is broken
yarn --version            # what does the failure look like?
asdf list nodejs          # is the .tool-versions pin actually installed?
ls ~/.asdf/installs/nodejs/*/bin | grep -E '^(yarn|pnpm)'   # stale shims?
```

Expected good state: `which yarn` resolves to `~/.local/bin/yarn` and its
version matches the `packageManager` field in `package.json`.

## Fix

Run these in order:

```bash
# 1. Install corepack into the ACTIVE node (required on Node >= 25).
npm install --global corepack

# 2. Point the shims at a stable directory OUTSIDE the node installs, so a
#    later version bump cannot dangle them.
corepack enable --install-directory ~/.local/bin

# 3. Remove stale package-manager shims from every node install, then drop the
#    broken asdf shims that shadowed them.
for d in ~/.asdf/installs/nodejs/*/bin; do
  rm -f "$d/yarn" "$d/yarnpkg" "$d/pnpm" "$d/pnpx"
done
asdf reshim nodejs
```

Step 3 heals already-running shells immediately. For future shells, ensure
`~/.local/bin` precedes `~/.asdf/shims` in `~/.bashrc` and `~/.zshrc`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

That ordering takes effect on the next shell launch and defends against the
shims returning if a plain `corepack enable` is ever run again.

## Keep it fixed after `asdf install nodejs`

Each new Node version needs corepack again. Run after every node install, or
put the equivalent in `.envrc` so direnv re-applies it:

```bash
corepack --version >/dev/null 2>&1 || {
  npm install --global corepack
  asdf reshim nodejs
}
corepack enable --install-directory ~/.local/bin
```

Follow with the step 3 cleanup + `asdf reshim nodejs` whenever a new version
arrives.

## Verify

```bash
which yarn        # ~/.local/bin/yarn
yarn --version    # matches "packageManager" in package.json
```

## Yarn 6 note

Yarn 6 ships Yarn Switch, a Yarn-maintained Rust version manager that replaces
corepack for Yarn (a standalone binary outside the Node installs that still
reads `packageManager`). Until this project moves to it, the steps above keep
`yarn` working on Yarn 4/5 with corepack.
