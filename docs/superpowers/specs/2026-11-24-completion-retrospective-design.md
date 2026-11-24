<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Completion Retrospective Design

## Intent

Every completed ticket ends a session with knowledge about wasted tokens and
steps. That knowledge disappears before the next run. XTC-53 records it as
tracker work so later runs cost less.

## Goals

1. Review the session after a ticket reaches the configured done status.
2. Record savings in a dedicated `completion-retrospective` skill.
3. Open one captured issue for each actionable finding.
4. Comment non-actionable observations on the completed ticket.
5. Let a fresh agent run the skill from its text alone.

## Non-goals

- No new Jira status, transition, or field.
- No automatic token metering.
- No edit to the skill or command named by a finding.
- No change to the completed ticket's status.
- No new automation outside the agent turn.
- No finding that duplicates an open issue.

## Constraints

- `.config/agent/project.yaml` owns project, labels, work types, and status
  names. The new skill reads it before Jira work.
- `jira-workflow` owns issue operations. The new skill follows its create,
  update, move, and comment rules.
- `hemingway` owns issue prose and comments.
- `scripts/skill-content.test.ts` rejects hardcoded tracker facts in
  `jira-workflow`. The new skill must pass the same rule.
- `skills/index.json` comes from `pnpm skills:catalog`. New skills need a
  catalog entry and a plugin version bump.
- The ticket description stays the spec. This note holds plugin design only.

## Approaches

| Approach                       | Cost                     | Trade                                       |
| ------------------------------ | ------------------------ | ------------------------------------------- |
| A: step inside `jira-workflow` | one file                 | couples a post-done task to issue movement  |
| B: dedicated skill plus hook   | new skill, eval, catalog | reusable; one short hook in `jira-workflow` |
| C: automation on transition    | event setup, session I/O | runs outside the turn; no session context   |

Picked B. The human partner chose a dedicated skill. A hook from
`jira-workflow` starts it; the skill stays independently invocable. C cannot
see the session that did the work.

## Design

### New skill

Path: `skills/completion-retrospective/SKILL.md`. Name:
`completion-retrospective`. The frontmatter description starts with "Use when"
and names done tickets, session review, wasted tokens, and repeated steps. It
does not describe the procedure.

Required companion skills: `jira-workflow`, `hemingway`.

The skill takes the completed ticket key. When the caller omits it, it uses the
ticket just moved to done. It runs these steps in order:

1. Read `.config/agent/project.yaml`. Read the ticket. Confirm its status
   matches `tracker.statuses.done`. Stop when it does not. If no key is
   available and no ticket was just moved, stop and name the missing key.
2. Review the session before the move to done, including subagent work. Look
   for redundant reads, extra tool calls, verbose command output, repeated
   commands, long prose, and slow checks. Exclude this retrospective's own
   calls.
3. Write one finding per waste. Each finding names the skill, command, or file
   to change and the expected saving in tokens or steps. Findings without a
   named target become observations.
4. Read open issues in `tracker.project`. Treat statuses other than
   `tracker.statuses.done` and `tracker.statuses.dropped` as open. Treat a
   finding as a duplicate when an open issue names the same target and the
   same change, whatever the wording or count. Drop matches.
5. Create a `Task` issue in `tracker.project` for each actionable finding.
   Use `Cut <named target>: <saving>` as the summary. Set the label to the
   full list containing only `<tracker.labels.project_prefix><repo>`. Confirm
   the issue lands in `tracker.statuses.captured`. Use the `jira-workflow`
   move rule when it does not.
6. Add one comment to the completed ticket when observations exist. Use a
   separate comment call. Include findings skipped as duplicates. Skip the
   comment when no observations exist.
7. Report the created keys. Report the comment ID only when a comment was
   posted. Report "no findings" when both lists are empty. Do not change the
   completed ticket's status.

Issue description shape:

```markdown
Session finding: <what repeated or cost tokens, with a count>
Change: <skill, command, or file>
Expected saving: <tokens or steps per ticket>
```

Observation comment shape:

```markdown
Observation: <what happened>. No change proposed.
```

### Hook in jira-workflow

Add one rule after the `Move to done after merge and green checks.` rule:
run `completion-retrospective` after that move. Keep the hook generic. Do not
add project keys, status names, or label values to `jira-workflow`.

### Tests

- Add an eval for `completion-retrospective` that loads on a request to review
  a just-closed Jira ticket for wasted steps. Assert the two companion skills.
- Add an eval case that checks the hook prose exists in `jira-workflow`.
- Extend `scripts/skill-content.test.ts` to keep tracker facts out of the new
  skill and to pin the post-done hook.
- Run targeted unit tests and the two eval cases with `EVAL_ITERATIONS=1`.

### Version

Bump CalVer from `26.11.25` to `26.11.26` in `.kimi-plugin/plugin.json` and
`package.json`. Ask the human partner before creating the PR. Regenerate
`skills/index.json`.

## What Is Left to the Builder

Write the failing tests first. Watch them fail. Write the minimal skill text
and hook to pass. Run the targeted tests, then the cheap eval cases. Sequence
commits, open a draft PR after the first push, settle checks, and ask for
merge approval only after review.
