// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { it } from "vitest";

import { assertSkillBehavior } from "../../../scripts/eval-helpers";

it("running commands: confirm done without fresh checker runs", () => {
  assertSkillBehavior("I think the change is done — can you confirm?", "completion-checklist", {
    forbids: ["reuse lint", "prettier --check"],
    reads: ["running-commands"],
  });
});
