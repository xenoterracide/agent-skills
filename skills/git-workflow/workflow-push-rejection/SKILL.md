---
name: workflow-push-rejection
description: |
  Use when a git push is rejected with "refusing to allow ... to create or
  update workflow `.github/workflows/...` without `workflow` scope", or when a
  push fails citing workflow files or a missing `workflow` token scope.
license: CC-BY-NC-SA-4.0
metadata:
  author: Caleb Cushing <caleb.cushing@gmail.com>
  copyright: Copyright © 2026 Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Workflow Push Rejection

An AI agent's token usually lacks the `workflow` scope, so a push whose commits
**create or modify** a file under `.github/workflows/` is rejected:

```
! [remote rejected] <branch> -> <branch> (refusing to allow an OAuth App to create or update workflow `.github/workflows/...` without `workflow` scope)
```

This usually does **not** mean you intentionally edited a workflow file. The
common cause is a stale base: a dependency bot updated a workflow file on the
remote, and your branch is built on an older `origin/develop`, so your branch's
copy of that file is now behind the remote and the push looks like it modifies
a workflow file. Rule that out before concluding it is a scope limitation.

## Fix the stale base first

1. Fetch the latest remote state: `git fetch origin`
2. Check whether `origin/develop` is ahead:
   `git log --oneline develop..origin/develop`
3. Merge the latest base into your branch: `git merge origin/develop`
4. Push again

Do not force push — it is unnecessary here and may be blocked by repository
rules.

## When it is genuinely a workflow edit

If an up-to-date base still hits the rejection, you really are creating or
modifying a workflow file. The agent's token lacks the `workflow` scope, so a
**human must make the change**. When planning, mark workflow-file edits as
human-required tasks and structure the work so agent-managed steps proceed
independently. Only files under `.github/workflows/` are restricted; YAML files
elsewhere are not.
