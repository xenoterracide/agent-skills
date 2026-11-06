<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Hemingway Auto-Apply Design

## Intent

The `hemingway` skill is the repo's standing prose and code-style rule,
but it almost never auto-loads. Sessions write design docs, PR bodies,
release notes, and replies for hours without the skill ever entering
context; it loads only when invoked by name. Make it load on prose work
by default.

## Diagnosis

Two loading paths, both leak:

1. Direct: the description triggers on a quality judgment — "prose
   that should be terse and clear." Real requests carry action verbs
   ("update the README", "add a changelog entry", "rewrite this error
   message"), not style vocabulary, so the router never matches.
2. Companion: covered for docs-creator, git-workflow, java-creator,
   code-review, coding-standards. Missing: use-case-creator (pure
   AsciiDoc prose), shell-script-creator (comments), and any prose task
   where no primary skill triggers.

The bootstrap's global rule points at rules the agent has not read. An
instruction without content cannot be followed.

## Goals

1. hemingway loads on any prose-writing or prose-editing task, with or
   without style vocabulary in the request.
2. Companion coverage extends to every prose-producing skill.
3. Eval cases pin the direct path with prompts that contain no style
   vocabulary.

## Non-goals

- No unconditional bootstrap injection into every session. The user is
  token-sensitive; the skill loads only when prose is in play.
- No change to the rules themselves beyond the rule-1 scoping already
  on the branch.

## Approaches

| Approach                     | Effect                          | Cost                                                     |
| ---------------------------- | ------------------------------- | -------------------------------------------------------- |
| A: action-led description    | fires on most prose tasks       | ~100 tokens per load, plus a facet when prose is written |
| B: complete companion wiring | covers prose under other skills | two lines                                                |
| C: bootstrap injection       | always in context               | ~100-300 tokens every session, even prose-free ones      |

Picked A + B. C buys certainty at a per-session cost the user declined;
A gets the same coverage when it matters. The user accepted the broad
trigger ("we'll try it and see").

## Decisions

- Description, verbatim:

  > Use whenever writing or editing prose of any kind: docs, README,
  > AGENTS.md, CONTRIBUTING.md, changelogs, release notes, commit
  > messages, PR titles and bodies, review replies, comments, Javadoc,
  > skill references, checklists, AsciiDoc. Also when tightening
  > existing prose, and when naming or structuring code. Read the prose
  > facet for writing, the code facet for code.

  "Tightening existing prose" keeps the style-verb path that already
  works; the action list widens it.

- Companion lines in use-case-creator and shell-script-creator,
  phrased like java-creator's.
- New eval cases, no style vocabulary: a changelog-entry prompt and an
  error-message rewrite, each asserting the load and the prose-facet
  read.

## Left to the builder

- Apply the description, companion lines, and eval cases after the
  in-flight eval run completes.
- One eval rerun over all cases; commit; PR.
