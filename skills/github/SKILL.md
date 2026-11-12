---
name: github
description: |
  Use when interacting with GitHub repositories, issues, pull requests, review
  comments, or GraphQL operations.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# GitHub Skill

This skill covers **GitHub platform tools and APIs** — MCP tools, the `gh` CLI,
and GraphQL queries. It is GitHub-specific; for commit/push/PR workflow
mechanics (which are platform-agnostic), use the `git-workflow` skill instead.

## Tool Priority

1. **Prefer MCP tools** - Use GitHub MCP tools when available (e.g., `pull_request_read`, `issue_write`)
2. **Fall back to GitHub CLI** - Use `gh` command when MCP tools are unavailable
3. **Disable pagination** - Use `GH_PAGER=cat` with CLI commands

## Why MCP Over CLI

- More reliable structured responses (no parsing shell output)
- Built-in authentication handling
- Safer (no shell injection risks)
- Better error messages

## Create a PR Review with Inline Comments

One review carries every anchored finding.

1. Read the head SHA: `gh pr view <n> --json headRefOid --jq .headRefOid`.
2. POST the review with its JSON body on stdin:

```bash
gh api --method POST "repos/{owner}/{repo}/pulls/<n>/reviews" \
  --input - --jq .html_url <<'EOF'
{
  "commit_id": "<head SHA>",
  "event": "REQUEST_CHANGES",
  "body": "Not on the diff:\n\n- `src/app.sh:8` ...",
  "comments": [
    {
      "path": "src/app.sh",
      "line": 12,
      "side": "RIGHT",
      "body": "**Important:** ..."
    }
  ]
}
EOF
```

The command prints the review URL. Report it.

- `event` is `REQUEST_CHANGES`, `COMMENT`, or `APPROVE`. Never approve.
- `side` picks the file: `RIGHT` for an added or unchanged line, `LEFT` for a
  deletion.
- `line` counts the file `side` picks. `RIGHT` counts the file at `commit_id`;
  `LEFT` counts the base file. `start_line` begins a range.
- A line outside the diff returns 422 and posts nothing. Remove that comment,
  move its text to `body` under `Not on the diff`, and repost.
- Skip a finding the bot already posted at the same path and line:

```bash
gh api --paginate "repos/{owner}/{repo}/pulls/<n>/comments" \
  --jq '.[] | select(.user.login == "<bot login>" and .line != null)
        | "\(.path):\(.line) \(.body)"'
```

With MCP tools: create a pending review, add each comment, then submit it
with the event.

## GraphQL via CLI

When MCP tools are unavailable, use `gh api graphql` for operations not covered by REST API:

### Query Review Threads

```bash
gh api graphql -f query='
query {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: N) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          comments(first: 1) {
            nodes {
              id
              body
              author { login }
            }
          }
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes | map(select(.isResolved == false))'
```

### Reply to Review Thread

```bash
gh api graphql -f query='
mutation {
  addPullRequestReviewThreadReply(
    input: {
      pullRequestReviewThreadId: "THREAD_ID"
      body: "Fixed in commit SHA"
    }
  ) {
    comment { id }
  }
}'
```
