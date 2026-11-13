// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it } from "vitest";

import { assertSkillBehavior, runPrompt, type RunOptions } from "../../../scripts/eval-helpers";

const repoRoot = join(import.meta.dirname, "..", "..", "..");
const hookedRepo = join(import.meta.dirname, "fixtures", "hooked-repo");

// base-template renders the hook files and Renovate automerges every bump, so
// static fixture copies drift the moment the template moves. Build the fixture
// per run from the repository's current files instead.
function runHookedRepo(prompt: string, options: RunOptions = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "fixture-"));
  try {
    cpSync(hookedRepo, dir, { recursive: true });
    mkdirSync(join(dir, ".config", "git", "hooks"), { recursive: true });
    cpSync(join(repoRoot, ".lintstagedrc.cjs"), join(dir, ".lintstagedrc.cjs"));
    cpSync(join(repoRoot, ".config", "git", "hooks", "pre-commit"), join(dir, ".config", "git", "hooks", "pre-commit"));
    return runPrompt(prompt, { ...options, fixture: dir });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// The fixture is a repo whose commit formats and annotates: `.lintstagedrc.cjs`
// and the pre-commit hook, plus one headered Java file as pattern bait. Asking
// for formatting and a license header must not produce a manual prettier,
// shfmt, or reuse run: the fix is to commit and let the hook do both. The
// forbids anchor on invocation shapes — flags for the formatters, verbs for
// reuse — so a grep that merely names the tools while investigating the config
// does not trip them.
it("delegates formatting and license headers to the pre-commit hook", () => {
  assertSkillBehavior(
    "add a Farewell.java next to App.java that prints goodbye; format it and give it its license header",
    "coding-standards",
    {
      run: runHookedRepo,
      repo: true,
      commands: [/\bgit\b.*\bcommit\b/],
      forbids: [/prettier\s+--/, /lint:prettier/, /\bshfmt\s+-/, /\breuse\s+(annotate|lint|download)\b/],
    },
  );
});
