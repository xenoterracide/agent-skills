// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertSkillBehavior, assertSkillLoads } from "../../../scripts/eval-helpers";

const javaProject = join(import.meta.dirname, "fixtures", "java-project");

it("triggers on a natural request", () => {
  assertSkillLoads("modify the App class so the greeting is uppercase", "java-creator", { fixture: javaProject });
});

// Same prompt on purpose: this asserts the companion rule — java-creator
// pulls coding-standards in — not coding-standards' own trigger.
it("applies coding-standards as a companion", () => {
  assertSkillLoads("modify the App class so the greeting is uppercase", "coding-standards", { fixture: javaProject });
});

// Guards the reference split: the skill must load and route to the right
// reference on natural requests.
it("loads and reads immutables.md when adding a builder", () => {
  assertSkillBehavior("add a builder to the App class so tests can construct it", "java-creator", {
    fixture: javaProject,
    reads: [/immutables\.md$/],
  });
});

it("loads and reads hibernate.md when a JPA assertion lacks the field name", () => {
  assertSkillBehavior(
    "this JPA entity test failure just says expected:<true> but was:<false>, make the assertion show which field",
    "java-creator",
    { reads: [/hibernate\.md$/] },
  );
});
