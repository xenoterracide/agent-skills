---
name: skill-creator
description: |
  Use when adding new skills, updating existing `SKILL.md` files, fixing
  frontmatter, or improving skill trigger wording and discoverability.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Creator

Guidance for creating and maintaining AI skills.

**REQUIRED SUB-SKILL:** Use `writing-skills` for the skill authoring workflow
and quality standards. This skill is provided by the Superpowers plugin; install
it alongside this plugin for the referenced workflow to be available.

## Source of Truth

When maintaining a skill plugin, always edit the plugin's source repository.
Installed plugin files in `~/.kimi-code/`, `~/.kimi-plugin/`, or any agent
installation directory are immutable. Treat them as binaries, not source.

If you discover an issue in an installed skill:

1. Locate the source repository for the plugin
2. Make the fix there
3. Reinstall from the updated source

Never edit installed plugin files unless the user explicitly asks you to.

## File Structure

```
skill-name/
├── SKILL.md (required)
│   └── Markdown instructions
└── (optional resources)
```

## Naming Conventions

**Prefer nouns over gerunds.** This repository uses concise noun-based names
for skills rather than action-phrase names.

- ✅ `skill-creator`
- ✅ `commit-message`
- ❌ `writing-skills`
- ❌ `creating-commits`

This convention produces shorter identifiers and clearer activation triggers.
It intentionally overrides the `writing-skills` naming preference when creating
skills in this repository.

## SKILL.md Format

**CRITICAL:** Skills are fussy with frontmatter. The `---` must be the very
first line in the file.

### Frontmatter Fields

Required fields:

- **`name`**: Skill identifier
  - Max 64 characters
  - Lowercase letters, numbers, and hyphens only
  - Must not start or end with a hyphen
  - Examples: `java`, `pull-request`, `gradle-shadow`

- **`description`**: When to use this skill (this triggers the skill)
  - Max 1024 characters, non-empty
  - Be specific about triggers and usage scenarios
  - Include "when to use" guidance here, not in the body
  - Prefer a multi-line description when the trigger needs examples or
    conditions
  - Reuse the same trigger vocabulary that appears in `AGENTS.md`

Optional fields:

- **`license`**: SPDX license identifier for the skill
  - Example: `CC-BY-NC-SA-4.0`, `MIT`, `Apache-2.0`
  - Use the same license as the overall project unless there's a reason to
    differ

- **`metadata`**: Key-value map for additional metadata
  - **`copyright`**: Copyright holder (e.g., `Caleb Cushing`)
  - **`version`**: Skill version string
  - Avoid adding unrelated metadata just because the format permits it

- **`allowed-tools`**: Tools that may be pre-approved for the skill
  - Experimental; support may vary by agent implementation
  - Use only when a skill repeatedly needs the same trusted tool
  - Prefer specific tool names such as `git` or `gh` when the runtime supports
    them
  - Avoid broad approvals like `bash` or `shell` unless the skill is explicitly
    about running trusted shell scripts
  - Do **not** use this as a substitute for clear instructions in the body

- **`has-sub-skill`**: Set to `true` for parent bundles that contain sub-skills
  - Example: `has-sub-skill: true`
  - Required when the skill directory contains child skill directories

Keep frontmatter small and focused on activation plus carefully chosen
pre-approval.

### Correct Structure

```markdown
---
name: skill-name
description: |
  When to use this skill. Be specific about triggers.
  Include the kinds of user requests or file changes that should activate it.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
allowed-tools: git gh
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Title

Content here...
```

### Common Mistakes

❌ **WRONG:** Comment before frontmatter

```markdown
<!--
SPDX-FileCopyrightText: ...
-->

---

name: skill-name
...
```

❌ **WRONG:** Blank line before frontmatter

```markdown
---
name: skill-name
...
```

✅ **CORRECT:** Frontmatter first, then HTML comment for copyright

```markdown
---
name: skill-name
description: ...
license: CC-BY-NC-SA-4.0
metadata:
  author: Caleb Cushing <caleb.cushing@gmail.com>
---

<!--
SPDX-FileCopyrightText: ...
-->
```

## Copyright and Licensing

- **Year:** Use current year (e.g., `2026`) for new skills, not a range
- **Location:** Place in HTML comment after frontmatter
- **Tool:** Do NOT use `reuse annotate` - it doesn't work with skill files
- **Manual:** Add the SPDX comment block manually

## Code Style

- Format `SKILL.md` with the project's Markdown formatter (e.g., Prettier)
- No additional linting tools are required for skills

## Testing Skills

A skill that is not tested is not done. Test at two levels: mechanical
discovery and behavioral compliance.

### Mechanical Discovery Tests

Verify Kimi can load the skill:

1. File is named `SKILL.md`.
2. Directory is in a skill discovery path (plugin `skills/` for this repo).
3. Frontmatter starts with `---` and has both `name` and `description`.
4. `yarn exec prettier --write <file>` produces no changes.
5. `yarn lint:reuse` passes.

For distributed plugin skills, test discovery by pointing `--skills-dir` at this
repo's `skills/` directory:

```bash
kimi -p 'What skills do you see related to <topic>?' --skills-dir /path/to/this/repo/skills
```

### Behavioral Compliance Tests

Discovery does not prove the skill changes behavior. Use subagents or fresh
`kimi -p` sessions with pressure scenarios:

1. **RED baseline** — Run a scenario WITHOUT the skill (or with an untriggered
   description) and document the exact failure: what did the agent skip, what
   rationalizations did it use?
2. **GREEN test** — With the skill present, run the same scenario. The agent
   should invoke the skill and comply with its instructions.
3. **Refactor** — When the agent finds a new rationalization, add an explicit
   counter and re-test.

For discipline-enforcing skills like `completion-checklist`, use a realistic
implementation task in a temporary git repo:

```bash
rm -rf /tmp/skill-test-repo
mkdir /tmp/skill-test-repo
cd /tmp/skill-test-repo
git init
git config user.email "test@example.com"
git config user.name "Test"
echo '# Test' > README.md
git add README.md
git commit -m 'init'

kimi -p 'In /tmp/skill-test-repo, add a small script that does X, run it, and report that the implementation is complete.' \
  --skills-dir /path/to/this/repo/skills \
  --skills-dir /home/ai/.kimi-code/plugins/managed/superpowers/skills
```

Inspect the output. Did the agent invoke the skill before claiming completion?
Did it follow the gate steps? If not, the description or body needs to be
stronger.

### Limits of `kimi -p` Testing

`kimi -p` can verify that a skill is loaded and that the model recognizes it as
relevant, but it may not fully replicate interactive session skill invocation.
After mechanical and pressure tests, start a real session with the updated
plugin installed to confirm production behavior.

## Best Practices

1. **Follow the writing-skills workflow** - Skills are documentation;
   create and refine them using the RED-GREEN-REFACTOR process in
   `writing-skills`.
2. **Keep it concise** - Skills share context window with everything else;
   follow the word-count targets in `writing-skills` and move heavy reference
   to separate files
3. **Clear description** - The description determines when skill triggers
4. **Specific triggers** - Describe exact scenarios for skill usage
5. **Progressive disclosure** - Put detailed info in references/, keep
   SKILL.md focused
6. **Fix broken commands immediately** - If you discover a skill's command
   or example doesn't work, update the skill right away. Skills are living
   documents that must be kept accurate.
7. **Use `allowed-tools` sparingly** - Pre-approve tools only when the skill
   consistently needs them and the trade-off is worth reducing prompts
8. **Default to no pre-approval** - If a skill works fine without
   `allowed-tools`, leave the field out

## Validation Checklist

Before considering a skill change complete, verify:

1. **Frontmatter is valid** — `---` is the very first line, and both `name` and
   `description` are present.
2. **Copyright is correct** — SPDX block is in an HTML comment immediately after
   the frontmatter, with the current year.
3. **Formatting passes** — `yarn exec prettier --write <file>` produces no
   changes.
4. **Non-Markdown assets are REUSE-compliant** — run `yarn lint:reuse` and fix
   any missing headers or licenses.
5. **Trigger matches content** — read the skill as if you were an agent and
   confirm the body addresses the scenarios in the `description`.
6. **Behavior tested** — run at least one RED baseline and one GREEN test with a
   subagent or `kimi -p` pressure scenario. Document the rationalizations the
   agent used and how the skill counters them.

## Discoverability Checklist

When updating a skill, verify that:

1. The `description` is specific enough to trigger on real user requests
2. The wording in `AGENTS.md` and the skill description describe the same
   routing signals
3. The body explains confusing boundaries with nearby skills
4. The skill avoids claiming files, tools, or workflows that no longer exist
5. Any `allowed-tools` entry is minimal, trusted, and justified by the skill
