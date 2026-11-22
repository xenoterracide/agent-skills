// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { it } from "vitest";

import { assertSkillBehavior, assertSkillLoads } from "../../../scripts/eval-helpers";

it("triggers when scoping a new feature", () => {
  assertSkillLoads(
    "we want to add audit logging, help me figure out what to build first and what can wait",
    "iterative-development",
  );
});

it("triggers when the domain model feels wrong", () => {
  assertSkillLoads(
    "this fulfillment flow feels way more complicated than it should be, are we missing a concept?",
    "iterative-development",
  );
});

it("iteration with XTC Subtasks", () => {
  assertSkillBehavior(
    "set up the first iteration for this XTC feature and break it into Subtasks",
    "iterative-development",
    { reads: ["references/jira-iteration.md"] },
  );
});
