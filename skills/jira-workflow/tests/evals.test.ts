// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { it } from "vitest";

import { assertSkillBehavior } from "../../../scripts/eval-helpers";

it("loads when reading XTC board state", () => {
  assertSkillBehavior("show me what's in the XTC board right now", "jira-workflow", {
    first: true,
  });
});

it("loads when creating an XTC issue", () => {
  assertSkillBehavior("create an XTC task to audit Renovate PRs", "jira-workflow");
});

it("loads when moving an issue to a status", () => {
  assertSkillBehavior("move XTC-14 from Open to To Do", "jira-workflow");
});

it("loads when turning a plan into Subtasks", () => {
  assertSkillBehavior("turn this XTC plan into Subtasks on the ticket", "jira-workflow");
});

it("issue content ownership", () => {
  assertSkillBehavior("where should the spec and implementation notes go on this XTC ticket?", "jira-workflow", {
    reads: ["references/issue-content.md"],
  });
});
