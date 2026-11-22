// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, it } from "vitest";

function skillMarkdown(): string[] {
  const paths: string[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(path);
      } else if (entry.name.endsWith(".md")) {
        paths.push(path);
      }
    }
  };

  walk("skills");

  return paths;
}

function allSkillText(): string {
  return skillMarkdown()
    .map((path) => readFileSync(path, "utf8"))
    .join("\n")
    .toLowerCase();
}

it("keeps the recall file out of skills", () => {
  expect(allSkillText()).not.toContain("where-was-i");
});

it("keeps ticket-specific use-case policy out of skills", () => {
  const text = allSkillText();

  expect(text).not.toContain("use cases stay deferred");
  expect(text).not.toContain("most tickets need none");
});

it("keeps issue-content ownership rules in the reference", () => {
  const text = readFileSync("skills/jira-workflow/references/issue-content.md", "utf8").toLowerCase();

  expect(text).toContain("description holds the spec");
  expect(text).toContain("status field holds progress");
  expect(text).toContain("do not put the ticket's current status");
  expect(text).toContain("comments hold discoveries");
});

it("keeps the design note intro readable", () => {
  const text = readFileSync("docs/superpowers/specs/2026-11-20-jira-workflow-design.md", "utf8");

  expect(text).toContain("update issues, move issues, and break work into Subtasks");
});
