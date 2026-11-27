// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, it } from "vitest";

interface SchemaShape {
  required: string[];
  additionalProperties: boolean;
  properties: { tracker: { required: string[]; properties: Record<string, unknown> } };
}

const TRACKER_KEYS = [
  "kind",
  "skill",
  "site",
  "project",
  "retrospective_epic",
  "board",
  "work_types",
  "labels",
  "statuses",
  "transitions",
];

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

function expectAll(text: string, values: string[]): void {
  for (const value of values) expect(text).toContain(value);
}

function expectNone(text: string, values: string[]): void {
  for (const value of values) expect(text).not.toContain(value);
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
  const schema = JSON.parse(readFileSync("schemas/project.schema.json", "utf8")) as SchemaShape;

  expect(schema.required).toEqual(["repo", "tracker"]);
  expect(schema.additionalProperties).toBe(false);
  expect(schema.properties.tracker.required).toEqual(TRACKER_KEYS);
  expect(Object.keys(schema.properties.tracker.properties)).toEqual(TRACKER_KEYS);
});

it("ships the agent-skills project config", () => {
  const text = readFileSync(".config/agent/project.yaml", "utf8");

  expect(text).toContain("xenoterracide/agent-skills/develop/schemas/project.schema.json");
  expect(text).toContain("repo: agent-skills");
  expect(text).toContain("project: XTC");
  expect(text).toContain("retrospective_epic: XTC-86");
  expect(text).toContain("board: 3");
  expect(text).toContain("work_types: [Epic, Feature, Task, Bug, Subtask]");
  expect(text).toContain('project_prefix: "project:"');
});

it("keeps the eval config fixture in sync", () => {
  const config = readFileSync(".config/agent/project.yaml", "utf8");
  const fixture = readFileSync("skills/jira-workflow/tests/fixtures/project-config/.config/agent/project.yaml", "utf8");

  expect(fixture).toBe(config);
});

it("keeps XTC facts out of jira-workflow", () => {
  const text = readFileSync("skills/jira-workflow/SKILL.md", "utf8");

  for (const value of [
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
  ]) {
    expect(text).not.toContain(value);
  }
});

it("keeps XTC facts out of jira-workflow references", () => {
  for (const name of readdirSync("skills/jira-workflow/references")) {
    if (!name.endsWith(".md")) continue;
    const text = readFileSync(join("skills/jira-workflow/references", name), "utf8");

    expect(text).not.toContain("XTC");
    expect(text).not.toContain("fc5ce4e3-4638-4a37-9aaf-1a2591482c2e");
  }
});

it("pins the jira-workflow config contract", () => {
  const text = readFileSync("skills/jira-workflow/SKILL.md", "utf8");

  for (const value of [
    ".config/agent/project.yaml",
    "stops",
    "listJiraIssueTransitions",
    "to.name",
    "labels =",
    "project-wide",
    "tracker.labels.project_prefix",
    "target role's value in `tracker.statuses`",
  ]) {
    expect(text).toContain(value);
  }
  expect(text).not.toContain("project:");
});

it("keeps iterative-development tracker-agnostic", () => {
  const text = skillMarkdown()
    .filter((path) => path.startsWith("skills/iterative-development/"))
    .map((path) => readFileSync(path, "utf8").toLowerCase())
    .join("\n");

  for (const value of ["xtc", "jira", "jira-iteration", "subtask"]) {
    expect(text).not.toContain(value);
  }
});

it("removes the jira iteration reference", () => {
  expect(existsSync("skills/iterative-development/references/jira-iteration.md")).toBe(false);
});

it("keeps the bootstrap pointed at project config", () => {
  const text = readFileSync("skills/using-xenoterracide-agent-skills/SKILL.md", "utf8");

  expect(text).not.toContain("XTC");
  expect(text).toContain(".config/agent/project.yaml");
});

it("instructs agents to emit a rendered PR link", () => {
  const text = readFileSync("skills/completion-checklist/SKILL.md", "utf8");

  expect(text).not.toMatch(/`\[repo#NNN\]\(url\)`/);
  expect(text).toContain("```markdown");
  expect(text).toMatch(/\[repo#NNN\]\(https:\/\/github\.com\/[^)]+\/pull\/NNN\)/);
  expect(text).toMatch(/rendered link/i);
  expect(text).toMatch(/no\s+backticks/i);
});

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
];

const RETROSPECTIVE_FORBIDDEN = [
  "XTC",
  "board: 3",
  "fc5ce4e3-4638-4a37-9aaf-1a2591482c2e",
  "`Done`",
  "`Open`",
  "`To Do`",
  "`Added to backlog`",
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

it("runs the retrospective after a done move", () => {
  const text = readFileSync("skills/jira-workflow/SKILL.md", "utf8");

  expect(text).toContain("completion-retrospective");
  expect(text).toMatch(/Move to `?done`?[\s\S]*?completion-retrospective/);
});

it("pins completion-retrospective discovery", () => {
  const text = readFileSync("skills/completion-retrospective/SKILL.md", "utf8");

  expect(text).toContain("name: completion-retrospective");
  expect(text).toMatch(/description:[\s\S]*?Use when[\s\S]*?wasted tokens/);
  expect(text).toContain("- **`jira-workflow`**");
  expect(text).toContain("- **`hemingway`**");
});

it("uses git aliases in agent instructions", () => {
  const bootstrap = readFileSync("skills/using-xenoterracide-agent-skills/SKILL.md", "utf8");
  expect(bootstrap).toContain("Use the aliases from the `Git aliases:` session block.");
  expectAll(bootstrap, ["git sync", "git sp", "git pl"]);
  expectNone(bootstrap, ["git fetch --all --prune", "git status\n"]);

  const pullRequest = readFileSync("skills/git-workflow/references/pull-request.md", "utf8");
  expectAll(pullRequest, ["git sp", "git sync", "git wtl", "git wtr", "git bd", "git pl"]);
  expectNone(pullRequest, ["git worktree list", "git branch -D", "git fetch --all --prune"]);

  const manualSync = readFileSync("skills/git-workflow/references/manual-sync.md", "utf8");
  expectAll(manualSync, ["git bc", "git sp", "git sync", "git p"]);
  expectNone(manualSync, ["git fetch --all --prune", "git branch --show-current"]);
  expect(manualSync).toContain("git status --porcelain --untracked-files=no");

  const rejection = readFileSync("skills/git-workflow/references/workflow-push-rejection.md", "utf8");
  expect(rejection).toContain("git sync");
  expect(rejection).not.toContain("git fetch origin");

  const quiet = readFileSync("skills/running-commands/references/quiet.md", "utf8");
  expectAll(quiet, ["git c", "git last"]);
  expect(quiet).not.toContain("git commit -m");
});
