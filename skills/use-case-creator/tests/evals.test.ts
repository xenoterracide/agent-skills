// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { it } from "vitest";

import { assertSkillBehavior } from "../../../scripts/eval-helpers";

it("placement for a cross-level use case", () => {
  assertSkillBehavior("where should a UX-level use case live when it affects code too?", "use-case-creator", {
    reads: ["references/placement.md"],
  });
});
