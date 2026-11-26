// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, it } from "vitest";

const SKILL_PATH = join("skills", "completion-retrospective", "SKILL.md");
const skillText = readFileSync(SKILL_PATH, "utf8");
const stepSix = skillText.slice(
  skillText.indexOf("6. Rank the affected keys."),
  skillText.indexOf("7. Add one comment"),
);

type Key = string;
type Run = [number, number];

function rankBeforeIssue(list: Key[], key: Key, anchor: Key): Key[] {
  const rest = list.filter((entry) => entry !== key);
  const index = rest.indexOf(anchor);
  if (index < 0) {
    throw new Error(`missing anchor ${anchor}`);
  }
  return [...rest.slice(0, index), key, ...rest.slice(index)];
}

function rankAfterIssue(list: Key[], key: Key, anchor: Key): Key[] {
  const rest = list.filter((entry) => entry !== key);
  const index = rest.indexOf(anchor);
  if (index < 0) {
    throw new Error(`missing anchor ${anchor}`);
  }
  return [...rest.slice(0, index + 1), key, ...rest.slice(index + 1)];
}

function targetSequence(children: Key[], affected: Key[], sorted: Key[]): Key[] {
  const affectedSet = new Set(affected);
  let slot = 0;
  return children.map((key) => (affectedSet.has(key) ? sorted[slot++] : key));
}

function affectedRuns(target: Key[], affected: Key[]): Run[] {
  const affectedSet = new Set(affected);
  const runs: Run[] = [];
  let start = -1;
  target.forEach((key, position) => {
    if (affectedSet.has(key)) {
      if (start < 0) {
        start = position;
      }
    } else if (start >= 0) {
      runs.push([start, position - 1]);
      start = -1;
    }
  });
  if (start >= 0) {
    runs.push([start, target.length - 1]);
  }
  return runs;
}

function moveBefore(target: Key[], result: Key[], run: Run): Key[] {
  const [first, last] = run;
  const anchor = target[last + 1];
  let next = result;
  for (let position = first; position <= last; position++) {
    next = rankBeforeIssue(next, target[position], anchor);
  }
  return next;
}

function moveAfter(target: Key[], result: Key[], run: Run): Key[] {
  const [first, last] = run;
  const anchor = target[first - 1];
  let next = result;
  for (let position = last; position >= first; position--) {
    next = rankAfterIssue(next, target[position], anchor);
  }
  return next;
}

function applyRun(target: Key[], result: Key[], run: Run): Key[] {
  const [first, last] = run;
  if (last < target.length - 1) {
    return moveBefore(target, result, run);
  }
  if (first > 0) {
    return moveAfter(target, result, run);
  }
  return moveBefore(target, result, [first, last - 1]);
}

function rankByProcedure(children: Key[], affected: Key[], sorted: Key[]): Key[] {
  const target = targetSequence(children, affected, sorted);
  return affectedRuns(target, affected).reduce((result, run) => applyRun(target, result, run), [...children]);
}

function permutations(values: Key[]): Key[][] {
  if (values.length <= 1) {
    return [values];
  }
  return values.flatMap((value, index) => {
    const rest = [...values.slice(0, index), ...values.slice(index + 1)];
    return permutations(rest).map((tail) => [value, ...tail]);
  });
}

it("states rank order without slot-based no-op skips", () => {
  expect(stepSix).toContain("For the run ending at the last position");
  expect(stepSix).toContain("Process all keys except the last in target order");
  expect(stepSix).not.toContain("Skip a call when the key already holds its target slot");
});

const RANK_CASES = [
  {
    children: ["A", "B", "C", "D"],
    affected: ["A", "C", "D"],
    sorted: ["C", "A", "D"],
    target: ["C", "B", "A", "D"],
  },
  {
    children: ["A", "B", "C", "D"],
    affected: ["A", "B", "D"],
    sorted: ["A", "D", "B"],
    target: ["A", "D", "C", "B"],
  },
  {
    children: ["A", "B", "C", "D"],
    affected: ["A", "B", "C", "D"],
    sorted: ["D", "C", "B", "A"],
    target: ["D", "C", "B", "A"],
  },
  {
    children: ["A", "B", "C", "D"],
    affected: ["A", "B"],
    sorted: ["B", "A"],
    target: ["B", "A", "C", "D"],
  },
  { children: ["A", "B", "C"], affected: ["B"], sorted: ["B"], target: ["A", "B", "C"] },
  { children: ["A", "B", "C"], affected: ["C"], sorted: ["C"], target: ["A", "B", "C"] },
  { children: ["A"], affected: ["A"], sorted: ["A"], target: ["A"] },
];

it("places affected keys in target order", () => {
  for (const { children, affected, sorted, target } of RANK_CASES) {
    expect(rankByProcedure(children, affected, sorted)).toEqual(target);
  }
});

function assertEveryOrder(size: number): void {
  const children = Array.from({ length: size }, (_, index) => String.fromCharCode(65 + index));
  for (let mask = 1; mask < 1 << size; mask++) {
    const affected = children.filter((_, index) => (mask & (1 << index)) !== 0);
    for (const sorted of permutations(affected)) {
      const target = targetSequence(children, affected, sorted);
      expect(rankByProcedure(children, affected, sorted)).toEqual(target);
    }
  }
}

it("reaches the target for every subset and permutation up to five children", () => {
  for (let size = 1; size <= 5; size++) {
    assertEveryOrder(size);
  }
});
