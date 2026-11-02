// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertContains, assertSkillLoads } from "../../../scripts/eval-helpers";

const javaClass = join(import.meta.dirname, "fixtures", "java-class");

it("triggers when tightening a checklist bullet", () => {
  assertSkillLoads(
    "tighten this checklist bullet: It is important to note that you should always run the tests before claiming done.",
    "hemingway",
  );
});

it("triggers when writing javadoc", () => {
  assertSkillLoads("write javadoc for Greeter.java", "hemingway", { fixture: javaClass });
});

it("triggers directly on pasted prose", () => {
  assertSkillLoads(
    "tighten this sentence: It is important to note that the tests should be run before you claim the work is done.",
    "hemingway",
    { first: true },
  );
});

it("loads as a docs-creator companion on a skill reference", () => {
  assertSkillLoads("tighten the wording in the pull-request reference", "hemingway");
});

it("prose rule applies", () => {
  assertContains("rewrite this to be terse: It is important to note that you should run the tests.", "Run the tests");
});
