// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["scripts/eval-helpers.test.ts", "skills/*/tests/evals.test.ts"],
    bail: 1,
    fileParallelism: false,
    testTimeout: 1_200_000,
    hookTimeout: 1_200_000,
  },
});
