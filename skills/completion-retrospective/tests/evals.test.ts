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

it("completion retrospective loads from a fresh prompt naming the epic", () => {
  assertSkillBehavior(
    "I just moved the Jira ticket to Done. Review the session for wasted steps and record the savings as tasks under the retrospective epic XTC-86. Add Relates links from the new tasks to the completed ticket and rank the affected epic children. Follow the workflow without follow-up questions.",
    "completion-retrospective",
    {
      companions: ["jira-workflow", "hemingway"],
      fixture: "skills/jira-workflow/tests/fixtures/project-config",
    },
  );
});
