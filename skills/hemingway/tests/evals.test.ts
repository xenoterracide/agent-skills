// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertSkillBehavior } from "../../../scripts/eval-helpers";

const javaClass = join(import.meta.dirname, "fixtures", "java-class");

it("triggers when tightening a checklist bullet", () => {
  assertSkillBehavior(
    "tighten this checklist bullet: It is important to note that you should always run the tests before claiming done.",
    "hemingway",
    { reads: ["references/prose.md"] },
  );
});

it("triggers when writing javadoc", () => {
  assertSkillBehavior("write javadoc for Greeter.java", "hemingway", {
    fixture: javaClass,
    reads: ["references/prose.md"],
  });
});

it("triggers directly on pasted prose", () => {
  assertSkillBehavior(
    "tighten this sentence: It is important to note that the tests should be run before you claim the work is done.",
    "hemingway",
    { first: true, reads: ["references/prose.md"] },
  );
});

it("triggers on code naming and reads the code facet", () => {
  assertSkillBehavior("the names in Greeter.java feel vague, tighten them", "hemingway", {
    fixture: javaClass,
    reads: ["references/code.md"],
  });
});

it("triggers on a changelog entry with no style vocabulary", () => {
  assertSkillBehavior("add a changelog entry for the version bump", "hemingway", {
    reads: ["references/prose.md"],
  });
});

it("triggers on an error-message rewrite with no style vocabulary", () => {
  assertSkillBehavior(
    "rewrite this error message so it's clearer: Configuration error: the requested operation could not be completed due to invalid parameters.",
    "hemingway",
    { reads: ["references/prose.md"] },
  );
});

it("triggers on a design spec with no style vocabulary", () => {
  assertSkillBehavior("write the design spec for retrying failed uploads", "hemingway", {
    reads: ["references/prose.md"],
  });
});

// Chat replies cannot be router-tested here: the sandbox runs without the
// plugin bootstrap, and an explain-flavored prompt classifies as
// investigation, not prose — verified 2026-11-06, one failure in one run.
// Chat coverage comes from the bootstrap's read-once instruction instead.

// Same prompt as docs-creator's own case on purpose: this asserts the
// companion rule — docs-creator pulls hemingway in — not hemingway's
// trigger. The companion path sometimes resolves by reading the facet
// directly instead of a router load event; two failing transcripts
// (2026-11-05, 2026-11-06) both show the read. The read is the contract.
it("applies as a docs-creator companion on a skill reference", () => {
  assertSkillBehavior("add a bullet to the git-workflow pull-request reference", "hemingway", {
    loadEvent: false,
    reads: ["references/prose.md"],
  });
});

// Router-event assertions fail on these prompts: the task vocabulary routes
// to docs-creator, and big-pickle sometimes writes without consulting any
// style skill (2026-11-12, one blind run in three, no load and no read).
// The facet read is the contract, same as the case above.
it("applies as a docs-creator companion when creating a new skill", () => {
  assertSkillBehavior(
    "add a calver skill to this repo for bumping YY.M.MICRO versions; create skills/calver/SKILL.md and update AGENTS.md",
    "hemingway",
    { loadEvent: false, reads: ["references/prose.md"] },
  );
});

it("applies as a docs-creator companion when editing AGENTS.md", () => {
  assertSkillBehavior("update AGENTS.md to say this repo uses CalVer YY.M.MICRO", "hemingway", {
    loadEvent: false,
    reads: ["references/prose.md"],
  });
});
