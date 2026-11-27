// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { readFileSync } from "node:fs";

import { expect, it } from "vitest";

const PHASE_FORBIDDEN = [
  "XTC",
  "board: 3",
  "fc5ce4e3-4638-4a37-9aaf-1a2591482c2e",
  "`Added to backlog`",
  "`Open`",
  "`To Do`",
  "`In Progress`",
  "`In Review`",
  "`Done`",
  "`Canceled`",
  "listJiraIssueTransitions",
  "nextPageToken",
  "labels =",
  "project-wide",
  "tracker.labels.project_prefix",
  "rankCustomFieldId",
];

export function pinPhaseSkill(skill: string, role: string, required: string[]): void {
  const text = readFileSync(`skills/${skill}/SKILL.md`, "utf8");

  expect(text).toContain(`name: ${skill}`);
  expect(text).toContain("Use when");
  expect(text).toContain(".config/agent/project.yaml");
  expect(text).toContain("stop");
  expect(text).toContain("name the path");
  expect(text).toContain("jira-workflow");
  expect(text).toContain(`tracker.statuses.${role}`);

  for (const value of required) {
    expect(text).toContain(value);
  }
  for (const value of PHASE_FORBIDDEN) {
    expect(text).not.toContain(value);
  }
}

it("pins the refine phase contract", () => {
  pinPhaseSkill("refine", "refining", [
    "refine phase",
    "tracker.statuses.refining",
    "before questions",
    "Do not add a breakdown",
  ]);
});

it("pins the implement phase contract", () => {
  pinPhaseSkill("implement", "building", [
    "implement phase",
    "tracker.statuses.ready",
    "tracker.statuses.building",
    "breakdown",
    "first work item",
    "name the missing breakdown",
  ]);
});
