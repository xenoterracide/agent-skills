// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import test from "node:test";

import { formatIndex, listSkillFiles } from "./generate-skill-catalog.mjs";

test("listSkillFiles excludes tests directories", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-catalog-"));
  try {
    mkdirSync(join(dir, "tests"));
    mkdirSync(join(dir, "references"));
    writeFileSync(join(dir, "SKILL.md"), "");
    writeFileSync(join(dir, "tests", "evals.yaml"), "");
    writeFileSync(join(dir, "references", "guide.md"), "");

    const files = listSkillFiles(dir).map((f) => relative(dir, f));
    assert.deepEqual(files.sort(), ["SKILL.md", "references/guide.md"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("formatIndex uses the repo prettier config, not defaults", async () => {
  const index = {
    skills: [
      {
        name: "java-creator",
        version: "0.10.2",
        files: ["SKILL.md", "references/hibernate.md", "references/immutables.md"],
      },
    ],
  };
  const output = await formatIndex(index);
  assert.ok(
    output.includes('"files": ["SKILL.md", "references/hibernate.md", "references/immutables.md"]'),
    "arrays that fit the repo print width must collapse to one line",
  );
});
