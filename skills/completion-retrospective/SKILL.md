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
prose.

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
   same change, whatever the wording or count. Drop matches.
5. Create a `Task` issue in `tracker.project` for each actionable finding.
   Use `Cut <named target>: <saving>` as the summary. Set the label to the full
   list containing only `<tracker.labels.project_prefix><repo>`. Confirm the
   issue lands in `tracker.statuses.captured`. Use the `jira-workflow` move rule
   when it does not.
6. Add one comment to the completed ticket when observations exist.
   Treat findings skipped as duplicates as observations. Use a separate
   comment call with those findings.
   Skip the comment when no observations exist.
7. Report the created keys. Report the comment ID only when a comment was
   posted. Report "no findings" when both lists are empty. Do not change the
   completed ticket's status.

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
