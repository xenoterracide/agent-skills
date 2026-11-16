// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { expect, it } from "vitest";

it("parses a JSON record", () => {
  expect(JSON.parse('{"name": "demo"}')).toEqual({ name: "demo" });
});
