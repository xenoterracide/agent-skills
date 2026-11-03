<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Reviewer

Review a skill before it ships. Check style, validation, discoverability, and
behavior.

Check style against the `hemingway` skill. Check the rest against the
checklists below.

## Testing Skills

A skill that is not tested is not done. Test at two levels: mechanical
discovery and behavioral compliance.

### Mechanical Discovery Tests

Verify the skill loads:

1. File is named `SKILL.md`.
2. Directory is in a skill discovery path (plugin `skills/` for this repo).
3. Frontmatter starts with `---` and has both `name` and `description`.
4. `pnpm exec prettier --write <file>` produces no changes.
5. `pnpm lint:reuse` passes.
6. `pnpm skills:check` passes.

### Behavioral Compliance Tests

Discovery does not prove the skill changes behavior. Dispatch a subagent with a
pressure scenario:

1. **RED baseline** — Run a scenario WITHOUT the skill (or with an untriggered
   description) and document the exact failure: what did the agent skip, what
   rationalizations did it use?
2. **GREEN test** — With the skill present, run the same scenario. The agent
   should invoke the skill and comply with its instructions.
3. **Refactor** — When the agent finds a new rationalization, add an explicit
   counter and re-test.

**Test with natural language prompts.** Do not name the technology in the
prompt; phrase the request the way a user naturally would. For example, test
`java-creator` with "modify the App class so the greeting is uppercase", test
`gradle-creator` with "add JUnit to the project" or "configure the build to use
Java 21", and test `shell-script-creator` with "modify the script so the
greeting is uppercase". If the skill does not trigger, strengthen the
`description` with the verbs and concepts that appear in natural requests.

For discipline-enforcing skills like `completion-checklist`, use a realistic
implementation task in a temporary git repo and dispatch a subagent to run it.

For Kimi, see `kimi-testing.md` for the `kimi -p` equivalents.

## Validation Checklist

Before considering a skill change complete, verify:

1. **Frontmatter is valid** — `---` is the very first line, and both `name` and
   `description` are present.
2. **Copyright is correct** — SPDX block is in an HTML comment immediately after
   the frontmatter, with the current year.
3. **Formatting passes** — `pnpm exec prettier --write <file>` produces no
   changes.
4. **Non-Markdown assets are REUSE-compliant** — run `pnpm lint:reuse` and fix
   any missing headers or licenses.
5. **Trigger matches content** — read the skill as if you were an agent and
   confirm the body addresses the scenarios in the `description`.
6. **Behavior tested** — run at least one RED baseline and one GREEN test with a
   subagent pressure scenario. Document the rationalizations the agent used and
   how the skill counters them. Trigger testing needs a full session: a subagent
   cannot observe skill auto-loading. Use the eval suite or a full harness
   session.

## Discoverability Checklist

When updating a skill, verify that:

1. The `description` is specific enough to trigger on real user requests
2. The wording in `AGENTS.md` and the skill description describe the same
   routing signals
3. The body explains confusing boundaries with nearby skills
4. The skill avoids claiming files, tools, or workflows that no longer exist
5. Any `allowed-tools` entry is minimal, trusted, and justified by the skill

## Requesting Review

Dispatch a reviewer subagent before a skill ships. Use
`skill-reviewer-template.md` and fill its placeholders.

1. Fill `[SKILL_PATH]`, `[DESCRIPTION]`, and `[CHANGES]`.
2. Fill `[STANDARDS]` by reading the `hemingway` prose facet and the
   `skill-creator` and `skill-reviewer` checklists, and pasting them in.
3. Dispatch a `general-purpose` subagent with the template.
4. Act on feedback by severity:
   - Fix Critical issues immediately.
   - Fix Important issues before proceeding.
   - Note Minor issues for later.
5. Push back with reasoning when the reviewer is wrong.
