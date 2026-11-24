// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { it } from "vitest";

import { assertSkillBehavior } from "../../../scripts/eval-helpers";

it("completion retrospective loads after a done ticket", () => {
  assertSkillBehavior(
    "I just moved the Jira ticket to Done. Review the session for wasted steps and record the savings.",
    "completion-retrospective",
    {
      companions: ["jira-workflow", "hemingway"],
      fixture: "skills/jira-workflow/tests/fixtures/project-config",
    },
  );
});
