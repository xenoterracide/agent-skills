// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import { join } from "node:path";
import test from "node:test";

import { assertContains, assertSkillLoads } from "../../../scripts/eval-helpers.mjs";

const javaClass = join(import.meta.dirname, "fixtures", "java-class");

test("triggers when writing a skill", { timeout: 1_200_000 }, () => {
  assertSkillLoads("write a skill that helps format commit messages", "hemingway");
});

test("triggers when writing javadoc", { timeout: 1_200_000 }, () => {
  assertSkillLoads("write javadoc for Greeter.java", "hemingway", { fixture: javaClass });
});

test("triggers when editing a skill reference", { timeout: 1_200_000 }, () => {
  assertSkillLoads("tighten the wording in the pull-request reference", "hemingway");
});

test("prose rule applies", { timeout: 1_200_000 }, () => {
  assertContains("rewrite this to be terse: It is important to note that you should run the tests.", "Run the tests");
});
