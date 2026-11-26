---
name: completion-retrospective
description: |
  Use when a ticket is done and you need a session review of wasted tokens,
  repeated steps, and avoidable work. Use after a done ticket to record the
  savings as tracker work.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Completion Retrospective

Read `.config/agent/project.yaml` before tracker work. When it is missing, stop
and name the path. Use `jira-workflow` for issue operations and `hemingway` for
prose. Follow this procedure without follow-up questions.

## Required Companion Skills

- **`jira-workflow`** — issue reads, creates, moves, and comments
- **`hemingway`** — issue descriptions and comments are prose

## Procedure

Take the completed ticket key from the caller. When the caller omits it, use the
ticket just moved to done.

1. Read `.config/agent/project.yaml`. Read the ticket. Confirm its status
   matches `tracker.statuses.done`. Stop when it does not. If no key is
   available and no ticket was just moved, stop and name the missing key.
2. Review the session before the move to done, including subagent work. When no
   session history is available, report no findings. Look for redundant reads,
   extra tool calls, verbose command output, repeated commands, long prose, and
   slow checks. Exclude this retrospective's own calls.
3. Write one finding per waste. Each finding names the skill, command, or file
   to change and the expected saving in tokens or steps. Findings without a
   named target become observations.
4. Read open issues in `tracker.project`. Treat statuses other than
   `tracker.statuses.done` and `tracker.statuses.dropped` as open. Treat a
   finding as a duplicate when an open issue names the same target and the
   same change, whatever the wording or count. When the issue has no outward
   `Relates` link to a completed ticket, keep the repeat as an observation.
   Do not create a task, add a link, or change priority. When the issue has
   such a link, add an outward `Relates` link from the issue to the completed
   ticket when absent. Count one link per completed ticket.
   Ignore repeat mentions inside one session. Map the distinct count to
   `1 Low, 2-3 Medium, 4-7 High, 8 or more Highest`. Change priority only when
   the bucket changes.
5. Create a `Task` issue in `tracker.project` for each actionable finding.
   Parent each `Task` to `tracker.retrospective_epic`. Set priority to Low.
   Use `Cut <named target>: <saving>` as the summary. Set the label to the full
   list containing only `<tracker.labels.project_prefix><repo>`. Confirm the
   issue lands in `tracker.statuses.captured`. Use the `jira-workflow` move rule
   when it does not. Add one outward `Relates` link from the new task to the
   completed ticket.
6. Rank the affected keys. Affected keys are tasks created in this run plus
   issues whose `Relates` links changed in this run. Read children of
   `tracker.retrospective_epic` in rank order. Record the slots held by
   affected keys. Treat a missing link as count 1.
   Sort affected keys by priority bucket highest first, then distinct
   completed-ticket link count largest first, then key ascending. Place the
   sorted keys into the recorded slots.
   Apply rank calls only to affected keys.
   Leave other backlog ranks unchanged.
   For each affected key in target order, use `rankAfterIssue` with the
   preceding child in the target sequence. When the key is first, use
   `rankBeforeIssue` with the next child. Do not pass `rankCustomFieldId`.
7. Add one comment to the completed ticket when observations exist.
   Treat findings skipped as duplicates as observations. Use a separate
   comment call with those observations.
   Skip the comment when no observations exist.
8. Report the created keys. Report the comment ID only when a comment was
   posted. Report "no findings" when both lists are empty. Do not change the
   completed ticket's status. Add a findings summary. For each finding, list
   its target, saving, duplicate status, issue key or observation, and any
   priority, link, or rank change.

## Issue text

Use this shape for each finding description:

```markdown
Session finding: <what repeated or cost tokens, with a count>
Change: <skill, command, or file>
Expected saving: <tokens or steps per ticket>
```

Use this shape for each observation in the comment:

```markdown
Observation: <what happened>. No change proposed.
```

## Non-goals

- No automatic reparenting of legacy tasks.
- No new status or transition.
- No change to observation comments.
