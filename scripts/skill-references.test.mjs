// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pullRequestReference = new URL(
  "../skills/git-workflow/references/pull-request.md",
  import.meta.url,
);

test("pull-request reference teaches --body-file heredocs", async () => {
  const md = await readFile(pullRequestReference, "utf8");
  assert.match(md, /--body-file - <<'EOF'/);
});

test("pull-request reference teaches no inline --body with a newline", async () => {
  const md = await readFile(pullRequestReference, "utf8");
  // a raw newline inside the quoted argument: what the old example showed
  assert.doesNotMatch(md, /--body(?:\s+|=)"[^"\n]*\n/);
  // \n escapes inside the quoted argument: what an agent emits composing it;
  // both land verbatim in the PR and the squash commit (java-commons #649)
  assert.doesNotMatch(md, /--body(?:\s+|=)"[^"\\]*\\n/);
});
