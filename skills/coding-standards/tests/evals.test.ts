// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertSkillBehavior } from "../../../scripts/eval-helpers";

const hookedRepo = join(import.meta.dirname, "fixtures", "hooked-repo");

// The fixture carries `.lintstagedrc.cjs` and the pre-commit hook, so the run
// sees a repo whose commit formats and annotates. Asking for formatting and a
// license header must not produce a manual prettier, shfmt, or reuse run: the
// fix is to commit and let the hook do both.
it("delegates formatting and license headers to the pre-commit hook", () => {
  assertSkillBehavior(
    "add a Farewell.java next to App.java that prints goodbye; make sure it's formatted and has its license header before committing",
    "coding-standards",
    {
      fixture: hookedRepo,
      repo: true,
      forbids: [/prettier/, /shfmt/, /reuse/],
    },
  );
});
