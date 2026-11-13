// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import assert from "node:assert/strict";

import { detectCommands, detectReads, detectSkills, transcript } from "./eval-output";
import { ITERATIONS, MODEL, runPrompt } from "./eval-sandbox";
import type { RunOptions } from "./eval-sandbox";

export { combineOutput, detectCommands, detectReads, detectSkills, harnessError, stripAnsi } from "./eval-output";
export { writeGhDenyStub, writeGhStub, writeGhbStub } from "./eval-stubs";
export { initSandboxRepo, ITERATIONS, runPrompt } from "./eval-sandbox";
export type { RunOptions } from "./eval-sandbox";

export interface AssertOptions extends RunOptions {
  iterations?: number;
  run?: typeof runPrompt;
  first?: boolean;
  /** Require the router's load event. False when the case asserts the facet
   * read instead — a companion can reach the facet by path without the
   * router firing. `first` requires this to stay true. */
  loadEvent?: boolean;
}

export interface BehaviorOptions extends AssertOptions {
  reads?: (string | RegExp)[];
  forbids?: (string | RegExp)[];
  commands?: (string | RegExp)[];
  /** Skills the primary skill must load alongside itself. */
  companions?: string[];
}

interface CheckContext {
  label: string;
  output: string;
}

interface LoadCheck extends CheckContext {
  skill: string;
  loadEvent: boolean;
  first: boolean;
  companions: string[];
}

interface ReadCheck extends CheckContext {
  reads: (string | RegExp)[];
}

interface CommandCheck extends CheckContext {
  forbids: (string | RegExp)[];
  commands: (string | RegExp)[];
}

interface Behavior extends AssertOptions {
  model: string;
  iterations: number;
  run: typeof runPrompt;
  first: boolean;
  loadEvent: boolean;
  reads: (string | RegExp)[];
  forbids: (string | RegExp)[];
  commands: (string | RegExp)[];
  companions: string[];
}

function normalizeBehavior(options: BehaviorOptions): Behavior {
  return {
    fixture: options.fixture,
    model: options.model ?? MODEL,
    iterations: options.iterations ?? ITERATIONS,
    run: options.run ?? runPrompt,
    first: options.first ?? false,
    loadEvent: options.loadEvent ?? true,
    reads: options.reads ?? [],
    forbids: options.forbids ?? [],
    commands: options.commands ?? [],
    companions: options.companions ?? [],
    repo: options.repo,
    ghb: options.ghb,
  };
}

function pathMatches(reads: string[], pattern: string | RegExp): boolean {
  return reads.some((read) => (typeof pattern === "string" ? read.includes(pattern) : pattern.test(read)));
}

const lineMatches = (pattern: string | RegExp, lines: string): boolean =>
  typeof pattern === "string" ? lines.includes(pattern) : pattern.test(lines);

function assertLoaded({ label, output, skill, loadEvent, first, companions }: LoadCheck): void {
  const loaded = detectSkills(output);
  if (loadEvent) {
    assert.ok(loaded.includes(skill), `${label}: skill "${skill}" did not load\n${transcript(output)}`);
    if (first) {
      assert.equal(
        loaded[0],
        skill,
        `${label}: expected "${skill}" to load first, got ${JSON.stringify(loaded)}\n${transcript(output)}`,
      );
    }
  }
  for (const companion of companions) {
    assert.ok(
      loaded.includes(companion),
      `${label}: companion "${companion}" did not load with "${skill}", got ${JSON.stringify(loaded)}\n${transcript(output)}`,
    );
  }
}

function assertReads({ label, output, reads }: ReadCheck): void {
  const readPaths = detectReads(output);
  for (const pattern of reads) {
    assert.ok(
      pathMatches(readPaths, pattern),
      `${label}: expected a Read matching ${String(pattern)}, got ${JSON.stringify(readPaths)}\n${transcript(output)}`,
    );
  }
}

function assertCommands({ label, output, forbids, commands }: CommandCheck): void {
  const lines = detectCommands(output).join("\n");
  for (const pattern of forbids) {
    assert.ok(
      !lineMatches(pattern, lines),
      `${label}: forbidden ${String(pattern)} appeared in a command line\n${transcript(output)}`,
    );
  }
  for (const pattern of commands) {
    assert.ok(lineMatches(pattern, lines), `${label}: expected a command matching ${String(pattern)}, got:\n${lines}`);
  }
}

export function assertSkillBehavior(prompt: string, skill: string, options: BehaviorOptions = {}): void {
  const { model, iterations, run, first, loadEvent, reads, forbids, commands, companions, fixture, repo, ghb } =
    normalizeBehavior(options);
  for (let i = 0; i < iterations; i++) {
    const output = run(prompt, { model, fixture, repo, ghb });
    const label = `run ${String(i + 1)}/${String(iterations)}`;
    assertLoaded({ label, output, skill, loadEvent, first, companions });
    assertReads({ label, output, reads });
    assertCommands({ label, output, forbids, commands });
  }
}

export function assertSkillLoads(prompt: string, skill: string, options: AssertOptions = {}): void {
  assertSkillBehavior(prompt, skill, options);
}
