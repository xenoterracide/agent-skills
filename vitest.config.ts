// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig } from "vitest/config";

import { ITERATIONS } from "./scripts/eval-helpers";

const SESSION_TIMEOUT = 360_000;

export default defineConfig({
  test: {
    include: ["scripts/eval-helpers.test.ts", "skills/*/tests/evals.test.ts"],
    bail: 1,
    fileParallelism: false,
    testTimeout: ITERATIONS * SESSION_TIMEOUT + 600_000,
    hookTimeout: ITERATIONS * SESSION_TIMEOUT + 600_000,
  },
});
