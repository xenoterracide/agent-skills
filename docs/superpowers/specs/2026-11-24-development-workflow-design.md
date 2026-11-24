<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Development Workflow Design

## Intent

A work request starts one lifecycle. The agent must know the phase and load the
skill responsible for it. Tool skills have clear triggers. `iterative-development`
has none. This design adds one router that owns the phases and hands work to
downstream skills.

## Goals

1. Add a `development-workflow` skill that routes by lifecycle phase.
2. Let a user start work with a plain request and reach the right skills.
3. Keep tool names and tool facts out of the router.
4. Keep `iterative-development` as the method, not the router.
5. Let config bind phases to skill names.
6. Open follow-up work for concrete skills with strong triggers to point back
   to the router.
7. Prove the router loads and routes with evals and static tests.

## Non-goals

- No new tracker status, transition, field, or comment.
- No replacement for `jira-workflow`, `git-workflow`, `github`, or `ship`.
- No background automation outside the agent turn.
- No automatic token metering.
- No change to XTC-53. A follow-up tracker issue will move its direct hook to
  the router.
- No always-on injection of the router into every session.
- No creation of `work-item` or `ship` in this repository. Consumer configs may
  bind those external skills.

## Constraints

- Skill descriptions are triggers. The router description must load on work
  start, phase questions, and ship requests without hijacking every code task.
- `.config/agent/workflow.yaml` owns phase bindings. Repos own the values.
- `.config/agent/project.yaml` owns tracker facts. The router reads the path to
  that file from workflow config.
- This repository's config binds only skills present in this catalog. External
  bindings belong in consumer configs.
- `iterative-development` stays tracker-agnostic. Its method rules stay there.
- Tool skills own their operations. The router only selects and loads them.
- A caller supplies a target phase. The router never derives a phase from the
  phase just completed.
- A mapped skill that does not exist stops the route. Name the missing skill.
- Version and catalog change only after the human approves the bump.

## Approaches

| Approach                       | Cost                      | Trade                                      |
| ------------------------------ | ------------------------- | ------------------------------------------ |
| Expand `iterative-development` | one skill                 | conflates method with routing              |
| Router skill plus config map   | new skill, config, evals  | one home for phase handoffs                |
| Tool skills route each other   | edits in every tool skill | duplicated edges; tool churn touches loops |
| Always-on bootstrap            | one plugin hook           | permanent context cost; weak trigger       |

Picked: router skill plus config map. It gives the lifecycle one owner. Tool
changes touch config and one adapter. The method stays separate.

## Design

### New config

Path: `.config/agent/workflow.yaml`. Schema:
`schemas/workflow.schema.json`.

```yaml
repo: agent-skills
tracker_config: .config/agent/project.yaml
phases:
  start: [iterative-development]
  review: [requesting-code-review]
  integrate: [finishing-a-development-branch]
  done: [completion-retrospective]
```

`repo` names the consumer. `tracker_config` is optional. A repo with no tracker
omits it. `phases` maps stable phase names to skill-name lists. A phase may be
absent. An absent or empty phase has no route.

### New skill

Path: `skills/development-workflow/SKILL.md`. Name: `development-workflow`.

The description starts with `Use when` and names starting a work item, asking
what phase comes next, and shipping finished work. It does not describe the
procedure.

The skill runs these steps:

1. Read `.config/agent/workflow.yaml`. Stop and name the path when missing.
2. Use a target phase supplied by the caller when present.
3. Read `tracker_config` when present and tracker state is needed. Load the
   skill named by `tracker.skill`. Stop and name that key when the skill is
   missing. Without `tracker_config`, use request text only. Ask for the phase
   when text cannot settle it.
4. Choose the target phase from the request or tracker role using the tables
   below.
5. Load each skill bound to that phase. Treat the list as a full set. Do not
   add skills from memory.
6. Stop when a bound skill is missing. Name the skill and the config key.
7. Do not perform the downstream work. The loaded skill owns it.
8. Report the phase and the loaded skill names.

Request table:

| Request signal                         | Target phase                |
| -------------------------------------- | --------------------------- |
| "start", "let's get started", "I want" | `start`                     |
| "what's next", "continue"              | inspect tracker, then route |
| "PR open", "review"                    | `review`                    |
| "merged", "branch"                     | `integrate`                 |
| "ship", "deploy", "release"            | `ship`                      |
| "done", "closed"                       | `done`                      |

Tracker role table:

| Tracker role                                | Target phase |
| ------------------------------------------- | ------------ |
| `captured`, `refining`, `ready`, `building` | `start`      |
| `reviewing`                                 | `review`     |
| `done`                                      | `done`       |
| `dropped`                                   | ask          |

The router text contains no tracker key, project key, status name, site, host,
GitHub command, Git command, or editor name.

### Back-pointers

Concrete skills keep their strong triggers. A follow-up tracker issue adds
these rules. This project does not edit those skills.

- `jira-workflow`: after a move to `tracker.statuses.done`, supply target phase
  `done`.
- `iterative-development`: at End, supply target phase `done`.
- `finishing-a-development-branch`: after merge, supply target phase
  `integrate`.

Supplying a target phase avoids self-loops. The router does not infer the next
phase from the phase just completed.

### Tests

- Eval: the router loads on "let's get started on the ticket".
- Eval: the router loads on "what's next on this ticket?".
- Eval: the router loads on "ship this".
- Eval: the router reads `.config/agent/workflow.yaml`.
- Eval: the `done` phase loads `completion-retrospective` from config.
- Eval: with no `tracker_config`, "what's next" asks for a phase.
- Static test: the router text contains no tracker or tool literals.
- Schema test: `workflow.schema.json` accepts the sample config and rejects a
  phase bound to a non-string value.
- Back-pointer tests belong to the follow-up tracker issue.

### Version

Bump CalVer in `.kimi-plugin/plugin.json` and `package.json`. Ask the human
before the bump. Regenerate `skills/index.json`.

## Left to the Builder

Write the failing tests first. Watch them fail. Add the config and schema. Add
the router skill. Run targeted unit tests and one cheap eval case per phase.
Open a follow-up tracker issue for back-pointers and XTC-53's direct hook. Do
not edit `jira-workflow` in this project.
