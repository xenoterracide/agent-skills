// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertSkillBehavior } from "../../../scripts/eval-helpers";

const pnpmRepo = join(import.meta.dirname, "fixtures", "pnpm");

// The startup skill advertises quiet flags for the pinned tools. These cases
// assert the agent emits the flag, not just that the skill loads.
it("quietens a dependency install", () => {
  assertSkillBehavior(
    "I'm not sure which skill to use. Install this repository's dependencies with pnpm.",
    "using-xenoterracide-agent-skills",
    { fixture: pnpmRepo, repo: true, commands: [/pnpm[^\n]*--reporter=silent/] },
  );
});

it("quietens fetching origin", () => {
  assertSkillBehavior("Which skill should I use? Sync this branch with origin.", "using-xenoterracide-agent-skills", {
    repo: true,
    commands: [/git (fetch|pull)[^\n]*(-q|--quiet)/],
  });
});

// The bootstrap is in every fresh session. It must carry the merge gate so
// the approval turn cannot merge from a feature worktree and skip cleanup.
// The prompt answer arrives in-turn, so no human turn is needed.
// Ask for the rule: the sandbox cwd is main, so an execute prompt would test
// the environment instead of the gate.
it("moves out of a worktree before merging, from the bootstrap", () => {
  assertSkillBehavior(
    "Which skill should I use? According to the workflow, what must happen before merging an approved PR when the session is in a feature worktree?",
    "using-xenoterracide-agent-skills",
    {
      repo: true,
      ghb: "green",
      forbids: [/gh pr merge\b(?!\s+--help\b)/, /merge_pull_request/, /mergePullRequest/, /pulls\/\d+\/merge/],
      prose: {
        includes: [/main worktree|session_move|move the session/, /confirm|cwd|working directory/],
        excludes: [/next turn|end the turn/],
      },
    },
  );
});

it("requires the approval prompt, from the bootstrap", () => {
  assertSkillBehavior(
    "Which skill should I use? According to the workflow, what must happen before merging an approved PR when the session is in the main worktree?",
    "using-xenoterracide-agent-skills",
    {
      repo: true,
      ghb: "green",
      forbids: [/gh pr merge\b(?!\s+--help\b)/],
      prose: { includes: [/question|prompt/i, /Approved, merge/i] },
    },
  );
});

it("keeps the PR link in chat, out of the approval question, from the bootstrap", () => {
  assertSkillBehavior(
    "Which skill should I use? According to the workflow, where does the PR link go relative to the approval question?",
    "using-xenoterracide-agent-skills",
    {
      repo: true,
      ghb: "green",
      prose: {
        includes: [/chat message/i, /question text/i, /no link|without a link|plain text/i],
        excludes: [/bare URL in the question|URL in the question text/i],
      },
    },
  );
});

it("accepts the exact text fallback choice, from the bootstrap", () => {
  assertSkillBehavior(
    "Which skill should I use? Quote the bootstrap sentence that says where approval comes from. According to that sentence alone, can an exact text reply on a harness without a question tool authorize a merge?",
    "using-xenoterracide-agent-skills",
    {
      repo: true,
      ghb: "green",
      forbids: [/gh pr merge\b(?!\s+--help\b)/],
      prose: {
        includes: [/yes|accepts|authorizes/i, /exact choice|exact name|text fallback|no question tool/i],
      },
    },
  );
});
