<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Jira Workflow Design

## Intent

XTC is the meta tracker for xenoterracide projects. Each repo holds local work.
Agents need one rule set for issue workflow and one repo file that binds that
rule set to a tracker.

XTC-14 first put XTC facts inside `jira-workflow` and `iterative-development`.
That coupled one workflow to one project. This design moves those facts into
`.config/agent/project.yaml`.

## Why

Skills carried project facts: project key, board, status names, work types, and
transition rules. Two skills described one workflow. A status rename could touch
both. `iterative-development` depended on Jira even when the work had no tracker
step.

The config file separates the parts. Skills own behavior. Repos own facts.
base-template will render the file into every consumer later.

## Goals

1. One repo file owns tracker and project facts.
2. `jira-workflow` reads that file. Its body holds no XTC project key, board
   number, or status names.
3. The state diagram uses logical role names. The config maps roles to tracker
   labels.
4. `iterative-development` owns the generic loop. It has no tracker-specific
   branch or reference.
5. Jira issues carry `project:<repo>` labels. XTC becomes the cross-project
   view.
6. Evals prove the generic skills load and the config is found.
7. PR #317 absorbs the new spec before merge.

## Non-goals

- No change to GitHub for Atlassian repository selection.
- No repo classification here. XTC-13 owns it.
- No Superpowers fork or prune decision here. XTC-15 owns it.
- No base-template change in this ticket. A follow-up ticket renders the file
  and the `AGENTS.md` pointer. This repo's `AGENTS.md` is not edited.
- No custom work types. No `Decision` or `Repo` type. No Kalix Epic.
- No `Spec` or `Ready` status. No `Plan` work type.
- No custom Jira field for project identity. Labels come first.
- No use-case format decision. Do not change `use-case-creator` or spec storage.
  Specs stay under `docs/superpowers/`.

## Anti-goals

- No bucket labels. Drop `now`, `next`, and `squirrel` from Jira.
- No synthetic skill generated from config. `jira-workflow` already exists.
- No separate Superpowers spec document per ticket. The ticket description is
  the record until the work merges.
- No forced use case on a small ticket. Most tickets need none.

## Constraints

- XTC is a team-managed software project. Cloud ID
  `fc5ce4e3-4638-4a37-9aaf-1a2591482c2e`. Board 3, KAN board.
- Jira moves issues with transition IDs. It does not accept a target status
  string. `listJiraIssueTransitions` returns transition IDs and `to.name`.
- JQL accepts status names. It does not move issues.
- The Atlassian MCP exposes statuses, board columns, and transitions on
  existing issues. It does not expose the full workflow definition.
- Edges out of `Added to backlog` and `Open` are intent. No issue sat in either
  state when transitions were checked. Mark them unverified in the skill.
- Skills are plain Markdown under `skills/`. Catalog comes from
  `pnpm skills:catalog`. Version follows CalVer `YY.M.MICRO`.
- The plugin stays dependency-free. The config is read as text by the agent.
  The plugin does not parse it.

## Approaches

### Config home

| Approach                                  | Cost                                  | Trade                                    |
| ----------------------------------------- | ------------------------------------- | ---------------------------------------- |
| A: `.config/agent/project.yaml` + pointer | one small line in `AGENTS.md`         | config body stays lazy; no plugin change |
| B: plugin-generated synthetic skill       | plugin change, tests, possible parser | no pointer; more machinery               |
| C: config body inside `AGENTS.md`         | every session pays the bytes          | rejected by the maintainer               |

Picked A. `jira-workflow` gets the path. It reads the file before Jira work.

### Format

| Format | Cost                  | Trade                                        |
| ------ | --------------------- | -------------------------------------------- |
| YAML   | none for text reading | comments; Prettier already handles it        |
| TOML   | none for text reading | familiar in this repo; less flexible nesting |
| JSON5  | parser needed later   | existing Renovate config; no native parser   |

Picked YAML. The agent reads text. The plugin never parses it.

### Jira project identity

| Approach                  | Cost             | Trade                                   |
| ------------------------- | ---------------- | --------------------------------------- |
| A: `project:<repo>` label | no admin         | queryable; label sprawl if misused      |
| B: custom field           | Jira admin       | structured; not available without setup |
| C: component              | project settings | good for teams; wrong shape for repos   |
| D: description text       | none             | not reliably queryable                  |

Picked A. Add labels to new work. Backfill old tickets in a separate pass.

### Template rollout

| Approach                            | Cost                 | Trade                      |
| ----------------------------------- | -------------------- | -------------------------- |
| A: schema in XTC-14, template later | one follow-up ticket | PR #317 stays focused      |
| B: two coordinated PRs now          | cross-repo sync      | template lands with schema |
| C: hand-add config per repo         | repeated edits       | drift returns              |

Picked A. XTC-14 owns the schema. A follow-up ticket owns base-template.

## Config schema

Path: `.config/agent/project.yaml`.

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/xenoterracide/agent-skills/develop/schemas/project.schema.json
repo: agent-skills

tracker:
  kind: jira
  skill: jira-workflow
  site: xenoterracide.atlassian.net
  project: XTC
  board: 3
  work_types: [Epic, Feature, Task, Bug, Subtask]
  labels:
    project_prefix: "project:"
  statuses:
    captured: Added to backlog
    refining: Open
    ready: To Do
    building: In Progress
    reviewing: In Review
    done: Done
    dropped: Canceled
  transitions:
    captured_to_refining: 9
    captured_to_ready: 11
    captured_to_captured: 8
    captured_to_dropped: 2
    refining_to_ready: 11
    refining_to_captured: 8
    refining_to_dropped: 2
    ready_to_building: 21
    ready_to_captured: 8
    ready_to_dropped: 2
    building_to_reviewing: 31
    building_to_ready: 11
    building_to_dropped: 2
    reviewing_to_done: 41
    reviewing_to_building: 21
    reviewing_to_dropped: 2
    done_to_refining: 9
    dropped_to_captured: 8
```

`statuses` names serve JQL and transition matching. `transitions` IDs serve
moves. The skill still calls `listJiraIssueTransitions`. It uses a configured ID
only when that ID appears in the result and its `to.name` matches `statuses`.
If the ID is absent or stale, it matches `to.name` and uses the returned ID.
Never move on an unchecked ID.

## Schema

`schemas/project.schema.json` is the config contract. It uses JSON Schema Draft
2020-12. It declares required `repo` and `tracker` keys. It constrains
`tracker.kind` to `jira`. It requires every key the skills read: `kind`, `skill`,
`site`, `project`, `board`, `work_types`, `labels`, `statuses`, and `transitions`.
It sets `additionalProperties: false`.

The `$schema` comment gives editors completion and inline errors. The plugin
does not parse YAML or validate config at runtime. Static tests gate the facts
this ticket needs. CI validation with a YAML parser stays a later change.

## Decisions

- The config is repo data, not skill logic. `jira-workflow` reads it before
  Jira operations.
- JSON Schema is the contract. It gives editor support. It adds no runtime
  dependency.
- This ticket does not edit `AGENTS.md`. `jira-workflow` owns the config path.
- Missing config stops the Jira operation. The skill names the path. It does not
  fall back to XTC constants.
- Board reads stay project-wide. Add `AND labels = "project:<repo>"` only when
  the user scopes a read to one repo.
- Work types live in `tracker.work_types`. The skill does not hardcode them.
- The state diagram uses roles: `captured`, `refining`, `ready`, `building`,
  `reviewing`, `done`, `dropped`. The config supplies Jira names.
- Jira stays any-to-any. The skill describes intended edges without claiming
  Jira enforces them.
- `jira-workflow` owns status meanings, issue operations, issue-content rules,
  and the four operations: read, create, update, move.
- `iterative-development` keeps the whirlpool principles and the generic loop.
  Its Jira reference and XTC branch are deleted.
- Work breakdown becomes tracker work items. Jira maps those to Subtasks.
- `use-case-creator` and spec storage are unchanged. Specs stay under
  `docs/superpowers/`.
- New XTC work gets `project:<repo>`. No custom field in this ticket.
- XTC-14's description stays spec-only. Jira status holds progress. Comments
  hold implementation discoveries.
- No separate spec docs under `docs/superpowers/specs/` for tickets. That
  directory holds plugin design notes like this one.
- `skills/jira-workflow/references/issue-content.md` stays at that path. Remove
  its closing `XTC is the tracker.` line. Static gates scan references too.
- The generic-skill gate bans backticked config values, not bare words such as
  `Open` or `Done`.
- Version stays `26.11.23` until release. Regenerate the catalog after skill
  file changes.

## Tests

- `schemas/project.schema.json` parses as JSON and declares the required config
  keys.
- The eval sandbox gets a `.config/agent/project.yaml` fixture. A
  `jira-workflow` eval asserts a Read of that file.
- `jira-workflow` eval loads on reading board state, creating an issue, moving
  an issue, and turning a plan into Subtasks.
- A static test fails if `jira-workflow/SKILL.md` contains `XTC`, `board: 3`, or
  backticked config status values.
- A static test scans `SKILL.md` and `references/*.md` for tracker-specific
  constants.
- A static test fails if `iterative-development` has a tracker-specific
  reference.
- The existing skill-content gates stay green.

## Left to the builder

- Replace XTC-14's description with this spec, minus current state.
- Add `schemas/project.schema.json` and `.config/agent/project.yaml` to this
  repo.
- Rewrite `skills/jira-workflow/SKILL.md` around the config and role names.
- Keep `skills/jira-workflow/references/issue-content.md` at its path. Remove
  its closing XTC line. Keep the four ownership rules.
- Add the config fixture to the eval sandbox.
- Update `skills/jira-workflow/tests/evals.test.ts` for config discovery.
- Remove `skills/iterative-development/references/jira-iteration.md` and its
  pointer. Update that skill's eval.
- Extend `scripts/skill-content.test.ts` with the generic-skill gates.
- Update `using-xenoterracide-agent-skills` if its pointer claims XTC-specific
  behavior.
- Regenerate `skills/index.json`.
- Add `project:agent-skills` to XTC-14.
- Run the evals with `EVAL_MODEL=opencode/big-pickle`.
- Push to PR #317 and settle it with `ghb pr verify`. Keep the PR ready. Move
  XTC-14 to `Done` only after merge and green checks.
- Open the base-template follow-up ticket after merge.
