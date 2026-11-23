// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { expect, it } from "vitest";

import { assertSkillBehavior } from "../../../scripts/eval-helpers";

const LINK_INCLUDES = [/\[[^\]]+#\d+\]\(https:\/\/github\.com\/[^)]+\/pull\/\d+\)/];
const LINK_EXCLUDES = [/`\[[^\]]+\]\([^)]+\)`/];

it("running commands: confirm done without fresh checker runs", () => {
  assertSkillBehavior("I think the change is done — can you confirm?", "completion-checklist", {
    repo: true,
    ghb: "green",
    forbids: ["reuse lint", "prettier --check"],
    commands: [/ghb pr verify/],
  });
});

it("renders the PR notification as a clickable link", () => {
  assertSkillBehavior(
    "The work is complete and checks are green. Confirm done and notify me with the link to PR 7.",
    "completion-checklist",
    {
      repo: true,
      ghb: "green",
      prose: { includes: LINK_INCLUDES, excludes: LINK_EXCLUDES },
    },
  );
});

it("allows unrelated fenced code", () => {
  const mixed = [
    '→ Skill "completion-checklist"',
    "```bash",
    "git status",
    "```",
    "[agent-skills#7](https://github.com/xenoterracide/agent-skills/pull/7)",
  ].join("\n");

  expect(() => {
    assertSkillBehavior("p", "completion-checklist", {
      iterations: 1,
      run: () => mixed,
      prose: { includes: LINK_INCLUDES, excludes: LINK_EXCLUDES },
    });
  }).not.toThrow();
});

it("rejects a fenced link", () => {
  const fenced = [
    '→ Skill "completion-checklist"',
    "```markdown",
    "[agent-skills#7](https://github.com/xenoterracide/agent-skills/pull/7)",
    "```",
  ].join("\n");

  expect(() => {
    assertSkillBehavior("p", "completion-checklist", {
      iterations: 1,
      run: () => fenced,
      prose: { includes: LINK_INCLUDES, excludes: LINK_EXCLUDES },
    });
  }).toThrow(/expected prose matching/);
});
