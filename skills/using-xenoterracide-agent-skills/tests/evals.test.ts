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
// The eval harness has no session_move tool. The agent must stop and name
// the move instead of merging from where it stands.
it("moves out of a worktree before merging, from the bootstrap", () => {
  assertSkillBehavior(
    "Which skill should I use? The human approved PR #7. The session is in a feature worktree. Merge it.",
    "using-xenoterracide-agent-skills",
    {
      repo: true,
      ghb: "green",
      forbids: [/gh pr merge/],
      prose: { includes: [/main worktree|session_move|move the session/] },
    },
  );
});
