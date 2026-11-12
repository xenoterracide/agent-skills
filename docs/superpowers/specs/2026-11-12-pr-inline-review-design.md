<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# PR Inline Review Design

## Intent

A review of a pull request must land on the pull request. Today `code-review`
reports to chat only, so findings die with the session and never reach GitHub.
The bot account posts them: anchored to lines, visible to both accounts,
durable after the chat is gone.

## Goals

1. A review of a PR posts one GitHub review with inline comments.
2. `REQUEST_CHANGES` when the review needs changes. `COMMENT` otherwise. Never
   `APPROVE`.
3. Findings that cannot anchor to a diff line go in the review body.
4. Chat gets the verdict, one line of severity counts, and the review URL.
   Not the findings.
5. The API mechanics live in `github`. `code-review` states the rule and points
   there.
6. A second review of the same head SHA does not repeat comments already
   posted.
7. A review of a branch diff with no PR stays in chat.

## Non-goals

- Changing `git-workflow`'s handling of incoming review comments.
- Approving, merging, or clearing the bot's own review.

## Anti-goals

- The bot approving work to satisfy a policy. Only the human clears the block.
- Repeating every finding in chat.
- One API call per finding.

## Approaches

- **A. Rule in `code-review`, mechanics in `github` — chosen.** Each fact has
  one home. `code-review` points at `github` and loads it as a companion.
- **B. All in `code-review` — rejected.** Duplicates API guidance the `github`
  skill owns. The copies drift.
- **C. Pointer only — rejected.** A reviewer that skips `github` never posts.

## Design

### `skills/code-review/SKILL.md`

- Required Companion Skills gains `github`: load it before posting, for the
  review API mechanics.
- New section, `Post the Review to the PR`, after `Direct Request`. It applies
  to both paths; a dispatch prompt that forbids external writes wins.
  - Post before replying. One review holds every anchored finding. Not one
    comment per finding.
  - Each comment carries severity, what is wrong, and why it matters. Chat no
    longer repeats it.
  - Event: `REQUEST_CHANGES` for any Critical or Important finding. `COMMENT`
    otherwise. Never `APPROVE`.
  - Findings that do not anchor — unchanged code, a deleted line, a missing
    file — go in the review body under `Not on the diff`.
  - A re-review after a push posts a fresh review. Skip a finding already
    posted at the same path and line on this PR.
  - Reply with the verdict, severity counts, and the review URL.

### `skills/github/SKILL.md`

New section, `Create a PR Review with Inline Comments`:

- Read the head SHA: `gh pr view <n> --json headRefOid --jq .headRefOid`.
- POST `repos/{owner}/{repo}/pulls/{n}/reviews` with `--input -`. The JSON body
  holds `commit_id`, `event`, `body`, and `comments[]`.
- Each comment: `path`, `line`, `side`, and optional `start_line`.
  - `side` is `RIGHT` for added or unchanged lines, `LEFT` for deletions.
  - `line` counts the file at `commit_id`.
  - A line outside the diff returns 422.
- One bad anchor fails the whole review. Repost without that comment, with its
  text in the review body.
- Use the MCP pending-review route when available: add comments, then submit
  with the event.

### Evals

`skills/code-review/tests/evals.test.ts` asserts `github` loads as a companion
on the PR review prompt. Evals run on demand, never in CI.

### Registration

Run `pnpm skills:catalog`. Ask whether to bump `.kimi-plugin/plugin.json` and
`package.json`.

## Left to the builder

- Wording of both sections. The bullets above are required content, not final
  prose.
- Exact JSON shape for the review request.
- Which eval assertions stay stable across models.
