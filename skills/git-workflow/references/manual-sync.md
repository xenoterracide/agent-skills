<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Manual Sync

The guarded manual sequence for syncing a topic branch. Read this only when
`ghb` is unavailable — `ghb pr sync` runs every step in one command. The
sequence syncs against `origin/HEAD`, the remote default branch, whatever
its name.

## Preconditions

- A symbolic remote HEAD: `git symbolic-ref --short
refs/remotes/origin/HEAD` prints `origin/<default>`. A failure means
  detached or missing — a remote branch named `HEAD` causes it in
  checkouts built without a clone — and every `origin/HEAD` below then
  resolves wrong. Fix it first: `git remote set-head origin -a`.
- On the topic branch, not the default branch: read the current branch name.
  It must be non-empty (empty is a detached HEAD) and differ from the default
  branch — `git symbolic-ref --short refs/remotes/origin/HEAD` with its
  `origin/` prefix stripped. Refuse on empty or on a match.
- A remote counterpart: `origin/<branch>` must exist. If it does not, push
  the branch with an upstream first — the comparison steps read
  `origin/<branch>`, and the final push needs its upstream.
- Clean working tree: no modified tracked files. Untracked files do not
  block this check. Commit or stash changes first.

## Sequence

1. Fetch every remote and prune deleted branches. Keep the output quiet. Show
   failures.

2. Compare your branch with its own remote, `origin/<branch>`:

   ```bash
   git rev-list --count HEAD..origin/<branch>
   git rev-list --count origin/<branch>..HEAD
   ```

   Both counts nonzero — the branch diverged from its remote. Refuse;
   repository rules block force push, so recovery is a human decision.

   Only the first nonzero — your local branch is behind its remote. Before
   resetting, list untracked files (`git ls-files --others`) and incoming
   paths (`git diff --name-only HEAD origin/<branch>`); a shared path means
   the reset would overwrite it, so refuse. Otherwise:

   ```bash
   git reset --hard origin/<branch>
   ```

3. Count how far behind the default branch you are:

   ```bash
   git rev-list --count HEAD..origin/HEAD
   ```

   Zero means current; skip to the push.

4. Merge the default branch:

   ```bash
   git merge origin/HEAD
   ```

   On conflict, inspect the working tree. Resolve it, or
   abort and hand the decision to a human.

5. Regenerate lockfiles instead of merging them — delete the lockfile and
   rebuild with the project's package manager so it matches the merged
   manifest.

6. Push the branch.

Never force push. If the push is rejected, create a new commit instead.
