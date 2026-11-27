// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { it } from "vitest";

import { assertSkillBehavior } from "../../../scripts/eval-helpers";

it("phase split, priority buckets, and unlinked-child repeat", () => {
  assertSkillBehavior(
    'Start @refine on the captured ticket, then @implement on the ready ticket with its breakdown. Then @retrospective on the done ticket: merged code, green checks, no status change. A repeat finding targets an unlinked epic child. Add an outward Relates link, apply 1 Low, 2-3 Medium, 4-7 High, 8 or more Highest, and rank affected children. Treat the spec as complete. Answer any refinement question with "no further changes". If refine asks whether to move the ticket, answer yes and continue.',
    "retrospective",
    {
      companions: ["refine", "implement", "completion-retrospective", "jira-workflow"],
      fixture: "skills/jira-workflow/tests/fixtures/project-config",
      reads: [".config/agent/project.yaml"],
      prose: { includes: [/Relates/i, /priority/i, /rank/i, /ask whether to move/i] },
    },
  );
});
