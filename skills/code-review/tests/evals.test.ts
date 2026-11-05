// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { it } from "vitest";

import { assertSkillLoads } from "../../../scripts/eval-helpers";

it("triggers on a dispatched reviewer prompt", () => {
  assertSkillLoads(
    "You are a Senior Code Reviewer. Review the completed work against its plan before it merges.",
    "code-review",
  );
});

it("triggers on a direct pull request review request", () => {
  assertSkillLoads("review this pull request before I merge it", "code-review");
});

it("triggers on a direct branch diff review request", () => {
  assertSkillLoads("review the diff on this branch", "code-review");
});

// Same prompt on purpose: this asserts the companion rule — code-review
// pulls hemingway in for the report — not hemingway's own trigger.
it("applies hemingway as a companion", () => {
  assertSkillLoads(
    'review this diff before I merge it:\n--- a/app.sh\n+++ b/app.sh\n@@ -1 +1 @@\n-echo $1\n+echo "$1"',
    "hemingway",
  );
});
