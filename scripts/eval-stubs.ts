// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ghScript = [
  "#!/bin/sh",
  'log="$(dirname "$0")/../gh.log"',
  'printf \'%s\\n\' "$*" >>"$log"',
  'case "$1 $2" in',
  '  "auth status") echo "Logged in to github.com account fixture"; exit 0;;',
  '  "repo view")',
  '    case "$*" in',
  '      *--json*) echo \'{"defaultBranchRef":{"name":"main"},"nameWithOwner":"xenoterracide/fixture"}\';;',
  '      *) echo "xenoterracide/fixture";;',
  "    esac",
  "    exit 0;;",
  '  "pr view")',
  '    case "$*" in',
  "      *7*)",
  '        case "$*" in',
  '          *--json*) echo \'{"number":7,"url":"https://github.com/xenoterracide/fixture/pull/7","title":"feat: fixture","state":"OPEN","isDraft":false,"headRefName":"feat/fixture","baseRefName":"main","headRefOid":"0000000000000000000000000000000000000007","mergeable":null,"mergeStateStatus":"UNKNOWN","reviewDecision":"","statusCheckRollup":[{"__typename":"CheckRun","name":"check / check","status":"IN_PROGRESS"}]}\';;',
  '          *) printf \'%s\\n\' "feat: fixture" "state: OPEN" "base: main" "head: feat/fixture" "checks: check / check  pending";;',
  "        esac",
  "        exit 0;;",
  '      *) echo "no pull requests found" >&2; exit 1;;',
  "    esac;;",
  '  "pr checks")',
  '    case "$*" in',
  '      *--watch*) echo "check / check  pass";;',
  '      *) echo "check / check  pending"; exit 8;;',
  "    esac",
  "    exit 0;;",
  '  "pr create") echo "https://github.com/xenoterracide/fixture/pull/1"; exit 0;;',
  "esac",
  "exit 0",
  "",
].join("\n");

const ghDenyScript = [
  "#!/bin/sh",
  'log="$(dirname "$0")/../gh.log"',
  'printf \'%s\\n\' "$*" >>"$log"',
  'echo "You are not logged into any GitHub hosts. Run gh auth login to authenticate." >&2',
  "exit 1",
  "",
].join("\n");

const ghbLogHeader = ["#!/bin/sh", 'log="$(dirname "$0")/../ghb.log"', 'printf \'%s\\n\' "$*" >>"$log"'];

const ghbMissingScript = [...ghbLogHeader, 'echo "ghb: command not found" >&2', "exit 127", ""].join("\n");

const ghbVerifyScript = (verify: string): string =>
  [...ghbLogHeader, 'case "$1 $2" in', `  "pr verify") echo "${verify}"; exit 0;;`, "esac", "exit 0", ""].join("\n");

const ghbVerifyLine = (availability: "green" | "blocked"): string =>
  availability === "blocked"
    ? "PR #7: mergeStateStatus BLOCKED, reviewDecision CHANGES_REQUESTED — merge refused"
    : "PR #7: current, mergeable, checks green";

// The stub shadows gh on the sandbox PATH. It answers the preflight an
// agent runs before creating a PR and accepts the create, so the flow
// completes without touching the network; argv is logged to gh.log. A
// named PR answers in an unsettled state — checks pending, policy blank —
// because a run the sandbox contradicts stops settling and starts
// investigating the sandbox itself.
export function writeGhStub(dir: string): void {
  const bin = join(dir, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "gh"), ghScript, { mode: 0o755 });
}

// The deny stub shadows gh for runs without a sandbox repo. The host gh is
// authenticated and the sandbox shares the host filesystem, so a run that
// wanders out can reach the real network; every gh call must fail as an
// unauthenticated gh would. argv is logged to gh.log.
export function writeGhDenyStub(dir: string): void {
  const bin = join(dir, "bin");
  mkdirSync(bin, { recursive: true });
  writeFileSync(join(bin, "gh"), ghDenyScript, { mode: 0o755 });
}

// The stub shadows ghb on the sandbox PATH. A host ghb would reach the
// network from inside the sandbox. "green" and "blocked" answer pr verify
// with that policy state so the ghb path completes; "missing" fails like
// an absent binary, so the run takes the raw fallback. argv is logged to
// ghb.log.
export function writeGhbStub(dir: string, availability: "missing" | "green" | "blocked"): void {
  const bin = join(dir, "bin");
  mkdirSync(bin, { recursive: true });
  const script = availability === "missing" ? ghbMissingScript : ghbVerifyScript(ghbVerifyLine(availability));
  writeFileSync(join(bin, "ghb"), script, { mode: 0o755 });
}
