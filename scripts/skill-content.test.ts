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

function expectDoc(path: string, present: string[], absent: string[]): void {
  const text = readFileSync(path, "utf8");
  for (const value of present) expect(text).toContain(value);
  for (const value of absent) expect(text).not.toContain(value);
}

const forbiddenGit =
  /git (sync|sp|pl|p |bc|wtl|wtr|bd|last|fetch --all --prune|fetch origin|worktree list|worktree remove|branch -D|branch --show-current|status|pull|push)/;

const gitDocs = [
  ["using-xenoterracide-agent-skills/SKILL.md", ["outcome they need", "Keep fetch and pull output quiet"]],
  ["git-workflow/references/pull-request.md", ["Fetch and prune"]],
  ["git-workflow/references/manual-sync.md", ["modified tracked files", "Keep the output quiet"]],
  ["git-workflow/references/workflow-push-rejection.md", ["latest remote state"]],
] as const;

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
    "Follow the named phase skill",
    "Do not infer a phase from the phase just finished",
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

it("keeps phase rules out of jira-workflow", () => {
  const text = readFileSync("skills/jira-workflow/SKILL.md", "utf8");

  for (const value of [
    "completion-retrospective",
    "when the first work item starts",
    "merged code",
    "breakdown in `tracker.statuses.ready`",
  ]) {
    expect(text).not.toContain(value);
  }
});

it("describes git workflows without prescribing commands", () => {
  for (const [path, phrases] of gitDocs) {
    const text = readFileSync(`skills/${path}`, "utf8");
    for (const phrase of phrases) expect(text).toContain(phrase);
    expect(text).not.toMatch(forbiddenGit);
  }
  expectDoc("skills/running-commands/references/quiet.md", ["git commit -m"], ["git c >", "git last"]);
});
