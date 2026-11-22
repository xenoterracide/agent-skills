// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { it } from "vitest";

import { assertSkillBehavior } from "../../../scripts/eval-helpers";

it("loads when reading XTC board state", () => {
  assertSkillBehavior("show me what's in the Jira board right now", "jira-workflow", {
    first: true,
  });
});

it("loads when creating an XTC issue", () => {
  assertSkillBehavior("create a Jira task to audit Renovate PRs", "jira-workflow");
});

it("loads when moving an issue to a status", () => {
  assertSkillBehavior("move this Jira issue from Open to To Do", "jira-workflow");
});

it("loads when turning a plan into Subtasks", () => {
  assertSkillBehavior("turn this plan into Subtasks on the Jira ticket", "jira-workflow");
});

it("issue content ownership", () => {
  assertSkillBehavior("where should the spec and implementation notes go on this Jira ticket?", "jira-workflow", {
    reads: ["references/issue-content.md"],
  });
});

it("reads the project config before Jira work", () => {
  assertSkillBehavior("show me the Jira board for this repo", "jira-workflow", {
    first: true,
    fixture: "skills/jira-workflow/tests/fixtures/project-config",
    reads: [".config/agent/project.yaml"],
  });
});
