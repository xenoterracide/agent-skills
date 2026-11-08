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

- On the topic branch, not the default branch: `git branch --show-current`
  prints a non-empty name (empty is a detached HEAD), and it differs from
  the default branch — `git symbolic-ref --short refs/remotes/origin/HEAD`
  with its `origin/` prefix stripped. Refuse on empty or on a match.
- A remote counterpart: `git rev-parse --verify origin/<branch>` succeeds.
  If it does not, `git push -u origin <branch>` first — the comparison
  steps read `origin/<branch>`, and the final push needs its upstream.
- Clean working tree: `git status --porcelain --untracked-files=no` prints
  nothing. Commit or stash first.

## Sequence

1. Fetch every remote and prune deleted branches:

   ```bash
   git fetch --all --prune
   ```

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

   On conflict, `git status --porcelain` shows the damage. Resolve it, or
   abort and hand the decision to a human.

5. Regenerate lockfiles instead of merging them — delete the lockfile and
   rebuild with the project's package manager so it matches the merged
   manifest.

6. Push:

   ```bash
   git push
   ```

Never force push. If the push is rejected, create a new commit instead.
