// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { readFileSync } from "node:fs";

import { expect, it } from "vitest";

const RETROSPECTIVE_REQUIRED = [
  ".config/agent/project.yaml",
  "tracker.statuses.done",
  "tracker.statuses.captured",
  "Exclude this retrospective's own calls",
  "Treat findings skipped as duplicates as observations",
  "same target",
  "Cut <named target>: <saving>",
  "Skip the comment when no observations exist",
  "name the missing key",
  "tracker.retrospective_epic",
  "outward",
  "Relates",
  "Set priority to Low",
  "1 Low, 2-3 Medium, 4-7 High, 8 or more Highest",
  "Count one link per completed ticket",
  "Count only outward `Relates` links whose target status is `tracker.statuses.done`",
  "Ignore repeat mentions inside one session",
  "Treat a missing link as count 1",
  "rankBeforeIssue",
  "rankAfterIssue",
  "Leave other backlog ranks unchanged",
  "Skip keys with no slot among epic children",
  "Split the target sequence into contiguous runs of affected keys",
  "For the run ending at the last position",
  "Process its keys in target order",
  "Process its keys in reverse target order",
  "Process all keys except the last in target order",
  "When no unaffected child exists",
  "Confirm the target sequence",
  "Stop and report the mismatch when the order differs",
  "without follow-up questions",
  "findings summary",
  "No automatic reparenting of legacy tasks",
  "Use the duplicate issue as the repeat target",
  "Add the outward `Relates` link when the completed ticket is not already linked",
  "Add the target to the affected keys when its priority bucket changes",
  "When no open issue matches the finding, keep the repeat as an observation",
];

const RETROSPECTIVE_FORBIDDEN = [
  "XTC",
  "board: 3",
  "fc5ce4e3-4638-4a37-9aaf-1a2591482c2e",
  "`Done`",
  "`Open`",
  "`To Do`",
  "`Added to backlog`",
  "`Relates` link to a completed ticket, keep the repeat as an observation",
];

it("keeps tracker facts out of completion-retrospective", () => {
  const text = readFileSync("skills/completion-retrospective/SKILL.md", "utf8");

  for (const value of RETROSPECTIVE_REQUIRED) {
    expect(text).toContain(value);
  }
  for (const value of RETROSPECTIVE_FORBIDDEN) {
    expect(text).not.toContain(value);
  }
});

it("runs the retrospective from the retrospective phase skill", () => {
  const text = readFileSync("skills/retrospective/SKILL.md", "utf8");

  expect(text).toContain("completion-retrospective");
  expect(text).toMatch(/tracker\.statuses\.done[\s\S]*?completion-retrospective/);
});

it("pins completion-retrospective discovery", () => {
  const text = readFileSync("skills/completion-retrospective/SKILL.md", "utf8");

  expect(text).toContain("name: completion-retrospective");
  expect(text).toMatch(/description:[\s\S]*?Use when[\s\S]*?wasted tokens/);
  expect(text).toContain("- **`jira-workflow`**");
  expect(text).toContain("- **`hemingway`**");
});
