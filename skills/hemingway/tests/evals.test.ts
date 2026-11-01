// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertContains, assertSkillLoads } from "../../../scripts/eval-helpers";

const javaClass = join(import.meta.dirname, "fixtures", "java-class");

it("triggers when writing a skill", () => {
  assertSkillLoads("write a skill that helps format commit messages", "hemingway");
});

it("triggers when writing javadoc", () => {
  assertSkillLoads("write javadoc for Greeter.java", "hemingway", { fixture: javaClass });
});

it("triggers when editing a skill reference", () => {
  assertSkillLoads("tighten the wording in the pull-request reference", "hemingway");
});

it("prose rule applies", () => {
  assertContains("rewrite this to be terse: It is important to note that you should run the tests.", "Run the tests");
});
