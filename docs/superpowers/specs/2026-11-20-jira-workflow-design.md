<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Jira Workflow Design

## Intent

XTC is the tracker for `agent-skills`. Agents need one place that states how
to read XTC, create issues, update
issues, move issues, and break work into Subtasks.

The status model now settled in XTC-14:

| Status             | Meaning                                                    |
| ------------------ | ---------------------------------------------------------- |
| `Added to backlog` | Captured. Not refined. Starting state.                     |
| `Open`             | Refinement. Ticket description holds the spec.             |
| `To Do`            | Spec sufficient. Agent creates work breakdown as Subtasks. |
| `In Progress`      | Agent works the Subtasks.                                  |
| `In Review`        | PR open. Checks or review pending.                         |
| `Done`             | Merged. Checks green.                                      |
| `Canceled`         | Dropped.                                                   |

Jira currently allows any status to move to any status. Keep Jira flexible.
The skill may be stricter.

## Goals

1. One skill owns XTC state rules and issue operations.
2. A second skill owns the iteration loop, including work breakdown to
   Subtasks.
3. Mermaid diagrams carry edges. Prose carries meanings and entry rules.
4. Specs live in the ticket description and in the repo. The ticket is the
   record while work is shelved.
5. Evals prove both new skills load on realistic prompts.

## Non-goals

- No change to GitHub for Atlassian repository selection.
- No repo classification here. XTC-13 owns it.
- No Superpowers fork or prune decision here. XTC-15 owns it.
- No custom work types. No `Decision` or `Repo` type. No Kalix Epic.
- No `Spec` or `Ready` status. No `Plan` work type.
- No use-case format decision. Use cases have no use case yet.

## Anti-goals

- No bucket labels. Drop `now`, `next`, and `squirrel` from Jira.
- No separate Superpowers spec document per ticket. The ticket description
  is the record until the work merges.
- No forced use case on a small ticket. Most tickets need none.

## Constraints

- XTC is a team-managed software project. Cloud ID
  `fc5ce4e3-4638-4a37-9aaf-1a2591482c2e`. Board 3, KAN board.
- The Atlassian MCP exposes statuses, board columns, and transitions on
  existing issues. It does not expose the full workflow definition.
- Edges out of `Added to backlog` and `Open` are intent. No issue sat in
  those states when transitions were checked. Mark them unverified in the
  skill.
- Skills are plain Markdown under `skills/`. Catalog comes from
  `pnpm skills:catalog`. Version follows CalVer `YY.M.MICRO`.

## Approaches

Where the workflow rules live:

| Approach                                     | Rules live in                  | Trade                                           |
| -------------------------------------------- | ------------------------------ | ----------------------------------------------- |
| A: new `jira-workflow` skill                 | fires at issue time            | one new skill, one eval suite                   |
| B: expand the bootstrap                      | every session sees it          | every session pays the bytes                    |
| C: expand `using-xenoterracide-agent-skills` | already loads at session start | conflates skill routing with tracker operations |

Picked A. The bootstrap keeps one pointer line. The route skill keeps one
pointer line.

Diagram homes:

| Approach                                                     | Shape                        | Trade                                           |
| ------------------------------------------------------------ | ---------------------------- | ----------------------------------------------- |
| A: state in `jira-workflow`, loop in `iterative-development` | each loads at its own moment | two skills, two eval suites                     |
| B: both diagrams in `jira-workflow`                          | one home                     | loop loads on issues that never iterate         |
| C: both in `iterative-development`                           | one home                     | state rules load on design work, not issue work |

Picked A. XTC-14 acceptance already names both files.

Spec placement:

| Approach                               | Spec goes                                      | Trade                                     |
| -------------------------------------- | ---------------------------------------------- | ----------------------------------------- |
| A: highest visible level it applies to | UX spec at UX level, even when it reaches down | intentionally vague; needs judgment       |
| B: dedicated `use-cases` repo          | one path                                       | no local or GitHub repo exists; premature |
| C: owning repo only                    | beside code                                    | cross-cutting specs lose their home       |

Picked A. A UX-level use case lives at the UX level even when it affects code
all the way down. The user calls this vague on purpose. Keep the rule vague.
A dedicated repo stays a long-term open question.

Use cases:

| Approach                    | Effect                                  | Trade                        |
| --------------------------- | --------------------------------------- | ---------------------------- |
| A: defer                    | ticket description and repo commit only | no use-case path in the loop |
| B: require for every ticket | full spec artifact                      | most tickets do not need one |

Picked A. One step at a time.

## Decisions

- Jira stays any-to-any. The skill describes the intended edges without
  claiming Jira enforces them.
- `jira-workflow` carries the state diagram, the status table, entry
  rules, and the four issue operations: read, create, update, move.
- `iterative-development` carries the iteration diagram. It keeps the
  whirlpool principles already in the skill. Work breakdown becomes Jira
  Subtasks owned by `To Do`, not by the spec.
- The loop: write spec in the ticket, commit spec to the repo, create
  work breakdown in `To Do`, add Subtasks, build test-first, open PR,
  merge green, reflect and update the ticket spec, then decide on another
  iteration.
- Specs go at the highest visible level they apply to. Record the rule
  and the open question in `use-case-creator` without adding a fixed path
  beyond `docs/use-cases/`.
- `use-case-creator` keeps AsciiDoc. Delete the AI-specific anchor claim;
  anchors stay only for referenced steps.
- No separate spec docs under `docs/superpowers/specs/` for tickets. That
  directory stays for plugin design notes like this one.
- `using-xenoterracide-agent-skills` gets one pointer to `jira-workflow`
  and keeps its existing process rules.
- Ask the maintainer about the version bump in `package.json` and
  `.kimi-plugin/plugin.json` before opening the PR.

## Left to the builder

- Write `skills/jira-workflow/SKILL.md`. Frontmatter `name` and
  `description` must start with "Use when" and carry the terms agents say:
  Jira, XTC, issue, ticket, status, Subtask, board, backlog. Add the SPDX
  HTML comment after frontmatter. Keep the state diagram, status table,
  unverified-edge note, and the four operations. Add `hemingway` as a
  companion.
- Add `skills/jira-workflow/tests/evals.test.ts`. Cases must load the
  skill on: reading XTC state, creating an XTC issue, moving an issue to a
  status, and turning a plan into Subtasks. Assert the diagram is present
  where a reference read is warranted.
- Update `skills/iterative-development/SKILL.md` with the iteration
  diagram and the Subtask rule. Keep the existing principles intact.
- Update `skills/use-case-creator/SKILL.md` with the placement rule and
  the open question. Do not introduce a fixed output path beyond
  `docs/use-cases/`.
- Add one pointer line to
  `skills/using-xenoterracide-agent-skills/SKILL.md`.
- Regenerate `skills/index.json` with `pnpm skills:catalog`.
- Ask about the version bump, then edit both version files.
- Run `pnpm check` and `pnpm evals skills/jira-workflow` before claiming
  completion. Open a draft PR after the first push. Merge waits for the
  maintainer's explicit yes.
- Move XTC-14 to `In Review` when the PR opens. Move it to `Done` only
  after merge and green checks.
