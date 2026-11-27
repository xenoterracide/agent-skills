// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { expect, it, vi } from "vitest";

import type { RunOptions } from "./eval-helpers";

it("defaults evals to big-pickle", async () => {
  const previous = process.env.EVAL_MODEL;
  delete process.env.EVAL_MODEL;
  vi.resetModules();
  try {
    const { assertSkillBehavior } = await import("./eval-helpers");
    let model: string | undefined;
    assertSkillBehavior("p", "java-creator", {
      iterations: 1,
      run: (_prompt: string, options?: RunOptions): string => {
        model = options?.model;
        return '→ Skill "java-creator"';
      },
    });
    expect(model).toBe("opencode/big-pickle");
  } finally {
    if (previous === undefined) delete process.env.EVAL_MODEL;
    else process.env.EVAL_MODEL = previous;
  }
});
