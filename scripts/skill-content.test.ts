// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { readFileSync } from "node:fs";

import { expect, it } from "vitest";

it("keeps ticket-specific use-case policy out of the iteration loop", () => {
  const text = readFileSync("skills/iterative-development/references/jira-iteration.md", "utf8").toLowerCase();

  expect(text).not.toContain("use cases stay deferred");
  expect(text).not.toContain("most tickets need none");
});

it("keeps ticket-specific use-case policy out of the use-case skill", () => {
  const paths = ["skills/use-case-creator/SKILL.md", "skills/use-case-creator/references/placement.md"];

  for (const path of paths) {
    const text = readFileSync(path, "utf8").toLowerCase();

    expect(text).not.toContain("use cases stay deferred");
    expect(text).not.toContain("most tickets need none");
  }
});
