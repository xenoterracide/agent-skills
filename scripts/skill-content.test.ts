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

// Scope: skills/ only. XTC-14's design note and plan keep the retired policy
// as historical ticket scope.

it("scans nested skill markdown", () => {
  expect(skillMarkdown()).toContain("skills/jira-workflow/references/issue-content.md");
});

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
  expect(text).toMatch(/do not put the ticket's current status,[\s\S]*?in the description\./);
  expect(text).toContain("comments hold discoveries");
});

it("keeps the design note config contract", () => {
  const text = readFileSync("docs/superpowers/specs/2026-11-20-jira-workflow-design.md", "utf8");

  expect(text).toContain(".config/agent/project.yaml");
  expect(text).toContain("schemas/project.schema.json");
});

it("defines the project config schema", () => {
  const schema = JSON.parse(readFileSync("schemas/project.schema.json", "utf8"));

  expect(schema.required).toEqual(["repo", "tracker"]);
  expect(schema.additionalProperties).toBe(false);
  expect(Object.keys(schema.properties.tracker.properties)).toEqual([
    "kind",
    "skill",
    "site",
    "project",
    "board",
    "work_types",
    "labels",
    "statuses",
    "transitions",
  ]);
});

it("ships the agent-skills project config", () => {
  const text = readFileSync(".config/agent/project.yaml", "utf8");

  expect(text).toContain("xenoterracide/agent-skills/develop/schemas/project.schema.json");
  expect(text).toContain("repo: agent-skills");
  expect(text).toContain("project: XTC");
  expect(text).toContain("board: 3");
  expect(text).toContain("work_types: [Epic, Feature, Task, Bug, Subtask]");
});
