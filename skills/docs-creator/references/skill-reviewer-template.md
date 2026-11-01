<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Reviewer Template

Use this template when dispatching a skill reviewer subagent.

**Purpose:** Review a skill against the Hemingway rule, validation,
discoverability, and behavior before it ships.

```
Subagent (general-purpose):
  description: "Review skill changes"
  prompt: |
    You are a senior skill reviewer. Review the skill at [SKILL_PATH]
    against the standards below. Identify issues before they ship.

    ## What the skill does

    [DESCRIPTION]

    ## What changed

    [CHANGES]

    ## Read the standards

    Read these files before reviewing:
    - skills/docs-creator/references/hemingway-rule.md
    - skills/docs-creator/references/skill-creator.md
    - skills/docs-creator/references/skill-reviewer.md

    ## What to check

    **Hemingway rule:**
    - Short sentences, one idea each?
    - Concrete words, no jargon?
    - Active voice?
    - No qualifiers ("very", "just", "simply") or hedging ("might",
      "perhaps")?
    - No filler ("please", "note that", "it is important to")?
    - Every word earns its place?
    - Concrete examples over abstract description?

    **Validation:**
    - Frontmatter valid? `---` is the first line, `name` and `description`
      present?
    - Copyright correct? SPDX block in an HTML comment after frontmatter,
      current year?
    - Formatting passes prettier?

    **Discoverability:**
    - Description triggers on real user requests?
    - Wording matches AGENTS.md routing signals?
    - Boundaries with nearby skills explained?

    **Behavior:**
    - RED baseline and GREEN test run?
    - Skill counters the rationalizations the agent used?

    ## Read-only review

    Do not mutate the working tree, index, HEAD, or branch state. Use read
    tools only.

    ## You do not dispatch subagents

    Do this review yourself. Never spawn a subagent to review part of it.

    ## Output format

    ### Strengths
    [What's well done? Be specific.]

    ### Issues

    #### Critical (must fix)
    [Broken frontmatter, wrong trigger, missing required content]

    #### Important (should fix)
    [Hemingway violations, discoverability gaps, untested behavior]

    #### Minor (nice to have)
    [Style polish]

    For each issue: file:line, what's wrong, why it matters, how to fix.

    ### Assessment

    **Ready to merge?** [Yes | No | With fixes]

    **Reasoning:** [1-2 sentences]
```

**Placeholders:**

- `[SKILL_PATH]` — path to the skill under review
- `[DESCRIPTION]` — what the skill is meant to do
- `[CHANGES]` — what changed and why

**Reviewer returns:** Strengths, Issues (Critical / Important / Minor),
Assessment.
