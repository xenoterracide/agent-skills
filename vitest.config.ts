// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig } from "vitest/config";

const SESSION_TIMEOUT = 360_000;
const configuredIterations = Number(process.env.EVAL_ITERATIONS ?? 3);
const iterations = Number.isNaN(configuredIterations) ? 3 : Math.max(1, configuredIterations);

export default defineConfig({
  test: {
    include: ["scripts/eval-helpers.test.ts", "skills/*/tests/evals.test.ts"],
    bail: 1,
    fileParallelism: false,
    testTimeout: iterations * SESSION_TIMEOUT + 600_000,
    hookTimeout: iterations * SESSION_TIMEOUT + 600_000,
  },
});
