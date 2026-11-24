<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Approval Prompt Gate Design

## Intent

Approval has arrived before review finished. In one incident the human had
approved, a reviewer subagent then reported findings, and work continued on
the earlier yes. Typed replies are also ambiguous: a review comment can read
like approval. The agent needs one explicit acceptance channel that comes last
and expires when the state changes.

## Goals

1. Only an "Approved, merge" selection in the question prompt, or that exact
   choice in text when no question tool exists, authorizes a merge.
2. The prompt comes after checks, self-review, reviewer subagent, and fix of
   its findings.
3. New findings, a new commit, a push, or a failed check void the answer.
4. "Review comments submitted" routes to the existing review-comment handling
   procedure.
5. Free text is review feedback. It never authorizes a merge.
6. Harnesses without a question tool get the same three choices as text. An
   exact choice name is required; any other reply is feedback.
7. The turn-boundary wording fix ships here. Both changes edit the same
   bootstrap paragraph.

## Non-goals

- No auto-merge and no merge without the selection.
- No change to the review-comment handling procedure itself.
- No change to other harnesses. They are not in use. Their tool support is
  unknown, so the rule only states a fallback.
- No change to the merge command. `--squash --delete-branch` stays.

## Constraints

- Keep the full procedure in `skills/git-workflow/references/pull-request.md`.
  The bootstrap carries one short gate. Each rule has one home.
- Only OpenCode is in use. Headless `opencode run` cancels question prompts.
  Transcripts show `✗ Asked 1 question failed`; no human sees the question.
- The eval helper detects commands, reads, skills, prose, and tool events.
  Its `events` option asserts the observed cancellation.
- Bump CalVer `26.11.24` to `26.11.25` in `.kimi-plugin/plugin.json` and
  `package.json`. Regenerate `skills/index.json`.
- Keep SPDX headers and Prettier formatting.

## Approaches

1. **Rules in prose only.** Prompt order and void conditions in the reference.
   Rejected: no way to tell an accepted selection from a typed yes.
2. **Rules plus a head-SHA check.** Reject stale approval by comparing the
   head SHA at prompt time with the SHA at merge time. Rejected as the whole
   answer: findings that produce no commit still change the decision.
3. **Question tool as the only acceptance channel, with a text fallback.**
   Chosen. A selection is unambiguous. The fallback keeps the rule usable on
   other harnesses without assuming what tools they have.

## Design

The bootstrap "Merging" section gains a short gate. After review completes,
post `[repo#NNN](url)` in chat. Question prompts differ by UI. The TUI shows
plain text. The web UI auto-links URLs. The question carries no link. Call the
question tool with three choices: "Approved, merge", "Review comments
submitted", and "Hold". The tool's free text answer is feedback. Only the first
choice, or its text fallback, authorizes the merge. The answer applies to the
state at prompt time. New findings, a commit, a push, or a failed check require
a new prompt.

The turn-boundary fix removes the pause from both the Merging paragraph and
the Working Directory section. The question answer arrives inside the turn.
When the session runs in a feature worktree, move it out with `session_move`,
wait for the harness to confirm the main-worktree cwd, and continue in that
turn.

`pull-request.md` carries the full rule in "Merging on the Approval Prompt":
prompt order, the three choices, the void conditions, and the text fallback.
It points to "Handling Review Comments" for the feedback choice.

Evals cover the failure modes: a typed yes attempts no merge; no prompt appears
while a reviewer is outstanding; new findings after the selection force a new
prompt; free text routes to feedback. The turn-boundary cases keep their
worktree assertions and now require cwd-confirmation prose.

## What Is Left to the Builder

Sequence the work, write the tests first, and run the targeted evals before and
after the skill edits. Keep the catalog version in sync with the skill change.
