<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Creator

Guidance for creating and maintaining AI skills.

Write the skill's prose against the `hemingway` skill. Review a finished skill
against `skill-reviewer.md`.

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

```text
skill-name/
├── SKILL.md (required)
│   └── Markdown instructions
└── (optional resources)
```

Closely related skills may be consolidated into a single parent skill that
routes to `references/*.md` files (for example, `git-workflow` and
`docs-creator` in this repository). A reference is a plain Markdown file, not a
skill: it carries an SPDX header and a title, with no YAML frontmatter or
`description`. Fold each child's trigger vocabulary into the parent
`description`, and make the parent body route each task to its reference.

## Naming Conventions

**Prefer nouns over gerunds.** This repository uses concise noun-based names
for skills rather than action-phrase names.

- ✅ `skill-creator`
- ✅ `use-case-creator`
- ❌ `writing-skills`
- ❌ `creating-commits`

**Use an active `-creator` suffix for language or technology skills.** Skill
names significantly affect automatic detection. Names like `java-creator`,
`gradle-creator`, and `shell-script-creator` trigger more reliably than bare
names such as `java`, `gradle`, or `shell-script`.

- ✅ `java-creator`
- ✅ `gradle-creator`
- ✅ `shell-script-creator`
- ❌ `java`
- ❌ `gradle`

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
  - Examples: `java-creator`, `github`, `use-case-creator`

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

- **`has-sub-skill`**: Not used in this repository. Group related skills into a
  single skill with `references/*.md` files instead of nesting child skills.

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

## Best Practices

1. **Follow the writing-skills workflow** - Skills are documentation;
   create and refine them using the RED-GREEN-REFACTOR process in
   `writing-skills`.
2. **Keep it concise** - Skills share context window with everything else;
   follow the `hemingway` skill and move heavy reference to separate files
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
9. **Reference `completion-checklist`** - Implementation skills that produce
   code or config changes should add a "Required Companion Skills" section
   that lists `coding-standards` and `completion-checklist`. Do not rely on
   the description alone to trigger the completion gate.
